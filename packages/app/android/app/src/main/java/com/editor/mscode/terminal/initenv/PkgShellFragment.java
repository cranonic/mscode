// package com.editor.mscode.terminal.initenv;

// /**
//  * Shell-side pkg() package manager functions embedded in mscode_env.sh.
//  * (curl + ar + tar via linker / toybox)
//  */
// public final class PkgShellFragment {
//     private PkgShellFragment() {}

//     public static void append(StringBuilder sb) {
//         sb.append("_pkg_repo='https://packages-cf.termux.dev/apt/termux-main'\n");
//         sb.append("_pkg_cache=\"$HOME/../pkg-cache\"\n");
//         sb.append("_pkg_arch() {\n");
//         sb.append("  case \"$(bb uname -m 2>/dev/null)\" in\n");
//         sb.append("    aarch64|arm64) echo aarch64 ;;\n");
//         sb.append("    armv7*|armv8*|arm) echo arm ;;\n");
//         sb.append("    x86_64|amd64) echo x86_64 ;;\n");
//         sb.append("    i686|i386|x86) echo i686 ;;\n");
//         sb.append("    *) echo aarch64 ;;\n");
//         sb.append("  esac\n");
//         sb.append("}\n");
//         sb.append("\n");
//         // Ensure Packages index
//         sb.append("_pkg_ensure_index() {\n");
//         sb.append("  mkdir -p \"$_pkg_cache\"\n");
//         sb.append("  _arch=$(_pkg_arch)\n");
//         sb.append("  _idx=\"$_pkg_cache/Packages\"\n");
//         sb.append("  _need=1\n");
//         sb.append("  if [ -f \"$_idx\" ]; then\n");
//         sb.append("    _age=$(( $(date +%s) - $(bb stat -c %Y \"$_idx\" 2>/dev/null || echo 0) ))\n");
//         sb.append("    [ \"$_age\" -lt 86400 ] 2>/dev/null && _need=0\n");
//         sb.append("  fi\n");
//         sb.append("  if [ \"$_need\" = 1 ]; then\n");
//         sb.append("    echo \"[pkg] fetching index ($_arch)…\" >&2\n");
//         sb.append("    _curl_ca=\n");
//         sb.append("    [ -n \"$CURL_CA_BUNDLE\" ] && _curl_ca=\"--cacert $CURL_CA_BUNDLE\"\n");
//         sb.append("    curl -fsSL $_curl_ca -o \"$_pkg_cache/Packages.gz\" \\\n");
//         sb.append("      \"$_pkg_repo/dists/stable/main/binary-$_arch/Packages.gz\" || return 1\n");
//         sb.append("    bb gunzip -c \"$_pkg_cache/Packages.gz\" > \"$_idx\" || return 1\n");
//         sb.append("  fi\n");
//         sb.append("}\n");
//         sb.append("\n");
//         // Resolve Filename: for a package name
//         sb.append("_pkg_resolve() {\n");
//         sb.append("  _want=\"$1\"\n");
//         sb.append("  _pkg_ensure_index || return 1\n");
//         sb.append("  _fn=\n");
//         sb.append("  _cur=\n");
//         sb.append("  while IFS= read -r _line || [ -n \"$_line\" ]; do\n");
//         sb.append("    case \"$_line\" in\n");
//         sb.append("      'Package: '*) _cur=${_line#Package: } ;;\n");
//         sb.append("      'Filename: '*)\n");
//         sb.append("        if [ \"$_cur\" = \"$_want\" ]; then _fn=${_line#Filename: }; fi\n");
//         sb.append("        ;;\n");
//         sb.append("      '') _cur= ;;\n");
//         sb.append("    esac\n");
//         sb.append("  done < \"$_pkg_cache/Packages\"\n");
//         sb.append("  [ -n \"$_fn\" ] || return 1\n");
//         sb.append("  echo \"$_fn\"\n");
//         sb.append("}\n");
//         sb.append("\n");
//         // Extract .deb → $PREFIX
//         // toybox has NO `ar` applet — never use `bb ar`.
//         // Order: $PREFIX/bin/ar (elf) → pure shell System V ar (deb-safe).
//         //
//         // CRITICAL: never store the 60-byte ar header in a shell var via $(dd…):
//         // command substitution strips trailing newlines, so the header becomes 59
//         // bytes, size/name fields shift, and data.tar* is never written →
//         // "[pkg] missing data.tar — deleting bad cache".
//         sb.append("_pkg_ar_x() {\n");
//         sb.append("  # Extract ar members of $1 into cwd. No toybox ar.\n");
//         sb.append("  _ar_file=\"$1\"\n");
//         sb.append("  if [ -f \"$PREFIX/bin/ar\" ]; then\n");
//         sb.append("    elf \"$PREFIX/bin/ar\" x \"$_ar_file\" && return 0\n");
//         sb.append("  fi\n");
//         sb.append("  # Magic is exactly 7 bytes \"!<arch>\" + 0x0A. Read 7 bytes only so\n");
//         sb.append("  # command-substitution cannot strip a trailing newline and break the match.\n");
//         sb.append("  _magic=$(dd if=\"$_ar_file\" bs=1 count=7 2>/dev/null)\n");
//         sb.append("  if [ \"$_magic\" != '!<arch>' ]; then\n");
//         sb.append("    _asz=$(bb stat -c %s \"$_ar_file\" 2>/dev/null || echo 0)\n");
//         sb.append("    echo \"[pkg] not an ar archive: $_ar_file (size=$_asz magic=[$_magic])\" >&2\n");
//         sb.append("    dd if=\"$_ar_file\" bs=1 count=80 2>/dev/null | cat -v >&2\n");
//         sb.append("    echo >&2\n");
//         sb.append("    return 1\n");
//         sb.append("  fi\n");
//         sb.append("  # Pure System V ar reader — headers in temp files (no newline strip)\n");
//         sb.append("  _hdrf=\".ar_hdr_$$\"; _namef=\".ar_name_$$\"; _szf=\".ar_sz_$$\"\n");
//         sb.append("  _off=8\n");
//         sb.append("  _total=$(bb stat -c %s \"$_ar_file\" 2>/dev/null || wc -c < \"$_ar_file\" | tr -d ' ')\n");
//         sb.append("  case \"$_total\" in ''|*[!0-9]*) rm -f \"$_hdrf\"; return 1 ;; esac\n");
//         sb.append("  [ \"$_total\" -gt 68 ] || { rm -f \"$_hdrf\"; return 1; }\n");
//         sb.append("  while [ \"$_off\" -lt \"$_total\" ]; do\n");
//         sb.append("    # 60-byte header → file (preserves trailing 0x60 0x0A)\n");
//         sb.append("    dd if=\"$_ar_file\" of=\"$_hdrf\" bs=1 skip=\"$_off\" count=60 2>/dev/null || break\n");
//         sb.append("    _hlen=$(bb stat -c %s \"$_hdrf\" 2>/dev/null || wc -c < \"$_hdrf\" | tr -d ' ')\n");
//         sb.append("    [ \"$_hlen\" = 60 ] || break\n");
//         sb.append("    # name: bytes 0-15, size: bytes 48-57 (decimal ASCII)\n");
//         sb.append("    dd if=\"$_hdrf\" of=\"$_namef\" bs=1 count=16 2>/dev/null\n");
//         sb.append("    dd if=\"$_hdrf\" of=\"$_szf\" bs=1 skip=48 count=10 2>/dev/null\n");
//         sb.append("    _name=$(cat \"$_namef\"; printf x); _name=${_name%x}\n");
//         sb.append("    _name=$(printf '%s' \"$_name\" | sed 's/[[:space:]]*$//;s/\\/$//')\n");
//         sb.append("    _sz=$(cat \"$_szf\"; printf x); _sz=${_sz%x}\n");
//         sb.append("    _sz=$(printf '%s' \"$_sz\" | sed 's/[[:space:]]//g')\n");
//         sb.append("    _off=$((_off + 60))\n");
//         sb.append("    case \"$_name\" in '' ) break ;; esac\n");
//         sb.append("    case \"$_sz\" in ''|*[!0-9]*) break ;; esac\n");
//         sb.append("    # GNU string table / long-name index — skip body, keep scanning\n");
//         sb.append("    case \"$_name\" in\n");
//         sb.append("      //|/)\n");
//         sb.append("        _off=$((_off + _sz))\n");
//         sb.append("        [ $((_sz & 1)) -eq 1 ] && _off=$((_off + 1))\n");
//         sb.append("        continue\n");
//         sb.append("        ;;\n");
//         sb.append("    esac\n");
//         sb.append("    [ \"$_sz\" -eq 0 ] && continue\n");
//         // toybox dd: prefer skip_bytes/count_bytes (fast); fallback bs=1 (correct, slower)
//         sb.append("    if dd if=\"$_ar_file\" of=\"$_name\" bs=1M iflag=skip_bytes,count_bytes skip=\"$_off\" count=\"$_sz\" 2>/dev/null; then\n");
//         sb.append("      :\n");
//         sb.append("    else\n");
//         sb.append("      dd if=\"$_ar_file\" of=\"$_name\" bs=1 skip=\"$_off\" count=\"$_sz\" 2>/dev/null || return 1\n");
//         sb.append("    fi\n");
//         sb.append("    _got=$(bb stat -c %s \"$_name\" 2>/dev/null || wc -c < \"$_name\" | tr -d ' ')\n");
//         sb.append("    [ \"$_got\" = \"$_sz\" ] || { echo \"[pkg] short write $_name ($_got/$_sz)\" >&2; return 1; }\n");
//         sb.append("    _off=$((_off + _sz))\n");
//         sb.append("    [ $((_sz & 1)) -eq 1 ] && _off=$((_off + 1))\n");
//         sb.append("  done\n");
//         sb.append("  rm -f \"$_hdrf\" \"$_namef\" \"$_szf\"\n");
//         sb.append("  return 0\n");
//         sb.append("}\n");
//         sb.append("\n");
//         sb.append("_pkg_extract_deb() {\n");
//         sb.append("  _deb=\"$1\"; _name=\"$2\"\n");
//         sb.append("  _work=\"$_pkg_cache/extract-$_name\"\n");
//         sb.append("  rm -rf \"$_work\"; mkdir -p \"$_work\"\n");
//         sb.append("  # reject tiny/HTML downloads before ar\n");
//         sb.append("  _debsz=$(bb stat -c %s \"$_deb\" 2>/dev/null || wc -c < \"$_deb\" | tr -d ' ')\n");
//         sb.append("  if [ -z \"$_debsz\" ] || [ \"$_debsz\" -lt 64 ]; then\n");
//         sb.append("    echo \"[pkg] deb too small ($_debsz bytes) — bad download\" >&2\n");
//         sb.append("    rm -f \"$_deb\"; return 1\n");
//         sb.append("  fi\n");
//         sb.append("  if ! ( cd \"$_work\" && _pkg_ar_x \"$_deb\" ); then\n");
//         sb.append("    echo \"[pkg] ar extract failed for $_name\" >&2\n");
//         sb.append("    ls -la \"$_work\" 2>/dev/null | head -20 >&2\n");
//         sb.append("    return 1\n");
//         sb.append("  fi\n");
//         sb.append("  # detect truncated deb (short read leaves tiny/missing data.tar)\n");
//         sb.append("  _has_data=0\n");
//         sb.append("  for _f in \"$_work\"/data.tar*; do [ -f \"$_f\" ] && [ -s \"$_f\" ] && _has_data=1; done\n");
//         sb.append("  if [ \"$_has_data\" = 0 ]; then\n");
//         sb.append("    echo \"[pkg] missing data.tar — ar members were:\" >&2\n");
//         sb.append("    ls -la \"$_work\" 2>/dev/null | head -20 >&2\n");
//         sb.append("    echo \"[pkg] deleting bad cache\" >&2\n");
//         sb.append("    rm -f \"$_deb\"\n");
//         sb.append("    return 1\n");
//         sb.append("  fi\n");
//         sb.append("  _data=\n");
//         sb.append("  for _f in \"$_work\"/data.tar*; do\n");
//         sb.append("    [ -f \"$_f\" ] && _data=\"$_f\" && break\n");
//         sb.append("  done\n");
//         sb.append("  [ -n \"$_data\" ] || { echo \"[pkg] no data.tar in deb\" >&2; return 1; }\n");
//         sb.append("  echo \"[pkg] extracting $(basename \"$_data\") → $PREFIX\" >&2\n");
//         // Termux debs contain: data/data/com.termux/files/usr/bin/...
//         // Stage extract, then merge that tree into our $PREFIX.
//         sb.append("  _stage=\"$_work/stage\"\n");
//         sb.append("  mkdir -p \"$_stage\"\n");
//         sb.append("  case \"$_data\" in\n");
//         sb.append("    *.xz)\n");
//         sb.append("      if [ -f \"$PREFIX/bin/xz\" ]; then\n");
//         sb.append("        elf \"$PREFIX/bin/xz\" -dc \"$_data\" | bb tar -xf - -C \"$_stage\" || return 1\n");
//         sb.append("      else\n");
//         sb.append("        echo \"[pkg] need $PREFIX/bin/xz to extract data.tar.xz — try: pkg install xz-utils\" >&2; return 1\n");
//         sb.append("      fi\n");
//         sb.append("      ;;\n");
//         sb.append("    *.gz|*.tgz)\n");
//         sb.append("      bb tar -xzf \"$_data\" -C \"$_stage\" || return 1\n");
//         sb.append("      ;;\n");
//         sb.append("    *.zst)\n");
//         sb.append("      if [ -f \"$PREFIX/bin/zstd\" ]; then\n");
//         sb.append("        elf \"$PREFIX/bin/zstd\" -dc \"$_data\" | bb tar -xf - -C \"$_stage\" || return 1\n");
//         sb.append("      else\n");
//         sb.append("        echo \"[pkg] need $PREFIX/bin/zstd for data.tar.zst — try: pkg install zstd\" >&2; return 1\n");
//         sb.append("      fi\n");
//         sb.append("      ;;\n");
//         sb.append("    *)\n");
//         sb.append("      bb tar -xf \"$_data\" -C \"$_stage\" || return 1\n");
//         sb.append("      ;;\n");
//         sb.append("  esac\n");
//         sb.append("  _src=\"\"\n");
//         sb.append("  if [ -d \"$_stage/data/data/com.termux/files/usr\" ]; then\n");
//         sb.append("    _src=\"$_stage/data/data/com.termux/files/usr\"\n");
//         sb.append("  elif [ -d \"$_stage/usr\" ]; then\n");
//         sb.append("    _src=\"$_stage/usr\"\n");
//         sb.append("  elif [ -d \"$_stage/bin\" ] || [ -d \"$_stage/lib\" ] || [ -d \"$_stage/share\" ]; then\n");
//         sb.append("    _src=\"$_stage\"\n");
//         sb.append("  else\n");
//         sb.append("    _src=$(bb find \"$_stage\" -type d -path '*/files/usr' 2>/dev/null | head -1)\n");
//         sb.append("  fi\n");
//         sb.append("  if [ -z \"$_src\" ] || [ ! -d \"$_src\" ]; then\n");
//         sb.append("    echo \"[pkg] could not locate package files in archive\" >&2\n");
//         sb.append("    bb find \"$_stage\" -maxdepth 8 2>/dev/null | head -30\n");
//         sb.append("    return 1\n");
//         sb.append("  fi\n");
//         sb.append("  echo \"[pkg] merging $_src → $PREFIX\" >&2\n");
//         // -a preserve, -f overwrite existing (re-install / shared libs)
//         sb.append("  bb cp -af \"$_src\"/. \"$PREFIX\"/ || return 1\n");
//         sb.append("  mkdir -p \"$PREFIX/var/lib/dpkg/info\"\n");
//         sb.append("  echo \"# mscode\" > \"$PREFIX/var/lib/dpkg/info/$_name.list\"\n");
//         sb.append("  rm -rf \"$_work\"\n");
//         sb.append("}\n");
//         sb.append("\n");

//         // Parse Depends: from Packages index (simple, ignores versions/alternatives)
//         sb.append("_pkg_depends() {\n");
//         sb.append("  _want=\"$1\"\n");
//         sb.append("  _pkg_ensure_index || return 0\n");
//         sb.append("  _cur=; _deps=\n");
//         sb.append("  while IFS= read -r _line || [ -n \"$_line\" ]; do\n");
//         sb.append("    case \"$_line\" in\n");
//         sb.append("      'Package: '*) _cur=${_line#Package: } ;;\n");
//         sb.append("      'Depends: '*)\n");
//         sb.append("        if [ \"$_cur\" = \"$_want\" ]; then _deps=${_line#Depends: }; fi\n");
//         sb.append("        ;;\n");
//         sb.append("      '') _cur= ;;\n");
//         sb.append("    esac\n");
//         sb.append("  done < \"$_pkg_cache/Packages\"\n");
//         sb.append("  # split on commas; strip version constraints and |\n");
//         sb.append("  echo \"$_deps\" | tr ',' '\\n' | while IFS= read -r _d; do\n");
//         sb.append("    _d=$(echo \"$_d\" | sed 's/|.*//' | sed 's/(.*//' | sed 's/^ *//;s/ *$//')\n");
//         sb.append("    [ -n \"$_d\" ] && echo \"$_d\"\n");
//         sb.append("  done\n");
//         sb.append("}\n");
//         sb.append("\n");
//         sb.append("_pkg_is_installed() {\n");
//         sb.append("  [ -f \"$PREFIX/var/lib/dpkg/info/$1.list\" ]\n");
//         sb.append("}\n");
//         sb.append("\n");
//         sb.append("_pkg_install_one() {\n");
//         sb.append("  _p=\"$1\"\n");
//         sb.append("  # depth guard for recursive deps\n");
//         sb.append("  _pkg_depth=${_pkg_depth:-0}\n");
//         sb.append("  if [ \"$_pkg_depth\" -gt 15 ]; then\n");
//         sb.append("    echo \"[pkg] dependency depth exceeded at $_p\" >&2; return 1\n");
//         sb.append("  fi\n");
//         sb.append("  if _pkg_is_installed \"$_p\"; then\n");
//         sb.append("    echo \"[pkg] already installed: $_p\" >&2\n");
//         sb.append("    return 0\n");
//         sb.append("  fi\n");
//         sb.append("  echo \"[pkg] resolving $_p…\" >&2\n");
//         // Only the Filename path may go to stdout from _pkg_resolve (status is >&2).
//         // tail -1 guards against any accidental noise in the capture.
//         sb.append("  _path=$(_pkg_resolve \"$_p\" | tail -n 1 | tr -d '\\r') || {\n");
//         sb.append("    echo \"[pkg] package not found: $_p\" >&2; return 1\n");
//         sb.append("  }\n");
//         sb.append("  # sanitize: must look like pool/.../*.deb (no status text mixed in)\n");
//         sb.append("  case \"$_path\" in\n");
//         sb.append("    pool/*.deb|pool/*/*.deb|pool/*/*/*.deb|pool/*/*/*/*.deb|pool/*/*/*/*/*.deb) ;;\n");
//         sb.append("    *) echo \"[pkg] bad path from index: [$_path]\" >&2; return 1 ;;\n");
//         sb.append("  esac\n");
//         // install dependencies first
//         sb.append("  _pkg_depth=$((_pkg_depth + 1))\n");
//         sb.append("  for _dep in $(_pkg_depends \"$_p\"); do\n");
//         sb.append("    case \"$_dep\" in\n");
//         // skip virtual/boring deps
//         sb.append("      ''|bash|coreutils|toybox|termux-am|termux-exec|dash|libandroid-support) ;;\n");
//         sb.append("      *)\n");
//         sb.append("        if ! _pkg_is_installed \"$_dep\"; then\n");
//         sb.append("          echo \"[pkg] dependency: $_dep (for $_p)\" >&2\n");
//         sb.append("          _pkg_install_one \"$_dep\" || { echo \"[pkg] dep failed: $_dep\" >&2; return 1; }\n");
//         sb.append("        fi\n");
//         sb.append("        ;;\n");
//         sb.append("    esac\n");
//         sb.append("  done\n");
//         sb.append("  _pkg_depth=$((_pkg_depth - 1))\n");
//         sb.append("  _deb=\"$_pkg_cache/$(basename \"$_path\")\"\n");
//         sb.append("  if [ ! -f \"$_deb\" ]; then\n");
//         sb.append("    echo \"[pkg] downloading $_path\" >&2\n");
//         sb.append("    rm -f \"$_deb\"\n");
//         sb.append("    _url=\"$_pkg_repo/$_path\"\n");
//         sb.append("    _dl_ok=0\n");
//         sb.append("    if [ -n \"$CURL_CA_BUNDLE\" ] && [ -f \"$CURL_CA_BUNDLE\" ]; then\n");
//         sb.append("      curl -fsSL --cacert \"$CURL_CA_BUNDLE\" -o \"$_deb\" \"$_url\" && _dl_ok=1\n");
//         sb.append("    fi\n");
//         sb.append("    if [ \"$_dl_ok\" = 0 ]; then\n");
//         sb.append("      curl -fsSL -o \"$_deb\" \"$_url\" && _dl_ok=1\n");
//         sb.append("    fi\n");
//         sb.append("    if [ \"$_dl_ok\" = 0 ]; then\n");
//         sb.append("      echo \"[pkg] download failed: $_url\" >&2; rm -f \"$_deb\"; return 1\n");
//         sb.append("    fi\n");
//         sb.append("  else\n");
//         sb.append("    echo \"[pkg] cached $(basename \"$_deb\")\" >&2\n");
//         sb.append("  fi\n");
//         // Verify download is a real .deb before extract (catch HTML/empty/SSL garbage)
//         sb.append("  _debsz=$(bb stat -c %s \"$_deb\" 2>/dev/null || wc -c < \"$_deb\" | tr -d ' ')\n");
//         sb.append("  _debmag=$(dd if=\"$_deb\" bs=1 count=7 2>/dev/null)\n");
//         sb.append("  if [ -z \"$_debsz\" ] || [ \"$_debsz\" -lt 64 ] || [ \"$_debmag\" != '!<arch>' ]; then\n");
//         sb.append("    echo \"[pkg] bad download: size=$_debsz magic=[$_debmag] url=$_pkg_repo/$_path\" >&2\n");
//         sb.append("    dd if=\"$_deb\" bs=1 count=120 2>/dev/null | cat -v >&2; echo >&2\n");
//         sb.append("    rm -f \"$_deb\"; return 1\n");
//         sb.append("  fi\n");
//         sb.append("  echo \"[pkg] deb ok ($_debsz bytes)\" >&2\n");
//         sb.append("  _pkg_extract_deb \"$_deb\" \"$_p\" || return 1\n");
//         sb.append("  # refresh command wrappers in THIS session\n");
//         sb.append("  mscode_wrap 2>/dev/null\n");
//         sb.append("  echo \"[pkg] ✓ $_p installed\" >&2\n");
//         sb.append("}\n");
//         sb.append("\n");
//         sb.append("pkg() {\n");
//         sb.append("  case \"$1\" in\n");
//         sb.append("    install|i)\n");
//         sb.append("      shift\n");
//         sb.append("      if [ $# -eq 0 ]; then\n");
//         sb.append("        echo \"usage: pkg install <package>…\" >&2\n");
//         sb.append("        return 1\n");
//         sb.append("      fi\n");
//         sb.append("      _ok=0\n");
//         sb.append("      for _pkg in \"$@\"; do\n");
//         sb.append("        _pkg_install_one \"$_pkg\" || _ok=1\n");
//         sb.append("      done\n");
//         sb.append("      return $_ok\n");
//         sb.append("      ;;\n");
//         sb.append("    list-installed|li)\n");
//         sb.append("      if [ -d \"$PREFIX/var/lib/dpkg/info\" ]; then\n");
//         sb.append("        ls \"$PREFIX/var/lib/dpkg/info\" 2>/dev/null | sed -n 's/\\.list$//p' | sort -u\n");
//         sb.append("      else\n");
//         sb.append("        echo \"[pkg] no packages installed yet\"\n");
//         sb.append("      fi\n");
//         sb.append("      ;;\n");
//         sb.append("    search|s)\n");
//         sb.append("      shift\n");
//         sb.append("      _q=\"$1\"\n");
//         sb.append("      if [ -z \"$_q\" ]; then echo \"usage: pkg search <name>\" >&2; return 1; fi\n");
//         sb.append("      _pkg_ensure_index || return 1\n");
//         sb.append("      grep -i \"^Package: .*$_q\" \"$_pkg_cache/Packages\" 2>/dev/null | sed 's/^Package: //' | sort -u | head -40\n");
//         sb.append("      ;;\n");
//         sb.append("    update|u|upgrade)\n");
//         sb.append("      rm -f \"$_pkg_cache/Packages\" \"$_pkg_cache/Packages.gz\" 2>/dev/null\n");
//         sb.append("      _pkg_ensure_index && echo \"[pkg] index updated\" >&2\n");
//         sb.append("      ;;\n");
//         sb.append("    *)\n");
//         sb.append("      echo \"pkg — Termux-style package manager (MS Code)\"\n");
//         sb.append("      echo \"  pkg install <pkg>    Download & extract into \\$PREFIX\"\n");
//         sb.append("      echo \"  pkg list-installed   List installed packages\"\n");
//         sb.append("      echo \"  pkg search <query>   Search package names\"\n");
//         sb.append("      echo \"  pkg update           Refresh package index\"\n");
//         sb.append("      echo \"  elf <path> [args]    Run PREFIX binary via linker\"\n");
//         sb.append("      echo \"PREFIX=$PREFIX  LINKER=$MSCODE_LINKER\"\n");
//         sb.append("      ;;\n");
//         sb.append("  esac\n");
//         sb.append("}\n");
//         sb.append("\n");
//     }
// }



package com.editor.mscode.terminal.initenv;

/**
 * Shell-side pkg() package manager functions embedded in mscode_env.sh.
 * (curl + ar + tar via linker / toybox)
 *
 * ─── FIX (variable clobbering) ─────────────────────────────────────────────
 * _pkg_install_one() recurses into itself for every dependency. Its working
 * variables (_p, _path, _deb, _dep, ...) were previously NOT declared
 * `local`, so they lived in the shell's global scope. Any nested recursive
 * call silently overwrote the caller's copies. Once the recursion unwound,
 * the OUTER call's _p/_path/_deb had been left pointing at whatever was the
 * LAST processed dependency — so the originally requested package (e.g.
 * "clang", "node") was never actually downloaded/extracted; instead its
 * last dependency got redundantly re-extracted and a misleading
 * "[pkg] ✓ <lastdep> installed" line was printed. All working vars in the
 * recursive/nested functions below are now `local`, and _pkg_depth is
 * correctly decremented on early-return-on-failure and reset per top-level
 * `pkg install` invocation.
 */
public final class PkgShellFragment {
    private PkgShellFragment() {}

    public static void append(StringBuilder sb) {
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
        sb.append("  local _arch _idx _need _age _curl_ca\n");
        sb.append("  mkdir -p \"$_pkg_cache\"\n");
        sb.append("  _arch=$(_pkg_arch)\n");
        sb.append("  _idx=\"$_pkg_cache/Packages\"\n");
        sb.append("  _need=1\n");
        sb.append("  if [ -f \"$_idx\" ]; then\n");
        sb.append("    _age=$(( $(date +%s) - $(bb stat -c %Y \"$_idx\" 2>/dev/null || echo 0) ))\n");
        sb.append("    [ \"$_age\" -lt 86400 ] 2>/dev/null && _need=0\n");
        sb.append("  fi\n");
        sb.append("  if [ \"$_need\" = 1 ]; then\n");
        sb.append("    echo \"[pkg] fetching index ($_arch)…\" >&2\n");
        sb.append("    _curl_ca=\n");
        sb.append("    [ -n \"$CURL_CA_BUNDLE\" ] && _curl_ca=\"--cacert $CURL_CA_BUNDLE\"\n");
        sb.append("    curl -fsSL $_curl_ca -o \"$_pkg_cache/Packages.gz\" \\\n");
        sb.append("      \"$_pkg_repo/dists/stable/main/binary-$_arch/Packages.gz\" || return 1\n");
        sb.append("    bb gunzip -c \"$_pkg_cache/Packages.gz\" > \"$_idx\" || return 1\n");
        sb.append("  fi\n");
        sb.append("}\n");
        sb.append("\n");
        // Resolve Filename: for a package name
        sb.append("_pkg_resolve() {\n");
        sb.append("  local _want _fn _cur _line\n");
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
        // toybox has NO `ar` applet — never use `bb ar`.
        // Order: $PREFIX/bin/ar (elf) → pure shell System V ar (deb-safe).
        //
        // CRITICAL: never store the 60-byte ar header in a shell var via $(dd…):
        // command substitution strips trailing newlines, so the header becomes 59
        // bytes, size/name fields shift, and data.tar* is never written →
        // "[pkg] missing data.tar — deleting bad cache".
        sb.append("_pkg_ar_x() {\n");
        sb.append("  local _ar_file _magic _asz _hdrf _namef _szf _off _total _hlen _name _sz _got\n");
        sb.append("  # Extract ar members of $1 into cwd. No toybox ar.\n");
        sb.append("  _ar_file=\"$1\"\n");
        sb.append("  if [ -f \"$PREFIX/bin/ar\" ]; then\n");
        sb.append("    elf \"$PREFIX/bin/ar\" x \"$_ar_file\" && return 0\n");
        sb.append("  fi\n");
        sb.append("  # Magic is exactly 7 bytes \"!<arch>\" + 0x0A. Read 7 bytes only so\n");
        sb.append("  # command-substitution cannot strip a trailing newline and break the match.\n");
        sb.append("  _magic=$(dd if=\"$_ar_file\" bs=1 count=7 2>/dev/null)\n");
        sb.append("  if [ \"$_magic\" != '!<arch>' ]; then\n");
        sb.append("    _asz=$(bb stat -c %s \"$_ar_file\" 2>/dev/null || echo 0)\n");
        sb.append("    echo \"[pkg] not an ar archive: $_ar_file (size=$_asz magic=[$_magic])\" >&2\n");
        sb.append("    dd if=\"$_ar_file\" bs=1 count=80 2>/dev/null | cat -v >&2\n");
        sb.append("    echo >&2\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  # Pure System V ar reader — headers in temp files (no newline strip)\n");
        sb.append("  _hdrf=\".ar_hdr_$$\"; _namef=\".ar_name_$$\"; _szf=\".ar_sz_$$\"\n");
        sb.append("  _off=8\n");
        sb.append("  _total=$(bb stat -c %s \"$_ar_file\" 2>/dev/null || wc -c < \"$_ar_file\" | tr -d ' ')\n");
        sb.append("  case \"$_total\" in ''|*[!0-9]*) rm -f \"$_hdrf\"; return 1 ;; esac\n");
        sb.append("  [ \"$_total\" -gt 68 ] || { rm -f \"$_hdrf\"; return 1; }\n");
        sb.append("  while [ \"$_off\" -lt \"$_total\" ]; do\n");
        sb.append("    # 60-byte header → file (preserves trailing 0x60 0x0A)\n");
        sb.append("    dd if=\"$_ar_file\" of=\"$_hdrf\" bs=1 skip=\"$_off\" count=60 2>/dev/null || break\n");
        sb.append("    _hlen=$(bb stat -c %s \"$_hdrf\" 2>/dev/null || wc -c < \"$_hdrf\" | tr -d ' ')\n");
        sb.append("    [ \"$_hlen\" = 60 ] || break\n");
        sb.append("    # name: bytes 0-15, size: bytes 48-57 (decimal ASCII)\n");
        sb.append("    dd if=\"$_hdrf\" of=\"$_namef\" bs=1 count=16 2>/dev/null\n");
        sb.append("    dd if=\"$_hdrf\" of=\"$_szf\" bs=1 skip=48 count=10 2>/dev/null\n");
        sb.append("    _name=$(cat \"$_namef\"; printf x); _name=${_name%x}\n");
        sb.append("    _name=$(printf '%s' \"$_name\" | sed 's/[[:space:]]*$//;s/\\/$//')\n");
        sb.append("    _sz=$(cat \"$_szf\"; printf x); _sz=${_sz%x}\n");
        sb.append("    _sz=$(printf '%s' \"$_sz\" | sed 's/[[:space:]]//g')\n");
        sb.append("    _off=$((_off + 60))\n");
        sb.append("    case \"$_name\" in '' ) break ;; esac\n");
        sb.append("    case \"$_sz\" in ''|*[!0-9]*) break ;; esac\n");
        sb.append("    # GNU string table / long-name index — skip body, keep scanning\n");
        sb.append("    case \"$_name\" in\n");
        sb.append("      //|/)\n");
        sb.append("        _off=$((_off + _sz))\n");
        sb.append("        [ $((_sz & 1)) -eq 1 ] && _off=$((_off + 1))\n");
        sb.append("        continue\n");
        sb.append("        ;;\n");
        sb.append("    esac\n");
        sb.append("    [ \"$_sz\" -eq 0 ] && continue\n");
        // toybox dd: prefer skip_bytes/count_bytes (fast); fallback bs=1 (correct, slower)
        sb.append("    if dd if=\"$_ar_file\" of=\"$_name\" bs=1M iflag=skip_bytes,count_bytes skip=\"$_off\" count=\"$_sz\" 2>/dev/null; then\n");
        sb.append("      :\n");
        sb.append("    else\n");
        sb.append("      dd if=\"$_ar_file\" of=\"$_name\" bs=1 skip=\"$_off\" count=\"$_sz\" 2>/dev/null || return 1\n");
        sb.append("    fi\n");
        sb.append("    _got=$(bb stat -c %s \"$_name\" 2>/dev/null || wc -c < \"$_name\" | tr -d ' ')\n");
        sb.append("    [ \"$_got\" = \"$_sz\" ] || { echo \"[pkg] short write $_name ($_got/$_sz)\" >&2; return 1; }\n");
        sb.append("    _off=$((_off + _sz))\n");
        sb.append("    [ $((_sz & 1)) -eq 1 ] && _off=$((_off + 1))\n");
        sb.append("  done\n");
        sb.append("  rm -f \"$_hdrf\" \"$_namef\" \"$_szf\"\n");
        sb.append("  return 0\n");
        sb.append("}\n");
        sb.append("\n");
        sb.append("_pkg_extract_deb() {\n");
        sb.append("  local _deb _name _work _debsz _has_data _f _data _stage _src\n");
        sb.append("  _deb=\"$1\"; _name=\"$2\"\n");
        sb.append("  _work=\"$_pkg_cache/extract-$_name\"\n");
        sb.append("  rm -rf \"$_work\"; mkdir -p \"$_work\"\n");
        sb.append("  # reject tiny/HTML downloads before ar\n");
        sb.append("  _debsz=$(bb stat -c %s \"$_deb\" 2>/dev/null || wc -c < \"$_deb\" | tr -d ' ')\n");
        sb.append("  if [ -z \"$_debsz\" ] || [ \"$_debsz\" -lt 64 ]; then\n");
        sb.append("    echo \"[pkg] deb too small ($_debsz bytes) — bad download\" >&2\n");
        sb.append("    rm -f \"$_deb\"; return 1\n");
        sb.append("  fi\n");
        sb.append("  if ! ( cd \"$_work\" && _pkg_ar_x \"$_deb\" ); then\n");
        sb.append("    echo \"[pkg] ar extract failed for $_name\" >&2\n");
        sb.append("    ls -la \"$_work\" 2>/dev/null | head -20 >&2\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  # detect truncated deb (short read leaves tiny/missing data.tar)\n");
        sb.append("  _has_data=0\n");
        sb.append("  for _f in \"$_work\"/data.tar*; do [ -f \"$_f\" ] && [ -s \"$_f\" ] && _has_data=1; done\n");
        sb.append("  if [ \"$_has_data\" = 0 ]; then\n");
        sb.append("    echo \"[pkg] missing data.tar — ar members were:\" >&2\n");
        sb.append("    ls -la \"$_work\" 2>/dev/null | head -20 >&2\n");
        sb.append("    echo \"[pkg] deleting bad cache\" >&2\n");
        sb.append("    rm -f \"$_deb\"\n");
        sb.append("    return 1\n");
        sb.append("  fi\n");
        sb.append("  _data=\n");
        sb.append("  for _f in \"$_work\"/data.tar*; do\n");
        sb.append("    [ -f \"$_f\" ] && _data=\"$_f\" && break\n");
        sb.append("  done\n");
        sb.append("  [ -n \"$_data\" ] || { echo \"[pkg] no data.tar in deb\" >&2; return 1; }\n");
        sb.append("  echo \"[pkg] extracting $(basename \"$_data\") → $PREFIX\" >&2\n");
        // Termux debs contain: data/data/com.termux/files/usr/bin/...
        // Stage extract, then merge that tree into our $PREFIX.
        sb.append("  _stage=\"$_work/stage\"\n");
        sb.append("  mkdir -p \"$_stage\"\n");
        sb.append("  case \"$_data\" in\n");
        sb.append("    *.xz)\n");
        sb.append("      if [ -f \"$PREFIX/bin/xz\" ]; then\n");
        sb.append("        elf \"$PREFIX/bin/xz\" -dc \"$_data\" | bb tar -xf - -C \"$_stage\" || return 1\n");
        sb.append("      else\n");
        sb.append("        echo \"[pkg] need $PREFIX/bin/xz to extract data.tar.xz — try: pkg install xz-utils\" >&2; return 1\n");
        sb.append("      fi\n");
        sb.append("      ;;\n");
        sb.append("    *.gz|*.tgz)\n");
        sb.append("      bb tar -xzf \"$_data\" -C \"$_stage\" || return 1\n");
        sb.append("      ;;\n");
        sb.append("    *.zst)\n");
        sb.append("      if [ -f \"$PREFIX/bin/zstd\" ]; then\n");
        sb.append("        elf \"$PREFIX/bin/zstd\" -dc \"$_data\" | bb tar -xf - -C \"$_stage\" || return 1\n");
        sb.append("      else\n");
        sb.append("        echo \"[pkg] need $PREFIX/bin/zstd for data.tar.zst — try: pkg install zstd\" >&2; return 1\n");
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
        sb.append("  echo \"[pkg] merging $_src → $PREFIX\" >&2\n");
        // -a preserve, -f overwrite existing (re-install / shared libs)
        sb.append("  bb cp -af \"$_src\"/. \"$PREFIX\"/ || return 1\n");
        sb.append("  mkdir -p \"$PREFIX/var/lib/dpkg/info\"\n");
        sb.append("  echo \"# mscode\" > \"$PREFIX/var/lib/dpkg/info/$_name.list\"\n");
        sb.append("  rm -rf \"$_work\"\n");
        sb.append("}\n");
        sb.append("\n");

        // Parse Depends: from Packages index (simple, ignores versions/alternatives)
        sb.append("_pkg_depends() {\n");
        sb.append("  local _want _cur _deps _line\n");
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
        sb.append("  local _p _path _dep _deb _debsz _debmag _dl_ok _url\n");
        sb.append("  _p=\"$1\"\n");
        sb.append("  # depth guard for recursive deps\n");
        sb.append("  _pkg_depth=${_pkg_depth:-0}\n");
        sb.append("  if [ \"$_pkg_depth\" -gt 15 ]; then\n");
        sb.append("    echo \"[pkg] dependency depth exceeded at $_p\" >&2; return 1\n");
        sb.append("  fi\n");
        sb.append("  if _pkg_is_installed \"$_p\"; then\n");
        sb.append("    echo \"[pkg] already installed: $_p\" >&2\n");
        sb.append("    return 0\n");
        sb.append("  fi\n");
        sb.append("  echo \"[pkg] resolving $_p…\" >&2\n");
        // Only the Filename path may go to stdout from _pkg_resolve (status is >&2).
        // tail -1 guards against any accidental noise in the capture.
        sb.append("  _path=$(_pkg_resolve \"$_p\" | tail -n 1 | tr -d '\\r') || {\n");
        sb.append("    echo \"[pkg] package not found: $_p\" >&2; return 1\n");
        sb.append("  }\n");
        sb.append("  # sanitize: must look like pool/.../*.deb (no status text mixed in)\n");
        sb.append("  case \"$_path\" in\n");
        sb.append("    pool/*.deb|pool/*/*.deb|pool/*/*/*.deb|pool/*/*/*/*.deb|pool/*/*/*/*/*.deb) ;;\n");
        sb.append("    *) echo \"[pkg] bad path from index: [$_path]\" >&2; return 1 ;;\n");
        sb.append("  esac\n");
        // install dependencies first
        sb.append("  _pkg_depth=$((_pkg_depth + 1))\n");
        sb.append("  for _dep in $(_pkg_depends \"$_p\"); do\n");
        sb.append("    case \"$_dep\" in\n");
        // skip virtual/boring deps
        sb.append("      ''|bash|coreutils|toybox|termux-am|termux-exec|dash|libandroid-support) ;;\n");
        sb.append("      *)\n");
        sb.append("        if ! _pkg_is_installed \"$_dep\"; then\n");
        sb.append("          echo \"[pkg] dependency: $_dep (for $_p)\" >&2\n");
        sb.append("          _pkg_install_one \"$_dep\" || { echo \"[pkg] dep failed: $_dep\" >&2; _pkg_depth=$((_pkg_depth - 1)); return 1; }\n");
        sb.append("        fi\n");
        sb.append("        ;;\n");
        sb.append("    esac\n");
        sb.append("  done\n");
        sb.append("  _pkg_depth=$((_pkg_depth - 1))\n");
        sb.append("  _deb=\"$_pkg_cache/$(basename \"$_path\")\"\n");
        sb.append("  if [ ! -f \"$_deb\" ]; then\n");
        sb.append("    echo \"[pkg] downloading $_path\" >&2\n");
        sb.append("    rm -f \"$_deb\"\n");
        sb.append("    _url=\"$_pkg_repo/$_path\"\n");
        sb.append("    _dl_ok=0\n");
        sb.append("    if [ -n \"$CURL_CA_BUNDLE\" ] && [ -f \"$CURL_CA_BUNDLE\" ]; then\n");
        sb.append("      curl -fsSL --cacert \"$CURL_CA_BUNDLE\" -o \"$_deb\" \"$_url\" && _dl_ok=1\n");
        sb.append("    fi\n");
        sb.append("    if [ \"$_dl_ok\" = 0 ]; then\n");
        sb.append("      curl -fsSL -o \"$_deb\" \"$_url\" && _dl_ok=1\n");
        sb.append("    fi\n");
        sb.append("    if [ \"$_dl_ok\" = 0 ]; then\n");
        sb.append("      echo \"[pkg] download failed: $_url\" >&2; rm -f \"$_deb\"; return 1\n");
        sb.append("    fi\n");
        sb.append("  else\n");
        sb.append("    echo \"[pkg] cached $(basename \"$_deb\")\" >&2\n");
        sb.append("  fi\n");
        // Verify download is a real .deb before extract (catch HTML/empty/SSL garbage)
        sb.append("  _debsz=$(bb stat -c %s \"$_deb\" 2>/dev/null || wc -c < \"$_deb\" | tr -d ' ')\n");
        sb.append("  _debmag=$(dd if=\"$_deb\" bs=1 count=7 2>/dev/null)\n");
        sb.append("  if [ -z \"$_debsz\" ] || [ \"$_debsz\" -lt 64 ] || [ \"$_debmag\" != '!<arch>' ]; then\n");
        sb.append("    echo \"[pkg] bad download: size=$_debsz magic=[$_debmag] url=$_pkg_repo/$_path\" >&2\n");
        sb.append("    dd if=\"$_deb\" bs=1 count=120 2>/dev/null | cat -v >&2; echo >&2\n");
        sb.append("    rm -f \"$_deb\"; return 1\n");
        sb.append("  fi\n");
        sb.append("  echo \"[pkg] deb ok ($_debsz bytes)\" >&2\n");
        sb.append("  _pkg_extract_deb \"$_deb\" \"$_p\" || return 1\n");
        sb.append("  # refresh command wrappers in THIS session\n");
        sb.append("  mscode_wrap 2>/dev/null\n");
        sb.append("  echo \"[pkg] ✓ $_p installed\" >&2\n");
        sb.append("}\n");
        sb.append("\n");
        sb.append("pkg() {\n");
        sb.append("  case \"$1\" in\n");
        sb.append("    install|i)\n");
        sb.append("      shift\n");
        sb.append("      local _ok _pkg\n");
        sb.append("      if [ $# -eq 0 ]; then\n");
        sb.append("        echo \"usage: pkg install <package>…\" >&2\n");
        sb.append("        return 1\n");
        sb.append("      fi\n");
        sb.append("      _ok=0\n");
        sb.append("      _pkg_depth=0\n");
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
        sb.append("      local _q\n");
        sb.append("      _q=\"$1\"\n");
        sb.append("      if [ -z \"$_q\" ]; then echo \"usage: pkg search <name>\" >&2; return 1; fi\n");
        sb.append("      _pkg_ensure_index || return 1\n");
        sb.append("      grep -i \"^Package: .*$_q\" \"$_pkg_cache/Packages\" 2>/dev/null | sed 's/^Package: //' | sort -u | head -40\n");
        sb.append("      ;;\n");
        sb.append("    update|u|upgrade)\n");
        sb.append("      rm -f \"$_pkg_cache/Packages\" \"$_pkg_cache/Packages.gz\" 2>/dev/null\n");
        sb.append("      _pkg_ensure_index && echo \"[pkg] index updated\" >&2\n");
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
    }
}