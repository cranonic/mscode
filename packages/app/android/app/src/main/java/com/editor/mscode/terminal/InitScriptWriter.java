package com.editor.mscode.terminal;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Writes per-session init shell scripts for native busybox (or legacy Alpine).
 *
 * Each terminal session gets its own init script so:
 *   • Different sessions can start in different directories.
 *   • Scripts are cleaned up after the session exits.
 */
public class InitScriptWriter {

    private final RootfsManager rootfs;

    public InitScriptWriter(RootfsManager rootfs) {
        this.rootfs = rootfs;
    }

    /**
     * Writes a session init script to {@code outputPath}.
     *
     * Native mode: simple HOME/PATH/cd/PS1 — no apk, no /etc/profile.
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

        // Native busybox ash init — no Alpine, no apk, no /etc
        String script =
            "#!/system/bin/sh\n" +
            "# MS Code native session init\n" +
            "export HOME='" + safeHome + "'\n" +
            "export TMPDIR='" + safeTmp + "'\n" +
            "export TERM=xterm-256color\n" +
            "export LANG=C.UTF-8\n" +
            "export PATH='" + safeLib + "':/system/bin:/system/xbin\n" +
            "export BUSYBOX='" + safeBb + "'\n" +
            // Make busybox applets available as plain commands if not already in PATH
            // (busybox itself is multi-call; user can run `busybox ls` or we symlink later)
            "cd '" + safeHome + "' 2>/dev/null || true\n" +
            // Hostname for prompt
            "MSCODE_HOST='" + safeHost + "'\n" +
            // Ash-friendly short prompt (last 2 path components)
            "export PS1='\\[\\e[1;32m\\]'" + "\"$MSCODE_HOST\"" +
                "'\\[\\e[0m\\]:\\[\\e[1;34m\\]$(pwd | awk -F/ '\\''{if (NF>3) print \"../\"$(NF-1)\"/\"$NF; else if (NF>=2) print $(NF-1)\"/\"$NF; else print $0}'\\'')\\[\\e[0m\\]\\$ '\n" +
            // cd to project dir if it exists
            "if [ -d '" + safeCwd + "' ]; then\n" +
            "    cd '" + safeCwd + "'\n" +
            "    echo -e \"\\e[33m[+] Opened: $PWD\\e[0m\"\n" +
            "else\n" +
            "    cd '" + safeHome + "'\n" +
            "    echo -e \"\\e[33m[+] Opened: $HOME\\e[0m\"\n" +
            "fi\n" +
            "echo -e \"\\e[1;32m[+] Native shell ready (busybox)\\e[0m\"\n";

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
