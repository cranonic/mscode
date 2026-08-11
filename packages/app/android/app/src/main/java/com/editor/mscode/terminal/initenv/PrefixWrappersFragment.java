package com.editor.mscode.terminal.initenv;

import java.io.File;
import java.util.Set;

/**
 * Static PREFIX/bin wrappers (Java-side scan — no shell for-loop at session start).
 */
public final class PrefixWrappersFragment {
    private PrefixWrappersFragment() {}

    /**
     * @param bins   result of prefix/bin listFiles (may be null)
     * @param skip   names already claimed by toybox applets
     */
    public static void append(StringBuilder sb, File[] bins, Set<String> skip) {
        sb.append("# PREFIX wrappers (static, generated at env-write time)\n");
        if (bins != null) {
            int wrapped = 0;
            for (File binFile : bins) {
                String name = binFile.getName();
                if (!ShellNameUtil.isValidShellName(name)) continue;
                if (skip != null && skip.contains(name)) continue;
                if ("clang".equals(name) || "clang++".equals(name) || "tcc".equals(name)
                        || "gcc".equals(name) || "g++".equals(name)
                        || "cc".equals(name) || "c++".equals(name)) continue;
                if (name.startsWith("clang-")) continue;
                String safePath = ShellNameUtil.shellSingleQuote(binFile.getAbsolutePath());
                sb.append(name).append("() { elf '").append(safePath).append("' \"$@\"; }\n");
                wrapped++;
                if (wrapped > 400) break;
            }
            sb.append("# wrapped ").append(String.valueOf(wrapped)).append(" PREFIX tools\n");
        }
        // Dynamic wrap ONLY after pkg install (same-session). Do NOT call at session
        // start — shell "for f in $PREFIX/bin/*; eval …" is 10–30s (see ai old fix).
        // Session open uses the static wrappers above (Java-generated, stamp-cached).
        sb.append("mscode_wrap() {\n");
        sb.append("  [ -d \"$PREFIX/bin\" ] || return 0\n");
        sb.append("  _n=0\n");
        sb.append("  for _f in \"$PREFIX/bin\"/*; do\n");
        sb.append("    [ -f \"$_f\" ] || continue\n");
        sb.append("    _b=${_f##*/}\n");
        sb.append("    case \"$_b\" in\n");
        sb.append("      *[!a-zA-Z0-9_+.-]*|[0-9]*|elf|bb|pkg|mscode_wrap|runpfx) continue ;;\n");
        sb.append("    esac\n");
        // Skip if already a shell function (static wrapper from this env)
        sb.append("    case \"$(typeset -f \"$_b\" 2>/dev/null | head -1)\" in\n");
        sb.append("      *\"$_b\"*) continue ;;\n");
        sb.append("    esac\n");
        sb.append("    eval \"${_b}() { elf \\\"\\${PREFIX}/bin/${_b}\\\" \\\"\\$@\\\"; }\"\n");
        sb.append("    _n=$((_n+1))\n");
        sb.append("  done\n");
        sb.append("  [ \"$_n\" -gt 0 ] && echo \"[mscode] wrapped $_n new tools\" >&2\n");
        sb.append("  return 0\n");
        sb.append("}\n");
        sb.append("\n");
    }
}
