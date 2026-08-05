package com.editor.mscode.terminal;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Writes per-session ENV script for native / Termux-style mode.
 *
 * libbusybox.so is multi-call: applet comes from argv[0] basename.
 * Direct "$BUSYBOX ls" fails with "applet not found".
 * Fix: bb() uses  ( exec -a APPLET "$BUSYBOX" args )
 * so argv[0] is the real applet name (supported by Android mksh).
 *
 * Interactive shell: /system/bin/sh -i with ENV=this file
 * (mksh sources ENV — functions stay alive, no extra exec).
 *
 * When bootstrap is present ($PREFIX/bin), PATH prefers it.
 * A minimal pkg() helper is provided for future package installs.
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
        String prefix   = rootfs.getPrefixPath();
        String busybox  = rootfs.getBusyboxPath();
        String libDir   = rootfs.getNativeLibDir();
        boolean bootOk  = rootfs.isBootstrapReady();

        String safeCwd = (projectCwd != null && !projectCwd.isEmpty())
            ? projectCwd.replace("'", "'\\''")
            : home.replace("'", "'\\''");

        String safeHost = hostname != null
            ? hostname.replace("'", "'\\''")
            : "mscode";

        String safeHome   = home.replace("'", "'\\''");
        String safeTmp    = tmp.replace("'", "'\\''");
        String safePrefix = prefix.replace("'", "'\\''");
        String safeLib    = libDir.replace("'", "'\\''");
        String safeBb     = busybox.replace("'", "'\\''");

        // Sourced via ENV= — do NOT exec a new shell at the end.
        StringBuilder sb = new StringBuilder();
        sb.append("# MS Code native / Termux-style ENV (sourced by interactive sh)\n");
        sb.append("export HOME='").append(safeHome).append("'\n");
        sb.append("export TMPDIR='").append(safeTmp).append("'\n");
        sb.append("export PREFIX='").append(safePrefix).append("'\n");
        sb.append("export TERMUX_PREFIX='").append(safePrefix).append("'\n");
        sb.append("export TERMUX_VERSION=mscode\n");
        sb.append("export TERM=xterm-256color\n");
        sb.append("export LANG=C.UTF-8\n");
        sb.append("export PATH='").append(safePrefix).append("/bin:")
          .append(safePrefix).append("/bin/applets:")
          .append(safeLib).append(":/system/bin:/system/xbin'\n");
        sb.append("export LD_LIBRARY_PATH='").append(safePrefix).append("/lib:")
          .append(safeLib).append("'\n");
        sb.append("export BUSYBOX='").append(safeBb).append("'\n");
        sb.append("export MSCODE_HOST='").append(safeHost).append("'\n");
        sb.append("export PS1='[$MSCODE_HOST:\\w]\\$ '\n");
        sb.append("\n");

        // Busybox multi-call helper
        sb.append("# argv[0] rewrite so multi-call busybox finds the applet\n");
        sb.append("bb() {\n");
        sb.append("  if [ $# -lt 1 ]; then\n");
        sb.append("    echo \"usage: bb <applet> [args...]\" >&2\n");
        sb.append("    echo \"       bb --list\" >&2\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  if [ \"$1\" = \"--list\" ] || [ \"$1\" = \"--help\" ]; then\n");
        sb.append("    ( exec -a busybox \"$BUSYBOX\" \"$1\" )\n");
        sb.append("    return $?\n");
        sb.append("  fi\n");
        sb.append("  _bb_applet=\"$1\"\n");
        sb.append("  shift\n");
        sb.append("  ( exec -a \"$_bb_applet\" \"$BUSYBOX\" \"$@\" )\n");
        sb.append("}\n");
        sb.append("\n");

        // Common aliases → busybox (always available even without bootstrap)
        sb.append("ls()    { bb ls \"$@\"; }\n");
        sb.append("ll()    { bb ls -la \"$@\"; }\n");
        sb.append("cat()   { bb cat \"$@\"; }\n");
        sb.append("cp()    { bb cp \"$@\"; }\n");
        sb.append("mv()    { bb mv \"$@\"; }\n");
        sb.append("rm()    { bb rm \"$@\"; }\n");
        sb.append("mkdir() { bb mkdir \"$@\"; }\n");
        sb.append("grep()  { bb grep \"$@\"; }\n");
        sb.append("find()  { bb find \"$@\"; }\n");
        sb.append("tar()   { bb tar \"$@\"; }\n");
        sb.append("head()  { bb head \"$@\"; }\n");
        sb.append("tail()  { bb tail \"$@\"; }\n");
        sb.append("wc()    { bb wc \"$@\"; }\n");
        sb.append("uname() { bb uname \"$@\"; }\n");
        sb.append("clear() { bb clear \"$@\"; }\n");
        sb.append("chmod() { bb chmod \"$@\"; }\n");
        sb.append("\n");

        // pkg — shell helper; real install via NativeTerminal.pkgInstall()
        sb.append("# pkg — Termux-style helper (install via Capacitor plugin)\n");
        sb.append("pkg() {\n");
        sb.append("  case \"$1\" in\n");
        sb.append("    install|i)\n");
        sb.append("      shift\n");
        sb.append("      if [ $# -eq 0 ]; then\n");
        sb.append("        echo \"usage: pkg install <package>…\" >&2\n");
        sb.append("        echo \"  From app JS: NativeTerminal.pkgInstall({ packages: ['git'] })\" >&2\n");
        sb.append("        return 1\n");
        sb.append("      fi\n");
        sb.append("      echo \"[pkg] Request: install $*\"\n");
        sb.append("      echo \"[pkg] Use NativeTerminal.pkgInstall({ packages: ['$*'] })\"\n");
        sb.append("      echo \"[pkg] PREFIX=$PREFIX\"\n");
        sb.append("      ;;\n");
        sb.append("    list-installed|li)\n");
        sb.append("      if [ -d \"$PREFIX/var/lib/dpkg/info\" ]; then\n");
        sb.append("        ls \"$PREFIX/var/lib/dpkg/info\" 2>/dev/null | sed -n 's/\\.list$//p' | sort -u\n");
        sb.append("      else\n");
        sb.append("        echo \"[pkg] no packages installed yet\"\n");
        sb.append("      fi\n");
        sb.append("      ;;\n");
        sb.append("    search|s)\n");
        sb.append("      shift\n");
        sb.append("      echo \"[pkg] search via Packages index on next install\"\n");
        sb.append("      echo \"[pkg] query: $*\"\n");
        sb.append("      ;;\n");
        sb.append("    update|u)\n");
        sb.append("      rm -f \"$HOME/../pkg-cache/Packages\" \"$HOME/../pkg-cache/Packages.gz\" 2>/dev/null\n");
        sb.append("      echo \"[pkg] index cache cleared — next install will re-fetch\"\n");
        sb.append("      ;;\n");
        sb.append("    *)\n");
        sb.append("      echo \"pkg — Termux-style package manager (MS Code)\"\n");
        sb.append("      echo \"  pkg install <pkg>   → NativeTerminal.pkgInstall()\"\n");
        sb.append("      echo \"  pkg list-installed  List installed packages\"\n");
        sb.append("      echo \"  pkg update          Clear package index cache\"\n");
        sb.append("      echo \"PREFIX=$PREFIX\"\n");
        sb.append("      ;;\n");
        sb.append("  esac\n");
        sb.append("}\n");
        sb.append("\n");

        // cd into project
        sb.append("if [ -d '").append(safeCwd).append("' ]; then\n");
        sb.append("  cd '").append(safeCwd).append("'\n");
        sb.append("else\n");
        sb.append("  cd '").append(safeHome).append("' 2>/dev/null || true\n");
        sb.append("fi\n");
        sb.append("\n");

        // One-shot banner
        sb.append("if [ -z \"$MSCODE_BANNER_SHOWN\" ]; then\n");
        sb.append("  export MSCODE_BANNER_SHOWN=1\n");
        sb.append("  echo \"[+] Opened: $PWD\"\n");
        if (bootOk) {
            sb.append("  echo \"[+] Termux-style PREFIX=$PREFIX  |  bb ls / pkg\"\n");
        } else {
            sb.append("  echo \"[+] Native shell (bootstrap pending)  |  bb ls / ls / bb --list\"\n");
        }
        sb.append("fi\n");

        File f = new File(outputPath);
        f.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(sb.toString().getBytes("UTF-8"));
        }
        //noinspection ResultOfMethodCallIgnored
        f.setReadable(true, false);
    }

    public void cleanup(String outputPath) {
        new File(outputPath).delete();
    }
}
