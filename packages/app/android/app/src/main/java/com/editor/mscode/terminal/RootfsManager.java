package com.editor.mscode.terminal;

import android.content.Context;
import android.os.Build;
import android.util.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Manages native environment: toybox + Termux-style Bionic bootstrap ($PREFIX).
 *
 * Layout (mirrors Termux, no proot):
 *   filesDir/
 *     home/          ← $HOME
 *     tmp/           ← $TMPDIR
 *     usr/           ← $PREFIX  (bootstrap extract target)
 *       bin/ lib/ etc/ share/ var/ ...
 *     hostname
 *
 * ─── Native mode (default) ────────────────────────────────────────────────
 *  • libtoybox.so from nativeLibraryDir (jniLibs)
 *  • Optional Termux bootstrap → filesDir/usr ($PREFIX)
 *  • No Alpine. proot only for C/C++ helper
 *
 * ─── Legacy proot mode ────────────────────────────────────────────────────
 *  proot + libtalloc kept only for C/C++ helper (clang/gcc/tcc). No Alpine.
 *
 * ─── targetSdk > 28 note ──────────────────────────────────────────────────
 *  Binaries under filesDir are not directly executable.
 *  Bootstrap packages install into $PREFIX; execution of those binaries
 *  requires either (a) copying selected tools into nativeLibraryDir as
 *  lib*.so, or (b) a linker wrapper. Toybox applets always work.
 */
public class RootfsManager {

    private static final String TAG = "RootfsManager";

    /** Current bootstrap schema version — bump when layout changes. */
    /** Bump when extract logic changes (e.g. SYMLINKS.txt handling). */
    private static final int BOOTSTRAP_VERSION = 2;

    /**
     * Termux bootstrap zip URLs (Bionic, no glibc).
     * Override via assets "bootstrap-<arch>.zip" when present.
     * Tag format used by termux-packages releases (apt.android-7).
     * Update BOOTSTRAP_TAG when bumping.
     */
    /** Online-only — keeps APK small. Bump tag when Termux publishes a new bootstrap. */
    private static final String BOOTSTRAP_TAG =
        "bootstrap-2026.08.02-r1%2Bapt.android-7";
    private static final String BOOTSTRAP_BASE =
        "https://github.com/termux/termux-packages/releases/download/" + BOOTSTRAP_TAG;

    private final Context context;

    private final String filesDir;
    private final String nativeLibDir;

    public RootfsManager(Context context) {
        this.context      = context;
        this.filesDir     = context.getFilesDir().getAbsolutePath();
        this.nativeLibDir = context.getApplicationInfo().nativeLibraryDir;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public String getFilesDir()     { return filesDir; }
    public String getNativeLibDir() { return nativeLibDir; }

    /** Native toybox path — always under nativeLibraryDir. */
    public String getToyboxPath() {
        return nativeLibDir + "/libtoybox.so";
    }

    /** User home for native / Termux-style sessions. */
    public String getHomePath() {
        return filesDir + "/home";
    }

    /**
     * Temp dir.
     * Native / bootstrap: filesDir/tmp
     */
    public String getTmpPath() {
        return filesDir + "/tmp";
    }

    /**
     * Termux-style prefix ($PREFIX).
     * Bootstrap extracts here → usr/bin, usr/lib, …
     */
    public String getPrefixPath() {
        return filesDir + "/usr";
    }

    /** Legacy Alpine rootfs path (only used if proot mode is re-enabled). */
    public String getRootfsPath() {
        return filesDir + "/alpine_core";
    }

    /**
     * Always points at the native library copy of proot (legacy).
     * NEVER returns a path under filesDir — that breaks on targetSdk > 28.
     */
    public String getProotPath() {
        return nativeLibDir + "/libproot.so";
    }

    // ─── Native + Bootstrap setup ─────────────────────────────────────────────

    /**
     * Ensures libtoybox.so is present and creates home + tmp directories.
     * Call this for every native session start.
     */
    public void ensureNativeBinaries() throws IOException {
        File toybox = new File(getToyboxPath());
        if (!toybox.exists()) {
            throw new IOException(
                "libtoybox.so missing from nativeLibraryDir (" + nativeLibDir + "). " +
                "Bundle it under jniLibs/<abi>/libtoybox.so"
            );
        }
        Log.i(TAG, "Using toybox from nativeLibraryDir: " + toybox.getAbsolutePath());

        ensureDir(getHomePath());
        ensureDir(getTmpPath());

        Log.i(TAG, "Native dirs ready — home=" + getHomePath() + " tmp=" + getTmpPath());
    }

    /**
     * Ensures Termux-style bootstrap ($PREFIX = filesDir/usr) is present.
     * Order of preference:
     *   1. Already extracted and version matches
     *   2. Bundled asset bootstrap-<arch>.zip
     *   3. Download from Termux bootstrap release
     *
     * Safe to call repeatedly. Does not touch Alpine / proot.
     *
     * @param arch  "aarch64" | "arm" | "x86_64" | "i686"
     */
    public void ensureBootstrap(String arch) throws IOException {
        ensureNativeBinaries();

        File prefix = new File(getPrefixPath());
        File marker = new File(prefix, ".mscode_bootstrap_version");

        if (prefix.isDirectory() && marker.isFile()) {
            try {
                String ver = new String(readAll(new FileInputStream(marker)), "UTF-8").trim();
                if (String.valueOf(BOOTSTRAP_VERSION).equals(ver)
                        && new File(prefix, "bin").isDirectory()) {
                    Log.i(TAG, "Bootstrap already ready (v" + ver + ") at " + prefix);
                    return;
                }
            } catch (IOException ignored) {}
        }

        // Clean partial extract
        if (prefix.exists()) {
            Log.w(TAG, "Removing incomplete/old bootstrap at " + prefix);
            deleteRecursive(prefix);
        }

        String assetName = "bootstrap-" + arch + ".zip";
        if (hasAsset(assetName)) {
            Log.i(TAG, "Extracting bundled bootstrap (" + assetName + ")…");
            extractBootstrapZipFromAsset(assetName, prefix);
        } else {
            String url = bootstrapUrlFor(arch);
            Log.i(TAG, "Downloading Termux bootstrap for " + arch + " from " + url);
            File zip = new File(context.getCacheDir(), "bootstrap-" + arch + ".zip");
            downloadFile(url, zip);
            extractBootstrapZip(zip, prefix);
            //noinspection ResultOfMethodCallIgnored
            zip.delete();
        }

        // Write version marker
        ensureDir(prefix.getAbsolutePath());
        try (FileOutputStream fos = new FileOutputStream(marker)) {
            fos.write(String.valueOf(BOOTSTRAP_VERSION).getBytes("UTF-8"));
        }

        // Minimal skeleton if bootstrap zip was empty / failed partially
        ensureDir(getPrefixPath() + "/bin");
        ensureDir(getPrefixPath() + "/lib");
        ensureDir(getPrefixPath() + "/etc");
        ensureDir(getPrefixPath() + "/var/lib");
        ensureDir(getPrefixPath() + "/tmp");

        // Symlink-friendly: some packages expect $PREFIX/tmp
        // (we already have filesDir/tmp as TMPDIR)

        Log.i(TAG, "Bootstrap ready at " + prefix.getAbsolutePath());
    }

    /**
     * Lightweight check used by isRootfsReady / frontend.
     * Toybox + home is enough to start a shell; bootstrap is optional.
     */
    public boolean isNativeReady() {
        return new File(getToyboxPath()).exists()
            && new File(getHomePath()).isDirectory()
            && new File(getTmpPath()).isDirectory();
    }

    /** True when $PREFIX/bin exists and version marker is valid. */
    public boolean isBootstrapReady() {
        File marker = new File(getPrefixPath(), ".mscode_bootstrap_version");
        if (!marker.isFile()) return false;
        try {
            String ver = new String(readAll(new FileInputStream(marker)), "UTF-8").trim();
            return String.valueOf(BOOTSTRAP_VERSION).equals(ver)
                && new File(getPrefixPath(), "bin").isDirectory();
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Returns true if the session environment is ready.
     * Prefer native readiness; bootstrap is additive.
     */
    public boolean isRootfsReady() {
        if (new File(getToyboxPath()).exists()) {
            return new File(getHomePath()).isDirectory()
                || new File(getToyboxPath()).exists();
        }
        return new File(getRootfsPath(), "etc/alpine-release").exists();
    }

    /** Creates tmp + home if missing. */
    public void ensureTmpDir() {
        new File(getTmpPath()).mkdirs();
        new File(getHomePath()).mkdirs();
    }

    // ─── Legacy proot / Alpine (kept for optional fallback) ───────────────────

    /**
     * Ensures proot + libtalloc are present (legacy).
     */
    public void ensureBinaries(String arch) throws IOException {
        File prootLib  = new File(nativeLibDir, "libproot.so");
        File tallocLib = new File(nativeLibDir, "libtalloc.so");

        if (!prootLib.exists()) {
            throw new IOException(
                "libproot.so missing from nativeLibraryDir (" + nativeLibDir + "). " +
                "Bundle it under jniLibs/<abi>/libproot.so"
            );
        }
        Log.i(TAG, "Using proot from nativeLibraryDir: " + prootLib.getAbsolutePath());

        if (!tallocLib.exists()) {
            File tallocVersioned = new File(nativeLibDir, "libtalloc.so.2");
            if (tallocVersioned.exists()) {
                tallocLib = tallocVersioned;
            } else {
                throw new IOException(
                    "libtalloc.so missing from nativeLibraryDir (" + nativeLibDir + ")."
                );
            }
        }

        installTallocLibrary(tallocLib);
    }

    public void installTallocLibrary(File tallocSrc) throws IOException {
        File tallocDest = new File(filesDir, "libtalloc.so.2");

        boolean needCopy = !tallocDest.exists()
            || !tallocDest.isFile()
            || tallocDest.length() != tallocSrc.length();

        if (!needCopy) {
            Log.i(TAG, "libtalloc.so.2 already installed: " + tallocDest.getAbsolutePath());
            return;
        }

        if (tallocDest.exists() && !tallocDest.delete()) {
            Log.w(TAG, "Could not delete stale " + tallocDest);
        }

        copyFile(tallocSrc, tallocDest);
        //noinspection ResultOfMethodCallIgnored
        tallocDest.setReadable(true, false);

        if (!tallocDest.exists() || tallocDest.length() == 0) {
            throw new IOException("Failed to install libtalloc.so.2 into " + filesDir);
        }
        Log.i(TAG, "Installed libtalloc.so.2 (" + tallocDest.length() + " bytes) → " + tallocDest);
    }

    /** @deprecated */
    public void refreshTallocSymlink() {
        File tallocLib = new File(nativeLibDir, "libtalloc.so");
        if (!tallocLib.exists()) tallocLib = new File(nativeLibDir, "libtalloc.so.2");
        if (!tallocLib.exists()) return;
        try {
            installTallocLibrary(tallocLib);
        } catch (IOException e) {
            Log.e(TAG, "refreshTallocSymlink failed", e);
        }
    }

    /**
     * Ensures Alpine rootfs is extracted (legacy — skip for native).
     */
    public void ensureRootfs(String arch) throws IOException {
        String rootfsPath = getRootfsPath();

        if (new File(rootfsPath, "etc/alpine-release").exists()) return;

        String assetName = "alpine-" + arch + ".zip";
        if (hasAsset(assetName)) {
            Log.i(TAG, "Extracting bundled Alpine (" + assetName + ")...");
            extractAlpineFromAsset(assetName, rootfsPath);
            return;
        }

        String alpineUrl = arch.equals("aarch64")
            ? "https://dl-cdn.alpinelinux.org/alpine/latest-stable/releases/aarch64/alpine-minirootfs-3.23.3-aarch64.tar.gz"
            : "https://dl-cdn.alpinelinux.org/alpine/v3.21/releases/x86_64/alpine-minirootfs-3.21.0-x86_64.tar.gz";

        Log.i(TAG, "Downloading Alpine rootfs for " + arch + "...");
        File tarGz = new File(filesDir, "alpine.tar.gz");
        downloadFile(alpineUrl, tarGz);
        new File(rootfsPath).mkdirs();
        extractTarGz(rootfsPath, tarGz);
        //noinspection ResultOfMethodCallIgnored
        tarGz.delete();
    }

    // ─── Hostname helpers ─────────────────────────────────────────────────────

    /** Reads persisted hostname. Native: filesDir/hostname. Default: "mscode". */
    public String getStoredHostname() {
        File nativeHost = new File(filesDir, "hostname");
        if (nativeHost.exists()) {
            try (FileInputStream fis = new FileInputStream(nativeHost)) {
                String h = new String(readAll(fis), "UTF-8").trim();
                if (!h.isEmpty()) return h;
            } catch (IOException ignored) {}
        }
        File f = new File(getRootfsPath(), "etc/mscode_hostname");
        if (f.exists()) {
            try (FileInputStream fis = new FileInputStream(f)) {
                String h = new String(readAll(fis), "UTF-8").trim();
                if (!h.isEmpty()) return h;
            } catch (IOException ignored) {}
        }
        return "mscode";
    }

    /** Persists hostname (native path). */
    public void saveHostname(String name) throws IOException {
        File f = new File(filesDir, "hostname");
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(name.getBytes("UTF-8"));
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private static String bootstrapUrlFor(String arch) {
        // Termux uses: aarch64, arm, i686, x86_64
        String a = arch;
        if ("arm64".equals(a) || "arm64-v8a".equals(a)) a = "aarch64";
        if ("armeabi-v7a".equals(a) || "armv7".equals(a)) a = "arm";
        if ("x86".equals(a)) a = "i686";
        return BOOTSTRAP_BASE + "/bootstrap-" + a + ".zip";
    }

    private void ensureDir(String path) throws IOException {
        File d = new File(path);
        if (!d.exists() && !d.mkdirs()) {
            throw new IOException("Failed to create dir: " + d);
        }
    }

    private boolean hasAsset(String name) {
        try {
            context.getAssets().open(name).close();
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private void extractBootstrapZipFromAsset(String assetName, File destPrefix) throws IOException {
        File tmpZip = new File(context.getCacheDir(), assetName);
        try (InputStream in = context.getAssets().open(assetName);
             FileOutputStream out = new FileOutputStream(tmpZip)) {
            pipe(in, out);
        }
        extractBootstrapZip(tmpZip, destPrefix);
        //noinspection ResultOfMethodCallIgnored
        tmpZip.delete();
    }

    /**
     * Termux bootstrap zip root contains bin/, lib/, etc. directly.
     * Symlinks are not stored as real links — they are listed in SYMLINKS.txt
     * as "target←relative/path". We must recreate them after extract.
     */
    private void extractBootstrapZip(File zipFile, File destPrefix) throws IOException {
        destPrefix.mkdirs();
        java.util.List<String[]> pendingSymlinks = new java.util.ArrayList<>();
        byte[] buf = new byte[65536];

        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFile))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.startsWith("/") || name.contains("..")) {
                    zis.closeEntry();
                    continue;
                }

                // SYMLINKS.txt: collect, do not write as a normal file
                if ("SYMLINKS.txt".equals(name) || name.endsWith("/SYMLINKS.txt")) {
                    java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(zis, "UTF-8"));
                    String line;
                    while ((line = br.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty()) continue;
                        int sep = line.indexOf('←');
                        if (sep < 0) {
                            Log.w(TAG, "Malformed SYMLINKS line: " + line);
                            continue;
                        }
                        String target = line.substring(0, sep);
                        String linkRel = line.substring(sep + 1);
                        // strip leading ./
                        if (linkRel.startsWith("./")) linkRel = linkRel.substring(2);
                        pendingSymlinks.add(new String[]{ target, linkRel });
                    }
                    // do not closeEntry via normal path — stream consumed
                    continue;
                }

                File out = new File(destPrefix, name);
                if (entry.isDirectory()) {
                    out.mkdirs();
                } else {
                    File parent = out.getParentFile();
                    if (parent != null) parent.mkdirs();
                    try (FileOutputStream fos = new FileOutputStream(out)) {
                        int n;
                        while ((n = zis.read(buf)) != -1) fos.write(buf, 0, n);
                    }
                    //noinspection ResultOfMethodCallIgnored
                    out.setReadable(true, false);
                    // Executable for bin/, libexec/, and known scripts
                    if (name.startsWith("bin/") || name.startsWith("libexec/")
                            || name.contains("/bin/") || name.endsWith(".so")
                            || name.endsWith(".sh")) {
                        //noinspection ResultOfMethodCallIgnored
                        out.setExecutable(true, false);
                    }
                }
                zis.closeEntry();
            }
        }

        // Recreate symlinks from SYMLINKS.txt
        int linkCount = 0;
        for (String[] pair : pendingSymlinks) {
            String target = pair[0];
            String linkRel = pair[1];
            File linkFile = new File(destPrefix, linkRel);
            File parent = linkFile.getParentFile();
            if (parent != null && !parent.exists()) parent.mkdirs();
            if (linkFile.exists()) {
                //noinspection ResultOfMethodCallIgnored
                linkFile.delete();
            }
            try {
                // Java NIO symlink (works on Android for app-private dirs)
                java.nio.file.Files.createSymbolicLink(
                    linkFile.toPath(),
                    java.nio.file.Paths.get(target)
                );
                linkCount++;
            } catch (Exception e) {
                // Fallback: copy if target is relative and exists
                File targetFile = new File(linkFile.getParentFile(), target);
                if (!targetFile.isAbsolute()) {
                    targetFile = new File(destPrefix, target);
                }
                if (targetFile.isFile()) {
                    copyFile(targetFile, linkFile);
                    //noinspection ResultOfMethodCallIgnored
                    linkFile.setExecutable(true, false);
                    linkCount++;
                    Log.w(TAG, "Symlink fallback copy: " + linkRel + " → " + target);
                } else {
                    Log.w(TAG, "Failed symlink " + linkRel + " → " + target + ": " + e.getMessage());
                }
            }
        }
        Log.i(TAG, "Bootstrap extract done — " + linkCount + " symlinks created");
    }

    private void extractAlpineFromAsset(String assetName, String rootfsPath) throws IOException {
        File tmpZip = new File(context.getCacheDir(), assetName);

        try (InputStream in  = context.getAssets().open(assetName);
             FileOutputStream out = new FileOutputStream(tmpZip)) {
            pipe(in, out);
        }

        File tarGz = null;
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(tmpZip))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.endsWith(".tar.gz") || name.endsWith(".tgz")) {
                    tarGz = new File(context.getCacheDir(), new File(name).getName());
                    try (FileOutputStream fos = new FileOutputStream(tarGz)) {
                        byte[] buf = new byte[65536]; int n;
                        while ((n = zis.read(buf)) != -1) fos.write(buf, 0, n);
                    }
                    break;
                }
            }
        }
        //noinspection ResultOfMethodCallIgnored
        tmpZip.delete();

        if (tarGz == null) throw new IOException("No .tar.gz inside " + assetName);
        new File(rootfsPath).mkdirs();
        extractTarGz(rootfsPath, tarGz);
        //noinspection ResultOfMethodCallIgnored
        tarGz.delete();
    }

    private void extractTarGz(String destDir, File tarFile) throws IOException {
        try {
            new ProcessBuilder("tar", "-xzf", tarFile.getAbsolutePath(), "-C", destDir)
                .redirectErrorStream(true).start().waitFor();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("tar interrupted", e);
        }
    }

    private void downloadFile(String urlStr, File dest) throws IOException {
        if (dest.exists() && dest.length() > 0) return;
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(300_000);
        conn.setInstanceFollowRedirects(true);
        conn.connect();
        int code = conn.getResponseCode();
        if (code >= 400) {
            throw new IOException("HTTP " + code + " downloading " + urlStr);
        }
        try (InputStream in  = conn.getInputStream();
             FileOutputStream out = new FileOutputStream(dest)) {
            pipe(in, out);
        }
    }

    private void copyFile(File src, File dest) throws IOException {
        try (FileInputStream in  = new FileInputStream(src);
             FileOutputStream out = new FileOutputStream(dest)) {
            pipe(in, out);
        }
    }

    private static void deleteRecursive(File f) {
        if (f == null || !f.exists()) return;
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) {
                for (File k : kids) deleteRecursive(k);
            }
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }

    static void pipe(InputStream in, OutputStream out) throws IOException {
        byte[] buf = new byte[65536]; int n;
        while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
    }

    static byte[] readAll(InputStream in) throws IOException {
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[4096]; int n;
        while ((n = in.read(buf)) != -1) bos.write(buf, 0, n);
        return bos.toByteArray();
    }
}
