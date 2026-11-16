package com.editor.mscode.terminal.initenv;

import java.io.File;

/** Shell function name validation and small path helpers. */
public final class ShellNameUtil {
    private ShellNameUtil() {}

    /** Valid mksh function name: [a-zA-Z_][a-zA-Z0-9_]* */
    public static boolean isValidShellName(String name) {
        if (name == null || name.isEmpty()) return false;
        if (name.contains("-") || name.contains(".") || name.contains("+")) return false;
        if (name.contains("[")) return false;
        char c0 = name.charAt(0);
        if (!(c0 == '_' || (c0 >= 'a' && c0 <= 'z') || (c0 >= 'A' && c0 <= 'Z'))) return false;
        for (int i = 1; i < name.length(); i++) {
            char c = name.charAt(i);
            if (!(c == '_' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
                    || (c >= '0' && c <= '9'))) return false;
        }
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

    /** Escape for use inside single-quoted shell strings. */
    public static String shellSingleQuote(String s) {
        if (s == null) return "";
        return s.replace("'", "'\\''");
    }

    public static boolean isSymlink(File f) {
        try {
            return !f.getCanonicalPath().equals(f.getAbsolutePath())
                || java.nio.file.Files.isSymbolicLink(f.toPath());
        } catch (Exception e) {
            return false;
        }
    }
}
