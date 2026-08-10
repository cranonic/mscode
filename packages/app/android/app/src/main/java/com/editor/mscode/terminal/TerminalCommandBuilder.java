// package com.editor.mscode.terminal;

// import java.io.File;
// import java.util.ArrayList;
// import java.util.List;
// import java.util.Map;

// /**
//  * Builds the command array and environment for a terminal session
//  * or a one-shot background execution.
//  *
//  * Pure native mode only:
//  *   • libtoybox.so + Termux Bionic $PREFIX
//  *   • No proot in interactive / normal background sessions
//  *   • proot kept only as a helper for C/C++ (clang/gcc/tcc) via wrapWithProot()
//  *
//  * ─── targetSdk > 28 note ──────────────────────────────────────────────────
//  *  Binary path always comes from nativeLibraryDir (libtoybox.so / libproot.so).
//  *  Never point at a binary under getFilesDir() — Android blocks execution
//  *  from writable app storage when targetSdkVersion is higher than 28.
//  *  $PREFIX/bin is on PATH; non-executable binaries are run via system linker.
//  */
// public class TerminalCommandBuilder {

//     private final String toyboxPath;
//     private final String prootPath;
//     private final String nativeLibDir;
//     private final String filesDir;
//     private final String homePath;
//     private final String tmpPath;
//     private final String prefixPath;

//     public TerminalCommandBuilder(RootfsManager mgr, String nativeLibDir) {
//         this.toyboxPath   = mgr.getToyboxPath();
//         this.prootPath    = mgr.getProotPath();
//         this.filesDir     = mgr.getFilesDir();
//         this.nativeLibDir = nativeLibDir;
//         this.homePath     = mgr.getHomePath();
//         this.tmpPath      = mgr.getTmpPath();
//         this.prefixPath   = mgr.getPrefixPath();
//     }

//     // ─── Terminal session command ─────────────────────────────────────────────

//     /**
//      * Full command for an interactive PTY session.
//      * Always pure native: /system/bin/sh -i
//      * Init script is sourced via ENV= (see buildSessionEnv).
//      */
//     public String[] buildSessionCommand(String initScriptPath) {
//         List<String> cmd = new ArrayList<>();
//         cmd.add("/system/bin/sh");
//         cmd.add("-i");
//         return cmd.toArray(new String[0]);
//     }

//     /**
//      * Full command for backgroundExecute() — no PTY, no init script.
//      * Always pure native.
//      *
//      * @param shellCommand  The sh -c command to run.
//      */
//     public String[] buildBackgroundCommand(String shellCommand) {
//         List<String> cmd = new ArrayList<>();
//         cmd.add("/system/bin/sh");
//         cmd.add("-c");

//         String envFile = filesDir + "/mscode_env.sh";
//         String safePrefix = prefixPath.replace("'", "'\\''");
//         String safeTmp = tmpPath.replace("'", "'\\''");
//         String safeHome = homePath.replace("'", "'\\''");
//         String safeLib = nativeLibDir.replace("'", "'\\''");
//         String safeEnv = envFile.replace("'", "'\\''");
//         String safeToybox = toyboxPath.replace("'", "'\\''");

//         StringBuilder w = new StringBuilder();
//         w.append("MSCODE_BANNER_SHOWN=1; ");
//         w.append("export HOME='").append(safeHome).append("'; ");
//         w.append("export TMPDIR='").append(safeTmp).append("'; ");
//         w.append("export PREFIX='").append(safePrefix).append("'; ");
//         w.append("export TERMUX_PREFIX='").append(safePrefix).append("'; ");
//         w.append("export TOYBOX='").append(safeToybox).append("'; ");
//         w.append("export PATH=\"/system/bin:/system/xbin:")
//          .append(safePrefix).append("/bin:")
//          .append(safePrefix).append("/bin/applets:")
//          .append(safeLib).append("\"; ");
//         w.append("export LD_LIBRARY_PATH=\"")
//          .append(safePrefix).append("/lib:")
//          .append(safeLib).append("\"; ");
//         w.append("export ANDROID_DATA=/data ANDROID_ROOT=/system ANDROID_STORAGE=/storage; ");
//         w.append("export SSL_CERT_FILE='").append(safePrefix).append("/etc/tls/cert.pem'; ");
//         w.append("export CURL_CA_BUNDLE=\"$SSL_CERT_FILE\"; ");
//         w.append("MSCODE_LINKER=/system/bin/linker64; ");
//         w.append("[ -x /system/bin/linker64 ] || MSCODE_LINKER=/system/bin/linker; ");
//         w.append("export MSCODE_LINKER; ");
//         // Source shared env so zip()/elf/pkg/mscode_wrap exist
//         w.append("[ -f '").append(safeEnv).append("' ] && . '").append(safeEnv).append("'; ");
//         // Re-assert PATH after env
//         w.append("export PATH=\"/system/bin:/system/xbin:")
//          .append(safePrefix).append("/bin:")
//          .append(safePrefix).append("/bin/applets:")
//          .append(safeLib).append("\"; ");
//         // Clear any leftover busybox functions; keep only toybox + PREFIX tools
//         w.append("for _c in ls cat cp mv rm mkdir rmdir grep find head tail wc uname ");
//         w.append("chmod chown sed sort cut tr uniq basename dirname pwd echo printf sleep date touch ");
//         w.append("ln readlink stat du df ps kill id which xargs tee md5sum base64 gzip diff ");
//         w.append("yes true false test env printenv seq expr realpath mktemp clear; do ");
//         w.append("unset -f $_c 2>/dev/null; done; ");
//         w.append("unalias -a 2>/dev/null; ");
//         // runpfx fallback if wrapper missing
//         w.append("runpfx() {");
//         w.append(" _n=\"$1\"; shift; _b=\"$PREFIX/bin/$_n\";");
//         w.append(" if type \"$_n\" >/dev/null 2>&1; then \"$_n\" \"$@\"; return $?; fi;");
//         w.append(" if [ -f \"$_b\" ]; then");
//         w.append("  if [ -x \"$_b\" ]; then \"$_b\" \"$@\"; else \"$MSCODE_LINKER\" \"$_b\" \"$@\"; fi;");
//         w.append("  return $?; fi; return 127; }; ");
//         w.append(shellCommand);
//         cmd.add(w.toString());
//         return cmd.toArray(new String[0]);
//     }

//     // ─── Environment ─────────────────────────────────────────────────────────

//     /**
//      * Environment for PTY sessions (full set).
//      */
//     public String[] buildSessionEnv() {
//         return buildSessionEnv(null);
//     }

//     /**
//      * @param initScriptPath  if non-null, set ENV= so interactive sh sources it
//      */
//     public String[] buildSessionEnv(String initScriptPath) {
//         List<String> env = new ArrayList<>();
//         env.add("HOME=" + homePath);
//         env.add("TMPDIR=" + tmpPath);
//         env.add("PREFIX=" + prefixPath);
//         env.add("TERM=xterm-256color");
//         env.add("LANG=C.UTF-8");
//         // $PREFIX/bin first so installed packages win over system tools
//         env.add("PATH=" + prefixPath + "/bin:" + prefixPath + "/bin/applets:"
//                 + nativeLibDir + ":/system/bin:/system/xbin");
//         env.add("LD_LIBRARY_PATH=" + prefixPath + "/lib:" + nativeLibDir);
//         env.add("TOYBOX=" + toyboxPath);
//         // Termux compatibility aliases
//         env.add("TERMUX_PREFIX=" + prefixPath);
//         env.add("TERMUX_VERSION=mscode");
//         env.add("ANDROID_DATA=/data");
//         env.add("ANDROID_ROOT=/system");
//         env.add("ANDROID_STORAGE=/storage");
//         env.add("TERMINFO=" + prefixPath + "/share/terminfo");
//         env.add("SSL_CERT_FILE=" + prefixPath + "/etc/tls/cert.pem");
//         env.add("CURL_CA_BUNDLE=" + prefixPath + "/etc/tls/cert.pem");
//         // proot binary lives in nativeLibraryDir — used ONLY for C/C++ helper
//         env.add("MSCODE_PROOT=" + prootPath);
//         env.add("PROOT_LOADER=" + nativeLibDir + "/libproot-loader.so");
//         File l32e = new File(nativeLibDir, "libproot-loader32.so");
//         if (l32e.exists()) {
//             env.add("PROOT_LOADER32=" + l32e.getAbsolutePath());
//         }
//         env.add("PROOT_TMP_DIR=" + tmpPath);
//         if (initScriptPath != null && !initScriptPath.isEmpty()) {
//             // mksh (Android /system/bin/sh) sources $ENV for interactive shells
//             env.add("ENV=" + initScriptPath);
//         }
//         return env.toArray(new String[0]);
//     }

//     /**
//      * Environment map for ProcessBuilder-based background execution.
//      * Call pb.environment().clear() first, then putAll(this).
//      */
//     public Map<String, String> buildBackgroundEnvMap() {
//         Map<String, String> map = new java.util.LinkedHashMap<>();
//         map.put("HOME",            homePath);
//         map.put("TMPDIR",          tmpPath);
//         map.put("PREFIX",          prefixPath);
//         map.put("TERM",            "xterm-256color");
//         map.put("LANG",            "C.UTF-8");
//         map.put("PATH", prefixPath + "/bin:" + prefixPath + "/bin/applets:"
//                 + nativeLibDir + ":/system/bin:/system/xbin");
//         map.put("LD_LIBRARY_PATH", prefixPath + "/lib:" + nativeLibDir);
//         map.put("TOYBOX",          toyboxPath);
//         map.put("TERMUX_PREFIX",   prefixPath);
//         map.put("TERMUX_VERSION",  "mscode");
//         map.put("ANDROID_DATA",    "/data");
//         map.put("ANDROID_ROOT",    "/system");
//         map.put("ANDROID_STORAGE", "/storage");
//         map.put("TERMINFO",        prefixPath + "/share/terminfo");
//         map.put("SSL_CERT_FILE",   prefixPath + "/etc/tls/cert.pem");
//         map.put("CURL_CA_BUNDLE",  prefixPath + "/etc/tls/cert.pem");
//         // Compiler helper only
//         map.put("MSCODE_PROOT",    prootPath);
//         map.put("PROOT_LOADER",    nativeLibDir + "/libproot-loader.so");
//         File l32 = new File(nativeLibDir, "libproot-loader32.so");
//         if (l32.exists()) {
//             map.put("PROOT_LOADER32", l32.getAbsolutePath());
//         }
//         map.put("PROOT_TMP_DIR",   tmpPath);
//         return map;
//     }

//     // ─── C/C++ helper only (proot) ────────────────────────────────────────────

//     /**
//      * Build a shell snippet that runs {@code guestCmd} under proot with host root (-r /).
//      * proot intercepts execve → can load ELF from non-executable $PREFIX (targetSdk>28).
//      * Used for clang/tcc/gcc only — interactive shell stays pure native.
//      */
//     public String wrapWithProot(String guestCmd) {
//         String termuxTmp = "/data/data/com.termux/files/usr/tmp";
//         return "\"" + prootPath + "\""
//             + " --link2symlink --kill-on-exit -0 -r /"
//             + " -b /system -b /data -b /dev -b /proc -b /sys"
//             + " -b /storage -b /sdcard -b /apex"
//             + " -b " + tmpPath + ":" + termuxTmp
//             + " -b " + tmpPath + ":/tmp"
//             + " -w \\\"$PWD\\\""
//             + " /system/bin/sh -c " + shellQuote(guestCmd);
//     }

//     private static String shellQuote(String s) {
//         return "'" + s.replace("'", "'\\''") + "'";
//     }

//     // ─── Accessors ────────────────────────────────────────────────────────────

//     public String getToyboxPath() { return toyboxPath; }
//     public String getProotPath()  { return prootPath; }
//     public String getPrefixPath() { return prefixPath; }
// }



package com.editor.mscode.terminal;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Builds the command array and environment for a terminal session
 * or a one-shot background execution.
 *
 * Pure native mode only:
 *   • libtoybox.so + Termux Bionic $PREFIX
 *   • No proot in interactive / normal background sessions
 *   • proot kept only as a helper for C/C++ (clang/gcc/tcc) via wrapWithProot()
 *
 * ─── targetSdk > 28 note ──────────────────────────────────────────────────
 *  Binary path always comes from nativeLibraryDir (libtoybox.so / libproot.so).
 *  Never point at a binary under getFilesDir() — Android blocks execution
 *  from writable app storage when targetSdkVersion is higher than 28.
 *  $PREFIX/bin is on PATH; non-executable binaries are run via system linker.
 */
public class TerminalCommandBuilder {

    private final String toyboxPath;
    private final String prootPath;
    private final String nativeLibDir;
    private final String filesDir;
    private final String homePath;
    private final String tmpPath;
    private final String prefixPath;

    public TerminalCommandBuilder(RootfsManager mgr, String nativeLibDir) {
        this.toyboxPath   = mgr.getToyboxPath();
        this.prootPath    = mgr.getProotPath();
        this.filesDir     = mgr.getFilesDir();
        this.nativeLibDir = nativeLibDir;
        this.homePath     = mgr.getHomePath();
        this.tmpPath      = mgr.getTmpPath();
        this.prefixPath   = mgr.getPrefixPath();
    }

    // ─── Terminal session command ─────────────────────────────────────────────

    /**
     * Interactive PTY session command.
     *
     * Always starts {@code /system/bin/sh} so the process never fails with 127
     * when $PREFIX/bin/bash is missing, non-executable, or broken.
     *
     * Inside the shell:
     *   1. Try bash (direct or via linker) only if {@code --version} works
     *   2. Otherwise stay on mksh ({@code exec /system/bin/sh -i})
     *
     * bash + readline soft-wraps long lines (Termux). mksh only horizontal-scrolls.
     * Init script: bash uses --rcfile; mksh uses ENV= (see {@link #buildSessionEnv}).
     */
    public String[] buildSessionCommand(String initScriptPath) {
        List<String> cmd = new ArrayList<>();
        cmd.add("/system/bin/sh");
        cmd.add("-c");

        String safePrefix = prefixPath.replace("'", "'\\''");
        String safeRc = (initScriptPath != null && !initScriptPath.isEmpty())
            ? initScriptPath.replace("'", "'\\''")
            : (homePath + "/.bashrc").replace("'", "'\\''");

        // Probe bash before exec — broken/partial installs must not kill the session (exit 127).
        StringBuilder w = new StringBuilder(512);
        w.append("PREFIX='").append(safePrefix).append("'; ");
        w.append("RC='").append(safeRc).append("'; ");
        w.append("export ENV=\"$RC\"; ");
        w.append("BASH_BIN=\"$PREFIX/bin/bash\"; ");
        w.append("L=/system/bin/linker64; [ -x \"$L\" ] || L=/system/bin/linker; ");
        w.append("run_bash() { ");
        w.append("  if [ -x \"$BASH_BIN\" ]; then ");
        w.append("    \"$BASH_BIN\" --version >/dev/null 2>&1 || return 1; ");
        w.append("    exec \"$BASH_BIN\" --rcfile \"$RC\" -i; ");
        w.append("  fi; ");
        w.append("  if [ -f \"$BASH_BIN\" ] && [ -x \"$L\" ]; then ");
        w.append("    \"$L\" \"$BASH_BIN\" --version >/dev/null 2>&1 || return 1; ");
        w.append("    exec \"$L\" \"$BASH_BIN\" --rcfile \"$RC\" -i; ");
        w.append("  fi; ");
        w.append("  return 1; ");
        w.append("}; ");
        w.append("run_bash || exec /system/bin/sh -i");

        cmd.add(w.toString());
        return cmd.toArray(new String[0]);
    }

    /** True when $PREFIX/bin/bash exists (may still fall back to mksh if it fails to run). */
    public boolean usesBash() {
        return new File(prefixPath, "bin/bash").isFile();
    }

    /**
     * Full command for backgroundExecute() — no PTY, no init script.
     * Always pure native.
     *
     * @param shellCommand  The sh -c command to run.
     */
    public String[] buildBackgroundCommand(String shellCommand) {
        List<String> cmd = new ArrayList<>();
        cmd.add("/system/bin/sh");
        cmd.add("-c");

        String envFile = filesDir + "/mscode_env.sh";
        String safePrefix = prefixPath.replace("'", "'\\''");
        String safeTmp = tmpPath.replace("'", "'\\''");
        String safeHome = homePath.replace("'", "'\\''");
        String safeLib = nativeLibDir.replace("'", "'\\''");
        String safeEnv = envFile.replace("'", "'\\''");
        String safeToybox = toyboxPath.replace("'", "'\\''");

        StringBuilder w = new StringBuilder();
        w.append("MSCODE_BANNER_SHOWN=1; ");
        w.append("export HOME='").append(safeHome).append("'; ");
        w.append("export TMPDIR='").append(safeTmp).append("'; ");
        w.append("export PREFIX='").append(safePrefix).append("'; ");
        w.append("export TERMUX_PREFIX='").append(safePrefix).append("'; ");
        w.append("export TOYBOX='").append(safeToybox).append("'; ");
        w.append("export PATH=\"/system/bin:/system/xbin:")
         .append(safePrefix).append("/bin:")
         .append(safePrefix).append("/bin/applets:")
         .append(safeLib).append("\"; ");
        w.append("export LD_LIBRARY_PATH=\"")
         .append(safePrefix).append("/lib:")
         .append(safeLib).append("\"; ");
        w.append("export ANDROID_DATA=/data ANDROID_ROOT=/system ANDROID_STORAGE=/storage; ");
        w.append("export SSL_CERT_FILE='").append(safePrefix).append("/etc/tls/cert.pem'; ");
        w.append("export CURL_CA_BUNDLE=\"$SSL_CERT_FILE\"; ");
        w.append("MSCODE_LINKER=/system/bin/linker64; ");
        w.append("[ -x /system/bin/linker64 ] || MSCODE_LINKER=/system/bin/linker; ");
        w.append("export MSCODE_LINKER; ");
        // Source shared env so zip()/elf/pkg/mscode_wrap exist
        w.append("[ -f '").append(safeEnv).append("' ] && . '").append(safeEnv).append("'; ");
        // Re-assert PATH after env
        w.append("export PATH=\"/system/bin:/system/xbin:")
         .append(safePrefix).append("/bin:")
         .append(safePrefix).append("/bin/applets:")
         .append(safeLib).append("\"; ");
        // Clear any leftover busybox functions; keep only toybox + PREFIX tools
        w.append("for _c in ls cat cp mv rm mkdir rmdir grep find head tail wc uname ");
        w.append("chmod chown sed sort cut tr uniq basename dirname pwd echo printf sleep date touch ");
        w.append("ln readlink stat du df ps kill id which xargs tee md5sum base64 gzip diff ");
        w.append("yes true false test env printenv seq expr realpath mktemp clear; do ");
        w.append("unset -f $_c 2>/dev/null; done; ");
        w.append("unalias -a 2>/dev/null; ");
        // runpfx fallback if wrapper missing
        w.append("runpfx() {");
        w.append(" _n=\"$1\"; shift; _b=\"$PREFIX/bin/$_n\";");
        w.append(" if type \"$_n\" >/dev/null 2>&1; then \"$_n\" \"$@\"; return $?; fi;");
        w.append(" if [ -f \"$_b\" ]; then");
        w.append("  if [ -x \"$_b\" ]; then \"$_b\" \"$@\"; else \"$MSCODE_LINKER\" \"$_b\" \"$@\"; fi;");
        w.append("  return $?; fi; return 127; }; ");
        w.append(shellCommand);
        cmd.add(w.toString());
        return cmd.toArray(new String[0]);
    }

    // ─── Environment ─────────────────────────────────────────────────────────

    /**
     * Environment for PTY sessions (full set).
     */
    public String[] buildSessionEnv() {
        return buildSessionEnv(null);
    }

    /**
     * @param initScriptPath  if non-null, set ENV= so interactive sh sources it
     */
    public String[] buildSessionEnv(String initScriptPath) {
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
        env.add("TOYBOX=" + toyboxPath);
        // Termux compatibility aliases
        env.add("TERMUX_PREFIX=" + prefixPath);
        env.add("TERMUX_VERSION=mscode");
        env.add("ANDROID_DATA=/data");
        env.add("ANDROID_ROOT=/system");
        env.add("ANDROID_STORAGE=/storage");
        env.add("TERMINFO=" + prefixPath + "/share/terminfo");
        env.add("SSL_CERT_FILE=" + prefixPath + "/etc/tls/cert.pem");
        env.add("CURL_CA_BUNDLE=" + prefixPath + "/etc/tls/cert.pem");
        // proot binary lives in nativeLibraryDir — used ONLY for C/C++ helper
        env.add("MSCODE_PROOT=" + prootPath);
        env.add("PROOT_LOADER=" + nativeLibDir + "/libproot-loader.so");
        File l32e = new File(nativeLibDir, "libproot-loader32.so");
        if (l32e.exists()) {
            env.add("PROOT_LOADER32=" + l32e.getAbsolutePath());
        }
        env.add("PROOT_TMP_DIR=" + tmpPath);
        if (initScriptPath != null && !initScriptPath.isEmpty()) {
            // mksh sources $ENV for interactive shells; bash uses --rcfile instead
            env.add("ENV=" + initScriptPath);
        }
        // readline: soft-wrap long lines (Termux behaviour). Used when bash is the shell.
        File inputrc = new File(prefixPath, "etc/inputrc");
        if (inputrc.isFile()) {
            env.add("INPUTRC=" + inputrc.getAbsolutePath());
        }
        return env.toArray(new String[0]);
    }

    /**
     * Environment map for ProcessBuilder-based background execution.
     * Call pb.environment().clear() first, then putAll(this).
     */
    public Map<String, String> buildBackgroundEnvMap() {
        Map<String, String> map = new java.util.LinkedHashMap<>();
        map.put("HOME",            homePath);
        map.put("TMPDIR",          tmpPath);
        map.put("PREFIX",          prefixPath);
        map.put("TERM",            "xterm-256color");
        map.put("LANG",            "C.UTF-8");
        map.put("PATH", prefixPath + "/bin:" + prefixPath + "/bin/applets:"
                + nativeLibDir + ":/system/bin:/system/xbin");
        map.put("LD_LIBRARY_PATH", prefixPath + "/lib:" + nativeLibDir);
        map.put("TOYBOX",          toyboxPath);
        map.put("TERMUX_PREFIX",   prefixPath);
        map.put("TERMUX_VERSION",  "mscode");
        map.put("ANDROID_DATA",    "/data");
        map.put("ANDROID_ROOT",    "/system");
        map.put("ANDROID_STORAGE", "/storage");
        map.put("TERMINFO",        prefixPath + "/share/terminfo");
        map.put("SSL_CERT_FILE",   prefixPath + "/etc/tls/cert.pem");
        map.put("CURL_CA_BUNDLE",  prefixPath + "/etc/tls/cert.pem");
        // Compiler helper only
        map.put("MSCODE_PROOT",    prootPath);
        map.put("PROOT_LOADER",    nativeLibDir + "/libproot-loader.so");
        File l32 = new File(nativeLibDir, "libproot-loader32.so");
        if (l32.exists()) {
            map.put("PROOT_LOADER32", l32.getAbsolutePath());
        }
        map.put("PROOT_TMP_DIR",   tmpPath);
        return map;
    }

    // ─── C/C++ helper only (proot) ────────────────────────────────────────────

    /**
     * Build a shell snippet that runs {@code guestCmd} under proot with host root (-r /).
     * proot intercepts execve → can load ELF from non-executable $PREFIX (targetSdk>28).
     * Used for clang/tcc/gcc only — interactive shell stays pure native.
     */
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

    // ─── Accessors ────────────────────────────────────────────────────────────

    public String getToyboxPath() { return toyboxPath; }
    public String getProotPath()  { return prootPath; }
    public String getPrefixPath() { return prefixPath; }
}
