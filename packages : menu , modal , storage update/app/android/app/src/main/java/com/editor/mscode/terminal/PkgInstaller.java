package com.editor.mscode.terminal;

import android.util.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;

/**
 * Termux-style package installer (Phase 2).
 *
 * Downloads .deb from Termux main repo, extracts data.tar.* into $PREFIX.
 * Does NOT run maintainer scripts (postinst) yet — files only.
 *
 * Repo: https://packages.termux.dev/apt/termux-main
 * Paths: pool/main/<first-letter>/<pkg>/<pkg>_<ver>_<arch>.deb
 *
 * Architecture mapping matches Termux: aarch64 | arm | i686 | x86_64
 *
 * Note on execution (targetSdk > 28):
 *   Extracted binaries under filesDir are often not directly executable.
 *   Busybox applets always work. Full package binaries may need a linker
 *   wrapper or nativeLibraryDir copy in a later phase.
 */
public class PkgInstaller {

    private static final String TAG = "PkgInstaller";

    /** Primary Termux main mirror (CF). */
    private static final String REPO_BASE =
        "https://packages-cf.termux.dev/apt/termux-main";

    private final RootfsManager rootfs;
    private final String arch; // Termux arch: aarch64, arm, x86_64, i686

    public interface ProgressListener {
        void onLog(String message);
    }

    public PkgInstaller(RootfsManager rootfs, String deviceArch) {
        this.rootfs = rootfs;
        this.arch = normalizeArch(deviceArch);
    }

    public String getArch() { return arch; }

    /**
     * Install one or more packages by name (e.g. "git", "curl").
     * Resolves the latest .deb via Packages index when possible;
     * falls back to a direct pool path guess for common packages.
     *
     * @return human-readable summary
     */
    public String install(List<String> packages, ProgressListener log) throws IOException {
        if (!rootfs.isBootstrapReady()) {
            throw new IOException("Bootstrap not ready — run initSetup first");
        }
        if (packages == null || packages.isEmpty()) {
            throw new IOException("No packages specified");
        }

        File prefix = new File(rootfs.getPrefixPath());
        File cache  = new File(rootfs.getFilesDir(), "pkg-cache");
        if (!cache.exists() && !cache.mkdirs()) {
            throw new IOException("Cannot create pkg-cache");
        }

        // Ensure dpkg-like tracking dirs
        File infoDir = new File(prefix, "var/lib/dpkg/info");
        File status  = new File(prefix, "var/lib/dpkg/status");
        infoDir.mkdirs();
        if (!status.exists()) {
            try (FileOutputStream fos = new FileOutputStream(status)) {
                fos.write("# MS Code package status\n".getBytes("UTF-8"));
            }
        }

        StringBuilder summary = new StringBuilder();
        for (String pkg : packages) {
            pkg = pkg.trim();
            if (pkg.isEmpty()) continue;
            logMsg(log, "Resolving " + pkg + "…");
            try {
                File deb = downloadDeb(pkg, cache, log);
                logMsg(log, "Extracting " + deb.getName() + " → $PREFIX");
                extractDeb(deb, prefix, pkg, infoDir, log);
                appendStatus(status, pkg);
                summary.append("installed: ").append(pkg).append("\n");
                logMsg(log, "✓ " + pkg);
            } catch (IOException e) {
                summary.append("FAILED: ").append(pkg).append(" — ").append(e.getMessage()).append("\n");
                logMsg(log, "✗ " + pkg + ": " + e.getMessage());
            }
        }
        return summary.toString().trim();
    }

    /** List packages that have a .list file under var/lib/dpkg/info. */
    public List<String> listInstalled() {
        List<String> out = new ArrayList<>();
        File infoDir = new File(rootfs.getPrefixPath(), "var/lib/dpkg/info");
        File[] files = infoDir.listFiles();
        if (files == null) return out;
        for (File f : files) {
            String n = f.getName();
            if (n.endsWith(".list")) {
                out.add(n.substring(0, n.length() - 5));
            }
        }
        java.util.Collections.sort(out);
        return out;
    }

    // ─── Download ─────────────────────────────────────────────────────────────

    private File downloadDeb(String pkg, File cache, ProgressListener log) throws IOException {
        // Try Packages index first
        String debPath = resolveFromPackagesIndex(pkg, log);
        if (debPath == null) {
            // Fallback: common pool layout  pool/main/g/git/git_*_aarch64.deb
            // We need a version — try HEAD on a few mirrors via Packages
            throw new IOException(
                "Could not resolve package '" + pkg + "' in Termux repo for arch " + arch
                + ". Check the name or run pkg update later."
            );
        }

        String url = REPO_BASE + "/" + debPath;
        File dest = new File(cache, new File(debPath).getName());
        if (dest.exists() && dest.length() > 0) {
            logMsg(log, "Using cached " + dest.getName());
            return dest;
        }
        logMsg(log, "Downloading " + url);
        downloadFile(url, dest);
        return dest;
    }

    /**
     * Fetch Packages.gz and find Filename: for the given package.
     * Simple linear scan — fine for occasional installs.
     */
    private String resolveFromPackagesIndex(String pkg, ProgressListener log) throws IOException {
        File indexCache = new File(rootfs.getFilesDir(), "pkg-cache/Packages");
        File indexGz    = new File(rootfs.getFilesDir(), "pkg-cache/Packages.gz");

        boolean needFetch = !indexCache.exists()
            || indexCache.length() == 0
            || (System.currentTimeMillis() - indexCache.lastModified()) > 24L * 3600_000;

        if (needFetch) {
            logMsg(log, "Fetching package index…");
            String url = REPO_BASE + "/dists/stable/main/binary-" + arch + "/Packages.gz";
            downloadFile(url, indexGz);
            // Decompress
            try (GZIPInputStream gis = new GZIPInputStream(new FileInputStream(indexGz));
                 FileOutputStream fos = new FileOutputStream(indexCache)) {
                RootfsManager.pipe(gis, fos);
            }
        }

        // Parse: look for Package: name then Filename:
        try (java.io.BufferedReader br = new java.io.BufferedReader(
                new java.io.InputStreamReader(new FileInputStream(indexCache), "UTF-8"))) {
            String line;
            String currentPkg = null;
            String filename = null;
            String version = null;
            String bestFilename = null;
            // Prefer highest version if multiple (simple string compare is ok for now)
            while ((line = br.readLine()) != null) {
                if (line.startsWith("Package: ")) {
                    // flush previous
                    if (pkg.equals(currentPkg) && filename != null) {
                        if (bestFilename == null) bestFilename = filename;
                        // keep last seen (index is usually sorted)
                        bestFilename = filename;
                    }
                    currentPkg = line.substring(9).trim();
                    filename = null;
                    version = null;
                } else if (line.startsWith("Filename: ")) {
                    filename = line.substring(10).trim();
                } else if (line.startsWith("Version: ")) {
                    version = line.substring(9).trim();
                } else if (line.isEmpty()) {
                    if (pkg.equals(currentPkg) && filename != null) {
                        bestFilename = filename;
                    }
                    currentPkg = null;
                    filename = null;
                }
            }
            if (pkg.equals(currentPkg) && filename != null) {
                bestFilename = filename;
            }
            return bestFilename;
        }
    }

    // ─── Extract .deb ─────────────────────────────────────────────────────────

    /**
     * .deb = ar archive: debian-binary, control.tar.*, data.tar.*
     * We only need data.tar.* extracted into $PREFIX.
     * Uses busybox ar + tar when available; otherwise pure-Java limited ar reader.
     */
    private void extractDeb(File deb, File prefix, String pkg,
                            File infoDir, ProgressListener log) throws IOException {

        File work = new File(rootfs.getFilesDir(), "pkg-cache/extract-" + pkg);
        deleteRecursive(work);
        work.mkdirs();

        // Prefer busybox ar if present
        String busybox = rootfs.getBusyboxPath();
        boolean usedBusybox = false;
        if (new File(busybox).exists()) {
            try {
                // busybox ar x deb
                Process p = new ProcessBuilder(busybox, "ar", "x", deb.getAbsolutePath())
                    .directory(work)
                    .redirectErrorStream(true)
                    .start();
                int code = p.waitFor();
                if (code == 0) usedBusybox = true;
            } catch (Exception e) {
                Log.w(TAG, "busybox ar failed: " + e.getMessage());
            }
        }

        if (!usedBusybox) {
            // Minimal pure-Java ar extractor
            extractAr(deb, work);
        }

        File dataTar = findDataTar(work);
        if (dataTar == null) {
            throw new IOException("No data.tar.* inside " + deb.getName());
        }

        // Termux debs contain data/data/com.termux/files/usr/... — stage then merge
        File stage = new File(work, "stage");
        stage.mkdirs();
        extractDataTar(dataTar, stage, log);
        File src = resolveTermuxUsr(stage);
        if (src == null) {
            throw new IOException("Could not locate package files (expected …/files/usr) in " + deb.getName());
        }
        logMsg(log, "Merging " + src.getAbsolutePath() + " → " + prefix);
        copyTree(src, prefix);

        File listFile = new File(infoDir, pkg + ".list");
        try (FileOutputStream fos = new FileOutputStream(listFile)) {
            fos.write(("# installed by MS Code PkgInstaller\n" + dataTar.getName() + "\n")
                .getBytes("UTF-8"));
        }

        deleteRecursive(work);
    }

    /** Find Termux nested usr/ or relative bin/lib/share root inside stage. */
    private static File resolveTermuxUsr(File stage) {
        File nested = new File(stage, "data/data/com.termux/files/usr");
        if (nested.isDirectory()) return nested;
        File usr = new File(stage, "usr");
        if (usr.isDirectory()) return usr;
        if (new File(stage, "bin").isDirectory()
                || new File(stage, "lib").isDirectory()
                || new File(stage, "share").isDirectory()) {
            return stage;
        }
        // deep search
        return findDirNamed(stage, "usr", 8);
    }

    private static File findDirNamed(File root, String name, int maxDepth) {
        if (maxDepth < 0 || root == null || !root.isDirectory()) return null;
        if (name.equals(root.getName()) && new File(root, "bin").exists()) return root;
        File[] kids = root.listFiles();
        if (kids == null) return null;
        for (File k : kids) {
            File f = findDirNamed(k, name, maxDepth - 1);
            if (f != null) return f;
        }
        return null;
    }

    private static void copyTree(File src, File dest) throws IOException {
        if (src.isDirectory()) {
            if (!dest.exists() && !dest.mkdirs()) {
                throw new IOException("mkdir failed: " + dest);
            }
            File[] kids = src.listFiles();
            if (kids == null) return;
            for (File k : kids) {
                copyTree(k, new File(dest, k.getName()));
            }
        } else {
            File parent = dest.getParentFile();
            if (parent != null && !parent.exists()) parent.mkdirs();
            try (FileInputStream in = new FileInputStream(src);
                 FileOutputStream out = new FileOutputStream(dest)) {
                RootfsManager.pipe(in, out);
            }
            //noinspection ResultOfMethodCallIgnored
            dest.setReadable(true, false);
            if (src.canExecute() || src.getName().contains(".")) {
                //noinspection ResultOfMethodCallIgnored
                dest.setExecutable(true, false);
            }
        }
    }

    private void extractDataTar(File dataTar, File destDir, ProgressListener log) throws IOException {
        String name = dataTar.getName();
        String busybox = rootfs.getBusyboxPath();

        List<String> cmd = new ArrayList<>();
        // Prefer system tar for xz/zstd; busybox for gz/plain
        if (name.endsWith(".xz")) {
            cmd.add("tar");
            cmd.add("-xJf");
            cmd.add(dataTar.getAbsolutePath());
            cmd.add("-C");
            cmd.add(destDir.getAbsolutePath());
        } else if (name.endsWith(".gz") || name.endsWith(".tgz")) {
            if (new File(busybox).exists()) {
                cmd.add(busybox); cmd.add("tar"); cmd.add("-xzf");
            } else {
                cmd.add("tar"); cmd.add("-xzf");
            }
            cmd.add(dataTar.getAbsolutePath());
            cmd.add("-C");
            cmd.add(destDir.getAbsolutePath());
        } else if (name.endsWith(".zst") || name.endsWith(".zstd")) {
            cmd.add("tar");
            cmd.add("--zstd");
            cmd.add("-xf");
            cmd.add(dataTar.getAbsolutePath());
            cmd.add("-C");
            cmd.add(destDir.getAbsolutePath());
        } else {
            if (new File(busybox).exists()) {
                cmd.add(busybox); cmd.add("tar"); cmd.add("-xf");
            } else {
                cmd.add("tar"); cmd.add("-xf");
            }
            cmd.add(dataTar.getAbsolutePath());
            cmd.add("-C");
            cmd.add(destDir.getAbsolutePath());
        }

        logMsg(log, "tar extract: " + name);
        try {
            Process p = new ProcessBuilder(cmd)
                .redirectErrorStream(true)
                .start();
            byte[] buf = new byte[4096];
            InputStream in = p.getInputStream();
            while (in.read(buf) != -1) { /* discard */ }
            int code = p.waitFor();
            if (code != 0) {
                throw new IOException("tar failed (exit " + code + ") for " + name);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("tar interrupted", e);
        }
    }

    private static File findDataTar(File work) {
        File[] files = work.listFiles();
        if (files == null) return null;
        for (File f : files) {
            String n = f.getName();
            if (n.startsWith("data.tar")) return f;
        }
        return null;
    }

    /** Minimal System V ar reader (sufficient for .deb). */
    private static void extractAr(File arFile, File destDir) throws IOException {
        try (FileInputStream fis = new FileInputStream(arFile)) {
            byte[] magic = new byte[8];
            if (fis.read(magic) != 8 || !"!<arch>\n".equals(new String(magic, "ASCII"))) {
                throw new IOException("Not an ar archive");
            }
            byte[] hdr = new byte[60];
            while (true) {
                int n = fis.read(hdr);
                if (n < 60) break;
                String name = new String(hdr, 0, 16, "ASCII").trim();
                // size at offset 48, length 10
                String sizeStr = new String(hdr, 48, 10, "ASCII").trim();
                long size;
                try {
                    size = Long.parseLong(sizeStr);
                } catch (NumberFormatException e) {
                    break;
                }
                // skip extended names etc. — for .deb names are short
                if (name.endsWith("/")) name = name.substring(0, name.length() - 1);
                File out = new File(destDir, name);
                try (FileOutputStream fos = new FileOutputStream(out)) {
                    long remaining = size;
                    byte[] buf = new byte[65536];
                    while (remaining > 0) {
                        int toRead = (int) Math.min(buf.length, remaining);
                        int r = fis.read(buf, 0, toRead);
                        if (r < 0) break;
                        fos.write(buf, 0, r);
                        remaining -= r;
                    }
                }
                // ar members are 2-byte aligned
                if ((size & 1) != 0) fis.read();
            }
        }
    }

    private static void appendStatus(File status, String pkg) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(status, true)) {
            String block = "\nPackage: " + pkg + "\nStatus: install ok installed\n";
            fos.write(block.getBytes("UTF-8"));
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static String normalizeArch(String deviceArch) {
        if (deviceArch == null) return "aarch64";
        if (deviceArch.contains("arm64") || deviceArch.contains("aarch64")) return "aarch64";
        if (deviceArch.contains("x86_64") || deviceArch.contains("amd64")) return "x86_64";
        if (deviceArch.contains("x86") || deviceArch.contains("i686")) return "i686";
        if (deviceArch.contains("arm")) return "arm";
        return "aarch64";
    }

    private static void downloadFile(String urlStr, File dest) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(300_000);
        conn.setInstanceFollowRedirects(true);
        conn.connect();
        int code = conn.getResponseCode();
        if (code >= 400) {
            throw new IOException("HTTP " + code + " for " + urlStr);
        }
        File parent = dest.getParentFile();
        if (parent != null) parent.mkdirs();
        try (InputStream in = conn.getInputStream();
             FileOutputStream out = new FileOutputStream(dest)) {
            RootfsManager.pipe(in, out);
        }
    }

    private static void deleteRecursive(File f) {
        if (f == null || !f.exists()) return;
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) for (File k : kids) deleteRecursive(k);
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }

    private static void logMsg(ProgressListener log, String msg) {
        Log.i(TAG, msg);
        if (log != null) log.onLog(msg);
    }
}
