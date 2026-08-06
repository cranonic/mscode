package com.editor.mscode.terminal;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Writes per-session ENV script for native / Termux-style mode.
 *
 * libbusybox.so is multi-call: applet comes from argv[0] basename.
 * Fix: bb() uses ( exec -a APPLET "$BUSYBOX" args ).
 *
 * targetSdk > 28: binaries under filesDir ($PREFIX/bin) are not directly
 * executable. We run them via the system Bionic linker:
 *   /system/bin/linker64 $PREFIX/bin/curl args…
 * Shell functions named after each binary shadow PATH lookups.
 *
 * Interactive shell: /system/bin/sh -i with ENV=this file
 * (mksh sources ENV — functions stay alive, no extra exec).
 */
public class InitScriptWriter {

    private final RootfsManager rootfs;

    public InitScriptWriter(RootfsManager rootfs) {
        this.rootfs = rootfs;
    }

    /**
     * @param outputPath  filesDir/init_tabX.sh — set as ENV= for interactive sh
     * @param projectCwd  Android path to cd into on startup
     */
    public void write(String outputPath, String projectCwd) throws IOException {
        String hostname = rootfs.getStoredHostname();
        String home     = rootfs.getHomePath();
        String tmp      = rootfs.getTmpPath();
        String prefix   = rootfs.getPrefixPath();
        String busybox  = rootfs.getBusyboxPath();
        String libDir   = rootfs.getNativeLibDir();
        boolean bootOk  = rootfs.isBootstrapReady();

        String safeCwd = (projectCwd != null && !projectCwd.isEmpty())
            ? projectCwd.replace("'", "'\\''")
            : home.replace("'", "'\\''");

        String safeHost = hostname != null
            ? hostname.replace("'", "'\\''")
            : "mscode";

        String safeHome   = home.replace("'", "'\\''");
        String safeTmp    = tmp.replace("'", "'\\''");
        String safePrefix = prefix.replace("'", "'\\''");
        String safeLib    = libDir.replace("'", "'\\''");
        String safeBb     = busybox.replace("'", "'\\''");

        StringBuilder sb = new StringBuilder();
        sb.append("# MS Code native / Termux-style ENV (sourced by interactive sh)\n");
        sb.append("export HOME='").append(safeHome).append("'\n");
        sb.append("export TMPDIR='").append(safeTmp).append("'\n");
        sb.append("export PREFIX='").append(safePrefix).append("'\n");
        sb.append("export TERMUX_PREFIX='").append(safePrefix).append("'\n");
        sb.append("export TERMUX_VERSION=mscode\n");
        sb.append("export TERM=xterm-256color\n");
        sb.append("export LANG=C.UTF-8\n");
        // terminfo for nano/ncurses (lives under bootstrap share/)
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
        // PREFIX still first so `which` reports the real binary path;
        // shell functions (below) win over PATH for actual execution.
        sb.append("export PATH='").append(safePrefix).append("/bin:")
          .append(safePrefix).append("/bin/applets:")
          .append(safeLib).append(":/system/bin:/system/xbin'\n");
        sb.append("export LD_LIBRARY_PATH='").append(safePrefix).append("/lib:")
          .append(safePrefix).append("/lib/glibc:")
          .append(safeLib).append("'\n");
        // Termux curl/openssl were built with hardcoded com.termux CA path —
        // force our PREFIX certs (or Android system bundle as fallback).
        sb.append("if [ -f '").append(safePrefix).append("/etc/tls/cert.pem' ]; then\n");
        sb.append("  export SSL_CERT_FILE='").append(safePrefix).append("/etc/tls/cert.pem'\n");
        sb.append("  export CURL_CA_BUNDLE='").append(safePrefix).append("/etc/tls/cert.pem'\n");
        sb.append("  export REQUESTS_CA_BUNDLE='").append(safePrefix).append("/etc/tls/cert.pem'\n");
        sb.append("elif [ -f '").append(safePrefix).append("/etc/ssl/certs/ca-certificates.crt' ]; then\n");
        sb.append("  export SSL_CERT_FILE='").append(safePrefix).append("/etc/ssl/certs/ca-certificates.crt'\n");
        sb.append("  export CURL_CA_BUNDLE=\"$SSL_CERT_FILE\"\n");
        sb.append("fi\n");
        sb.append("export BUSYBOX='").append(safeBb).append("'\n");
        sb.append("export MSCODE_HOST='").append(safeHost).append("'\n");
        // mksh (Android /system/bin/sh) does not expand \w — use $PWD
        sb.append("export PS1='[$MSCODE_HOST:$PWD]\\$ '\n");
        // Bionic expects these (tzdata warnings otherwise)
        sb.append("export ANDROID_DATA=/data\n");
        sb.append("export ANDROID_ROOT=/system\n");
        sb.append("export ANDROID_STORAGE=/storage\n");
        // bash scripts (neofetch etc.) don't inherit mksh functions — use BASH_ENV
        sb.append("export BASH_ENV='").append(safePrefix).append("/etc/mscode_bash_env.sh'\n");
        sb.append("\n");

        // ── System Bionic linker (runs ELF from non-executable filesDir) ──
        sb.append("# targetSdk>28: exec from filesDir is blocked — use linker\n");
        sb.append("if [ -x /system/bin/linker64 ]; then\n");
        sb.append("  export MSCODE_LINKER=/system/bin/linker64\n");
        sb.append("elif [ -x /system/bin/linker ]; then\n");
        sb.append("  export MSCODE_LINKER=/system/bin/linker\n");
        sb.append("else\n");
        sb.append("  export MSCODE_LINKER=\n");
        sb.append("fi\n");
        sb.append("\n");

        // elf <path> [args…] — run PREFIX binary via linker WITHOUT replacing the shell.
        // NEVER use bare `exec` here — that killed the whole terminal session.
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
        sb.append("  _elf_hd=$(bb head -c 2 \"$_elf_bin\" 2>/dev/null)\n");
        sb.append("  if [ \"$_elf_hd\" = '#!' ]; then\n");
        sb.append("    # Honour shebang: Termux scripts often need bash, not system sh\n");
        sb.append("    _shebang=$(bb head -n 1 \"$_elf_bin\")\n");
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

        // ── Busybox multi-call ────────────────────────────────────────────
        sb.append("bb() {\n");
        sb.append("  if [ $# -lt 1 ]; then\n");
        sb.append("    echo \"usage: bb <applet> [args…]\" >&2\n");
        sb.append("    echo \"       bb --list\" >&2\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  if [ \"$1\" = \"--list\" ] || [ \"$1\" = \"--help\" ]; then\n");
        sb.append("    ( exec -a busybox \"$BUSYBOX\" \"$1\" )\n");
        sb.append("    return $?\n");
        sb.append("  fi\n");
        sb.append("  _bb_applet=\"$1\"\n");
        sb.append("  shift\n");
        sb.append("  ( exec -a \"$_bb_applet\" \"$BUSYBOX\" \"$@\" )\n");
        sb.append("}\n");
        sb.append("\n");

        // Coreutils via busybox — always work, never hit PREFIX Permission denied
        String[] bbApplets = {
            "ls", "cat", "cp", "mv", "rm", "mkdir", "rmdir", "grep", "find",
            "tar", "head", "tail", "wc", "uname", "clear", "chmod", "chown",
            "sed", "sort", "awk", "cut", "tr", "uniq", "basename", "dirname",
            "dirname", "pwd", "echo", "printf", "sleep", "date", "touch",
            "ln", "readlink", "stat", "du", "df", "mount", "umount",
            "ps", "kill", "id", "whoami", "which", "xargs", "tee",
            "md5sum", "sha256sum", "base64", "gzip", "gunzip", "zcat",
            "diff", "cmp", "od", "hexdump", "yes", "true", "false",
            "test", "env", "printenv", "seq", "expr", "tr", "fold",
            "realpath", "mktemp", "wget"
        };
        // dedupe while writing
        java.util.LinkedHashSet<String> seen = new java.util.LinkedHashSet<>();
        for (String a : bbApplets) {
            if (!seen.add(a)) continue;
            if ("ls".equals(a)) {
                sb.append("ls()  { bb ls \"$@\"; }\n");
                sb.append("ll()  { bb ls -la \"$@\"; }\n");
            } else {
                sb.append(a).append("() { bb ").append(a).append(" \"$@\"; }\n");
            }
        }
        sb.append("\n");

        // ── Dynamic PREFIX/bin wrappers (re-run after pkg install) ────────
        // Java static list goes stale; shell scan always matches current $PREFIX/bin.
        // Skip busybox-covered names and invalid function identifiers.
        sb.append("_MSCODE_BB_SKIP=' ");
        for (String a : seen) {
            sb.append(a).append(' ');
        }
        sb.append("'\n");
        sb.append("mscode_wrap() {\n");
        sb.append("  [ -d \"$PREFIX/bin\" ] || return 0\n");
        sb.append("  _wc=0\n");
        sb.append("  for _f in \"$PREFIX\"/bin/*; do\n");
        sb.append("    [ -e \"$_f\" ] || continue\n");
        sb.append("    _n=${_f##*/}\n");
        sb.append("    # valid shell function name?\n");
        sb.append("    case \"$_n\" in\n");
        sb.append("      ''|*[!a-zA-Z0-9_]*|[0-9]*) continue ;;\n");
        sb.append("    esac\n");
        sb.append("    case \"$_MSCODE_BB_SKIP\" in\n");
        sb.append("      *\" $_n \"*) continue ;;\n");
        sb.append("    esac\n");
        sb.append("    case \"$_n\" in\n");
        sb.append("      elf|bb|pkg|mscode_wrap|export|exec|if|fi|then|else|while|do|done|case|esac|function|return|shift|cd|command) continue ;;\n");
        sb.append("    esac\n");
        // IMPORTANT: must be \$@ so eval keeps literal "$@" inside the function body.
        // Using plain $@ here expands at wrap-time (empty) and breaks python --version etc.
        sb.append("    eval \"$_n() { elf \\\"$_f\\\" \\\"\\$@\\\"; }\"\n");
        sb.append("    _wc=$((_wc+1))\n");
        sb.append("  done\n");
        sb.append("  return 0\n");
        sb.append("}\n");
        sb.append("mscode_wrap\n");
        sb.append("\n");

        // Write BASH_ENV file so bash scripts get the same wrappers
        sb.append("_mscode_write_bash_env() {\n");
        sb.append("  mkdir -p \"$PREFIX/etc\"\n");
        sb.append("  {\n");
        sb.append("    echo '# Auto-generated for bash scripts (neofetch, etc.)'\n");
        sb.append("    echo \"export PREFIX='$PREFIX'\"\n");
        sb.append("    echo \"export TERMUX_PREFIX='$PREFIX'\"\n");
        sb.append("    echo \"export BUSYBOX='$BUSYBOX'\"\n");
        sb.append("    echo \"export MSCODE_LINKER='$MSCODE_LINKER'\"\n");
        sb.append("    echo \"export LD_LIBRARY_PATH='$LD_LIBRARY_PATH'\"\n");
        sb.append("    echo \"export PATH='$PATH'\"\n");
        sb.append("    echo \"export TERMINFO='$TERMINFO'\"\n");
        sb.append("    echo \"export CURL_CA_BUNDLE='$CURL_CA_BUNDLE'\"\n");
        sb.append("    echo \"export SSL_CERT_FILE='$SSL_CERT_FILE'\"\n");
        sb.append("    echo \"export ANDROID_DATA=/data\"\n");
        sb.append("    echo \"export ANDROID_ROOT=/system\"\n");
        sb.append("    echo 'bb() { [ $# -lt 1 ] && return 1; local a=\"$1\"; shift; ( exec -a \"$a\" \"$BUSYBOX\" \"$@\" ); }'\n");
        // busybox applets as bash functions
        sb.append("    for a in ls cat cp mv rm mkdir grep find tar head tail wc uname clear chmod sed sort awk cut tr uniq basename dirname pwd date touch ln readlink stat which xargs tee ps kill id env seq true false test; do\n");
        sb.append("      echo \"$a() { bb $a \\\"\\$@\\\"; }\"\n");
        sb.append("    done\n");
        sb.append("    echo 'elf() { local b=\"$1\"; shift; [ -f \"$b\" ] || return 127; if [ -n \"$MSCODE_LINKER\" ]; then \"$MSCODE_LINKER\" \"$b\" \"$@\"; else \"$b\" \"$@\"; fi; }'\n");
        sb.append("    for _f in \"$PREFIX\"/bin/*; do\n");
        sb.append("      [ -e \"$_f\" ] || continue\n");
        sb.append("      _n=${_f##*/}\n");
        sb.append("      case \"$_n\" in ''|*[!a-zA-Z0-9_]*|[0-9]*) continue ;; esac\n");
        sb.append("      case \" $_MSCODE_BB_SKIP \" in *\" $_n \"*) continue ;; esac\n");
        sb.append("      echo \"$_n() { elf '$_f' \\\"\\$@\\\"; }\"\n");
        sb.append("    done\n");
        sb.append("  } > \"$PREFIX/etc/mscode_bash_env.sh\"\n");
        sb.append("}\n");
        sb.append("_mscode_write_bash_env 2>/dev/null\n");
        sb.append("\n");

        // ── pkg — real install from shell (curl + ar + tar via linker) ──
        sb.append("_pkg_repo='https://packages-cf.termux.dev/apt/termux-main'\n");
        sb.append("_pkg_cache=\"$HOME/../pkg-cache\"\n");
        sb.append("_pkg_arch() {\n");
        sb.append("  case \"$(bb uname -m 2>/dev/null)\" in\n");
        sb.append("    aarch64|arm64) echo aarch64 ;;\n");
        sb.append("    armv7*|armv8*|arm) echo arm ;;\n");
        sb.append("    x86_64|amd64) echo x86_64 ;;\n");
        sb.append("    i686|i386|x86) echo i686 ;;\n");
        sb.append("    *) echo aarch64 ;;\n");
        sb.append("  esac\n");
        sb.append("}\n");
        sb.append("\n");
        // Ensure Packages index
        sb.append("_pkg_ensure_index() {\n");
        sb.append("  mkdir -p \"$_pkg_cache\"\n");
        sb.append("  _arch=$(_pkg_arch)\n");
        sb.append("  _idx=\"$_pkg_cache/Packages\"\n");
        sb.append("  _need=1\n");
        sb.append("  if [ -f \"$_idx\" ]; then\n");
        sb.append("    _age=$(( $(date +%s) - $(bb stat -c %Y \"$_idx\" 2>/dev/null || echo 0) ))\n");
        sb.append("    [ \"$_age\" -lt 86400 ] 2>/dev/null && _need=0\n");
        sb.append("  fi\n");
        sb.append("  if [ \"$_need\" = 1 ]; then\n");
        sb.append("    echo \"[pkg] fetching index ($_arch)…\"\n");
        sb.append("    if [ -n \"$CURL_CA_BUNDLE\" ] && [ -f \"$CURL_CA_BUNDLE\" ]; then\n");
        sb.append("      curl -fsSL --cacert \"$CURL_CA_BUNDLE\" -o \"$_pkg_cache/Packages.gz\" \\\n");
        sb.append("        \"$_pkg_repo/dists/stable/main/binary-$_arch/Packages.gz\" || return 1\n");
        sb.append("    else\n");
        sb.append("      curl -fsSL -o \"$_pkg_cache/Packages.gz\" \\\n");
        sb.append("        \"$_pkg_repo/dists/stable/main/binary-$_arch/Packages.gz\" || return 1\n");
        sb.append("    fi\n");
        sb.append("    bb gunzip -c \"$_pkg_cache/Packages.gz\" > \"$_idx\" || return 1\n");
        sb.append("  fi\n");
        sb.append("}\n");
        sb.append("\n");
        // Resolve Filename: for a package name
        sb.append("_pkg_resolve() {\n");
        sb.append("  _want=\"$1\"\n");
        sb.append("  _pkg_ensure_index || return 1\n");
        sb.append("  _fn=\n");
        sb.append("  _cur=\n");
        sb.append("  while IFS= read -r _line || [ -n \"$_line\" ]; do\n");
        sb.append("    case \"$_line\" in\n");
        sb.append("      'Package: '*) _cur=${_line#Package: } ;;\n");
        sb.append("      'Filename: '*)\n");
        sb.append("        if [ \"$_cur\" = \"$_want\" ]; then _fn=${_line#Filename: }; fi\n");
        sb.append("        ;;\n");
        sb.append("      '') _cur= ;;\n");
        sb.append("    esac\n");
        sb.append("  done < \"$_pkg_cache/Packages\"\n");
        sb.append("  [ -n \"$_fn\" ] || return 1\n");
        sb.append("  echo \"$_fn\"\n");
        sb.append("}\n");
        sb.append("\n");

        // Extract .deb → $PREFIX
        sb.append("_pkg_extract_deb() {\n");
        sb.append("  _deb=\"$1\"; _name=\"$2\"\n");
        sb.append("  _work=\"$_pkg_cache/extract-$_name\"\n");
        sb.append("  rm -rf \"$_work\"; mkdir -p \"$_work\"\n");
        sb.append("  if ! ( cd \"$_work\" && bb ar x \"$_deb\" ); then\n");
        sb.append("    echo \"[pkg] ar failed — corrupt cache? re-downloading\"\n");
        sb.append("    rm -f \"$_deb\"\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  # detect truncated deb (ar short read leaves tiny/missing data.tar)\n");
        sb.append("  _has_data=0\n");
        sb.append("  for _f in \"$_work\"/data.tar*; do [ -f \"$_f\" ] && [ -s \"$_f\" ] && _has_data=1; done\n");
        sb.append("  if [ \"$_has_data\" = 0 ]; then\n");
        sb.append("    echo \"[pkg] missing data.tar — deleting bad cache\"\n");
        sb.append("    rm -f \"$_deb\"\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  _data=\n");
        sb.append("  for _f in \"$_work\"/data.tar*; do\n");
        sb.append("    [ -f \"$_f\" ] && _data=\"$_f\" && break\n");
        sb.append("  done\n");
        sb.append("  [ -n \"$_data\" ] || { echo \"[pkg] no data.tar in deb\" >&2; return 1; }\n");
        sb.append("  echo \"[pkg] extracting $(basename \"$_data\") → $PREFIX\"\n");
        // Termux debs contain: data/data/com.termux/files/usr/bin/...\n
        // Stage extract, then merge that tree into our $PREFIX.\n
        sb.append("  _stage=\"$_work/stage\"\n");
        sb.append("  mkdir -p \"$_stage\"\n");
        sb.append("  case \"$_data\" in\n");
        sb.append("    *.xz)\n");
        sb.append("      if [ -f \"$PREFIX/bin/xz\" ]; then\n");
        sb.append("        elf \"$PREFIX/bin/xz\" -dc \"$_data\" | bb tar -xf - -C \"$_stage\" || return 1\n");
        sb.append("      else\n");
        sb.append("        echo \"[pkg] need $PREFIX/bin/xz to extract data.tar.xz\" >&2; return 1\n");
        sb.append("      fi\n");
        sb.append("      ;;\n");
        sb.append("    *.gz|*.tgz)\n");
        sb.append("      bb tar -xzf \"$_data\" -C \"$_stage\" || return 1\n");
        sb.append("      ;;\n");
        sb.append("    *.zst)\n");
        sb.append("      if [ -f \"$PREFIX/bin/zstd\" ]; then\n");
        sb.append("        elf \"$PREFIX/bin/zstd\" -dc \"$_data\" | bb tar -xf - -C \"$_stage\" || return 1\n");
        sb.append("      else\n");
        sb.append("        echo \"[pkg] need $PREFIX/bin/zstd for data.tar.zst\" >&2; return 1\n");
        sb.append("      fi\n");
        sb.append("      ;;\n");
        sb.append("    *)\n");
        sb.append("      bb tar -xf \"$_data\" -C \"$_stage\" || return 1\n");
        sb.append("      ;;\n");
        sb.append("  esac\n");
        sb.append("  _src=\"\"\n");
        sb.append("  if [ -d \"$_stage/data/data/com.termux/files/usr\" ]; then\n");
        sb.append("    _src=\"$_stage/data/data/com.termux/files/usr\"\n");
        sb.append("  elif [ -d \"$_stage/usr\" ]; then\n");
        sb.append("    _src=\"$_stage/usr\"\n");
        sb.append("  elif [ -d \"$_stage/bin\" ] || [ -d \"$_stage/lib\" ] || [ -d \"$_stage/share\" ]; then\n");
        sb.append("    _src=\"$_stage\"\n");
        sb.append("  else\n");
        sb.append("    _src=$(bb find \"$_stage\" -type d -path '*/files/usr' 2>/dev/null | head -1)\n");
        sb.append("  fi\n");
        sb.append("  if [ -z \"$_src\" ] || [ ! -d \"$_src\" ]; then\n");
        sb.append("    echo \"[pkg] could not locate package files in archive\" >&2\n");
        sb.append("    bb find \"$_stage\" -maxdepth 8 2>/dev/null | head -30\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  echo \"[pkg] merging $_src → $PREFIX\"\n");
        // -a preserve, -f overwrite existing (re-install / shared libs)
        sb.append("  bb cp -af \"$_src\"/. \"$PREFIX\"/ || return 1\n");
        sb.append("  mkdir -p \"$PREFIX/var/lib/dpkg/info\"\n");
        sb.append("  echo \"# mscode\" > \"$PREFIX/var/lib/dpkg/info/$_name.list\"\n");
        sb.append("  rm -rf \"$_work\"\n");
        sb.append("}\n");
        sb.append("\n");
        // Parse Depends: from Packages index (simple, ignores versions/alternatives)
        sb.append("_pkg_depends() {\n");
        sb.append("  _want=\"$1\"\n");
        sb.append("  _pkg_ensure_index || return 0\n");
        sb.append("  _cur=; _deps=\n");
        sb.append("  while IFS= read -r _line || [ -n \"$_line\" ]; do\n");
        sb.append("    case \"$_line\" in\n");
        sb.append("      'Package: '*) _cur=${_line#Package: } ;;\n");
        sb.append("      'Depends: '*)\n");
        sb.append("        if [ \"$_cur\" = \"$_want\" ]; then _deps=${_line#Depends: }; fi\n");
        sb.append("        ;;\n");
        sb.append("      '') _cur= ;;\n");
        sb.append("    esac\n");
        sb.append("  done < \"$_pkg_cache/Packages\"\n");
        sb.append("  # split on commas; strip version constraints and |\n");
        sb.append("  echo \"$_deps\" | tr ',' '\\n' | while IFS= read -r _d; do\n");
        sb.append("    _d=$(echo \"$_d\" | sed 's/|.*//' | sed 's/(.*//' | sed 's/^ *//;s/ *$//')\n");
        sb.append("    [ -n \"$_d\" ] && echo \"$_d\"\n");
        sb.append("  done\n");
        sb.append("}\n");
        sb.append("\n");
        sb.append("_pkg_is_installed() {\n");
        sb.append("  [ -f \"$PREFIX/var/lib/dpkg/info/$1.list\" ]\n");
        sb.append("}\n");
        sb.append("\n");

        sb.append("_pkg_install_one() {\n");
        sb.append("  _p=\"$1\"\n");
        sb.append("  # depth guard for recursive deps\n");
        sb.append("  _pkg_depth=${_pkg_depth:-0}\n");
        sb.append("  if [ \"$_pkg_depth\" -gt 15 ]; then\n");
        sb.append("    echo \"[pkg] dependency depth exceeded at $_p\" >&2; return 1\n");
        sb.append("  fi\n");
        sb.append("  if _pkg_is_installed \"$_p\"; then\n");
        sb.append("    echo \"[pkg] already installed: $_p\"\n");
        sb.append("    return 0\n");
        sb.append("  fi\n");
        sb.append("  echo \"[pkg] resolving $_p…\"\n");
        sb.append("  _path=$(_pkg_resolve \"$_p\") || {\n");
        sb.append("    echo \"[pkg] package not found: $_p\" >&2; return 1\n");
        sb.append("  }\n");
        // install dependencies first
        sb.append("  _pkg_depth=$((_pkg_depth + 1))\n");
        sb.append("  for _dep in $(_pkg_depends \"$_p\"); do\n");
        sb.append("    case \"$_dep\" in\n");
        // skip virtual/boring deps
        sb.append("      ''|bash|coreutils|busybox|termux-am|termux-exec|dash|libandroid-support) ;;\n");
        sb.append("      *)\n");
        sb.append("        if ! _pkg_is_installed \"$_dep\"; then\n");
        sb.append("          echo \"[pkg] dependency: $_dep (for $_p)\"\n");
        sb.append("          _pkg_install_one \"$_dep\" || echo \"[pkg] warn: dep $_dep failed\"\n");
        sb.append("        fi\n");
        sb.append("        ;;\n");
        sb.append("    esac\n");
        sb.append("  done\n");
        sb.append("  _pkg_depth=$((_pkg_depth - 1))\n");
        sb.append("  _deb=\"$_pkg_cache/$(basename \"$_path\")\"\n");
        sb.append("  if [ ! -f \"$_deb\" ]; then\n");
        sb.append("    echo \"[pkg] downloading $_path\"\n");
        sb.append("    if [ -n \"$CURL_CA_BUNDLE\" ] && [ -f \"$CURL_CA_BUNDLE\" ]; then\n");
        sb.append("      curl -fsSL --cacert \"$CURL_CA_BUNDLE\" -o \"$_deb\" \"$_pkg_repo/$_path\" || return 1\n");
        sb.append("    else\n");
        sb.append("      curl -fsSL -o \"$_deb\" \"$_pkg_repo/$_path\" || return 1\n");
        sb.append("    fi\n");
        sb.append("  else\n");
        sb.append("    echo \"[pkg] cached $(basename \"$_deb\")\"\n");
        sb.append("  fi\n");
        sb.append("  _pkg_extract_deb \"$_deb\" \"$_p\" || return 1\n");
        sb.append("  # refresh command wrappers in THIS session\n");
        sb.append("  mscode_wrap 2>/dev/null\n");
        sb.append("  echo \"[pkg] ✓ $_p installed\"\n");
        sb.append("}\n");
        sb.append("\n");
        sb.append("pkg() {\n");
        sb.append("  case \"$1\" in\n");
        sb.append("    install|i)\n");
        sb.append("      shift\n");
        sb.append("      if [ $# -eq 0 ]; then\n");
        sb.append("        echo \"usage: pkg install <package>…\" >&2\n");
        sb.append("        return 1\n");
        sb.append("      fi\n");
        sb.append("      _ok=0\n");
        sb.append("      for _pkg in \"$@\"; do\n");
        sb.append("        _pkg_install_one \"$_pkg\" || _ok=1\n");
        sb.append("      done\n");
        sb.append("      return $_ok\n");
        sb.append("      ;;\n");
        sb.append("    list-installed|li)\n");
        sb.append("      if [ -d \"$PREFIX/var/lib/dpkg/info\" ]; then\n");
        sb.append("        ls \"$PREFIX/var/lib/dpkg/info\" 2>/dev/null | sed -n 's/\\.list$//p' | sort -u\n");
        sb.append("      else\n");
        sb.append("        echo \"[pkg] no packages installed yet\"\n");
        sb.append("      fi\n");
        sb.append("      ;;\n");
        sb.append("    search|s)\n");
        sb.append("      shift\n");
        sb.append("      _q=\"$1\"\n");
        sb.append("      if [ -z \"$_q\" ]; then echo \"usage: pkg search <name>\" >&2; return 1; fi\n");
        sb.append("      _pkg_ensure_index || return 1\n");
        sb.append("      grep -i \"^Package: .*$_q\" \"$_pkg_cache/Packages\" 2>/dev/null | sed 's/^Package: //' | sort -u | head -40\n");
        sb.append("      ;;\n");
        sb.append("    update|u|upgrade)\n");
        sb.append("      rm -f \"$_pkg_cache/Packages\" \"$_pkg_cache/Packages.gz\" 2>/dev/null\n");
        sb.append("      _pkg_ensure_index && echo \"[pkg] index updated\"\n");
        sb.append("      ;;\n");
        sb.append("    *)\n");
        sb.append("      echo \"pkg — Termux-style package manager (MS Code)\"\n");
        sb.append("      echo \"  pkg install <pkg>    Download & extract into \\$PREFIX\"\n");
        sb.append("      echo \"  pkg list-installed   List installed packages\"\n");
        sb.append("      echo \"  pkg search <query>   Search package names\"\n");
        sb.append("      echo \"  pkg update           Refresh package index\"\n");
        sb.append("      echo \"  elf <path> [args]    Run PREFIX binary via linker\"\n");
        sb.append("      echo \"PREFIX=$PREFIX  LINKER=$MSCODE_LINKER\"\n");
        sb.append("      ;;\n");
        sb.append("  esac\n");
        sb.append("}\n");
        sb.append("\n");

        // cd into project
        sb.append("if [ -d '").append(safeCwd).append("' ]; then\n");
        sb.append("  cd '").append(safeCwd).append("'\n");
        sb.append("else\n");
        sb.append("  cd '").append(safeHome).append("' 2>/dev/null || true\n");
        sb.append("fi\n");
        sb.append("\n");

        // banner
        sb.append("if [ -z \"$MSCODE_BANNER_SHOWN\" ]; then\n");
        sb.append("  export MSCODE_BANNER_SHOWN=1\n");
        sb.append("  echo \"[+] Opened: $PWD\"\n");
        if (bootOk) {
            sb.append("  echo \"[+] PREFIX=$PREFIX  linker=$MSCODE_LINKER\"\n");
            sb.append("  echo \"[+] bb ls / curl / elf $PREFIX/bin/curl / pkg\"\n");
        } else {
            sb.append("  echo \"[+] Native shell (bootstrap pending)  |  bb ls / bb --list\"\n");
        }
        sb.append("fi\n");

        File f = new File(outputPath);
        f.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(sb.toString().getBytes("UTF-8"));
        }
        //noinspection ResultOfMethodCallIgnored
        f.setReadable(true, false);
    }

    public void cleanup(String outputPath) {
        new File(outputPath).delete();
    }

    /** Valid mksh function name: [a-zA-Z_][a-zA-Z0-9_]* — also allow digits after start, plus + - . for some tools we skip. */
    private static boolean isValidShellName(String name) {
        if (name == null || name.isEmpty()) return false;
        // skip names with chars invalid in function identifiers
        if (name.contains("-") || name.contains(".") || name.contains("+")) return false;
        if (name.contains("[")) return false;
        char c0 = name.charAt(0);
        if (!(c0 == '_' || (c0 >= 'a' && c0 <= 'z') || (c0 >= 'A' && c0 <= 'Z'))) return false;
        for (int i = 1; i < name.length(); i++) {
            char c = name.charAt(i);
            if (!(c == '_' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
                    || (c >= '0' && c <= '9'))) return false;
        }
        // reserved / shell builtins we must not override badly
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

    private static boolean isSymlink(File f) {
        try {
            return !f.getCanonicalPath().equals(f.getAbsolutePath())
                || java.nio.file.Files.isSymbolicLink(f.toPath());
        } catch (Exception e) {
            return false;
        }
    }
}