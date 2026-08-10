package com.editor.mscode.terminal.initenv;

/**
 * Base exports: HOME, PREFIX, PATH, terminfo, certs, PS1 prompt.
 * First block of mscode_env.sh.
 */
public final class EnvExportsFragment {
    private EnvExportsFragment() {}

    public static void append(StringBuilder sb,
                              String safeHome, String safeTmp, String safePrefix,
                              String safeLib, String safeToybox, String safeHost) {
        sb.append("# MS Code native / Termux-style ENV (sourced by interactive sh)\n");
        sb.append("export HOME='").append(safeHome).append("'\n");
        sb.append("export TMPDIR='").append(safeTmp).append("'\n");
        sb.append("export PREFIX='").append(safePrefix).append("'\n");
        sb.append("export TERMUX_PREFIX='").append(safePrefix).append("'\n");
        sb.append("export TERMUX_VERSION=mscode\n");
        sb.append("export TERM=xterm-256color\n");
        sb.append("export LANG=C.UTF-8\n");
        sb.append("export TERMINFO='").append(safePrefix).append("/share/terminfo'\n");
        sb.append("export TERMINFO_DIRS='").append(safePrefix).append("/share/terminfo'\n");
        sb.append("# fallback TERM if xterm-256color entry missing\n");
        sb.append("if [ ! -e \"$TERMINFO/x/xterm-256color\" ] && [ ! -e \"$TERMINFO/78/xterm-256color\" ]; then\n");
        sb.append("  if [ -e \"$TERMINFO/x/xterm\" ] || [ -e \"$TERMINFO/78/xterm\" ]; then\n");
        sb.append("    export TERM=xterm\n");
        sb.append("  else\n");
        sb.append("    export TERM=linux\n");
        sb.append("  fi\n");
        sb.append("fi\n");
        sb.append("export PATH='").append(safePrefix).append("/bin:")
          .append(safePrefix).append("/bin/applets:")
          .append(safeLib).append(":/system/bin:/system/xbin'\n");
        sb.append("export LD_LIBRARY_PATH='").append(safePrefix).append("/lib:")
          .append(safePrefix).append("/lib/glibc:")
          .append(safeLib).append("'\n");
        sb.append("if [ -f '").append(safePrefix).append("/etc/tls/cert.pem' ]; then\n");
        sb.append("  export SSL_CERT_FILE='").append(safePrefix).append("/etc/tls/cert.pem'\n");
        sb.append("  export CURL_CA_BUNDLE='").append(safePrefix).append("/etc/tls/cert.pem'\n");
        sb.append("  export REQUESTS_CA_BUNDLE='").append(safePrefix).append("/etc/tls/cert.pem'\n");
        sb.append("elif [ -f '").append(safePrefix).append("/etc/ssl/certs/ca-certificates.crt' ]; then\n");
        sb.append("  export SSL_CERT_FILE='").append(safePrefix).append("/etc/ssl/certs/ca-certificates.crt'\n");
        sb.append("  export CURL_CA_BUNDLE=\"$SSL_CERT_FILE\"\n");
        sb.append("fi\n");
        sb.append("export TOYBOX='").append(safeToybox).append("'\n");
        sb.append("export MSCODE_HOST='").append(safeHost).append("'\n");
        sb.append("_mscode_prompt() {\n");
        sb.append("  _cwd=$PWD\n");
        sb.append("  if [ \"$_cwd\" = \"$HOME\" ]; then\n");
        sb.append("    _cwd='~'\n");
        sb.append("  elif [ \"${_cwd#$HOME/}\" != \"$_cwd\" ]; then\n");
        sb.append("    _under=\"${_cwd#$HOME/}\"\n");
        sb.append("    case \"$_under\" in\n");
        sb.append("      */*/*)\n");
        sb.append("        _b=${_under##*/}\n");
        sb.append("        _rest=${_under%/*}\n");
        sb.append("        _a=${_rest##*/}\n");
        sb.append("        _cwd=\"~/.../$_a/$_b\"\n");
        sb.append("        ;;\n");
        sb.append("      *)\n");
        sb.append("        _cwd=\"~/$_under\"\n");
        sb.append("        ;;\n");
        sb.append("    esac\n");
        sb.append("  else\n");
        sb.append("    case \"$_cwd\" in\n");
        sb.append("      /*/*/*/*)\n");
        sb.append("        _b=${_cwd##*/}\n");
        sb.append("        _rest=${_cwd%/*}\n");
        sb.append("        _a=${_rest##*/}\n");
        sb.append("        _cwd=\"/.../$_a/$_b\"\n");
        sb.append("        ;;\n");
        sb.append("    esac\n");
        sb.append("  fi\n");
        sb.append("  ( exec -a printf \"$TOYBOX\" '\\033[1;32m%s\\033[0m: \\033[1;34m%s\\033[0m $ ' \"$MSCODE_HOST\" \"$_cwd\" )\n");
        sb.append("}\n");
        sb.append("export PS1='$(_mscode_prompt)'\n");
        sb.append("export ANDROID_DATA=/data\n");
        sb.append("export ANDROID_ROOT=/system\n");
        sb.append("export ANDROID_STORAGE=/storage\n");
        sb.append("export BASH_ENV='").append(safePrefix).append("/etc/mscode_bash_env.sh'\n");
        // Line wrap like Termux — never horizontal-scroll with '<' / '>' markers
        sb.append("printf '\\033[?7h' 2>/dev/null || true\n");
        sb.append("if [ -n \"$BASH_VERSION\" ]; then\n");
        sb.append("  bind 'set horizontal-scroll-mode off' 2>/dev/null || true\n");
        sb.append("  bind 'set horizontal-scroll-mode Off' 2>/dev/null || true\n");
        sb.append("  bind 'set enable-bracketed-paste on' 2>/dev/null || true\n");
        sb.append("elif [ -n \"$KSH_VERSION\" ]; then\n");
        sb.append("  # mksh's line editor horizontal-scrolls a long command line by default,\n");
        sb.append("  # showing a '<' where content is clipped off-screen. 'multiline' makes\n");
        sb.append("  # it wrap across terminal rows instead, same as Termux.\n");
        sb.append("  set -o multiline 2>/dev/null || true\n");
        sb.append("fi\n");
        sb.append("stty onlcr 2>/dev/null || true\n");
        sb.append("\n");
    }
}