/**
 * Compress engine.
 *
 * CRITICAL: shellCommand = raw script body (NOT `sh -c "..."`).
 * Native already runs: /system/bin/sh -c <shellCommand>
 *
 * Markers:
 *   __MS_PHASE__ checking | installing | compressing
 *   __MS_PROGRESS__ <pct> | <current> <total>
 *   __MS_STATUS__ <text>
 */

import type { ArchiveFormat, CompressOptions } from './compressTypes';
import { ensureArchiveExtension } from './compressTypes';

export type CompressPhase =
  | 'idle'
  | 'checking'
  | 'installing'
  | 'compressing'
  | 'done'
  | 'failed';

export interface CompressPlan {
  outputPath: string;
  shellCommand: string;
  summary: string;
  options: CompressOptions;
  cwd: string;
  requiredPackages: string[];
}

const q = (p: string) =>
  '"' + String(p).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

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

  // Prefer real sdcard/internal path for output when writable
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
        " ]; then printf '%s\\n' " +
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

  const binArr = bins.map((b) => q(b)).join(' ');

  const L: string[] = [];
  L.push('export PATH="/system/bin:/system/xbin:${PREFIX:-}/bin"');
  L.push('MKDIR=/system/bin/mkdir; [ -x "$MKDIR" ] || MKDIR=mkdir');
  L.push('RM=/system/bin/rm; [ -x "$RM" ] || RM=rm');
  L.push('WC=/system/bin/wc; [ -x "$WC" ] || WC=wc');
  L.push('MSCODE_LINKER=${MSCODE_LINKER:-/system/bin/linker64}');
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
  L.push(
    '  if command -v "$bin" >/dev/null 2>&1 || [ -f "$PREFIX/bin/$bin" ]; then',
  );
  L.push('    echo "__MS_STATUS__ Found $bin"');
  L.push('  else');
  L.push('    echo "__MS_STATUS__ Missing $bin"');
  L.push('    NEED_PKGS="$NEED_PKGS $bin"');
  L.push('  fi');
  L.push('done');
  L.push('');
  // Missing tools → exit 42; UI installs via NativeTerminal.pkgInstall then retries
  L.push('if [ -n "$NEED_PKGS" ]; then');
  L.push('  echo "__MS_PHASE__ installing"');
  L.push('  echo "__MS_STATUS__ Need packages:$NEED_PKGS"');
  L.push('  echo "__MS_PROGRESS__ 100"');
  L.push('  exit 42');
  L.push('fi');
  L.push('');
  L.push('echo "__MS_PHASE__ compressing"');
  L.push('echo "__MS_PROGRESS__ 0"');
  L.push('echo "__MS_STATUS__ Preparing compress…"');
  L.push('echo "__MS_STATUS__ OUT=$OUT"');
  L.push('"$MKDIR" -p "$OUTDIR" 2>/dev/null || true');
  L.push('"$RM" -f "$OUT" 2>/dev/null || true');
  L.push('LIST="${TMPDIR:-/data/local/tmp}/mscode_compress_$$.list"');
  L.push('{ ' + listCmd + '; } > "$LIST" 2>/dev/null || true');
  L.push('TOTAL=$("$WC" -l < "$LIST" 2>/dev/null | tr -d \' \\t\')');
  L.push('case "$TOTAL" in \'\'|*[!0-9]*) TOTAL=0 ;; esac');
  L.push('if [ -z "$TOTAL" ] || [ "$TOTAL" -lt 1 ]; then');
  L.push(
    '  echo "__MS_STATUS__ No readable files (use Internal Storage / sdcard)"',
  );
  L.push('  echo "__MS_PROGRESS__ 100"');
  L.push('  "$RM" -f "$LIST"');
  L.push('  exit 1');
  L.push('fi');
  L.push('echo "__MS_STATUS__ Found $TOTAL file(s)"');
  L.push('echo "__MS_PROGRESS__ 0 $TOTAL"');
  L.push('');
  L.push('if [ "$MODE" = "tar" ]; then');
  L.push('  echo "__MS_STATUS__ Creating archive ($TOTAL files)…"');
  L.push('  echo "__MS_PROGRESS__ 1 $TOTAL"');
  L.push(
    '  if command -v runpfx >/dev/null 2>&1; then runpfx tar $TARFLAGS "$OUT" -T "$LIST"; else tar $TARFLAGS "$OUT" -T "$LIST"; fi',
  );
  L.push('  EC=$?');
  L.push('  "$RM" -f "$LIST"');
  L.push('  if [ $EC -ne 0 ]; then');
  L.push('    echo "__MS_STATUS__ tar failed (exit $EC)"');
  L.push('    echo "__MS_PROGRESS__ 100"');
  L.push('    exit $EC');
  L.push('  fi');
  L.push('  echo "__MS_STATUS__ Done — $OUT"');
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
    '    if command -v runpfx >/dev/null 2>&1; then runpfx 7z a -t7z -mx=' +
      String(level) +
      solid +
      pwd7z +
      ' "$OUT" "$f"; else 7z a -t7z -mx=' +
      String(level) +
      solid +
      pwd7z +
      ' "$OUT" "$f"; fi',
  );
  L.push('  else');
  L.push('    _ze="${TMPDIR:-/data/local/tmp}/mscode_zip_err_$$"');
  L.push('    _ok=0');
  L.push(
    '    if command -v runpfx >/dev/null 2>&1 && runpfx zip ' +
      zipLevel +
      pwdZip +
      ' "$OUT" "$f" >"$_ze" 2>&1; then _ok=1; fi',
  );
  L.push('    if [ "$_ok" -eq 0 ] && [ -f "$PREFIX/bin/zip" ]; then');
  L.push(
    '      if "$MSCODE_LINKER" "$PREFIX/bin/zip" ' +
      zipLevel +
      pwdZip +
      ' "$OUT" "$f" >"$_ze" 2>&1; then _ok=1; fi',
  );
  L.push('    fi');
  L.push('    if [ "$_ok" -eq 0 ] && command -v zip >/dev/null 2>&1; then');
  L.push(
    '      if zip ' +
      zipLevel +
      pwdZip +
      ' "$OUT" "$f" >"$_ze" 2>&1; then _ok=1; fi',
  );
  L.push('    fi');
  L.push('    if [ "$_ok" -eq 0 ]; then');
  L.push('      echo "__MS_STATUS__ zip fail: $(head -1 "$_ze" 2>/dev/null)"');
  L.push('    fi');
  L.push('    rm -f "$_ze"');
  L.push('  fi');
  L.push('done < "$LIST"');
  L.push('"$RM" -f "$LIST"');
  L.push('if [ ! -f "$OUT" ]; then');
  L.push('  echo "__MS_STATUS__ Archive not created at $OUT"');
  L.push('  echo "__MS_PROGRESS__ 100"');
  L.push('  exit 1');
  L.push('fi');
  L.push(
    'SZ=$(/system/bin/stat -c %s "$OUT" 2>/dev/null || "$WC" -c < "$OUT" | tr -d " ")',
  );
  L.push('echo "__MS_STATUS__ Done — $OUT ($SZ bytes)"');
  L.push('echo "__MS_PROGRESS__ 100"');
  L.push('test -f "$OUT"');

  const script = L.join('\n');
  const cwd = safeShellCwd(writableOutDir, opts?.tmpDir);
  const shellCommand = script;

  return {
    outputPath,
    shellCommand,
    summary:
      'Compress ' +
      options.sources.length +
      ' item(s) → ' +
      fileName +
      ' (' +
      format +
      ', level ' +
      level +
      ')',
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
