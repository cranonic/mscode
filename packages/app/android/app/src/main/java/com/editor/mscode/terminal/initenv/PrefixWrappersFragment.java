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
        // Dynamic wrap after pkg install — targetSdk>28 cannot exec filesDir binaries.
        // Shell functions call elf() so linker/shebang handling always runs.
        sb.append("mscode_wrap() {\n");
        sb.append("  [ -d \"$PREFIX/bin\" ] || return 0\n");
        sb.append("  _n=0\n");
        sb.append("  for _f in \"$PREFIX/bin\"/*; do\n");
        sb.append("    [ -f \"$_f\" ] || continue\n");
        sb.append("    _b=$(basename \"$_f\")\n");
        // skip invalid shell function names
        sb.append("    case \"$_b\" in\n");
        sb.append("      *[!a-zA-Z0-9_+.-]*|[0-9]*) continue ;;\n");
        sb.append("    esac\n");
        // don't override critical builtins / already-defined session helpers
        sb.append("    case \"$_b\" in\n");
        sb.append("      elf|bb|pkg|mscode_wrap|runpfx) continue ;;\n");
        sb.append("    esac\n");
        // define/overwrite: name() { elf "$PREFIX/bin/name" "$@"; }
        // \$@ so $@ is not expanded at eval time
        sb.append("    eval \"${_b}() { elf \\\"\\${PREFIX}/bin/${_b}\\\" \\\"\\$@\\\"; }\"\n");
        sb.append("    _n=$((_n+1))\n");
        sb.append("  done\n");
        sb.append("  echo \"[mscode] wrapped $_n tools from \\$PREFIX/bin\" >&2\n");
        sb.append("  return 0\n");
        sb.append("}\n");
        // Auto-wrap once at session start so already-installed packages work
        sb.append("mscode_wrap 2>/dev/null\n");
        sb.append("\n");
    }
}
