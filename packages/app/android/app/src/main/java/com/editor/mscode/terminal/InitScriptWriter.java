package com.editor.mscode.terminal;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Writes per-session init shell scripts for native mode.
 *
 * Entry point is always /system/bin/sh (not libbusybox.so).
 * Reason: busybox multi-call uses argv[0] basename as the applet name.
 * When the binary is named "libbusybox.so", it looks for applet
 * "libbusybox.so" → "applet not found".
 *
 * Busybox applets remain available via $BUSYBOX or the bb() helper.
 */
public class InitScriptWriter {

    private final RootfsManager rootfs;

    public InitScriptWriter(RootfsManager rootfs) {
        this.rootfs = rootfs;
    }

    /**
     * Writes a session init script to {@code outputPath}.
     *
     * @param outputPath  Where to write the script (e.g. filesDir/init_tab1.sh).
     * @param projectCwd  Android path to open on startup (or empty → $HOME).
     */
    public void write(String outputPath, String projectCwd) throws IOException {
        String hostname = rootfs.getStoredHostname();
        String home     = rootfs.getHomePath();
        String tmp      = rootfs.getTmpPath();
        String busybox  = rootfs.getBusyboxPath();
        String libDir   = rootfs.getNativeLibDir();

        String safeCwd = (projectCwd != null && !projectCwd.isEmpty())
            ? projectCwd.replace("'", "'\\''")
            : home.replace("'", "'\\''");

        String safeHost = hostname != null
            ? hostname.replace("'", "'\\''")
            : "mscode";

        String safeHome = home.replace("'", "'\\''");
        String safeTmp  = tmp.replace("'", "'\\''");
        String safeLib  = libDir.replace("'", "'\\''");
        String safeBb   = busybox.replace("'", "'\\''");

        String script =
            "#!/system/bin/sh\n" +
            "# MS Code native session init\n" +
            "export HOME='" + safeHome + "'\n" +
            "export TMPDIR='" + safeTmp + "'\n" +
            "export TERM=xterm-256color\n" +
            "export LANG=C.UTF-8\n" +
            "export PATH=/system/bin:/system/xbin:'" + safeLib + "'\n" +
            "export BUSYBOX='" + safeBb + "'\n" +
            // Helper: bb ls, bb tar, ...
            "bb() { \"$BUSYBOX\" \"$@\"; }\n" +
            "cd '" + safeHome + "' 2>/dev/null || true\n" +
            "MSCODE_HOST='" + safeHost + "'\n" +
            "export PS1='[$MSCODE_HOST:\\w]\\$ '\n" +
            "if [ -d '" + safeCwd + "' ]; then\n" +
            "    cd '" + safeCwd + "'\n" +
            "    echo \"[+] Opened: $PWD\"\n" +
            "else\n" +
            "    cd '" + safeHome + "'\n" +
            "    echo \"[+] Opened: $HOME\"\n" +
            "fi\n" +
            "echo \"[+] Native shell ready  |  tools: bb <applet>  or  $BUSYBOX <applet>\"\n" +
            "exec /system/bin/sh -i\n";

        File f = new File(outputPath);
        f.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(script.getBytes("UTF-8"));
        }
        //noinspection ResultOfMethodCallIgnored
        f.setExecutable(true, false);
    }

    /** Deletes the init script after session exit to avoid stale files. */
    public void cleanup(String outputPath) {
        new File(outputPath).delete();
    }
}
