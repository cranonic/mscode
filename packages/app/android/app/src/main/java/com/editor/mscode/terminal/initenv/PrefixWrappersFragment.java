// package com.editor.mscode.terminal.initenv;

// import java.io.File;
// import java.util.Set;

// /**
//  * Static PREFIX/bin wrappers (Java-side scan — no shell for-loop at session start).
//  */
// public final class PrefixWrappersFragment {
//     private PrefixWrappersFragment() {}

//     /**
//      * @param bins   result of prefix/bin listFiles (may be null)
//      * @param skip   names already claimed by toybox applets
//      */
//     public static void append(StringBuilder sb, File[] bins, Set<String> skip) {
//         sb.append("# PREFIX wrappers (static, generated at env-write time)\n");
//         if (bins != null) {
//             int wrapped = 0;
//             for (File binFile : bins) {
//                 String name = binFile.getName();
//                 if (!ShellNameUtil.isValidShellName(name)) continue;
//                 if (skip != null && skip.contains(name)) continue;
//                 if ("clang".equals(name) || "clang++".equals(name) || "tcc".equals(name)
//                         || "gcc".equals(name) || "g++".equals(name)
//                         || "cc".equals(name) || "c++".equals(name)) continue;
//                 if (name.startsWith("clang-")) continue;
//                 String safePath = ShellNameUtil.shellSingleQuote(binFile.getAbsolutePath());
//                 sb.append(name).append("() { elf '").append(safePath).append("' \"$@\"; }\n");
//                 wrapped++;
//                 if (wrapped > 400) break;
//             }
//             sb.append("# wrapped ").append(String.valueOf(wrapped)).append(" PREFIX tools\n");
//         }
//         // Dynamic wrap ONLY after pkg install (same-session). Do NOT call at session
//         // start — shell "for f in $PREFIX/bin/*; eval …" is 10–30s (see ai old fix).
//         // Session open uses the static wrappers above (Java-generated, stamp-cached).
//         sb.append("mscode_wrap() {\n");
//         sb.append("  [ -d \"$PREFIX/bin\" ] || return 0\n");
//         sb.append("  _n=0\n");
//         sb.append("  for _f in \"$PREFIX/bin\"/*; do\n");
//         sb.append("    [ -f \"$_f\" ] || continue\n");
//         sb.append("    _b=${_f##*/}\n");
//         sb.append("    case \"$_b\" in\n");
//         sb.append("      *[!a-zA-Z0-9_+.-]*|[0-9]*|elf|bb|pkg|mscode_wrap|runpfx) continue ;;\n");
//         sb.append("    esac\n");
//         // Skip if already a shell function (static wrapper from this env)
//         sb.append("    case \"$(typeset -f \"$_b\" 2>/dev/null | head -1)\" in\n");
//         sb.append("      *\"$_b\"*) continue ;;\n");
//         sb.append("    esac\n");
//         sb.append("    eval \"${_b}() { elf \\\"\\${PREFIX}/bin/${_b}\\\" \\\"\\$@\\\"; }\"\n");
//         sb.append("    _n=$((_n+1))\n");
//         sb.append("  done\n");
//         sb.append("  [ \"$_n\" -gt 0 ] && echo \"[mscode] wrapped $_n new tools\" >&2\n");
//         sb.append("  return 0\n");
//         sb.append("}\n");
//         sb.append("\n");
//     }
// }



package com.editor.mscode.terminal.initenv;

import java.io.File;
import java.util.Set;

/**
 * Static PREFIX/bin wrappers (Java-side scan — no shell for-loop at session start).
 *
 * Also emits:
 *  - always-on critical wrappers (node / npm / npx / python*) when the file exists
 *  - mscode_wrap() for post-pkg same-session refresh
 *  - command_not_found_handle (bash) + simple fallback note
 */
public final class PrefixWrappersFragment {
    private PrefixWrappersFragment() {}

    /**
     * @param bins   result of prefix/bin listFiles (may be null)
     * @param skip   names already claimed by toybox applets
     */
    public static void append(StringBuilder sb, File[] bins, Set<String> skip) {
        sb.append("# PREFIX wrappers (static, generated at env-write time)\n");

        // ── Critical tooling: always define if present (fixes npm after install) ──
        // npm/npx are shebang scripts; must go through elf(), never direct exec.
        sb.append("_mscode_crit_wrap() {\n");
        sb.append("  [ -f \"$PREFIX/bin/$1\" ] || return 0\n");
        sb.append("  eval \"$1() { elf \\\"\\$PREFIX/bin/$1\\\" \\\"\\$@\\\"; }\"\n");
        sb.append("}\n");
        sb.append("_mscode_crit_wrap node\n");
        sb.append("_mscode_crit_wrap npm\n");
        sb.append("_mscode_crit_wrap npx\n");
        sb.append("_mscode_crit_wrap python\n");
        sb.append("_mscode_crit_wrap python3\n");
        sb.append("_mscode_crit_wrap pip\n");
        sb.append("_mscode_crit_wrap pip3\n");
        sb.append("unset -f _mscode_crit_wrap 2>/dev/null\n");
        sb.append("\n");

        if (bins != null) {
            int wrapped = 0;
            for (File binFile : bins) {
                String name = binFile.getName();
                if (!ShellNameUtil.isValidShellName(name)) continue;
                if (skip != null && skip.contains(name)) continue;
                // already handled above
                if ("node".equals(name) || "npm".equals(name) || "npx".equals(name)
                        || "python".equals(name) || "python3".equals(name)
                        || "pip".equals(name) || "pip3".equals(name)) continue;
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
        sb.append("  # always refresh critical node/python tools first\n");
        sb.append("  for _c in node npm npx python python3 pip pip3; do\n");
        sb.append("    if [ -f \"$PREFIX/bin/$_c\" ]; then\n");
        sb.append("      eval \"${_c}() { elf \\\"\\${PREFIX}/bin/${_c}\\\" \\\"\\$@\\\"; }\"\n");
        sb.append("      _n=$((_n+1))\n");
        sb.append("    fi\n");
        sb.append("  done\n");
        sb.append("  for _f in \"$PREFIX/bin\"/*; do\n");
        sb.append("    [ -e \"$_f\" ] || continue\n");
        sb.append("    _b=${_f##*/}\n");
        sb.append("    case \"$_b\" in\n");
        sb.append("      *[!a-zA-Z0-9_+.-]*|[0-9]*|elf|bb|pkg|mscode_wrap|runpfx|node|npm|npx|python|python3|pip|pip3) continue ;;\n");
        sb.append("    esac\n");
        // Do NOT use typeset -f (unreliable on Android mksh). Always redefine — cheap.
        sb.append("    eval \"${_b}() { elf \\\"\\${PREFIX}/bin/${_b}\\\" \\\"\\$@\\\"; }\"\n");
        sb.append("    _n=$((_n+1))\n");
        sb.append("  done\n");
        sb.append("  [ \"$_n\" -gt 0 ] && echo \"[mscode] wrapped $_n tools\" >&2\n");
        sb.append("  return 0\n");
        sb.append("}\n");
        sb.append("\n");

        // bash: intercept unknown commands and try $PREFIX/bin via elf
        sb.append("command_not_found_handle() {\n");
        sb.append("  _cnf=\"$1\"; shift\n");
        sb.append("  if [ -n \"$_cnf\" ] && [ -f \"$PREFIX/bin/$_cnf\" ]; then\n");
        sb.append("    elf \"$PREFIX/bin/$_cnf\" \"$@\"\n");
        sb.append("    return $?\n");
        sb.append("  fi\n");
        sb.append("  echo \"$_cnf: command not found\" >&2\n");
        sb.append("  return 127\n");
        sb.append("}\n");
        sb.append("\n");
    }
}
