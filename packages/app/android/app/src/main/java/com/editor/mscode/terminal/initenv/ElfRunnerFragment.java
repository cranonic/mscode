package com.editor.mscode.terminal.initenv;

/**
 * Linker setup, proot path recovery, and elf() runner.
 * Handles targetSdk>28 non-executable filesDir binaries.
 */
public final class ElfRunnerFragment {
    private ElfRunnerFragment() {}

    public static void append(StringBuilder sb, String safeLib, String safeTmp) {
        sb.append("# targetSdk>28: exec from filesDir is blocked — use linker\n");
        sb.append("if [ -x /system/bin/linker64 ]; then\n");
        sb.append("  export MSCODE_LINKER=/system/bin/linker64\n");
        sb.append("elif [ -x /system/bin/linker ]; then\n");
        sb.append("  export MSCODE_LINKER=/system/bin/linker\n");
        sb.append("else\n");
        sb.append("  export MSCODE_LINKER=\n");
        sb.append("fi\n");
        sb.append("export MSCODE_PROOT='").append(safeLib).append("/libproot.so'\n");
        sb.append("export PROOT_LOADER='").append(safeLib).append("/libproot-loader.so'\n");
        sb.append("if [ -f '").append(safeLib).append("/libproot-loader32.so' ]; then\n");
        sb.append("  export PROOT_LOADER32='").append(safeLib).append("/libproot-loader32.so'\n");
        sb.append("fi\n");
        sb.append("export PROOT_TMP_DIR='").append(safeTmp).append("'\n");
        sb.append("if [ ! -f \"$MSCODE_PROOT\" ]; then\n");
        sb.append("  if [ -n \"$PROOT_LOADER\" ] && [ -f \"${PROOT_LOADER%/*}/libproot.so\" ]; then\n");
        sb.append("    export MSCODE_PROOT=\"${PROOT_LOADER%/*}/libproot.so\"\n");
        sb.append("  elif [ -n \"$TOYBOX\" ] && [ -f \"${TOYBOX%/*}/libproot.so\" ]; then\n");
        sb.append("    export MSCODE_PROOT=\"${TOYBOX%/*}/libproot.so\"\n");
        sb.append("  fi\n");
        sb.append("fi\n");
        sb.append("\n");

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
        sb.append("  _elf_hd=$(command head -c 2 \"$_elf_bin\" 2>/dev/null || /system/bin/head -c 2 \"$_elf_bin\" 2>/dev/null)\n");
        sb.append("  if [ \"$_elf_hd\" = '#!' ]; then\n");
        sb.append("    _shebang=$(command head -n 1 \"$_elf_bin\" 2>/dev/null || /system/bin/head -n 1 \"$_elf_bin\")\n");
        sb.append("    _interp=\n");
        sb.append("    case \"$_shebang\" in\n");
        sb.append("      *bash*)\n");
        sb.append("        if [ -f \"$PREFIX/bin/bash\" ]; then _interp=$PREFIX/bin/bash; fi\n");
        sb.append("        ;;\n");
        sb.append("      *python3*|*python*)\n");
        sb.append("        if [ -f \"$PREFIX/bin/python3\" ]; then _interp=$PREFIX/bin/python3\n");
        sb.append("        elif [ -f \"$PREFIX/bin/python\" ]; then _interp=$PREFIX/bin/python; fi\n");
        sb.append("        ;;\n");
        sb.append("      *nodejs*|*node*)\n");
        sb.append("        if [ -f \"$PREFIX/bin/node\" ]; then _interp=$PREFIX/bin/node; fi\n");
        sb.append("        ;;\n");
        sb.append("    esac\n");
        sb.append("    if [ -n \"$_interp\" ] && [ -n \"$MSCODE_LINKER\" ]; then\n");
        sb.append("      \"$MSCODE_LINKER\" \"$_interp\" \"$_elf_bin\" \"$@\"\n");
        sb.append("      return $?\n");
        sb.append("    fi\n");
        sb.append("    /system/bin/sh \"$_elf_bin\" \"$@\"\n");
        sb.append("    return $?\n");
        sb.append("  fi\n");
        sb.append("  if [ -n \"$MSCODE_LINKER\" ]; then\n");
        sb.append("    \"$MSCODE_LINKER\" \"$_elf_bin\" \"$@\"\n");
        sb.append("    return $?\n");
        sb.append("  fi\n");
        sb.append("  \"$_elf_bin\" \"$@\"\n");
        sb.append("  return $?\n");
        sb.append("}\n");
        sb.append("\n");
    }
}
