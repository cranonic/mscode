package com.editor.mscode.terminal.initenv;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * bb() multi-call helper + toybox applet shell functions.
 * Returns the set of applet names already claimed (for PREFIX skip list).
 */
public final class ToyboxAppletsFragment {
    private ToyboxAppletsFragment() {}

    public static final String[] TOYBOX_APPLETS = {
        "ls", "cat", "cp", "mv", "rm", "mkdir", "rmdir", "grep", "find",
        "tar", "head", "tail", "wc", "uname", "chmod", "chown",
        "sed", "sort", "cut", "tr", "uniq", "basename", "dirname",
        "sleep", "date", "touch", "ln", "readlink", "stat", "du", "df",
        "mount", "umount", "ps", "kill", "id", "whoami", "which", "xargs",
        "tee", "md5sum", "base64", "gzip", "diff", "cmp",
        "env", "printenv", "seq", "expr", "realpath", "mktemp", "clear"
    };

    public static final String[] BB_ONLY_APPLETS = {
        "awk", "wget", "sha256sum", "gunzip", "zcat", "od", "hexdump", "fold"
    };

    /** Append bb() + applet wrappers; return names that PREFIX wrappers must skip. */
    public static Set<String> append(StringBuilder sb) {
        sb.append("bb() {\n");
        sb.append("  if [ $# -lt 1 ]; then\n");
        sb.append("    echo \"usage: bb <applet> [args…]\" >&2\n");
        sb.append("    echo \"       bb --list\" >&2\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  if [ \"$1\" = \"--list\" ] || [ \"$1\" = \"--help\" ]; then\n");
        sb.append("    ( exec -a toybox \"$TOYBOX\" \"$1\" )\n");
        sb.append("    return $?\n");
        sb.append("  fi\n");
        sb.append("  _bb_applet=\"$1\"\n");
        sb.append("  shift\n");
        sb.append("  ( exec -a \"$_bb_applet\" \"$TOYBOX\" \"$@\" )\n");
        sb.append("}\n");
        sb.append("\n");

        LinkedHashSet<String> seen = new LinkedHashSet<>();
        for (String a : TOYBOX_APPLETS) {
            if (!seen.add(a)) continue;
            if ("ls".equals(a)) {
                sb.append("ls() { command ls \"$@\" 2>/dev/null || /system/bin/ls \"$@\" || bb ls \"$@\"; }\n");
                sb.append("ll() { ls -la \"$@\"; }\n");
            } else {
                sb.append(a).append("() { command ").append(a)
                  .append(" \"$@\" 2>/dev/null || /system/bin/").append(a)
                  .append(" \"$@\" || bb ").append(a).append(" \"$@\"; }\n");
            }
        }
        for (String a : BB_ONLY_APPLETS) {
            if (!seen.add(a)) continue;
            sb.append(a).append("() { bb ").append(a).append(" \"$@\"; }\n");
        }
        sb.append("\n");
        return seen;
    }
}
