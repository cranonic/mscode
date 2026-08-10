/**
 * Compress engine.
 *
 * CRITICAL: shellCommand = raw script body (NOT `sh -c "..."`).
 * Native already runs: /system/bin/sh -c <shellCommand>
 *
 * Markers:
 *   __MS_PHASE__ checking | installing | compressing | staging
 *   __MS_PROGRESS__ <pct> | <current> <total>
 *   __MS_STATUS__ <text>
 *
 * Path rules (Android):
 *  - Shared storage (/storage, /sdcard) → shell can read/write directly
 *  - Own app (/data/.../com.editor.mscode/...) → same UID, shell OK
 *  - Foreign app private (/data/.../com.termux/...) → NOT readable by shell
 *  - content:// SAF URIs → NOT readable by shell; must stage via JS/SAF first
 */

import type { ArchiveFormat, CompressOptions, CompressSource } from './compressTypes';
import { ensureArchiveExtension } from './compressTypes';

export type CompressPhase =
  | 'idle'
  | 'checking'
  | 'installing'
  | 'staging'
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
  /** Temp staging dir to delete after compress (if any) */
  stageDir?: string;
}

const q = (p: string) =>
  '"' + String(p).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

/** Strip file:// and normalize. */
export function normalizeFsPath(pathOrUri: string): string {
  if (!pathOrUri || pathOrUri === 'ROOT') return pathOrUri;
  let p = pathOrUri;
  if (p.startsWith('file://')) {
    p = p.slice('file://'.length);
    // file:///data/... → /data/...
    if (p.startsWith('//')) p = p.slice(1);
  }
  // collapse duplicate slashes except leading //
  p = p.replace(/\/{2,}/g, '/');
  return p;
}

/**
 * Resolve content:// → real path only when the shell can read it.
 * Termux / foreign app-private paths MUST stay as content:// so SAF staging
 * can openInputStream; stripping to /data/data/com.termux/... makes shell +
 * Capacitor both fail (ENOENT / EACCES).
 */
export function shellPathFromUri(pathOrUri: string): string {
  if (!pathOrUri || pathOrUri === 'ROOT') return pathOrUri;
  if (!pathOrUri.startsWith('content://')) {
    return normalizeFsPath(pathOrUri);
  }
  try {
    const tryDecode = (decoded: string): string | null => {
      let raw: string | null = null;
      if (decoded.startsWith('primary:')) {
        const rel = decoded.slice('primary:'.length);
        return rel
          ? normalizeFsPath('/storage/emulated/0/' + rel)
          : '/storage/emulated/0';
      }
      if (decoded.startsWith('raw:')) raw = decoded.slice(4);
      else if (decoded.startsWith('/')) raw = decoded;
      if (!raw) return null;
      const n = normalizeFsPath(raw);
      // Foreign app private → keep content:// for SAF
      if (isForeignAppPath(n)) return null;
      return n;
    };

    const doc = pathOrUri.match(/\/document\/([^?#]+)/);
    if (doc) {
      const got = tryDecode(decodeURIComponent(doc[1]));
      if (got) return got;
    }
    const tree = pathOrUri.match(/\/tree\/([^/?#]+)/);
    if (tree) {
      const got = tryDecode(decodeURIComponent(tree[1]));
      if (got) return got;
    }
  } catch {
    /* keep content:// */
  }
  return pathOrUri;
}

export function isContentUri(p: string): boolean {
  return typeof p === 'string' && p.startsWith('content://');
}

/** True for this app's private data dirs (any user id). */
export function isOwnAppPath(p: string): boolean {
  if (!p) return false;
  const n = normalizeFsPath(p);
  return /\/com\.editor\.mscode(\.|\/|$)/.test(n);
}

/**
 * Other apps' private data (/data/data/com.termux/..., /data/user/0/com.xxx/...).
 * Own app is NOT foreign.
 */
export function isForeignAppPath(p: string): boolean {
  if (!p) return false;
  const n = normalizeFsPath(p);
  if (!n.startsWith('/data/data/') && !n.startsWith('/data/user/')) return false;
  return !isOwnAppPath(n);
}

/** Paths the native shell can read without SAF staging. */
export function isShellReadablePath(p: string): boolean {
  if (!p || isContentUri(p)) return false;
  const n = normalizeFsPath(p);
  if (!n.startsWith('/')) return false;
  if (isForeignAppPath(n)) return false;
  return true;
}

/** Paths that need JS/SAF copy into a stage dir before zip. */
export function needsStaging(p: string): boolean {
  return isContentUri(p) || isForeignAppPath(p);
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
  if (
    fallbackTmp &&
    fallbackTmp.startsWith('/') &&
    !isContentUri(fallbackTmp) &&
    !isForeignAppPath(fallbackTmp)
  ) {
    return fallbackTmp;
  }
  // Prefer app tmp if we know it; else system tmp
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
  opts?: { tmpDir?: string; stageDir?: string },
): CompressPlan {
  const fileName = ensureArchiveExtension(
    options.archiveName.trim() || 'archive',
    options.format,
  );
  const outputDirRaw = normalizeFsPath(
    options.outputDir.replace(/\/+$/, '') || '.',
  );
  const outputDir = shellPathFromUri(outputDirRaw);

  const tmpFallback =
    opts?.tmpDir &&
    opts.tmpDir.startsWith('/') &&
    !isContentUri(opts.tmpDir) &&
    !isForeignAppPath(opts.tmpDir)
      ? normalizeFsPath(opts.tmpDir)
      : '/data/local/tmp';

  // Prefer real path for output when shell-writable (shared OR own app)
  const writableOutDir =
    !isContentUri(outputDir) &&
    outputDir.startsWith('/') &&
    !isForeignAppPath(outputDir)
      ? outputDir
      : tmpFallback;

  const outputPath =
    normalizeFsPath(writableOutDir.replace(/\/+$/, '')) + '/' + fileName;

  // Sources may already be staged paths from CompressModal
  const sources = options.sources.map((s) => shellPathFromUri(s.path));
  const level = options.level;
  const includeHidden = options.includeHidden;
  const format = options.format;
  const { bins, packages } = depsForFormat(format);

  const listParts: string[] = [];
  for (const p of sources) {
    if (isContentUri(p) || isForeignAppPath(p)) {
      // Should not happen if modal staged correctly — still report clearly
      listParts.push(
        'echo "__MS_STATUS__ Skip (need stage): ' +
          p.replace(/"/g, '') +
          '"',
      );
      continue;
    }
    const hidden = includeHidden ? '' : " -not -path '*/.*' ";
    listParts.push(
      'echo "__MS_STATUS__ Listing ' +
        p.replace(/"/g, '') +
        '"; ' +
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
        '; else echo "__MS_STATUS__ Missing path: ' +
        p.replace(/"/g, '') +
        '"; fi',
    );
  }
  const listCmd = listParts.length ? listParts.join('; ') : 'true';

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
  const stageDir = opts?.stageDir
    ? normalizeFsPath(opts.stageDir)
    : undefined;

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
  if (stageDir) {
    L.push('STAGEDIR=' + q(stageDir));
  }
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
  // Prefer app/tmp over /tmp (not writable on many devices)
  L.push('LIST="${TMPDIR:-/data/local/tmp}/mscode_compress_$$.list"');
  L.push('{ ' + listCmd + '; } > "$LIST" 2>/dev/null || true');
  L.push('TOTAL=$("$WC" -l < "$LIST" 2>/dev/null | tr -d \' \\t\')');
  L.push('case "$TOTAL" in \'\'|*[!0-9]*) TOTAL=0 ;; esac');
  L.push('if [ -z "$TOTAL" ] || [ "$TOTAL" -lt 1 ]; then');
  L.push(
    '  echo "__MS_STATUS__ No readable files (stage Termux/SAF first, or use sdcard / app storage)"',
  );
  L.push('  echo "__MS_PROGRESS__ 100"');
  L.push('  "$RM" -f "$LIST"');
  if (stageDir) {
    L.push('  "$RM" -rf "$STAGEDIR" 2>/dev/null || true');
  }
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
  if (stageDir) {
    L.push('  "$RM" -rf "$STAGEDIR" 2>/dev/null || true');
  }
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
  if (stageDir) {
    L.push('"$RM" -rf "$STAGEDIR" 2>/dev/null || true');
  }
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
    stageDir,
  };
}

export async function prepareCompress(
  options: CompressOptions,
  opts?: { tmpDir?: string; stageDir?: string },
): Promise<CompressPlan> {
  return buildCompressPlan(options, opts);
}

/**
 * Decide which sources need staging and build a unique stage directory path.
 */
export function planStaging(
  sources: CompressSource[],
  tmpDir?: string,
): {
  needsStage: boolean;
  stageDir: string;
  toStage: CompressSource[];
  direct: CompressSource[];
} {
  // Prefer app-writable tmp (filesDir/tmp or Cache). /data/local/tmp is often
  // not creatable/writable for the app process on modern Android (ENOENT).
  const base =
    tmpDir &&
    tmpDir.startsWith('/') &&
    !isContentUri(tmpDir) &&
    !isForeignAppPath(tmpDir)
      ? normalizeFsPath(tmpDir)
      : '';
  const stageDir =
    (base || '__APP_TMP__').replace(/\/+$/, '') +
    '/mscode_stage_' +
    Date.now() +
    '_' +
    Math.floor(Math.random() * 1e6);

  const toStage: CompressSource[] = [];
  const direct: CompressSource[] = [];
  for (const s of sources) {
    // Keep original path for staging (content:// must not be stripped)
    if (needsStaging(s.path) || isContentUri(s.path)) {
      toStage.push(s);
    } else {
      direct.push({ ...s, path: shellPathFromUri(s.path) });
    }
  }
  return {
    needsStage: toStage.length > 0,
    stageDir,
    toStage,
    direct,
  };
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
      if (
        p === 'checking' ||
        p === 'installing' ||
        p === 'compressing' ||
        p === 'staging'
      ) {
        phase = p;
        if (p === 'compressing' || p === 'installing' || p === 'staging')
          percent = 0;
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
