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

    /**
     * Full command for an interactive PTY session.
     *
     * @param initScriptPath  Per-session init shell script (sets PS1, cd, etc.)
     */
    public String[] buildSessionCommand(String initScriptPath) {
        if (useNative) {
            return buildNativeSessionCommand(initScriptPath);
        }
        return buildProotSessionCommand(initScriptPath);
    }

    /**
     * Native session: /system/bin/sh -i
     * Init script is sourced via ENV= (see buildNativeSessionEnv).
     * Busybox applets: bb ls  (uses exec -a to fix argv[0]).
     * $PREFIX/bin is on PATH when bootstrap is installed.
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

    /**
     * Full command for backgroundExecute() — no PTY, no init script.
     *
     * @param shellCommand  The sh -c command to run.
     */
    public String[] buildBackgroundCommand(String shellCommand) {
        if (useNative) {
            return buildNativeBackgroundCommand(shellCommand);
        }
        return buildProotBackgroundCommand(shellCommand);
    }

    public String[] buildNativeBackgroundCommand(String shellCommand) {
        List<String> cmd = new ArrayList<>();
        // Same reason as session: cannot use libbusybox.so as argv[0] applet name
        cmd.add("/system/bin/sh");
        cmd.add("-c");
        // Source shared env so pkg/elf/git wrappers exist (interactive ENV is not set for -c)
        String envFile = filesDir + "/mscode_env.sh";
        // Suppress welcome banner for background jobs
        String wrapped = "MSCODE_BANNER_SHOWN=1; [ -f '" + envFile + "' ] && . '" + envFile + "'; " + shellCommand;
        cmd.add(wrapped);
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

    /** Expose environment variables for ProcessBuilder / streamBackgroundExecute. */
    public Map<String, String> getProotEnv() {
        return buildBackgroundEnvMap();
    }

    // ─── Environment ─────────────────────────────────────────────────────────

    /**
     * Environment for PTY sessions (full set).
     */
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
     * @param initScriptPath  if non-null, set ENV= so interactive sh sources it
     */
    public String[] buildNativeSessionEnv(String initScriptPath) {
        List<String> env = new ArrayList<>();
        env.add("HOME=" + homePath);
        env.add("TMPDIR=" + tmpPath);
        env.add("PREFIX=" + prefixPath);
        env.add("TERM=xterm-256color");
        env.add("LANG=C.UTF-8");
        // $PREFIX/bin first so installed packages win over system tools
        env.add("PATH=" + prefixPath + "/bin:" + prefixPath + "/bin/applets:"
                + nativeLibDir + ":/system/bin:/system/xbin");
        env.add("LD_LIBRARY_PATH=" + prefixPath + "/lib:" + nativeLibDir);
        env.add("BUSYBOX=" + busyboxPath);
        // Termux compatibility aliases
        env.add("TERMUX_PREFIX=" + prefixPath);
        env.add("TERMUX_VERSION=mscode");
        env.add("ANDROID_DATA=/data");
        env.add("ANDROID_ROOT=/system");
        env.add("ANDROID_STORAGE=/storage");
        env.add("TERMINFO=" + prefixPath + "/share/terminfo");
        env.add("SSL_CERT_FILE=" + prefixPath + "/etc/tls/cert.pem");
        env.add("CURL_CA_BUNDLE=" + prefixPath + "/etc/tls/cert.pem");
        // proot binary lives in nativeLibraryDir (executable) — used only for compilers
        env.add("MSCODE_PROOT=" + prootPath);
        env.add("PROOT_LOADER=" + nativeLibDir + "/libproot-loader.so");
        File l32e = new File(nativeLibDir, "libproot-loader32.so");
        if (l32e.exists()) {
            env.add("PROOT_LOADER32=" + l32e.getAbsolutePath());
        }
        env.add("PROOT_TMP_DIR=" + tmpPath);
        if (initScriptPath != null && !initScriptPath.isEmpty()) {
            // mksh (Android /system/bin/sh) sources $ENV for interactive shells
            env.add("ENV=" + initScriptPath);
        }
        return env.toArray(new String[0]);
    }

    private String[] buildProotSessionEnv() {
        List<String> env = new ArrayList<>();
        addCommonProotEnv(env);
        return env.toArray(new String[0]);
    }

    /**
     * Environment map for ProcessBuilder-based background execution.
     * Call pb.environment().clear() first, then putAll(this).
     */
    public Map<String, String> buildBackgroundEnvMap() {
        if (useNative) {
            return buildNativeEnvMap();
        }
        return buildProotEnvMap();
    }

    public Map<String, String> buildNativeEnvMap() {
        Map<String, String> map = new java.util.LinkedHashMap<>();
        map.put("HOME",            homePath);
        map.put("TMPDIR",          tmpPath);
        map.put("PREFIX",          prefixPath);
        map.put("TERM",            "xterm-256color");
        map.put("LANG",            "C.UTF-8");
        map.put("PATH",            prefixPath + "/bin:" + prefixPath + "/bin/applets:"
                                   + nativeLibDir + ":/system/bin:/system/xbin");
        map.put("LD_LIBRARY_PATH", prefixPath + "/lib:" + nativeLibDir);
        map.put("BUSYBOX",         busyboxPath);
        map.put("TERMUX_PREFIX",   prefixPath);
        map.put("TERMUX_VERSION",  "mscode");
        map.put("ANDROID_DATA",    "/data");
        map.put("ANDROID_ROOT",    "/system");
        map.put("ANDROID_STORAGE", "/storage");
        map.put("TERMINFO",        prefixPath + "/share/terminfo");
        map.put("SSL_CERT_FILE",   prefixPath + "/etc/tls/cert.pem");
        map.put("CURL_CA_BUNDLE",  prefixPath + "/etc/tls/cert.pem");
        // Compiler helper: proot from nativeLibraryDir bypasses noexec on $PREFIX
        map.put("MSCODE_PROOT",    prootPath);
        map.put("PROOT_LOADER",    nativeLibDir + "/libproot-loader.so");
        File l32 = new File(nativeLibDir, "libproot-loader32.so");
        if (l32.exists()) {
            map.put("PROOT_LOADER32", l32.getAbsolutePath());
        }
        map.put("PROOT_TMP_DIR",   tmpPath);
        return map;
    }

    private Map<String, String> buildProotEnvMap() {
        Map<String, String> map = new java.util.LinkedHashMap<>();
        map.put("PROOT_LOADER",    nativeLibDir + "/libproot-loader.so");
        File l32 = new File(nativeLibDir, "libproot-loader32.so");
        if (l32.exists()) {
            map.put("PROOT_LOADER32", l32.getAbsolutePath());
        }
        map.put("PROOT_TMP_DIR",   tmpPath);
        map.put("HOME",            "/root");
        map.put("TMPDIR",          tmpPath);
        map.put("TERM",            "xterm-256color");
        map.put("LANG",            "C.UTF-8");
        map.put("PATH",            "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");
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

    /**
     * Build a shell snippet that runs {@code guestCmd} under proot with host root (-r /).
     * proot intercepts execve → can load ELF from non-executable $PREFIX (targetSdk>28).
     * Used for clang/tcc/gcc only — interactive shell stays native.
     */
    public String wrapWithProot(String guestCmd) {
        // Minimal binds: keep paths identical to host so $PREFIX paths stay valid.
        // Termux packages hardcode /data/data/com.termux/files/usr/tmp — bind our tmp.
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
        env.add("PS1=\\[\\e[1;32m\\]\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]$(pwd | awk -F/ \'{if (NF>3) print \"../\"$(NF-1)\"/\"$NF; else if (NF>=2) print $(NF-1)\"/\"$NF; else print $0}\')\\[\\e[0m\\]\\$ ");
        env.add("TMPDIR=" + tmpPath);
        env.add("PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");
        env.add("LD_LIBRARY_PATH=" + nativeLibDir);
    }
}
