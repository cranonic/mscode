package com.editor.mscode.terminal;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Builds the command array and environment for a terminal session
 * or a one-shot background execution.
 *
 * Supports two modes:
 *   • Native (default) — libbusybox.so + optional Termux $PREFIX, no proot
 *   • Legacy proot     — kept for reference / optional fallback
 *
 * ─── targetSdk > 28 note ──────────────────────────────────────────────────
 *  Binary path always comes from nativeLibraryDir (libbusybox.so / libproot.so).
 *  Never point at a binary under getFilesDir() — Android blocks execution
 *  from writable app storage when targetSdkVersion is higher than 28.
 *  $PREFIX/bin is on PATH for packages that were made executable via the
 *  bootstrap / package installer path (linker or nativeLibraryDir copy).
 *
 * Background jobs do NOT source mscode_env.sh (busybox applet functions call
 * $BUSYBOX and break after APK updates with "can't execute: Is a directory").
 * Interactive sessions still use ENV= init script with full wrappers.
 */
public class ProotCommandBuilder {

    private final String busyboxPath;
    private final String prootPath;
    private final String rootfsPath;
    private final String nativeLibDir;
    private final String filesDir;
    private final String homePath;
    private final String tmpPath;
    private final String prefixPath;

    /** Prefer native busybox + bootstrap over proot. */
    private boolean useNative = true;

    public ProotCommandBuilder(RootfsManager mgr, String nativeLibDir) {
        this.busyboxPath  = mgr.getBusyboxPath();
        this.prootPath    = mgr.getProotPath();
        this.rootfsPath   = mgr.getRootfsPath();
        this.filesDir     = mgr.getFilesDir();
        this.nativeLibDir = nativeLibDir;
        this.homePath     = mgr.getHomePath();
        this.tmpPath      = mgr.getTmpPath();
        this.prefixPath   = mgr.getPrefixPath();
    }

    public void setUseNative(boolean nativeMode) {
        this.useNative = nativeMode;
    }

    public boolean isNative() {
        return useNative;
    }

    // ─── Terminal session command ─────────────────────────────────────────────

    public String[] buildSessionCommand(String initScriptPath) {
        if (useNative) {
            return buildNativeSessionCommand(initScriptPath);
        }
        return buildProotSessionCommand(initScriptPath);
    }

    /**
     * Native session: /system/bin/sh -i
     * Init script is sourced via ENV= (see buildNativeSessionEnv).
     */
    public String[] buildNativeSessionCommand(String initScriptPath) {
        List<String> cmd = new ArrayList<>();
        cmd.add("/system/bin/sh");
        cmd.add("-i");
        return cmd.toArray(new String[0]);
    }

    private String[] buildProotSessionCommand(String initScriptPath) {
        List<String> cmd = new ArrayList<>();
        cmd.add(prootPath);
        addCommonProotFlags(cmd);
        cmd.add("sh");
        cmd.add(initScriptPath);
        return cmd.toArray(new String[0]);
    }

    // ─── Background ───────────────────────────────────────────────────────────

    public String[] buildBackgroundCommand(String shellCommand) {
        if (useNative) {
            return buildNativeBackgroundCommand(shellCommand);
        }
        return buildProotBackgroundCommand(shellCommand);
    }

    /**
     * Clean background shell — no mscode_env.sh.
     * Interactive terminal keeps full wrappers via ENV= init script.
     * runpfx helper runs $PREFIX/bin tools via linker64 when not +x.
     * PATH never includes nativeLibraryDir (directory of .so files).
     * /storage and /sdcard remain accessible as normal host paths.
     */
    public String[] buildNativeBackgroundCommand(String shellCommand) {
        List<String> cmd = new ArrayList<>();
        cmd.add("/system/bin/sh");
        cmd.add("-c");

        String safePrefix = prefixPath.replace("'", "'\\''");
        String safeTmp = tmpPath.replace("'", "'\\''");
        String safeHome = homePath.replace("'", "'\\''");
        String safeLib = nativeLibDir.replace("'", "'\\''");

        StringBuilder w = new StringBuilder();
        w.append("MSCODE_BANNER_SHOWN=1; ");
        w.append("export HOME='").append(safeHome).append("'; ");
        w.append("export TMPDIR='").append(safeTmp).append("'; ");
        w.append("export PREFIX='").append(safePrefix).append("'; ");
        w.append("export TERMUX_PREFIX='").append(safePrefix).append("'; ");
        // system + PREFIX only — sdcard/git use real /storage paths, not virtual
        w.append("export PATH=\"/system/bin:/system/xbin:")
         .append(safePrefix).append("/bin:")
         .append(safePrefix).append("/bin/applets\"; ");
        w.append("export LD_LIBRARY_PATH=\"")
         .append(safePrefix).append("/lib:")
         .append(safeLib).append("\"; ");
        w.append("export ANDROID_DATA=/data ANDROID_ROOT=/system ANDROID_STORAGE=/storage; ");
        w.append("export SSL_CERT_FILE='").append(safePrefix).append("/etc/tls/cert.pem'; ");
        w.append("export CURL_CA_BUNDLE=\"$SSL_CERT_FILE\"; ");
        w.append("export MSCODE_PROOT='")
         .append(prootPath.replace("'", "'\\''")).append("'; ");
        w.append("MSCODE_LINKER=/system/bin/linker64; ");
        w.append("[ -x /system/bin/linker64 ] || MSCODE_LINKER=/system/bin/linker; ");
        w.append("export MSCODE_LINKER; ");
        // Run PREFIX binary: direct if +x, else linker64 (targetSdk>28 noexec)
        w.append("runpfx() {");
        w.append(" _n=\"$1\"; shift;");
        w.append(" _b=\"$PREFIX/bin/$_n\";");
        w.append(" if [ ! -f \"$_b\" ]; then");
        w.append("  command -v \"$_n\" >/dev/null 2>&1 && { \"$_n\" \"$@\"; return $?; };");
        w.append("  return 127;");
        w.append(" fi;");
        w.append(" if [ -x \"$_b\" ]; then \"$_b\" \"$@\";");
        w.append(" else \"$MSCODE_LINKER\" \"$_b\" \"$@\"; fi;");
        w.append(" }; ");
        w.append(shellCommand);
        cmd.add(w.toString());
        return cmd.toArray(new String[0]);
    }

    private String[] buildProotBackgroundCommand(String shellCommand) {
        List<String> cmd = new ArrayList<>();
        cmd.add(prootPath);
        addCommonProotFlags(cmd);
        cmd.add("sh");
        cmd.add("-c");
        cmd.add(shellCommand);
        return cmd.toArray(new String[0]);
    }

    public Map<String, String> getProotEnv() {
        return buildBackgroundEnvMap();
    }

    // ─── Environment ─────────────────────────────────────────────────────────

    public String[] buildSessionEnv() {
        return buildSessionEnv(null);
    }

    public String[] buildSessionEnv(String initScriptPath) {
        if (useNative) {
            return buildNativeSessionEnv(initScriptPath);
        }
        return buildProotSessionEnv();
    }

    public String[] buildNativeSessionEnv() {
        return buildNativeSessionEnv(null);
    }

    /**
     * Interactive session env. nativeLibDir stays on PATH only for loading .so
     * via dynamic linker lookup when needed; prefer system + PREFIX for commands.
     * Init script (ENV=) provides bb/pkg/elf wrappers.
     */
    public String[] buildNativeSessionEnv(String initScriptPath) {
        List<String> env = new ArrayList<>();
        env.add("HOME=" + homePath);
        env.add("TMPDIR=" + tmpPath);
        env.add("PREFIX=" + prefixPath);
        env.add("TERM=xterm-256color");
        env.add("LANG=C.UTF-8");
        // PREFIX first, then system — do NOT put nativeLibDir first (dir of .so)
        env.add("PATH=" + prefixPath + "/bin:" + prefixPath + "/bin/applets:"
                + "/system/bin:/system/xbin:" + nativeLibDir);
        env.add("LD_LIBRARY_PATH=" + prefixPath + "/lib:" + nativeLibDir);
        env.add("BUSYBOX=" + busyboxPath);
        env.add("TERMUX_PREFIX=" + prefixPath);
        env.add("TERMUX_VERSION=mscode");
        env.add("ANDROID_DATA=/data");
        env.add("ANDROID_ROOT=/system");
        env.add("ANDROID_STORAGE=/storage");
        env.add("TERMINFO=" + prefixPath + "/share/terminfo");
        env.add("SSL_CERT_FILE=" + prefixPath + "/etc/tls/cert.pem");
        env.add("CURL_CA_BUNDLE=" + prefixPath + "/etc/tls/cert.pem");
        env.add("MSCODE_PROOT=" + prootPath);
        env.add("MSCODE_LINKER=/system/bin/linker64");
        env.add("PROOT_LOADER=" + nativeLibDir + "/libproot-loader.so");
        File l32e = new File(nativeLibDir, "libproot-loader32.so");
        if (l32e.exists()) {
            env.add("PROOT_LOADER32=" + l32e.getAbsolutePath());
        }
        env.add("PROOT_TMP_DIR=" + tmpPath);
        if (initScriptPath != null && !initScriptPath.isEmpty()) {
            env.add("ENV=" + initScriptPath);
        }
        return env.toArray(new String[0]);
    }

    private String[] buildProotSessionEnv() {
        List<String> env = new ArrayList<>();
        addCommonProotEnv(env);
        return env.toArray(new String[0]);
    }

    public Map<String, String> buildBackgroundEnvMap() {
        if (useNative) {
            return buildNativeEnvMap();
        }
        return buildProotEnvMap();
    }

    public Map<String, String> buildNativeEnvMap() {
        Map<String, String> map = new java.util.LinkedHashMap<>();
        map.put("HOME", homePath);
        map.put("TMPDIR", tmpPath);
        map.put("PREFIX", prefixPath);
        map.put("TERM", "xterm-256color");
        map.put("LANG", "C.UTF-8");
        // Real host paths — /storage/emulated/0 works for git/compress when permitted
        map.put("PATH", "/system/bin:/system/xbin:" + prefixPath + "/bin:"
                + prefixPath + "/bin/applets");
        map.put("LD_LIBRARY_PATH", prefixPath + "/lib:" + nativeLibDir);
        map.put("BUSYBOX", busyboxPath);
        map.put("TERMUX_PREFIX", prefixPath);
        map.put("TERMUX_VERSION", "mscode");
        map.put("ANDROID_DATA", "/data");
        map.put("ANDROID_ROOT", "/system");
        map.put("ANDROID_STORAGE", "/storage");
        map.put("TERMINFO", prefixPath + "/share/terminfo");
        map.put("SSL_CERT_FILE", prefixPath + "/etc/tls/cert.pem");
        map.put("CURL_CA_BUNDLE", prefixPath + "/etc/tls/cert.pem");
        map.put("MSCODE_PROOT", prootPath);
        map.put("MSCODE_LINKER", "/system/bin/linker64");
        map.put("PROOT_LOADER", nativeLibDir + "/libproot-loader.so");
        File l32 = new File(nativeLibDir, "libproot-loader32.so");
        if (l32.exists()) {
            map.put("PROOT_LOADER32", l32.getAbsolutePath());
        }
        map.put("PROOT_TMP_DIR", tmpPath);
        return map;
    }

    private Map<String, String> buildProotEnvMap() {
        Map<String, String> map = new java.util.LinkedHashMap<>();
        map.put("PROOT_LOADER", nativeLibDir + "/libproot-loader.so");
        File l32 = new File(nativeLibDir, "libproot-loader32.so");
        if (l32.exists()) {
            map.put("PROOT_LOADER32", l32.getAbsolutePath());
        }
        map.put("PROOT_TMP_DIR", tmpPath);
        map.put("HOME", "/root");
        map.put("TMPDIR", tmpPath);
        map.put("TERM", "xterm-256color");
        map.put("LANG", "C.UTF-8");
        map.put("PATH", "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");
        map.put("LD_LIBRARY_PATH", nativeLibDir);
        return map;
    }

    // ─── Proot helpers (legacy) ───────────────────────────────────────────────

    private void addCommonProotFlags(List<String> cmd) {
        cmd.add("--link2symlink");
        cmd.add("--sysvipc");
        cmd.add("-L");
        cmd.add("--kill-on-exit");
        cmd.add("-0");
        cmd.add("-r"); cmd.add(rootfsPath);
        cmd.add("-w"); cmd.add("/");

        for (String mnt : new String[]{
                "/apex", "/odm", "/product", "/system", "/system_ext", "/vendor",
                "/linkerconfig/ld.config.txt",
                "/linkerconfig/com.android.art/ld.config.txt",
                "/plat_property_contexts", "/property_contexts",
                "/storage"}) {
            if (new File(mnt).exists()) {
                cmd.add("-b");
                cmd.add(mnt);
            }
        }

        cmd.add("-b"); cmd.add("/dev");
        cmd.add("-b"); cmd.add("/proc");
        cmd.add("-b"); cmd.add("/sys");
        cmd.add("-b"); cmd.add("/data");
        cmd.add("-b"); cmd.add(filesDir + ":/root");
        cmd.add("-b"); cmd.add("/sdcard");
        if (new File("/storage").exists()) {
            cmd.add("-b"); cmd.add("/storage");
        }

        cmd.add("-b"); cmd.add("/dev/urandom:/dev/random");
        cmd.add("-b"); cmd.add(tmpPath + ":/dev/shm");
    }

    public String wrapWithProot(String guestCmd) {
        String termuxTmp = "/data/data/com.termux/files/usr/tmp";
        return "\"" + prootPath + "\""
            + " --link2symlink --kill-on-exit -0 -r /"
            + " -b /system -b /data -b /dev -b /proc -b /sys"
            + " -b /storage -b /sdcard -b /apex"
            + " -b " + tmpPath + ":" + termuxTmp
            + " -b " + tmpPath + ":/tmp"
            + " -w \\\"$PWD\\\""
            + " /system/bin/sh -c " + shellQuote(guestCmd);
    }

    private static String shellQuote(String s) {
        return "'" + s.replace("'", "'\\''") + "'";
    }

    private void addCommonProotEnv(List<String> env) {
        env.add("PROOT_LOADER=" + nativeLibDir + "/libproot-loader.so");
        File l32 = new File(nativeLibDir, "libproot-loader32.so");
        if (l32.exists()) {
            env.add("PROOT_LOADER32=" + l32.getAbsolutePath());
        }
        env.add("PROOT_TMP_DIR=" + tmpPath);
        env.add("HOME=/root");
        env.add("TERM=xterm-256color");
        env.add("LANG=C.UTF-8");
        env.add("TMPDIR=" + tmpPath);
        env.add("PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");
        env.add("LD_LIBRARY_PATH=" + nativeLibDir);
    }
}
