package com.editor.mscode.terminal;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Writes per-session ENV script for native mode.
 *
 * libbusybox.so is multi-call: applet comes from argv[0] basename.
 * Direct "$BUSYBOX ls" fails with "applet not found".
 * Fix: bb() uses  ( exec -a APPLET "$BUSYBOX" args )
 * so argv[0] is the real applet name (supported by Android mksh).
 *
 * Interactive shell: /system/bin/sh -i with ENV=this file
 * (mksh sources ENV — functions stay alive, no extra exec).
 */
public class InitScriptWriter {

    private final RootfsManager rootfs;

    public InitScriptWriter(RootfsManager rootfs) {
        this.rootfs = rootfs;
    }

    /**
     * @param outputPath  filesDir/init_tabX.sh — set as ENV= for interactive sh
     * @param projectCwd  Android path to cd into on startup
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

        // Sourced via ENV= — do NOT exec a new shell at the end.
        String script =
            "# MS Code native ENV (sourced by interactive sh)\n" +
            "export HOME='" + safeHome + "'\n" +
            "export TMPDIR='" + safeTmp + "'\n" +
            "export TERM=xterm-256color\n" +
            "export LANG=C.UTF-8\n" +
            "export PATH=/system/bin:/system/xbin:'" + safeLib + "'\n" +
            "export BUSYBOX='" + safeBb + "'\n" +
            "export MSCODE_HOST='" + safeHost + "'\n" +
            "export PS1='[$MSCODE_HOST:\\w]\\$ '\n" +
            "\n" +
            "# argv[0] rewrite so multi-call busybox finds the applet\n" +
            "bb() {\n" +
            "  if [ $# -lt 1 ]; then\n" +
            "    echo \"usage: bb <applet> [args...]\" >&2\n" +
            "    echo \"       bb --list\" >&2\n" +
            "    return 1\n" +
            "  fi\n" +
            "  if [ \"$1\" = \"--list\" ] || [ \"$1\" = \"--help\" ]; then\n" +
            "    ( exec -a busybox \"$BUSYBOX\" \"$1\" )\n" +
            "    return $?\n" +
            "  fi\n" +
            "  _bb_applet=\"$1\"\n" +
            "  shift\n" +
            "  ( exec -a \"$_bb_applet\" \"$BUSYBOX\" \"$@\" )\n" +
            "}\n" +
            "\n" +
            "ls()    { bb ls \"$@\"; }\n" +
            "ll()    { bb ls -la \"$@\"; }\n" +
            "cat()   { bb cat \"$@\"; }\n" +
            "cp()    { bb cp \"$@\"; }\n" +
            "mv()    { bb mv \"$@\"; }\n" +
            "rm()    { bb rm \"$@\"; }\n" +
            "mkdir() { bb mkdir \"$@\"; }\n" +
            "grep()  { bb grep \"$@\"; }\n" +
            "find()  { bb find \"$@\"; }\n" +
            "tar()   { bb tar \"$@\"; }\n" +
            "head()  { bb head \"$@\"; }\n" +
            "tail()  { bb tail \"$@\"; }\n" +
            "wc()    { bb wc \"$@\"; }\n" +
            "uname() { bb uname \"$@\"; }\n" +
            "clear() { bb clear \"$@\"; }\n" +
            "chmod() { bb chmod \"$@\"; }\n" +
            "\n" +
            "if [ -d '" + safeCwd + "' ]; then\n" +
            "  cd '" + safeCwd + "'\n" +
            "else\n" +
            "  cd '" + safeHome + "' 2>/dev/null || true\n" +
            "fi\n" +
            "\n" +
            "if [ -z \"$MSCODE_BANNER_SHOWN\" ]; then\n" +
            "  export MSCODE_BANNER_SHOWN=1\n" +
            "  echo \"[+] Opened: $PWD\"\n" +
            "  echo \"[+] Native shell  |  bb ls / ls / bb --list\"\n" +
            "fi\n";

        File f = new File(outputPath);
        f.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(script.getBytes("UTF-8"));
        }
        //noinspection ResultOfMethodCallIgnored
        f.setReadable(true, false);
    }

    public void cleanup(String outputPath) {
        new File(outputPath).delete();
    }
}
