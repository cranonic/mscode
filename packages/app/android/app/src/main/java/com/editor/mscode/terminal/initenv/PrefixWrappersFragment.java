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
        sb.append("mscode_wrap() {\n");
        sb.append("  echo \"[mscode] wrappers already loaded from cached env; pkg install refreshes on next session\" >&2\n");
        sb.append("  return 0\n");
        sb.append("}\n");
        sb.append("\n");
    }
}
