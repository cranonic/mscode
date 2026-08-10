package com.editor.mscode.terminal.initenv;

import com.editor.mscode.terminal.RootfsManager;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Stamp-based cache for mscode_env.sh.
 * Rebuilds only when bootstrap / PREFIX/bin / toybox path changes.
 */
public class SharedEnvCache {

    private final RootfsManager rootfs;
    private final SharedEnvBuilder builder;

    public SharedEnvCache(RootfsManager rootfs) {
        this.rootfs = rootfs;
        this.builder = new SharedEnvBuilder(rootfs);
    }

    public void ensureSharedEnv() throws IOException {
        String sharedPath = rootfs.getFilesDir() + "/mscode_env.sh";
        File shared = new File(sharedPath);
        String stamp = computeEnvStamp();
        File stampFile = new File(rootfs.getFilesDir(), ".mscode_env_stamp");
        if (shared.isFile() && stampFile.isFile()) {
            try {
                String old = new String(readAll(new FileInputStream(stampFile)), "UTF-8").trim();
                if (stamp.equals(old) && shared.length() > 200) {
                    return; // cache hit
                }
            } catch (IOException ignored) {}
        }
        builder.writeFullEnv(sharedPath, rootfs.getHomePath(), /*includeSessionBits*/ false);
        try (FileOutputStream fos = new FileOutputStream(stampFile)) {
            fos.write(stamp.getBytes("UTF-8"));
        }
    }

    /** Force rebuild on next ensureSharedEnv (e.g. after pkg install). */
    public void invalidate() {
        new File(rootfs.getFilesDir(), ".mscode_env_stamp").delete();
    }

    private String computeEnvStamp() {
        StringBuilder s = new StringBuilder();
        s.append("v5|"); // bumped: mksh 'set -o multiline' wrap fix (was horizontal-scrolling with '<')
        s.append(rootfs.isBootstrapReady() ? "1" : "0").append('|');
        s.append(rootfs.getToyboxPath()).append('|');
        s.append(rootfs.getNativeLibDir()).append('|');
        File bin = new File(rootfs.getPrefixPath(), "bin");
        if (bin.isDirectory()) {
            File[] kids = bin.listFiles();
            long count = kids == null ? 0 : kids.length;
            // Order-independent fingerprint (sum + max of mtimes)
            long maxM = 0;
            long sumM = 0;
            if (kids != null) {
                for (File k : kids) {
                    long m = k.lastModified();
                    sumM += m;
                    if (m > maxM) maxM = m;
                }
            }
            s.append(count).append('|').append(maxM).append('|').append(sumM);
        } else {
            s.append("0|0|0");
        }
        return s.toString();
    }

    private static byte[] readAll(FileInputStream fis) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = fis.read(buf)) != -1) bos.write(buf, 0, n);
        return bos.toByteArray();
    }
}