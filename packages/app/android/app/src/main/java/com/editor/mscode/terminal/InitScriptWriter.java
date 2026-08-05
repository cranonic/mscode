package com.editor.mscode.terminal;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Writes per-session ENV script for native / Termux-style mode.
 *
 * libbusybox.so is multi-call: applet comes from argv[0] basename.
 * Fix: bb() uses ( exec -a APPLET "$BUSYBOX" args ).
 *
 * targetSdk > 28: binaries under filesDir ($PREFIX/bin) are not directly
 * executable. We run them via the system Bionic linker:
 *   /system/bin/linker64 $PREFIX/bin/curl args…
 * Shell functions named after each binary shadow PATH lookups.
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

        StringBuilder sb = new StringBuilder();
        sb.append("# MS Code native / Termux-style ENV (sourced by interactive sh)\n");
        sb.append("export HOME='").append(safeHome).append("'\n");
        sb.append("export TMPDIR='").append(safeTmp).append("'\n");
        sb.append("export PREFIX='").append(safePrefix).append("'\n");
        sb.append("export TERMUX_PREFIX='").append(safePrefix).append("'\n");
        sb.append("export TERMUX_VERSION=mscode\n");
        sb.append("export TERM=xterm-256color\n");
        sb.append("export LANG=C.UTF-8\n");
        // PREFIX still first so `which` reports the real binary path;
        // shell functions (below) win over PATH for actual execution.
        sb.append("export PATH='").append(safePrefix).append("/bin:")
          .append(safePrefix).append("/bin/applets:")
          .append(safeLib).append(":/system/bin:/system/xbin'\n");
        sb.append("export LD_LIBRARY_PATH='").append(safePrefix).append("/lib:")
          .append(safePrefix).append("/lib/glibc:")
          .append(safeLib).append("'\n");
        sb.append("export BUSYBOX='").append(safeBb).append("'\n");
        sb.append("export MSCODE_HOST='").append(safeHost).append("'\n");
        sb.append("export PS1='[$MSCODE_HOST:\\w]\\$ '\n");
        sb.append("\n");

        // ── System Bionic linker (runs ELF from non-executable filesDir) ──
        sb.append("# targetSdk>28: exec from filesDir is blocked — use linker\n");
        sb.append("if [ -x /system/bin/linker64 ]; then\n");
        sb.append("  export MSCODE_LINKER=/system/bin/linker64\n");
        sb.append("elif [ -x /system/bin/linker ]; then\n");
        sb.append("  export MSCODE_LINKER=/system/bin/linker\n");
        sb.append("else\n");
        sb.append("  export MSCODE_LINKER=\n");
        sb.append("fi\n");
        sb.append("\n");

        // elf <path> [args…] — run one PREFIX binary via linker (or sh for scripts)
        sb.append("elf() {\n");
        sb.append("  if [ $# -lt 1 ]; then\n");
        sb.append("    echo \"usage: elf <binary-path> [args…]\" >&2\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  _elf_bin=\"$1\"; shift\n");
        sb.append("  if [ ! -f \"$_elf_bin\" ]; then\n");
        sb.append("    echo \"elf: not found: $_elf_bin\" >&2\n");
        sb.append("    return 127\n");
        sb.append("  fi\n");
        sb.append("  # shebang scripts → system sh (no +x needed)\n");
        sb.append("  _elf_hd=$(bb head -c 2 \"$_elf_bin\" 2>/dev/null)\n");
        sb.append("  if [ \"$_elf_hd\" = '#!' ]; then\n");
        sb.append("    exec /system/bin/sh \"$_elf_bin\" \"$@\"\n");
        sb.append("  fi\n");
        sb.append("  if [ -n \"$MSCODE_LINKER\" ]; then\n");
        sb.append("    exec \"$MSCODE_LINKER\" \"$_elf_bin\" \"$@\"\n");
        sb.append("  fi\n");
        sb.append("  # last resort (may Permission denied)\n");
        sb.append("  exec \"$_elf_bin\" \"$@\"\n");
        sb.append("}\n");
        sb.append("\n");

        // ── Busybox multi-call ────────────────────────────────────────────
        sb.append("bb() {\n");
        sb.append("  if [ $# -lt 1 ]; then\n");
        sb.append("    echo \"usage: bb <applet> [args…]\" >&2\n");
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

        // Coreutils via busybox — always work, never hit PREFIX Permission denied
        String[] bbApplets = {
            "ls", "cat", "cp", "mv", "rm", "mkdir", "rmdir", "grep", "find",
            "tar", "head", "tail", "wc", "uname", "clear", "chmod", "chown",
            "sed", "sort", "awk", "cut", "tr", "uniq", "basename", "dirname",
            "dirname", "pwd", "echo", "printf", "sleep", "date", "touch",
            "ln", "readlink", "stat", "du", "df", "mount", "umount",
            "ps", "kill", "id", "whoami", "which", "xargs", "tee",
            "md5sum", "sha256sum", "base64", "gzip", "gunzip", "zcat",
            "diff", "cmp", "od", "hexdump", "yes", "true", "false",
            "test", "env", "printenv", "seq", "expr", "tr", "fold",
            "realpath", "mktemp", "wget"
        };
        // dedupe while writing
        java.util.LinkedHashSet<String> seen = new java.util.LinkedHashSet<>();
        for (String a : bbApplets) {
            if (!seen.add(a)) continue;
            if ("ls".equals(a)) {
                sb.append("ls()  { bb ls \"$@\"; }\n");
                sb.append("ll()  { bb ls -la \"$@\"; }\n");
            } else {
                sb.append(a).append("() { bb ").append(a).append(" \"$@\"; }\n");
            }
        }
        sb.append("\n");

        // ── PREFIX/bin ELF wrappers (linker64) ────────────────────────────
        // Generated for every file in $PREFIX/bin so `curl`, `git`, … work.
        // Shell functions override PATH; `which curl` still shows PREFIX path.
        if (bootOk) {
            File binDir = new File(prefix, "bin");
            File[] bins = binDir.isDirectory() ? binDir.listFiles() : null;
            int wrapCount = 0;
            if (bins != null) {
                sb.append("# Auto wrappers for $PREFIX/bin via MSCODE_LINKER\n");
                for (File bin : bins) {
                    if (!bin.isFile() && !isSymlink(bin)) continue;
                    String name = bin.getName();
                    // skip invalid function names / busybox already wrapped
                    if (!isValidShellName(name)) continue;
                    if (seen.contains(name)) continue; // prefer busybox applet
                    // skip apt internals that confuse interactive use? keep all

                    String abs = bin.getAbsolutePath().replace("'", "'\\''");
                    // function: name() { elf 'abs' "$@"; }
                    sb.append(name).append("() { elf '").append(abs).append("' \"$@\"; }\n");
                    wrapCount++;
                }
                sb.append("# wrappers: ").append(wrapCount).append("\n\n");
            }
        }

        // ── pkg helper ───────────────────────────────────────────────────
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
        // use bb sed/sort via functions — no Permission denied
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
        sb.append("      echo \"  elf <path> [args]   Run PREFIX binary via linker\"\n");
        sb.append("      echo \"PREFIX=$PREFIX  LINKER=$MSCODE_LINKER\"\n");
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

        // banner
        sb.append("if [ -z \"$MSCODE_BANNER_SHOWN\" ]; then\n");
        sb.append("  export MSCODE_BANNER_SHOWN=1\n");
        sb.append("  echo \"[+] Opened: $PWD\"\n");
        if (bootOk) {
            sb.append("  echo \"[+] PREFIX=$PREFIX  linker=$MSCODE_LINKER\"\n");
            sb.append("  echo \"[+] bb ls / curl / elf $PREFIX/bin/curl / pkg\"\n");
        } else {
            sb.append("  echo \"[+] Native shell (bootstrap pending)  |  bb ls / bb --list\"\n");
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

    /** Valid mksh function name: [a-zA-Z_][a-zA-Z0-9_]* — also allow digits after start, plus + - . for some tools we skip. */
    private static boolean isValidShellName(String name) {
        if (name == null || name.isEmpty()) return false;
        // skip names with chars invalid in function identifiers
        if (name.contains("-") || name.contains(".") || name.contains("+")) return false;
        if (name.contains("[")) return false;
        char c0 = name.charAt(0);
        if (!(c0 == '_' || (c0 >= 'a' && c0 <= 'z') || (c0 >= 'A' && c0 <= 'Z'))) return false;
        for (int i = 1; i < name.length(); i++) {
            char c = name.charAt(i);
            if (!(c == '_' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
                    || (c >= '0' && c <= '9'))) return false;
        }
        // reserved / shell builtins we must not override badly
        if ("elf".equals(name) || "bb".equals(name) || "pkg".equals(name)
                || "export".equals(name) || "exec".equals(name)
                || "if".equals(name) || "fi".equals(name)
                || "then".equals(name) || "else".equals(name)
                || "while".equals(name) || "do".equals(name)
                || "done".equals(name) || "case".equals(name)
                || "esac".equals(name) || "function".equals(name)
                || "return".equals(name) || "shift".equals(name)
                || "cd".equals(name) || "command".equals(name)) {
            return false;
        }
        return true;
    }

    private static boolean isSymlink(File f) {
        try {
            return !f.getCanonicalPath().equals(f.getAbsolutePath())
                || java.nio.file.Files.isSymbolicLink(f.toPath());
        } catch (Exception e) {
            return false;
        }
    }
}
