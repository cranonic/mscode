/**
 * Compress engine.
 *
 * CRITICAL: shellCommand must be the raw script body — NOT `sh -c "..."`.
 * ProotCommandBuilder.buildNativeBackgroundCommand already runs:
 *   /system/bin/sh -c <shellCommand>
 * Wrapping again causes the OUTER sh to expand $OUT/$bin/… to empty
 * before the real script runs.
 *
 * Markers:
 *   __MS_PHASE__ checking | installing | compressing
 *   __MS_PROGRESS__ <pct>  OR  <current> <total>
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
  cwd: string;
  requiredPackages: string[];
}

const q = (p: string) => '"' + String(p).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

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
    /* keep */
  }
  return pathOrUri;
}

export function isContentUri(p: string): boolean {
  return typeof p === 'string' && p.startsWith('content://');
}

function isForeignAppPath(p: string): boolean {
  if (!p.startsWith('/data/data/') && !p.startsWith('/data/user/')) return false;
  return p.indexOf('com.editor.mscode') < 0;
}

export function safeShellCwd(preferred: string, fallbackTmp?: string): string {
  const resolved = shellPathFromUri(preferred);
  if (
    resolved &&
    !isContentUri(resolved) &&
    resolved.startsWith('/') &&
    !isForeignAppPath(resolved)
  ) {
    return resolved;
  }
  if (fallbackTmp && fallbackTmp.startsWith('/') && !isContentUri(fallbackTmp)) {
    return fallbackTmp;
  }
  return '/data/local/tmp';
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
  const fileName = ensureArchiveExtension(
    options.archiveName.trim() || 'archive',
    options.format,
  );
  const outputDirRaw = options.outputDir.replace(/\/$/, '') || '.';
  const outputDir = shellPathFromUri(outputDirRaw);

  const tmpFallback =
    opts?.tmpDir &&
    opts.tmpDir.startsWith('/') &&
    !isContentUri(opts.tmpDir) &&
    !isForeignAppPath(opts.tmpDir)
      ? opts.tmpDir
      : '/data/local/tmp';

  // Never write into Termux / foreign app-private storage
  const writableOutDir =
    !isContentUri(outputDir) &&
    outputDir.startsWith('/') &&
    !isForeignAppPath(outputDir)
      ? outputDir
      : tmpFallback;

  const outputPath = writableOutDir.replace(/\/$/, '') + '/' + fileName;
  const sources = options.sources.map((s) => shellPathFromUri(s.path));
  const level = options.level;
  const includeHidden = options.includeHidden;
  const format = options.format;
  const { bins, packages } = depsForFormat(format);

  const listParts: string[] = [];
  for (const p of sources) {
    if (isContentUri(p) || isForeignAppPath(p)) {
      // Shell of this app cannot read other apps' private data
      listParts.push(
        'echo "__MS_STATUS__ Skip inaccessible path (permission)" >&2',
      );
      continue;
    }
    const hidden = includeHidden ? '' : " -not -path '*/.*' ";
    listParts.push(
      'if [ -d ' +
        q(p) +
        ' ]; then /system/bin/find ' +
        q(p) +
        hidden +
        ' -type f 2>/dev/null || find ' +
        q(p) +
        hidden +
        ' -type f 2>/dev/null; ' +
        'elif [ -e ' +
        q(p) +
        ' ]; then printf \'%s\\n\' ' +
        q(p) +
        '; fi',
    );
  }
  const listCmd = listParts.join('; ');

  const pwdZip = options.password ? ' -P ' + q(options.password) : '';
  const zipLevel =
    options.method === 'store' || level === 0 ? '-0' : '-' + String(level);
  const pwd7z = options.password ? ' -p' + q(options.password) : '';
  const solid = options.solid ? ' -ms=on' : ' -ms=off';

  let mode = 'zip';
  if (
    format === 'tar' ||
    format === 'tar.gz' ||
    format === 'tar.bz2' ||
    format === 'tar.xz'
  ) {
    mode = 'tar';
  } else if (format === '7z') {
    mode = '7z';
  }

  let tarFlags = '-cf';
  if (format === 'tar.gz') tarFlags = '-czf';
  if (format === 'tar.bz2') tarFlags = '-cjf';
  if (format === 'tar.xz') tarFlags = '-cJf';

  // Space-separated quoted bin names for `for bin in ...`
  const binArr = bins.map((b) => q(b)).join(' ');

  const L: string[] = [];
  // Prefer system tools; drop dead busybox function wrappers from mscode_env.sh
  L.push('export PATH="/system/bin:/system/xbin:${PREFIX:-}/bin:${PATH:-}"');
  L.push('unset BUSYBOX 2>/dev/null || true');
  L.push(
    'for _c in find wc tr sort head basename mkdir rm ls cp mv cat; do unset -f $_c 2>/dev/null; done',
  );
  L.push(
    'unalias find wc tr sort head basename mkdir rm zip tar 7z gzip bzip2 xz 2>/dev/null || true',
  );
  L.push('');
  L.push('OUT=' + q(outputPath));
  L.push('OUTDIR=' + q(writableOutDir));
  L.push('MODE=' + q(mode));
  L.push('TARFLAGS=' + q(tarFlags));
  L.push('');
  L.push('echo "__MS_PHASE__ checking"');
  L.push('echo "__MS_PROGRESS__ 0"');
  L.push('echo "__MS_STATUS__ Checking required tools…"');
  L.push('');
  L.push('NEED_PKGS=""');
  L.push('for bin in ' + binArr + '; do');
  L.push('  echo "__MS_STATUS__ Checking $bin…"');
  L.push('  if command -v "$bin" >/dev/null 2>&1; then');
  L.push('    echo "__MS_STATUS__ Found $bin"');
  L.push('  else');
  L.push('    echo "__MS_STATUS__ Missing $bin"');
  L.push('    NEED_PKGS="$NEED_PKGS $bin"');
  L.push('  fi');
  L.push('done');
  L.push('');
  L.push('INSTALL_LIST=""');
  L.push('for miss in $NEED_PKGS; do');
  L.push('  case "$miss" in');
  L.push('    zip) INSTALL_LIST="$INSTALL_LIST zip" ;;');
  L.push('    tar) INSTALL_LIST="$INSTALL_LIST tar" ;;');
  L.push('    gzip) INSTALL_LIST="$INSTALL_LIST gzip" ;;');
  L.push('    bzip2) INSTALL_LIST="$INSTALL_LIST bzip2" ;;');
  L.push('    xz) INSTALL_LIST="$INSTALL_LIST xz-utils" ;;');
  L.push('    7z) INSTALL_LIST="$INSTALL_LIST p7zip" ;;');
  L.push('    *) INSTALL_LIST="$INSTALL_LIST $miss" ;;');
  L.push('  esac');
  L.push('done');
  L.push(
    "INSTALL_LIST=$(printf '%s\\n' $INSTALL_LIST | sort -u | tr '\\n' ' ')",
  );
  L.push("INSTALL_LIST=$(echo \"$INSTALL_LIST\" | sed 's/^ *//;s/ *$//')");
  L.push('');
  L.push('if [ -n "$INSTALL_LIST" ]; then');
  L.push('  echo "__MS_PHASE__ installing"');
  L.push('  echo "__MS_PROGRESS__ 0"');
  L.push('  echo "__MS_STATUS__ Packages to install: $INSTALL_LIST"');
  L.push('  TOTAL_P=0');
  L.push('  for _x in $INSTALL_LIST; do TOTAL_P=$((TOTAL_P + 1)); done');
  L.push('  if [ -z "$TOTAL_P" ] || [ "$TOTAL_P" -lt 1 ]; then TOTAL_P=1; fi');
  L.push('  N_P=0');
  L.push('  if command -v pkg >/dev/null 2>&1; then');
  L.push('    for pkg in $INSTALL_LIST; do');
  L.push('      N_P=$((N_P + 1))');
  L.push('      echo "__MS_STATUS__ Installing $pkg ($N_P/$TOTAL_P)…"');
  L.push('      echo "__MS_PROGRESS__ $N_P $TOTAL_P"');
  L.push(
    '      pkg install "$pkg" 2>&1 | while IFS= read -r line || [ -n "$line" ]; do',
  );
  L.push('        [ -z "$line" ] && continue');
  L.push('        echo "__MS_STATUS__ [$pkg] $line"');
  L.push('      done || true');
  L.push('      echo "__MS_STATUS__ Installed $pkg"');
  L.push('    done');
  L.push('  else');
  L.push('    echo "__MS_STATUS__ pkg not found — tools may be missing"');
  L.push('  fi');
  L.push('  echo "__MS_STATUS__ Verifying tools…"');
  L.push('  for bin in ' + binArr + '; do');
  L.push('    if ! command -v "$bin" >/dev/null 2>&1; then');
  L.push('      echo "__MS_STATUS__ Still missing: $bin"');
  L.push('      echo "__MS_PROGRESS__ 100"');
  L.push('      exit 127');
  L.push('    fi');
  L.push('  done');
  L.push('  echo "__MS_STATUS__ All tools ready"');
  L.push('  echo "__MS_PROGRESS__ 100"');
  L.push('fi');
  L.push('');
  L.push('echo "__MS_PHASE__ compressing"');
  L.push('echo "__MS_PROGRESS__ 0"');
  L.push('echo "__MS_STATUS__ Preparing compress…"');
  L.push(
    'mkdir -p "$OUTDIR" 2>/dev/null || /system/bin/mkdir -p "$OUTDIR" || true',
  );
  L.push('rm -f "$OUT" 2>/dev/null || true');
  L.push('LIST="${TMPDIR:-/data/local/tmp}/mscode_compress_$$.list"');
  L.push('{ ' + listCmd + '; } > "$LIST" 2>/dev/null || true');
  L.push("TOTAL=$(wc -l < \"$LIST\" 2>/dev/null | tr -d ' \\t')");
  L.push('case "$TOTAL" in \'\'|*[!0-9]*) TOTAL=0 ;; esac');
  L.push('if [ -z "$TOTAL" ] || [ "$TOTAL" -lt 1 ]; then');
  L.push(
    '  echo "__MS_STATUS__ No readable files to compress (use Internal Storage / sdcard paths)"',
  );
  L.push('  echo "__MS_PROGRESS__ 100"');
  L.push('  rm -f "$LIST"');
  L.push('  exit 1');
  L.push('fi');
  L.push('echo "__MS_STATUS__ Found $TOTAL file(s)"');
  L.push('echo "__MS_PROGRESS__ 0 $TOTAL"');
  L.push('');
  L.push('if [ "$MODE" = "tar" ]; then');
  L.push('  echo "__MS_STATUS__ Creating archive ($TOTAL files)…"');
  L.push('  echo "__MS_PROGRESS__ 1 $TOTAL"');
  L.push('  tar $TARFLAGS "$OUT" -T "$LIST"');
  L.push('  EC=$?');
  L.push('  rm -f "$LIST"');
  L.push('  if [ $EC -ne 0 ]; then');
  L.push('    echo "__MS_STATUS__ tar failed (exit $EC)"');
  L.push('    echo "__MS_PROGRESS__ 100"');
  L.push('    exit $EC');
  L.push('  fi');
  L.push(
    '  echo "__MS_STATUS__ Done — $TOTAL file(s) → $(basename "$OUT")"',
  );
  L.push('  echo "__MS_PROGRESS__ 100"');
  L.push('  exit 0');
  L.push('fi');
  L.push('');
  L.push('N=0');
  L.push('while IFS= read -r f || [ -n "$f" ]; do');
  L.push('  [ -z "$f" ] && continue');
  L.push('  N=$((N+1))');
  L.push('  BASE=$(basename "$f")');
  L.push('  echo "__MS_STATUS__ [$N/$TOTAL] $BASE"');
  L.push('  echo "__MS_PROGRESS__ $N $TOTAL"');
  L.push('  if [ "$MODE" = "7z" ]; then');
  L.push(
    '    7z a -t7z -mx=' +
      String(level) +
      solid +
      pwd7z +
      ' "$OUT" "$f" >/dev/null 2>&1 || true',
  );
  L.push('  else');
  L.push('    rel="$f"');
  L.push('    case "$f" in');
  L.push('      "$OUTDIR"/*) rel="${f#$OUTDIR/}" ;;');
  L.push('    esac');
  L.push(
    '    (cd "$OUTDIR" && zip -q ' +
      zipLevel +
      pwdZip +
      ' "$OUT" "$rel") 2>/dev/null || \\',
  );
  L.push(
    '    zip -q ' + zipLevel + pwdZip + ' "$OUT" "$f" 2>/dev/null || true',
  );
  L.push('  fi');
  L.push('done < "$LIST"');
  L.push('rm -f "$LIST"');
  L.push(
    'echo "__MS_STATUS__ Done — $TOTAL file(s) → $(basename "$OUT")"',
  );
  L.push('echo "__MS_PROGRESS__ 100"');
  L.push('test -e "$OUT"');

  const script = L.join('\n');
  const cwd = safeShellCwd(writableOutDir, opts?.tmpDir);

  // RAW script only — native already does /system/bin/sh -c
  const shellCommand = script;

  const summary =
    'Compress ' +
    options.sources.length +
    ' item(s) → ' +
    fileName +
    ' (' +
    format +
    ', level ' +
    level +
    ')';

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
    const p2 = line.match(/__MS_PROGRESS__\s+(\d+)\s+(\d+)/);
    if (p2) {
      const cur = parseInt(p2[1], 10);
      const tot = parseInt(p2[2], 10);
      percent =
        tot > 0 ? Math.min(100, Math.max(0, Math.round((cur * 100) / tot))) : 0;
      continue;
    }
    const p1 = line.match(/__MS_PROGRESS__\s+(\d+)\s*$/);
    if (p1) {
      percent = Math.min(100, Math.max(0, parseInt(p1[1], 10)));
      continue;
    }
    const s = line.match(/__MS_STATUS__\s+(.*)/);
    if (s) status = s[1].trim();
  }
  return { percent, status, phase };
}
