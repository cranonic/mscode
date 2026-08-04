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
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Manages the Alpine Linux rootfs and proot binaries on the device.
 *
 * ─── Setup priority ───────────────────────────────────────────────────────
 *  Binaries (proot + libtalloc):
 *    • proot is ALWAYS taken from nativeLibraryDir (jniLibs) as libproot.so.
 *      Never copied to filesDir — Android blocks execute-from-writable-storage
 *      when targetSdkVersion > 28.
 *    • libtalloc.so is symlinked (or copied) into filesDir as libtalloc.so.2
 *      for LD_LIBRARY_PATH only (it is a library, not an executable).
 *
 *  Alpine rootfs:
 *    1. Already extracted → skip.
 *    2. Bundled asset zip (alpine-<arch>.zip) → extract from APK.
 *       The zip wraps the tar.gz so gradle doesn't strip/compress it.
 *    3. Download tar.gz directly from Alpine CDN → extract.
 */
public class RootfsManager {

    private static final String TAG = "RootfsManager";

    private final Context context;

    /** Resolved once, reused everywhere. */
    private final String filesDir;
    private final String nativeLibDir;

    public RootfsManager(Context context) {
        this.context      = context;
        this.filesDir     = context.getFilesDir().getAbsolutePath();
        this.nativeLibDir = context.getApplicationInfo().nativeLibraryDir;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public String getFilesDir()     { return filesDir; }
    public String getRootfsPath()   { return filesDir + "/alpine_core"; }
    public String getTmpPath()      { return getRootfsPath() + "/tmp"; }

    /**
     * Always points at the native library copy of proot.
     * NEVER returns a path under filesDir — that breaks on targetSdk > 28.
     */
    public String getProotPath() {
        return nativeLibDir + "/libproot.so";
    }

    /** Returns true if Alpine is fully extracted. */
    public boolean isRootfsReady() {
        return new File(getRootfsPath(), "etc/alpine-release").exists();
    }

    /**
     * Ensures proot is present in nativeLibraryDir and libtalloc.so.2
     * is available under filesDir for LD_LIBRARY_PATH.
     *
     * proot is never copied into filesDir.
     *
     * @param arch  "aarch64" or "x86_64" (kept for API compatibility)
     */
    public void ensureBinaries(String arch) throws IOException {
        File prootLib  = new File(nativeLibDir, "libproot.so");
        File tallocLib = new File(nativeLibDir, "libtalloc.so");

        if (!prootLib.exists()) {
            throw new IOException(
                "libproot.so missing from nativeLibraryDir (" + nativeLibDir + "). " +
                "Bundle it under jniLibs/arm64-v8a/libproot.so (and other ABIs as needed)."
            );
        }
        Log.i(TAG, "Using proot from nativeLibraryDir: " + prootLib.getAbsolutePath());

        // libtalloc is only needed on LD_LIBRARY_PATH — symlink preferred
        File tallocDest = new File(filesDir, "libtalloc.so.2");
        if (!tallocDest.exists() && tallocLib.exists()) {
            refreshTallocSymlink();
        } else if (!tallocLib.exists()) {
            Log.w(TAG, "libtalloc.so not found in nativeLibraryDir — some proot features may fail");
        }
    }

    /**
     * Ensures $filesDir/libtalloc.so.2 → nativeLibraryDir/libtalloc.so.
     * Safe to call repeatedly (idempotent).
     */
    public void refreshTallocSymlink() {
        File tallocLib = new File(nativeLibDir, "libtalloc.so");
        if (!tallocLib.exists()) return;

        File tallocDest = new File(filesDir, "libtalloc.so.2");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Path dest = tallocDest.toPath();
                Path src  = tallocLib.toPath();

                if (Files.isSymbolicLink(dest)) {
                    Path current = Files.readSymbolicLink(dest);
                    if (current.equals(src)) return;
                }

                Files.deleteIfExists(dest);
                Files.createSymbolicLink(dest, src);
                Log.i(TAG, "Created talloc symlink: " + dest + " → " + src);
                return;
            } catch (Exception e) {
                Log.w(TAG, "Symlink failed, falling back to copy", e);
            }
        }

        // Pre-O or symlink failed → copy
        try {
            if (!tallocDest.exists()) {
                copyFile(tallocLib, tallocDest);
                Log.i(TAG, "Copied libtalloc.so → libtalloc.so.2");
            }
        } catch (IOException e) {
            Log.e(TAG, "Failed to install libtalloc.so.2", e);
        }
    }

    /**
     * Ensures Alpine rootfs is extracted.
     * See class Javadoc for priority order.
     *
     * @param arch  "aarch64" or "x86_64"
     */
    public void ensureRootfs(String arch) throws IOException {
        String rootfsPath = getRootfsPath();

        if (isRootfsReady()) return;

        // Try bundled zip asset
        String assetName = "alpine-" + arch + ".zip";
        if (hasAsset(assetName)) {
            Log.i(TAG, "Extracting bundled Alpine (" + assetName + ")...");
            extractAlpineFromAsset(assetName, rootfsPath);
            return;
        }

        // Fallback: download from CDN
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

    /** Creates filesDir/alpine_core/tmp if missing. */
    public void ensureTmpDir() {
        new File(getTmpPath()).mkdirs();
    }

    // ─── Hostname helpers ─────────────────────────────────────────────────────

    /** Reads persisted hostname from rootfs. Default: "mscode". */
    public String getStoredHostname() {
        File f = new File(getRootfsPath(), "etc/mscode_hostname");
        if (f.exists()) {
            try (FileInputStream fis = new FileInputStream(f)) {
                String h = new String(readAll(fis), "UTF-8").trim();
                if (!h.isEmpty()) return h;
            } catch (IOException ignored) {}
        }
        return "mscode";
    }

    /** Persists hostname to rootfs/etc/mscode_hostname. */
    public void saveHostname(String name) throws IOException {
        File f = new File(getRootfsPath(), "etc/mscode_hostname");
        f.getParentFile().mkdirs();
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
