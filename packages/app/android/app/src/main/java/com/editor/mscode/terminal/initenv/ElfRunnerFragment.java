// package com.editor.mscode.terminal.initenv;

// /**
//  * Linker setup, proot path recovery, and elf() runner.
//  * Handles targetSdk>28 non-executable filesDir binaries.
//  */
// public final class ElfRunnerFragment {
//     private ElfRunnerFragment() {}

//     public static void append(StringBuilder sb, String safeLib, String safeTmp) {
//         sb.append("# targetSdk>28: exec from filesDir is blocked — use linker\n");
//         sb.append("if [ -x /system/bin/linker64 ]; then\n");
//         sb.append("  export MSCODE_LINKER=/system/bin/linker64\n");
//         sb.append("elif [ -x /system/bin/linker ]; then\n");
//         sb.append("  export MSCODE_LINKER=/system/bin/linker\n");
//         sb.append("else\n");
//         sb.append("  export MSCODE_LINKER=\n");
//         sb.append("fi\n");
//         sb.append("export MSCODE_PROOT='").append(safeLib).append("/libproot.so'\n");
//         sb.append("export PROOT_LOADER='").append(safeLib).append("/libproot-loader.so'\n");
//         sb.append("if [ -f '").append(safeLib).append("/libproot-loader32.so' ]; then\n");
//         sb.append("  export PROOT_LOADER32='").append(safeLib).append("/libproot-loader32.so'\n");
//         sb.append("fi\n");
//         sb.append("export PROOT_TMP_DIR='").append(safeTmp).append("'\n");
//         sb.append("if [ ! -f \"$MSCODE_PROOT\" ]; then\n");
//         sb.append("  if [ -n \"$PROOT_LOADER\" ] && [ -f \"${PROOT_LOADER%/*}/libproot.so\" ]; then\n");
//         sb.append("    export MSCODE_PROOT=\"${PROOT_LOADER%/*}/libproot.so\"\n");
//         sb.append("  elif [ -n \"$TOYBOX\" ] && [ -f \"${TOYBOX%/*}/libproot.so\" ]; then\n");
//         sb.append("    export MSCODE_PROOT=\"${TOYBOX%/*}/libproot.so\"\n");
//         sb.append("  fi\n");
//         sb.append("fi\n");
//         sb.append("\n");

//         sb.append("elf() {\n");
//         sb.append("  if [ $# -lt 1 ]; then\n");
//         sb.append("    echo \"usage: elf <binary-path> [args…]\" >&2\n");
//         sb.append("    return 1\n");
//         sb.append("  fi\n");
//         sb.append("  _elf_bin=\"$1\"; shift\n");
//         sb.append("  if [ ! -f \"$_elf_bin\" ]; then\n");
//         sb.append("    echo \"elf: not found: $_elf_bin\" >&2\n");
//         sb.append("    return 127\n");
//         sb.append("  fi\n");
//         sb.append("  _elf_hd=$(command head -c 2 \"$_elf_bin\" 2>/dev/null || /system/bin/head -c 2 \"$_elf_bin\" 2>/dev/null)\n");
//         sb.append("  if [ \"$_elf_hd\" = '#!' ]; then\n");
//         sb.append("    _shebang=$(command head -n 1 \"$_elf_bin\" 2>/dev/null || /system/bin/head -n 1 \"$_elf_bin\")\n");
//         sb.append("    _interp=\n");
//         sb.append("    case \"$_shebang\" in\n");
//         sb.append("      *bash*)\n");
//         sb.append("        if [ -f \"$PREFIX/bin/bash\" ]; then _interp=$PREFIX/bin/bash; fi\n");
//         sb.append("        ;;\n");
//         sb.append("      *python3*|*python*)\n");
//         sb.append("        if [ -f \"$PREFIX/bin/python3\" ]; then _interp=$PREFIX/bin/python3\n");
//         sb.append("        elif [ -f \"$PREFIX/bin/python\" ]; then _interp=$PREFIX/bin/python; fi\n");
//         sb.append("        ;;\n");
//         sb.append("      *nodejs*|*node*)\n");
//         sb.append("        if [ -f \"$PREFIX/bin/node\" ]; then _interp=$PREFIX/bin/node; fi\n");
//         sb.append("        ;;\n");
//         sb.append("    esac\n");
//         sb.append("    if [ -n \"$_interp\" ] && [ -n \"$MSCODE_LINKER\" ]; then\n");
//         sb.append("      \"$MSCODE_LINKER\" \"$_interp\" \"$_elf_bin\" \"$@\"\n");
//         sb.append("      return $?\n");
//         sb.append("    fi\n");
//         sb.append("    /system/bin/sh \"$_elf_bin\" \"$@\"\n");
//         sb.append("    return $?\n");
//         sb.append("  fi\n");
//         sb.append("  if [ -n \"$MSCODE_LINKER\" ]; then\n");
//         sb.append("    \"$MSCODE_LINKER\" \"$_elf_bin\" \"$@\"\n");
//         sb.append("    return $?\n");
//         sb.append("  fi\n");
//         sb.append("  \"$_elf_bin\" \"$@\"\n");
//         sb.append("  return $?\n");
//         sb.append("}\n");
//         sb.append("\n");
//     }
// }



package com.editor.mscode.terminal.initenv;

/**
 * Linker setup, proot path recovery, and elf() runner.
 * Handles targetSdk>28 non-executable filesDir binaries.
 *
 * npm / npx are shebang scripts (often pointing at Termux paths). We rewrite
 * the interpreter to $PREFIX/bin/node (or bash/python) and run via linker.
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
        sb.append("  # resolve one level of symlink (npm → ../lib/node_modules/...)\n");
        sb.append("  if [ -L \"$_elf_bin\" ]; then\n");
        sb.append("    _elf_link=$(command readlink \"$_elf_bin\" 2>/dev/null || /system/bin/readlink \"$_elf_bin\" 2>/dev/null)\n");
        sb.append("    case \"$_elf_link\" in\n");
        sb.append("      /*) _elf_bin=\"$_elf_link\" ;;\n");
        sb.append("      *)\n");
        sb.append("        _elf_dir=${_elf_bin%/*}\n");
        sb.append("        [ \"$_elf_dir\" = \"$_elf_bin\" ] && _elf_dir=.\n");
        sb.append("        _elf_bin=\"$_elf_dir/$_elf_link\"\n");
        sb.append("        ;;\n");
        sb.append("    esac\n");
        sb.append("  fi\n");
        sb.append("  if [ ! -f \"$_elf_bin\" ]; then\n");
        sb.append("    echo \"elf: not found: $_elf_bin\" >&2\n");
        sb.append("    return 127\n");
        sb.append("  fi\n");
        sb.append("  _elf_hd=$(command head -c 2 \"$_elf_bin\" 2>/dev/null || /system/bin/head -c 2 \"$_elf_bin\" 2>/dev/null)\n");
        sb.append("  if [ \"$_elf_hd\" = '#!' ]; then\n");
        sb.append("    _shebang=$(command head -n 1 \"$_elf_bin\" 2>/dev/null || /system/bin/head -n 1 \"$_elf_bin\")\n");
        sb.append("    # strip #! and optional spaces\n");
        sb.append("    _sb=${_shebang#\\#!}\n");
        sb.append("    _sb=${_sb# }\n");
        sb.append("    _sb=${_sb# }\n");
        sb.append("    _interp=\n");
        sb.append("    _script_args=\n");
        // /usr/bin/env node  |  /data/data/com.termux/.../bin/node  |  node
        sb.append("    case \"$_sb\" in\n");
        sb.append("      */env\\ *|env\\ *)\n");
        sb.append("        _rest=${_sb#*env }\n");
        sb.append("        _rest=${_rest# }\n");
        sb.append("        _prog=${_rest%% *}\n");
        sb.append("        case \"$_prog\" in\n");
        sb.append("          node|nodejs)\n");
        sb.append("            [ -f \"$PREFIX/bin/node\" ] && _interp=$PREFIX/bin/node\n");
        sb.append("            ;;\n");
        sb.append("          python3|python)\n");
        sb.append("            if [ -f \"$PREFIX/bin/python3\" ]; then _interp=$PREFIX/bin/python3\n");
        sb.append("            elif [ -f \"$PREFIX/bin/python\" ]; then _interp=$PREFIX/bin/python; fi\n");
        sb.append("            ;;\n");
        sb.append("          bash)\n");
        sb.append("            [ -f \"$PREFIX/bin/bash\" ] && _interp=$PREFIX/bin/bash\n");
        sb.append("            ;;\n");
        sb.append("          sh)\n");
        sb.append("            _interp=/system/bin/sh\n");
        sb.append("            ;;\n");
        sb.append("        esac\n");
        sb.append("        ;;\n");
        sb.append("      *bash*)\n");
        sb.append("        [ -f \"$PREFIX/bin/bash\" ] && _interp=$PREFIX/bin/bash\n");
        sb.append("        ;;\n");
        sb.append("      *python3*|*python*)\n");
        sb.append("        if [ -f \"$PREFIX/bin/python3\" ]; then _interp=$PREFIX/bin/python3\n");
        sb.append("        elif [ -f \"$PREFIX/bin/python\" ]; then _interp=$PREFIX/bin/python; fi\n");
        sb.append("        ;;\n");
        sb.append("      *nodejs*|*node*)\n");
        sb.append("        [ -f \"$PREFIX/bin/node\" ] && _interp=$PREFIX/bin/node\n");
        sb.append("        ;;\n");
        sb.append("      *sh)\n");
        sb.append("        _interp=/system/bin/sh\n");
        sb.append("        ;;\n");
        sb.append("    esac\n");
        sb.append("    if [ -n \"$_interp\" ]; then\n");
        sb.append("      if [ -n \"$MSCODE_LINKER\" ] && [ -f \"$_interp\" ]; then\n");
        sb.append("        # node/python/bash themselves need the linker under targetSdk>28\n");
        sb.append("        case \"$_interp\" in\n");
        sb.append("          /system/*) \"$_interp\" \"$_elf_bin\" \"$@\" ;;\n");
        sb.append("          *) \"$MSCODE_LINKER\" \"$_interp\" \"$_elf_bin\" \"$@\" ;;\n");
        sb.append("        esac\n");
        sb.append("        return $?\n");
        sb.append("      fi\n");
        sb.append("      \"$_interp\" \"$_elf_bin\" \"$@\"\n");
        sb.append("      return $?\n");
        sb.append("    fi\n");
        // last resort: let system sh interpret the script (may fail if shebang path is Termux-only)
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
