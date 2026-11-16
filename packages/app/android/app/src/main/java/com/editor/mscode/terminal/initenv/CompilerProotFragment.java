package com.editor.mscode.terminal.initenv;

/**
 * proot-based compiler helpers: _mscode_proot, clang, clang++, tcc, run.
 * Only path that still uses proot (C/C++).
 */
public final class CompilerProotFragment {
    private CompilerProotFragment() {}

    public static void append(StringBuilder sb) {
        sb.append("_mscode_proot() {\n");
        sb.append("  _pr=\"$MSCODE_PROOT\"\n");
        sb.append("  if [ -z \"$_pr\" ] || [ ! -f \"$_pr\" ]; then\n");
        sb.append("    if [ -n \"$PROOT_LOADER\" ] && [ -f \"${PROOT_LOADER%/*}/libproot.so\" ]; then\n");
        sb.append("      _pr=\"${PROOT_LOADER%/*}/libproot.so\"\n");
        sb.append("      MSCODE_PROOT=\"$_pr\"; export MSCODE_PROOT\n");
        sb.append("    fi\n");
        sb.append("  fi\n");
        sb.append("  if [ -z \"$_pr\" ] || [ ! -f \"$_pr\" ]; then\n");
        sb.append("    echo \"mscode: libproot.so missing (MSCODE_PROOT='$MSCODE_PROOT')\" >&2\n");
        sb.append("    return 127\n");
        sb.append("  fi\n");
        sb.append("  if [ -n \"$1\" ] && [ ! -e \"$1\" ]; then\n");
        sb.append("    echo \"mscode: binary not found: $1\" >&2\n");
        sb.append("    echo \"mscode: install with: pkg install clang ndk-sysroot\" >&2\n");
        sb.append("    return 127\n");
        sb.append("  fi\n");
        sb.append("  PATH=\"${PATH:-/system/bin:/system/xbin:${PREFIX}/bin}\" \\\n");
        sb.append("  PREFIX=\"$PREFIX\" \\\n");
        sb.append("  TMPDIR=\"${TMPDIR:-$PREFIX/tmp}\" \\\n");
        sb.append("  HOME=\"${HOME:-}\" \\\n");
        sb.append("  LD_LIBRARY_PATH=\"${LD_LIBRARY_PATH:-$PREFIX/lib}\" \\\n");
        sb.append("  ANDROID_DATA=/data ANDROID_ROOT=/system \\\n");
        sb.append("  \"$_pr\" --link2symlink --kill-on-exit -0 -r / \\\n");
        sb.append("    -b /system -b /data -b /dev -b /proc -b /sys \\\n");
        sb.append("    -b /storage -b /sdcard -b /apex \\\n");
        sb.append("    -b \"$PREFIX\" \\\n");
        sb.append("    -b \"${TMPDIR:-$PREFIX/tmp}:/data/data/com.termux/files/usr/tmp\" \\\n");
        sb.append("    -b \"${TMPDIR:-$PREFIX/tmp}:/tmp\" \\\n");
        sb.append("    -w \"$PWD\" \\\n");
        sb.append("    \"$@\"\n");
        sb.append("}\n");
        sb.append("_mscode_dash_o() {\n");
        sb.append("  _prev=\n");
        sb.append("  _o=\n");
        sb.append("  for _tok in \"$@\"; do\n");
        sb.append("    [ \"$_prev\" = '-o' ] && _o=\"$_tok\"\n");
        sb.append("    _prev=\"$_tok\"\n");
        sb.append("  done\n");
        sb.append("  [ -n \"$_o\" ] && echo \"$_o\"\n");
        sb.append("}\n");
        sb.append("_mscode_compile() {\n");
        sb.append("  _cc=\"$1\"; shift\n");
        sb.append("  _mscode_proot \"$_cc\" \"$@\"\n");
        sb.append("  _st=$?\n");
        sb.append("  if [ $_st -eq 0 ]; then\n");
        sb.append("    _out=$(_mscode_dash_o \"$@\")\n");
        sb.append("    [ -n \"$_out\" ] && [ -f \"$_out\" ] && chmod +x \"$_out\" 2>/dev/null\n");
        sb.append("  fi\n");
        sb.append("  return $_st\n");
        sb.append("}\n");
        sb.append("clang() {\n");
        sb.append("  if [ ! -f \"$PREFIX/bin/clang\" ]; then\n");
        sb.append("    echo 'clang not installed — run: pkg install clang ndk-sysroot' >&2\n");
        sb.append("    return 127\n");
        sb.append("  fi\n");
        sb.append("  _mscode_compile \"$PREFIX/bin/clang\" \"$@\"\n");
        sb.append("}\n");
        sb.append("_mscode_clangxx() { _mscode_compile \"$PREFIX/bin/clang++\" \"$@\"; }\n");
        sb.append("alias 'clang++'=_mscode_clangxx\n");
        sb.append("tcc() { [ -f \"$PREFIX/bin/tcc\" ] && _mscode_compile \"$PREFIX/bin/tcc\" \"$@\"; }\n");
        sb.append("run() {\n");
        sb.append("  if [ $# -lt 1 ]; then\n");
        sb.append("    echo 'usage: run <binary> [args…]' >&2\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  _run_bin=\"$1\"; shift\n");
        sb.append("  case \"$_run_bin\" in\n");
        sb.append("    /*) ;;\n");
        sb.append("    ./*) _run_bin=\"$PWD/${_run_bin#./}\" ;;\n");
        sb.append("    *)  _run_bin=\"$PWD/$_run_bin\" ;;\n");
        sb.append("  esac\n");
        sb.append("  if [ ! -f \"$_run_bin\" ]; then\n");
        sb.append("    echo \"run: not found: $_run_bin\" >&2\n");
        sb.append("    return 127\n");
        sb.append("  fi\n");
        sb.append("  _tmpd=\"${TMPDIR:-$PREFIX/tmp}\"\n");
        sb.append("  mkdir -p \"$_tmpd\"\n");
        sb.append("  _run_copy=\"$_tmpd/mscode_run_$$\"\n");
        sb.append("  cp \"$_run_bin\" \"$_run_copy\" || return 1\n");
        sb.append("  chmod 755 \"$_run_copy\" 2>/dev/null\n");
        sb.append("  if [ -n \"$MSCODE_LINKER\" ]; then\n");
        sb.append("    \"$MSCODE_LINKER\" \"$_run_copy\" \"$@\"\n");
        sb.append("    _st=$?\n");
        sb.append("  else\n");
        sb.append("    _mscode_proot \"$_run_copy\" \"$@\"\n");
        sb.append("    _st=$?\n");
        sb.append("  fi\n");
        sb.append("  rm -f \"$_run_copy\"\n");
        sb.append("  return $_st\n");
        sb.append("}\n");
        sb.append("\n");
    }
}
