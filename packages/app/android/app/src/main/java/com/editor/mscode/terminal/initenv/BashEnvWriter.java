// package com.editor.mscode.terminal.initenv;

// import android.util.Log;

// import java.io.File;
// import java.io.FileOutputStream;
// import java.io.IOException;

// /**
//  * Writes $PREFIX/etc/mscode_bash_env.sh once from Java.
//  * Bash scripts (BASH_ENV) do not inherit mksh functions from mscode_env.sh.
//  */
// public final class BashEnvWriter {
//     private static final String TAG = "BashEnvWriter";

//     private BashEnvWriter() {}

//     public static void write(String prefix, String safePrefix, String safeToybox,
//                              String safeLib, File[] bins) {
//         StringBuilder b = new StringBuilder(4096);
//         b.append("# Auto-generated for bash scripts (neofetch, etc.) — do not hand-edit\n");
//         b.append("export PREFIX='").append(safePrefix).append("'\n");
//         b.append("export TERMUX_PREFIX='").append(safePrefix).append("'\n");
//         b.append("export TOYBOX='").append(safeToybox).append("'\n");
//         b.append("export LD_LIBRARY_PATH='").append(safePrefix).append("/lib:")
//          .append(safePrefix).append("/lib/glibc:").append(safeLib).append("'\n");
//         b.append("export PATH='").append(safePrefix).append("/bin:")
//          .append(safePrefix).append("/bin/applets:").append(safeLib)
//          .append(":/system/bin:/system/xbin'\n");
//         b.append("export TERMINFO='").append(safePrefix).append("/share/terminfo'\n");
//         b.append("if [ -f '").append(safePrefix).append("/etc/tls/cert.pem' ]; then\n");
//         b.append("  export CURL_CA_BUNDLE='").append(safePrefix).append("/etc/tls/cert.pem'\n");
//         b.append("  export SSL_CERT_FILE=\"$CURL_CA_BUNDLE\"\n");
//         b.append("fi\n");
//         b.append("export ANDROID_DATA=/data\n");
//         b.append("export ANDROID_ROOT=/system\n");
//         b.append("bb() { [ $# -lt 1 ] && return 1; local a=\"$1\"; shift; ( exec -a \"$a\" \"$TOYBOX\" \"$@\" ); }\n");
//         b.append("_mscode_proot() { \"$MSCODE_PROOT\" --link2symlink --kill-on-exit -0 -r / -b /system -b /data -b /dev -b /proc -b /sys -b /storage -b /sdcard -b /apex -b \"$PREFIX\" -b \"${TMPDIR:-$PREFIX/tmp}:/tmp\" -w \"$PWD\" \"$@\"; }\n");
//         b.append("clang() { [ -f \"$PREFIX/bin/clang\" ] || return 127; _mscode_proot \"$PREFIX/bin/clang\" \"$@\"; }\n");
//         b.append("_mscode_clangxx() { _mscode_proot \"$PREFIX/bin/clang++\" \"$@\"; }\n");
//         b.append("alias 'clang++'=_mscode_clangxx\n");
//         b.append("elf() { local _b=\"$1\"; shift; [ -f \"$_b\" ] || return 127; if [ -n \"$MSCODE_LINKER\" ]; then \"$MSCODE_LINKER\" \"$_b\" \"$@\"; else \"$_b\" \"$@\"; fi; }\n");

//         for (String a : ToyboxAppletsFragment.TOYBOX_APPLETS) {
//             b.append(a).append("() { bb ").append(a).append(" \"$@\"; }\n");
//         }

//         if (bins != null) {
//             int wrapped = 0;
//             for (File binFile : bins) {
//                 String name = binFile.getName();
//                 if (!ShellNameUtil.isValidShellName(name)) continue;
//                 if ("clang".equals(name) || "clang++".equals(name)) continue;
//                 String safePath = ShellNameUtil.shellSingleQuote(binFile.getAbsolutePath());
//                 b.append(name).append("() { elf '").append(safePath).append("' \"$@\"; }\n");
//                 if (++wrapped > 400) break;
//             }
//         }

//         File etc = new File(prefix, "etc");
//         if (!etc.isDirectory()) etc.mkdirs();
//         try (FileOutputStream fos = new FileOutputStream(new File(etc, "mscode_bash_env.sh"))) {
//             fos.write(b.toString().getBytes("UTF-8"));
//         } catch (IOException e) {
//             Log.w(TAG, "mscode_bash_env.sh write failed: " + e.getMessage());
//         }
//     }
// }




package com.editor.mscode.terminal.initenv;

import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Writes $PREFIX/etc/mscode_bash_env.sh once from Java.
 * Bash scripts (BASH_ENV) do not inherit mksh functions from mscode_env.sh.
 */
public final class BashEnvWriter {
    private static final String TAG = "BashEnvWriter";

    private BashEnvWriter() {}

    public static void write(String prefix, String safePrefix, String safeToybox,
                             String safeLib, File[] bins) {
        StringBuilder b = new StringBuilder(4096);
        b.append("# Auto-generated for bash scripts (neofetch, etc.) — do not hand-edit\n");
        b.append("export PREFIX='").append(safePrefix).append("'\n");
        b.append("export TERMUX_PREFIX='").append(safePrefix).append("'\n");
        b.append("export TOYBOX='").append(safeToybox).append("'\n");
        b.append("export LD_LIBRARY_PATH='").append(safePrefix).append("/lib:")
         .append(safePrefix).append("/lib/glibc:").append(safeLib).append("'\n");
        b.append("export PATH='").append(safePrefix).append("/bin:")
         .append(safePrefix).append("/bin/applets:").append(safeLib)
         .append(":/system/bin:/system/xbin'\n");
        b.append("export TERMINFO='").append(safePrefix).append("/share/terminfo'\n");
        b.append("if [ -f '").append(safePrefix).append("/etc/tls/cert.pem' ]; then\n");
        b.append("  export CURL_CA_BUNDLE='").append(safePrefix).append("/etc/tls/cert.pem'\n");
        b.append("  export SSL_CERT_FILE=\"$CURL_CA_BUNDLE\"\n");
        b.append("fi\n");
        b.append("export ANDROID_DATA=/data\n");
        b.append("export ANDROID_ROOT=/system\n");
        b.append("bb() { [ $# -lt 1 ] && return 1; local a=\"$1\"; shift; ( exec -a \"$a\" \"$TOYBOX\" \"$@\" ); }\n");
        b.append("_mscode_proot() { \"$MSCODE_PROOT\" --link2symlink --kill-on-exit -0 -r / -b /system -b /data -b /dev -b /proc -b /sys -b /storage -b /sdcard -b /apex -b \"$PREFIX\" -b \"${TMPDIR:-$PREFIX/tmp}:/tmp\" -w \"$PWD\" \"$@\"; }\n");
        b.append("clang() { [ -f \"$PREFIX/bin/clang\" ] || return 127; _mscode_proot \"$PREFIX/bin/clang\" \"$@\"; }\n");
        b.append("_mscode_clangxx() { _mscode_proot \"$PREFIX/bin/clang++\" \"$@\"; }\n");
        b.append("alias 'clang++'=_mscode_clangxx\n");
        b.append("elf() { local _b=\"$1\"; shift; [ -f \"$_b\" ] || return 127; if [ -n \"$MSCODE_LINKER\" ]; then \"$MSCODE_LINKER\" \"$_b\" \"$@\"; else \"$_b\" \"$@\"; fi; }\n");

        for (String a : ToyboxAppletsFragment.TOYBOX_APPLETS) {
            b.append(a).append("() { bb ").append(a).append(" \"$@\"; }\n");
        }

        if (bins != null) {
            int wrapped = 0;
            for (File binFile : bins) {
                String name = binFile.getName();
                if (!ShellNameUtil.isValidShellName(name)) continue;
                if ("clang".equals(name) || "clang++".equals(name)) continue;
                String safePath = ShellNameUtil.shellSingleQuote(binFile.getAbsolutePath());
                b.append(name).append("() { elf '").append(safePath).append("' \"$@\"; }\n");
                if (++wrapped > 400) break;
            }
        }

        File etc = new File(prefix, "etc");
        if (!etc.isDirectory()) etc.mkdirs();
        try (FileOutputStream fos = new FileOutputStream(new File(etc, "mscode_bash_env.sh"))) {
            fos.write(b.toString().getBytes("UTF-8"));
        } catch (IOException e) {
            Log.w(TAG, "mscode_bash_env.sh write failed: " + e.getMessage());
        }

        // readline inputrc — soft-wrap long lines (Termux-style, no '<' scroll marker)
        writeInputrc(etc);
    }

    /**
     * $PREFIX/etc/inputrc — used when INPUTRC is set and bash is the interactive shell.
     * horizontal-scroll-mode off ⇒ long input wraps to the next line instead of
     * scrolling with a '&lt;' marker (mksh has no equivalent option).
     */
    public static void writeInputrc(File etcDir) {
        if (etcDir == null) return;
        if (!etcDir.isDirectory() && !etcDir.mkdirs()) return;
        String content =
            "# MS Code readline config — match Termux line wrapping\n"
          + "set horizontal-scroll-mode Off\n"
          + "set horizontal-scroll-mode off\n"
          + "set enable-bracketed-paste on\n"
          + "set blink-matching-paren on\n"
          + "set colored-completion-prefix on\n"
          + "set show-all-if-ambiguous on\n"
          + "set completion-ignore-case on\n";
        try (FileOutputStream fos = new FileOutputStream(new File(etcDir, "inputrc"))) {
            fos.write(content.getBytes("UTF-8"));
        } catch (IOException e) {
            Log.w(TAG, "inputrc write failed: " + e.getMessage());
        }
    }
}
