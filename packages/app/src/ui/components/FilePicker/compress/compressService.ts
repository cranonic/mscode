// /**
//  * Compress engine — safe cwd, content:// → real path when encoded,
//  * pkg check/install, then pack with progress markers.
//  *
//  * Markers:
//  *   __MS_PHASE__ checking | installing | compressing
//  *   __MS_PROGRESS__ <0-100>
//  *   __MS_STATUS__ <text>
//  */

// import type { ArchiveFormat, CompressOptions } from './compressTypes';
// import { ensureArchiveExtension } from './compressTypes';

// export type CompressPhase = 'idle' | 'checking' | 'installing' | 'compressing' | 'done' | 'failed';

// export interface CompressPlan {
//   outputPath: string;
//   shellCommand: string;
//   summary: string;
//   options: CompressOptions;
//   /** Always a real filesystem directory (never content://) */
//   cwd: string;
//   requiredPackages: string[];
// }

// const q = (p: string) => `"${String(p).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// /**
//  * content:// tree/document URIs often embed a real path in the doc id
//  * (Termux, raw:, primary:). ProcessBuilder cannot use content:// as cwd.
//  */
// export function shellPathFromUri(pathOrUri: string): string {
//   if (!pathOrUri || pathOrUri === 'ROOT') return pathOrUri;
//   if (!pathOrUri.startsWith('content://')) return pathOrUri;
//   try {
//     const doc = pathOrUri.match(/\/document\/([^?#]+)/);
//     if (doc) {
//       const decoded = decodeURIComponent(doc[1]);
//       if (decoded.startsWith('/')) return decoded;
//       if (decoded.startsWith('raw:')) return decoded.slice(4);
//       if (decoded.startsWith('primary:')) {
//         const rel = decoded.slice('primary:'.length);
//         return rel ? `/storage/emulated/0/${rel}` : '/storage/emulated/0';
//       }
//     }
//     const tree = pathOrUri.match(/\/tree\/([^/?#]+)/);
//     if (tree) {
//       const decoded = decodeURIComponent(tree[1]);
//       if (decoded.startsWith('/')) return decoded;
//       if (decoded.startsWith('raw:')) return decoded.slice(4);
//       if (decoded.startsWith('primary:')) {
//         const rel = decoded.slice('primary:'.length);
//         return rel ? `/storage/emulated/0/${rel}` : '/storage/emulated/0';
//       }
//     }
//   } catch {
//     /* keep original */
//   }
//   return pathOrUri;
// }

// export function isContentUri(p: string): boolean {
//   return typeof p === 'string' && p.startsWith('content://');
// }

// /** Real dir for ProcessBuilder — never content:// */
// export function safeShellCwd(preferred: string, fallbackTmp?: string): string {
//   const resolved = shellPathFromUri(preferred);
//   if (resolved && !isContentUri(resolved) && resolved.startsWith('/')) {
//     return resolved;
//   }
//   // App-private tmp candidates (background job must chdir somewhere real)
//   const candidates = [
//     fallbackTmp,
//     typeof process !== 'undefined' ? undefined : undefined,
//   ].filter(Boolean) as string[];
//   // shell will also export TMPDIR from env; use generic Android-ish defaults
//   return candidates[0] || '/data/local/tmp';
// }

// export function depsForFormat(format: ArchiveFormat): {
//   bins: string[];
//   packages: string[];
// } {
//   switch (format) {
//     case 'zip':
//       return { bins: ['zip'], packages: ['zip'] };
//     case 'tar':
//       return { bins: ['tar'], packages: ['tar'] };
//     case 'tar.gz':
//       return { bins: ['tar', 'gzip'], packages: ['tar', 'gzip'] };
//     case 'tar.bz2':
//       return { bins: ['tar', 'bzip2'], packages: ['tar', 'bzip2'] };
//     case 'tar.xz':
//       return { bins: ['tar', 'xz'], packages: ['tar', 'xz-utils'] };
//     case '7z':
//       return { bins: ['7z'], packages: ['p7zip'] };
//     default:
//       return { bins: ['zip'], packages: ['zip'] };
//   }
// }

// export function buildCompressPlan(
//   options: CompressOptions,
//   opts?: { tmpDir?: string },
// ): CompressPlan {
//   const fileName = ensureArchiveExtension(options.archiveName.trim() || 'archive', options.format);
//   const outputDirRaw = options.outputDir.replace(/\/$/, '') || '.';
//   const outputDir = shellPathFromUri(outputDirRaw);
//   // If still content://, write archive under tmp and report path
//   const writableOutDir =
//     !isContentUri(outputDir) && outputDir.startsWith('/')
//       ? outputDir
//       : shellPathFromUri(opts?.tmpDir || '') || '/data/local/tmp';

//   const outputPath = `${writableOutDir.replace(/\/$/, '')}/${fileName}`;

//   // Source paths for shell (best-effort real paths)
//   const sources = options.sources.map((s) => shellPathFromUri(s.path));
//   const level = options.level;
//   const includeHidden = options.includeHidden;
//   const format = options.format;
//   const { bins, packages } = depsForFormat(format);

//   const listParts = sources.map((p) => {
//     if (isContentUri(p)) {
//       // Cannot walk content:// from shell — skip with warning marker
//       return `echo "__MS_STATUS__ Skip unreadable URI (use real path): ${p.replace(/"/g, '')}" >&2`;
//     }
//     const hidden = includeHidden ? '' : ` -not -path '*/.*' `;
//     return (
//       `if [ -d ${q(p)} ]; then /system/bin/find ${q(p)}${hidden} -type f 2>/dev/null || find ${q(p)}${hidden} -type f 2>/dev/null; ` +
//       `elif [ -e ${q(p)} ]; then printf '%s\\n' ${q(p)}; fi`
//     );
//   });
//   const listCmd = listParts.join('; ');

//   const pwdZip = options.password ? ` -P ${q(options.password)}` : '';
//   const zipLevel = options.method === 'store' || level === 0 ? '-0' : `-${level}`;
//   const pwd7z = options.password ? ` -p${q(options.password)}` : '';
//   const solid = options.solid ? ' -ms=on' : ' -ms=off';

//   let mode = 'zip';
//   if (format === 'tar' || format === 'tar.gz' || format === 'tar.bz2' || format === 'tar.xz') {
//     mode = 'tar';
//   } else if (format === '7z') {
//     mode = '7z';
//   }

//   let tarFlags = '-cf';
//   if (format === 'tar.gz') tarFlags = '-czf';
//   if (format === 'tar.bz2') tarFlags = '-cjf';
//   if (format === 'tar.xz') tarFlags = '-cJf';

//   const binArr = bins.map((b) => q(b)).join(' ');

//   // Prefer toybox/system tools — avoid broken libbusybox.so PATH aliases
//   const script = `
// # Prefer system + PREFIX; avoid dead native-lib busybox applet paths
// export PATH="/system/bin:/system/xbin:\${PREFIX:-}/bin:\${PATH:-}"
// unalias find wc tr sort head basename mkdir rm zip tar 7z gzip bzip2 xz 2>/dev/null || true

// # Safe percent — never divide by zero (mksh/toybox)
// _safe_pct() {
//   _n="$1"; _d="$2"; _extra="${3:-0}"
//   case "$_d" in ''|*[!0-9]* ) _d=0 ;; esac
//   case "$_n" in ''|*[!0-9]* ) _n=0 ;; esac
//   if [ "$_d" -lt 1 ]; then
//     echo "$_extra"
//   else
//     echo $(( _n * 100 / _d + _extra ))
//   fi
// }


// OUT=${q(outputPath)}
// OUTDIR=${q(writableOutDir)}
// MODE=${q(mode)}
// TARFLAGS=${q(tarFlags)}

// # ── Phase 1: checking ──────────────────────────────────────────
// echo "__MS_PHASE__ checking"
// echo "__MS_PROGRESS__ 0"
// echo "__MS_STATUS__ Checking required tools…"

// NEED_PKGS=""
// for bin in ${binArr}; do
//   echo "__MS_STATUS__ Checking $bin…"
//   if command -v "$bin" >/dev/null 2>&1; then
//     echo "__MS_STATUS__ Found $bin"
//   else
//     echo "__MS_STATUS__ Missing $bin"
//     NEED_PKGS="$NEED_PKGS $bin"
//   fi
// done

// INSTALL_LIST=""
// for miss in $NEED_PKGS; do
//   case "$miss" in
//     zip) INSTALL_LIST="$INSTALL_LIST zip" ;;
//     tar) INSTALL_LIST="$INSTALL_LIST tar" ;;
//     gzip) INSTALL_LIST="$INSTALL_LIST gzip" ;;
//     bzip2) INSTALL_LIST="$INSTALL_LIST bzip2" ;;
//     xz) INSTALL_LIST="$INSTALL_LIST xz-utils" ;;
//     7z) INSTALL_LIST="$INSTALL_LIST p7zip" ;;
//     *) INSTALL_LIST="$INSTALL_LIST $miss" ;;
//   esac
// done
// INSTALL_LIST=$(printf '%s\\n' $INSTALL_LIST | sort -u | tr '\\n' ' ')
// INSTALL_LIST=$(echo "$INSTALL_LIST" | sed 's/^ *//;s/ *$//')

// # ── Phase 2: installing (if needed) ────────────────────────────
// if [ -n "$INSTALL_LIST" ]; then
//   echo "__MS_PHASE__ installing"
//   echo "__MS_PROGRESS__ 0"
//   echo "__MS_STATUS__ Packages to install: $INSTALL_LIST"

//   TOTAL_P=0
//   for _x in $INSTALL_LIST; do
//     TOTAL_P=$((TOTAL_P + 1))
//   done
//   # Guard: empty list should not reach here, but never allow 0 divisor
//   if [ -z "$TOTAL_P" ] || [ "$TOTAL_P" -lt 1 ]; then
//     TOTAL_P=1
//   fi

//   N_P=0
//   if command -v pkg >/dev/null 2>&1; then
//     for pkg in $INSTALL_LIST; do
//       N_P=$((N_P + 1))
//       PCT=$(_safe_pct "$N_P" "$TOTAL_P")
//       [ "$PCT" -gt 99 ] && PCT=99
//       echo "__MS_STATUS__ Installing $pkg ($N_P/$TOTAL_P)…"
//       echo "__MS_PROGRESS__ $PCT"
//       pkg install "$pkg" 2>&1 | while IFS= read -r line || [ -n "$line" ]; do
//         [ -z "$line" ] && continue
//         echo "__MS_STATUS__ [$pkg] $line"
//       done || true
//       echo "__MS_STATUS__ Installed $pkg"
//     done
//   else
//     echo "__MS_STATUS__ pkg not found — tools may be missing"
//   fi

//   echo "__MS_STATUS__ Verifying tools…"
//   for bin in ${binArr}; do
//     if ! command -v "$bin" >/dev/null 2>&1; then
//       echo "__MS_STATUS__ Still missing: $bin — install via: pkg install …"
//       echo "__MS_PROGRESS__ 100"
//       exit 127
//     fi
//   done
//   echo "__MS_STATUS__ All tools ready"
//   echo "__MS_PROGRESS__ 100"
// fi

// # ── Phase 3: compressing ───────────────────────────────────────
// echo "__MS_PHASE__ compressing"
// echo "__MS_PROGRESS__ 0"
// echo "__MS_STATUS__ Preparing compress…"

// mkdir -p "$OUTDIR" 2>/dev/null || /system/bin/mkdir -p "$OUTDIR" || true
// rm -f "$OUT" 2>/dev/null || true
// LIST="\${TMPDIR:-/data/local/tmp}/mscode_compress_$$.list"
// { ${listCmd}; } > "$LIST" 2>/dev/null || true
// TOTAL=$(wc -l < "$LIST" 2>/dev/null | tr -d ' \t')
// case "$TOTAL" in ''|*[!0-9]*) TOTAL=0 ;; esac
// if [ -z "$TOTAL" ] || [ "$TOTAL" -lt 1 ]; then
//   echo "__MS_STATUS__ No readable files to compress (check path permissions)"
//   echo "__MS_PROGRESS__ 100"
//   rm -f "$LIST"
//   exit 1
// fi
// echo "__MS_STATUS__ Found $TOTAL file(s)"
// echo "__MS_PROGRESS__ 3"

// if [ "$MODE" = "tar" ]; then
//   echo "__MS_STATUS__ Creating archive ($TOTAL files)…"
//   echo "__MS_PROGRESS__ 15"
//   tar $TARFLAGS "$OUT" -T "$LIST"
//   EC=$?
//   rm -f "$LIST"
//   if [ $EC -ne 0 ]; then
//     echo "__MS_STATUS__ tar failed (exit $EC)"
//     echo "__MS_PROGRESS__ 100"
//     exit $EC
//   fi
//   echo "__MS_STATUS__ Done — $TOTAL file(s) → $(basename "$OUT")"
//   echo "__MS_PROGRESS__ 100"
//   exit 0
// fi

// N=0
// while IFS= read -r f || [ -n "$f" ]; do
//   [ -z "$f" ] && continue
//   N=$((N+1))
//   # floor(N/TOTAL*96)+3, safe if TOTAL is 0
//   if [ -z "$TOTAL" ] || [ "$TOTAL" -lt 1 ]; then
//     PCT=0
//   else
//     PCT=$(( N * 96 / TOTAL + 3 ))
//   fi
//   [ "$PCT" -gt 99 ] && PCT=99
//   [ "$PCT" -lt 0 ] && PCT=0
//   BASE=$(basename "$f")
//   echo "__MS_STATUS__ [$N/$TOTAL] $BASE"
//   echo "__MS_PROGRESS__ $PCT"
//   if [ "$MODE" = "7z" ]; then
//     7z a -t7z -mx=${level}${solid}${pwd7z} "$OUT" "$f" >/dev/null 2>&1 || true
//   else
//     rel="$f"
//     case "$f" in
//       "$OUTDIR"/*) rel="\${f#\$OUTDIR/}" ;;
//     esac
//     (cd "$OUTDIR" && zip -q ${zipLevel}${pwdZip} "$OUT" "$rel") 2>/dev/null || \
//     zip -q ${zipLevel}${pwdZip} "$OUT" "$f" 2>/dev/null || true
//   fi
// done < "$LIST"
// rm -f "$LIST"
// echo "__MS_STATUS__ Done — $TOTAL file(s) → $(basename "$OUT")"
// echo "__MS_PROGRESS__ 100"
// test -e "$OUT"
// `.trim();

//   // cwd for ProcessBuilder: must exist on disk
//   const cwd = safeShellCwd(writableOutDir, opts?.tmpDir);

//   const shellCommand = `sh -c ${q(script)}`;
//   const summary = `Compress ${options.sources.length} item(s) → ${fileName} (${format}, level ${level})`;

//   return {
//     outputPath,
//     shellCommand,
//     summary,
//     options,
//     cwd,
//     requiredPackages: packages,
//   };
// }

// export async function prepareCompress(
//   options: CompressOptions,
//   opts?: { tmpDir?: string },
// ): Promise<CompressPlan> {
//   return buildCompressPlan(options, opts);
// }

// export function parseCompressOutput(
//   chunk: string,
//   state: { percent: number; status: string; phase: CompressPhase },
// ): { percent: number; status: string; phase: CompressPhase } {
//   let { percent, status, phase } = state;
//   for (const line of chunk.split(/\r?\n/)) {
//     const ph = line.match(/__MS_PHASE__\s+(\w+)/);
//     if (ph) {
//       const p = ph[1] as CompressPhase;
//       if (p === 'checking' || p === 'installing' || p === 'compressing') {
//         phase = p;
//         if (p === 'compressing' || p === 'installing') percent = 0;
//       }
//       continue;
//     }
//     const p = line.match(/__MS_PROGRESS__\s+(\d+)/);
//     if (p) {
//       percent = Math.min(100, Math.max(0, parseInt(p[1], 10)));
//       continue;
//     }
//     const s = line.match(/__MS_STATUS__\s+(.*)/);
//     if (s) status = s[1].trim();
//   }
//   return { percent, status, phase };
// }





/**
 * Compress engine — safe cwd, content:// → real path when encoded,
 * pkg check/install, then pack with progress markers.
 *
 * Markers:
 *   __MS_PHASE__ checking | installing | compressing
 *   __MS_PROGRESS__ <0-100>
 *   __MS_STATUS__ <text>
 */

import type { ArchiveFormat, CompressOptions } from './compressTypes';
import { ensureArchiveExtension } from './compressTypes';

export type CompressPhase = 'idle' | 'checking' | 'installing' | 'compressing' | 'done' | 'failed';

export interface CompressPlan {
  outputPath: string;
  shellCommand: string;
  summary: string;
  options: CompressOptions;
  /** Always a real filesystem directory (never content://) */
  cwd: string;
  requiredPackages: string[];
}

const q = (p: string) => '"' + String(p).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

/**
 * content:// tree/document URIs often embed a real path in the doc id
 * (Termux, raw:, primary:). ProcessBuilder cannot use content:// as cwd.
 */
export function shellPathFromUri(pathOrUri: string): string {
  if (!pathOrUri || pathOrUri === 'ROOT') return pathOrUri;
  if (!pathOrUri.startsWith('content://')) return pathOrUri;
  try {
    const doc = pathOrUri.match(/\/document\/([^?#]+)/);
    if (doc) {
      const decoded = decodeURIComponent(doc[1]);
      if (decoded.startsWith('/')) return decoded;
      if (decoded.startsWith('raw:')) return decoded.slice(4);
      if (decoded.startsWith('primary:')) {
        const rel = decoded.slice('primary:'.length);
        return rel ? '/storage/emulated/0/' + rel : '/storage/emulated/0';
      }
    }
    const tree = pathOrUri.match(/\/tree\/([^/?#]+)/);
    if (tree) {
      const decoded = decodeURIComponent(tree[1]);
      if (decoded.startsWith('/')) return decoded;
      if (decoded.startsWith('raw:')) return decoded.slice(4);
      if (decoded.startsWith('primary:')) {
        const rel = decoded.slice('primary:'.length);
        return rel ? '/storage/emulated/0/' + rel : '/storage/emulated/0';
      }
    }
  } catch {
    /* keep original */
  }
  return pathOrUri;
}

export function isContentUri(p: string): boolean {
  return typeof p === 'string' && p.startsWith('content://');
}

/** Real dir for ProcessBuilder — never content:// */
export function safeShellCwd(preferred: string, fallbackTmp?: string): string {
  const resolved = shellPathFromUri(preferred);
  if (resolved && !isContentUri(resolved) && resolved.startsWith('/')) {
    return resolved;
  }
  return fallbackTmp || '/data/local/tmp';
}

export function depsForFormat(format: ArchiveFormat): {
  bins: string[];
  packages: string[];
} {
  switch (format) {
    case 'zip':
      return { bins: ['zip'], packages: ['zip'] };
    case 'tar':
      return { bins: ['tar'], packages: ['tar'] };
    case 'tar.gz':
      return { bins: ['tar', 'gzip'], packages: ['tar', 'gzip'] };
    case 'tar.bz2':
      return { bins: ['tar', 'bzip2'], packages: ['tar', 'bzip2'] };
    case 'tar.xz':
      return { bins: ['tar', 'xz'], packages: ['tar', 'xz-utils'] };
    case '7z':
      return { bins: ['7z'], packages: ['p7zip'] };
    default:
      return { bins: ['zip'], packages: ['zip'] };
  }
}

export function buildCompressPlan(
  options: CompressOptions,
  opts?: { tmpDir?: string },
): CompressPlan {
  const fileName = ensureArchiveExtension(options.archiveName.trim() || 'archive', options.format);
  const outputDirRaw = options.outputDir.replace(/\/$/, '') || '.';
  const outputDir = shellPathFromUri(outputDirRaw);
  const writableOutDir =
    !isContentUri(outputDir) && outputDir.startsWith('/')
      ? outputDir
      : shellPathFromUri(opts?.tmpDir || '') || '/data/local/tmp';

  const outputPath = writableOutDir.replace(/\/$/, '') + '/' + fileName;

  const sources = options.sources.map((s) => shellPathFromUri(s.path));
  const level = options.level;
  const includeHidden = options.includeHidden;
  const format = options.format;
  const { bins, packages } = depsForFormat(format);

  const listParts = sources.map((p) => {
    if (isContentUri(p)) {
      return 'echo "__MS_STATUS__ Skip unreadable URI" >&2';
    }
    const hidden = includeHidden ? '' : " -not -path '*/.*' ";
    return (
      'if [ -d ' + q(p) + ' ]; then /system/bin/find ' + q(p) + hidden + ' -type f 2>/dev/null || find ' + q(p) + hidden + ' -type f 2>/dev/null; ' +
      'elif [ -e ' + q(p) + ' ]; then printf \'%s\\n\' ' + q(p) + '; fi'
    );
  });
  const listCmd = listParts.join('; ');

  const pwdZip = options.password ? ' -P ' + q(options.password) : '';
  const zipLevel = options.method === 'store' || level === 0 ? '-0' : '-' + level;
  const pwd7z = options.password ? ' -p' + q(options.password) : '';
  const solid = options.solid ? ' -ms=on' : ' -ms=off';

  let mode = 'zip';
  if (format === 'tar' || format === 'tar.gz' || format === 'tar.bz2' || format === 'tar.xz') {
    mode = 'tar';
  } else if (format === '7z') {
    mode = '7z';
  }

  let tarFlags = '-cf';
  if (format === 'tar.gz') tarFlags = '-czf';
  if (format === 'tar.bz2') tarFlags = '-cjf';
  if (format === 'tar.xz') tarFlags = '-cJf';

  const binArr = bins.map((b) => q(b)).join(' ');

  // Build shell script with string concat — avoids TS template ${} parsing shell vars
  const lines: string[] = [];
  lines.push('export PATH="/system/bin:/system/xbin:${PREFIX:-}/bin:${PATH:-}"');
  lines.push('unalias find wc tr sort head basename mkdir rm zip tar 7z gzip bzip2 xz 2>/dev/null || true');
  lines.push('');
  lines.push('_safe_pct() {');
  lines.push('  _n="$1"; _d="$2"; _extra="${3:-0}"');
  lines.push("  case \"$_d\" in ''|*[!0-9]* ) _d=0 ;; esac");
  lines.push("  case \"$_n\" in ''|*[!0-9]* ) _n=0 ;; esac");
  lines.push('  if [ "$_d" -lt 1 ]; then');
  lines.push('    echo "$_extra"');
  lines.push('  else');
  lines.push('    echo $(( _n * 100 / _d + _extra ))');
  lines.push('  fi');
  lines.push('}');
  lines.push('');
  lines.push('OUT=' + q(outputPath));
  lines.push('OUTDIR=' + q(writableOutDir));
  lines.push('MODE=' + q(mode));
  lines.push('TARFLAGS=' + q(tarFlags));
  lines.push('');
  lines.push('echo "__MS_PHASE__ checking"');
  lines.push('echo "__MS_PROGRESS__ 0"');
  lines.push('echo "__MS_STATUS__ Checking required tools…"');
  lines.push('');
  lines.push('NEED_PKGS=""');
  lines.push('for bin in ' + binArr + '; do');
  lines.push('  echo "__MS_STATUS__ Checking $bin…"');
  lines.push('  if command -v "$bin" >/dev/null 2>&1; then');
  lines.push('    echo "__MS_STATUS__ Found $bin"');
  lines.push('  else');
  lines.push('    echo "__MS_STATUS__ Missing $bin"');
  lines.push('    NEED_PKGS="$NEED_PKGS $bin"');
  lines.push('  fi');
  lines.push('done');
  lines.push('');
  lines.push('INSTALL_LIST=""');
  lines.push('for miss in $NEED_PKGS; do');
  lines.push('  case "$miss" in');
  lines.push('    zip) INSTALL_LIST="$INSTALL_LIST zip" ;;');
  lines.push('    tar) INSTALL_LIST="$INSTALL_LIST tar" ;;');
  lines.push('    gzip) INSTALL_LIST="$INSTALL_LIST gzip" ;;');
  lines.push('    bzip2) INSTALL_LIST="$INSTALL_LIST bzip2" ;;');
  lines.push('    xz) INSTALL_LIST="$INSTALL_LIST xz-utils" ;;');
  lines.push('    7z) INSTALL_LIST="$INSTALL_LIST p7zip" ;;');
  lines.push('    *) INSTALL_LIST="$INSTALL_LIST $miss" ;;');
  lines.push('  esac');
  lines.push('done');
  lines.push("INSTALL_LIST=$(printf '%s\\n' $INSTALL_LIST | sort -u | tr '\\n' ' ')");
  lines.push("INSTALL_LIST=$(echo \"$INSTALL_LIST\" | sed 's/^ *//;s/ *$//')");
  lines.push('');
  lines.push('if [ -n "$INSTALL_LIST" ]; then');
  lines.push('  echo "__MS_PHASE__ installing"');
  lines.push('  echo "__MS_PROGRESS__ 0"');
  lines.push('  echo "__MS_STATUS__ Packages to install: $INSTALL_LIST"');
  lines.push('  TOTAL_P=0');
  lines.push('  for _x in $INSTALL_LIST; do TOTAL_P=$((TOTAL_P + 1)); done');
  lines.push('  if [ -z "$TOTAL_P" ] || [ "$TOTAL_P" -lt 1 ]; then TOTAL_P=1; fi');
  lines.push('  N_P=0');
  lines.push('  if command -v pkg >/dev/null 2>&1; then');
  lines.push('    for pkg in $INSTALL_LIST; do');
  lines.push('      N_P=$((N_P + 1))');
  lines.push('      PCT=$(_safe_pct "$N_P" "$TOTAL_P")');
  lines.push('      [ "$PCT" -gt 99 ] && PCT=99');
  lines.push('      echo "__MS_STATUS__ Installing $pkg ($N_P/$TOTAL_P)…"');
  lines.push('      echo "__MS_PROGRESS__ $PCT"');
  lines.push('      pkg install "$pkg" 2>&1 | while IFS= read -r line || [ -n "$line" ]; do');
  lines.push('        [ -z "$line" ] && continue');
  lines.push('        echo "__MS_STATUS__ [$pkg] $line"');
  lines.push('      done || true');
  lines.push('      echo "__MS_STATUS__ Installed $pkg"');
  lines.push('    done');
  lines.push('  else');
  lines.push('    echo "__MS_STATUS__ pkg not found — tools may be missing"');
  lines.push('  fi');
  lines.push('  echo "__MS_STATUS__ Verifying tools…"');
  lines.push('  for bin in ' + binArr + '; do');
  lines.push('    if ! command -v "$bin" >/dev/null 2>&1; then');
  lines.push('      echo "__MS_STATUS__ Still missing: $bin — install via: pkg install …"');
  lines.push('      echo "__MS_PROGRESS__ 100"');
  lines.push('      exit 127');
  lines.push('    fi');
  lines.push('  done');
  lines.push('  echo "__MS_STATUS__ All tools ready"');
  lines.push('  echo "__MS_PROGRESS__ 100"');
  lines.push('fi');
  lines.push('');
  lines.push('echo "__MS_PHASE__ compressing"');
  lines.push('echo "__MS_PROGRESS__ 0"');
  lines.push('echo "__MS_STATUS__ Preparing compress…"');
  lines.push('mkdir -p "$OUTDIR" 2>/dev/null || /system/bin/mkdir -p "$OUTDIR" || true');
  lines.push('rm -f "$OUT" 2>/dev/null || true');
  lines.push('LIST="${TMPDIR:-/data/local/tmp}/mscode_compress_$$.list"');
  lines.push('{ ' + listCmd + '; } > "$LIST" 2>/dev/null || true');
  lines.push("TOTAL=$(wc -l < \"$LIST\" 2>/dev/null | tr -d ' \\t')");
  lines.push('case "$TOTAL" in \'\'|*[!0-9]*) TOTAL=0 ;; esac');
  lines.push('if [ -z "$TOTAL" ] || [ "$TOTAL" -lt 1 ]; then');
  lines.push('  echo "__MS_STATUS__ No readable files to compress (check path permissions)"');
  lines.push('  echo "__MS_PROGRESS__ 100"');
  lines.push('  rm -f "$LIST"');
  lines.push('  exit 1');
  lines.push('fi');
  lines.push('echo "__MS_STATUS__ Found $TOTAL file(s)"');
  lines.push('echo "__MS_PROGRESS__ 3"');
  lines.push('');
  lines.push('if [ "$MODE" = "tar" ]; then');
  lines.push('  echo "__MS_STATUS__ Creating archive ($TOTAL files)…"');
  lines.push('  echo "__MS_PROGRESS__ 15"');
  lines.push('  tar $TARFLAGS "$OUT" -T "$LIST"');
  lines.push('  EC=$?');
  lines.push('  rm -f "$LIST"');
  lines.push('  if [ $EC -ne 0 ]; then');
  lines.push('    echo "__MS_STATUS__ tar failed (exit $EC)"');
  lines.push('    echo "__MS_PROGRESS__ 100"');
  lines.push('    exit $EC');
  lines.push('  fi');
  lines.push('  echo "__MS_STATUS__ Done — $TOTAL file(s) → $(basename "$OUT")"');
  lines.push('  echo "__MS_PROGRESS__ 100"');
  lines.push('  exit 0');
  lines.push('fi');
  lines.push('');
  lines.push('N=0');
  lines.push('while IFS= read -r f || [ -n "$f" ]; do');
  lines.push('  [ -z "$f" ] && continue');
  lines.push('  N=$((N+1))');
  lines.push('  if [ -z "$TOTAL" ] || [ "$TOTAL" -lt 1 ]; then PCT=0');
  lines.push('  else PCT=$(( N * 96 / TOTAL + 3 )); fi');
  lines.push('  [ "$PCT" -gt 99 ] && PCT=99');
  lines.push('  [ "$PCT" -lt 0 ] && PCT=0');
  lines.push('  BASE=$(basename "$f")');
  lines.push('  echo "__MS_STATUS__ [$N/$TOTAL] $BASE"');
  lines.push('  echo "__MS_PROGRESS__ $PCT"');
  lines.push('  if [ "$MODE" = "7z" ]; then');
  lines.push('    7z a -t7z -mx=' + level + solid + pwd7z + ' "$OUT" "$f" >/dev/null 2>&1 || true');
  lines.push('  else');
  lines.push('    rel="$f"');
  lines.push('    case "$f" in');
  lines.push('      "$OUTDIR"/*) rel="${f#$OUTDIR/}" ;;');
  lines.push('    esac');
  lines.push('    (cd "$OUTDIR" && zip -q ' + zipLevel + pwdZip + ' "$OUT" "$rel") 2>/dev/null || \\');
  lines.push('    zip -q ' + zipLevel + pwdZip + ' "$OUT" "$f" 2>/dev/null || true');
  lines.push('  fi');
  lines.push('done < "$LIST"');
  lines.push('rm -f "$LIST"');
  lines.push('echo "__MS_STATUS__ Done — $TOTAL file(s) → $(basename "$OUT")"');
  lines.push('echo "__MS_PROGRESS__ 100"');
  lines.push('test -e "$OUT"');

  const script = lines.join('\n');
  const cwd = safeShellCwd(writableOutDir, opts?.tmpDir);
  const shellCommand = 'sh -c ' + q(script);
  const summary =
    'Compress ' + options.sources.length + ' item(s) → ' + fileName + ' (' + format + ', level ' + level + ')';

  return {
    outputPath,
    shellCommand,
    summary,
    options,
    cwd,
    requiredPackages: packages,
  };
}

export async function prepareCompress(
  options: CompressOptions,
  opts?: { tmpDir?: string },
): Promise<CompressPlan> {
  return buildCompressPlan(options, opts);
}

export function parseCompressOutput(
  chunk: string,
  state: { percent: number; status: string; phase: CompressPhase },
): { percent: number; status: string; phase: CompressPhase } {
  let { percent, status, phase } = state;
  for (const line of chunk.split(/\r?\n/)) {
    const ph = line.match(/__MS_PHASE__\s+(\w+)/);
    if (ph) {
      const p = ph[1] as CompressPhase;
      if (p === 'checking' || p === 'installing' || p === 'compressing') {
        phase = p;
        if (p === 'compressing' || p === 'installing') percent = 0;
      }
      continue;
    }
    const p = line.match(/__MS_PROGRESS__\s+(\d+)/);
    if (p) {
      percent = Math.min(100, Math.max(0, parseInt(p[1], 10)));
      continue;
    }
    const s = line.match(/__MS_STATUS__\s+(.*)/);
    if (s) status = s[1].trim();
  }
  return { percent, status, phase };
}
