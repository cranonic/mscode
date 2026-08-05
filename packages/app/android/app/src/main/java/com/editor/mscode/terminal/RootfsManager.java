package com.editor.mscode.terminal;

import android.content.Context;
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
 * Manages native busybox binaries and (optional legacy) Alpine rootfs.
 *
 * ─── Native mode (default) ────────────────────────────────────────────────
 *  • libbusybox.so from nativeLibraryDir (jniLibs) — never copied to filesDir
 *  • home  = filesDir/home
 *  • tmp   = filesDir/tmp
 *  • No Alpine extract, no proot, no talloc
 *
 * ─── Legacy proot mode ────────────────────────────────────────────────────
 *  proot + libtalloc + Alpine rootfs still available if needed.
 */
public class RootfsManager {

    private static final String TAG = "RootfsManager";

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

    /** Native busybox path — always under nativeLibraryDir. */
    public String getBusyboxPath() {
        return nativeLibDir + "/libbusybox.so";
    }

    /** User home for native sessions. */
    public String getHomePath() {
        return filesDir + "/home";
    }

    /**
     * Temp dir.
     * Native: filesDir/tmp
     * (Legacy Alpine used alpine_core/tmp — no longer default.)
     */
    public String getTmpPath() {
        return filesDir + "/tmp";
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

    // ─── Native setup ─────────────────────────────────────────────────────────

    /**
     * Ensures libbusybox.so is present and creates home + tmp directories.
     * Call this instead of ensureRootfs() for native sessions.
     */
    public void ensureNativeBinaries() throws IOException {
        File busybox = new File(getBusyboxPath());
        if (!busybox.exists()) {
            throw new IOException(
                "libbusybox.so missing from nativeLibraryDir (" + nativeLibDir + "). " +
                "Bundle it under jniLibs/<abi>/libbusybox.so"
            );
        }
        Log.i(TAG, "Using busybox from nativeLibraryDir: " + busybox.getAbsolutePath());

        File home = new File(getHomePath());
        if (!home.exists() && !home.mkdirs()) {
            throw new IOException("Failed to create home dir: " + home);
        }

        File tmp = new File(getTmpPath());
        if (!tmp.exists() && !tmp.mkdirs()) {
            throw new IOException("Failed to create tmp dir: " + tmp);
        }

        Log.i(TAG, "Native dirs ready — home=" + home + " tmp=" + tmp);
    }

    /**
     * Native "ready" check: busybox present + home/tmp exist.
     * Used by isRootfsReady() so frontend checkSetup still works.
     */
    public boolean isNativeReady() {
        return new File(getBusyboxPath()).exists()
            && new File(getHomePath()).isDirectory()
            && new File(getTmpPath()).isDirectory();
    }

    /**
     * Returns true if the session environment is ready.
     * Prefer native readiness; fall back to Alpine only if present.
     */
    public boolean isRootfsReady() {
        if (new File(getBusyboxPath()).exists()) {
            // Native path — treat as ready once dirs exist (or after ensureNativeBinaries)
            return new File(getHomePath()).isDirectory()
                || new File(getBusyboxPath()).exists(); // busybox alone is enough to start
        }
        return new File(getRootfsPath(), "etc/alpine-release").exists();
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
        tarGz.delete();
    }

    /** Creates tmp dir if missing. */
    public void ensureTmpDir() {
        new File(getTmpPath()).mkdirs();
        new File(getHomePath()).mkdirs();
    }

    // ─── Hostname helpers ─────────────────────────────────────────────────────

    /** Reads persisted hostname. Native: filesDir/hostname. Default: "mscode". */
    public String getStoredHostname() {
        // Prefer native location
        File nativeHost = new File(filesDir, "hostname");
        if (nativeHost.exists()) {
            try (FileInputStream fis = new FileInputStream(nativeHost)) {
                String h = new String(readAll(fis), "UTF-8").trim();
                if (!h.isEmpty()) return h;
            } catch (IOException ignored) {}
        }
        // Legacy Alpine location
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

    private boolean hasAsset(String name) {
        try {
            context.getAssets().open(name).close();
            return true;
        } catch (IOException e) {
            return false;
        }
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
        tmpZip.delete();

        if (tarGz == null) throw new IOException("No .tar.gz inside " + assetName);
        new File(rootfsPath).mkdirs();
        extractTarGz(rootfsPath, tarGz);
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
        if (dest.exists()) return;
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(120_000);
        conn.connect();
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
