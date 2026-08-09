/**
 * Reusable archive / compress configuration shared by FilePicker and future callers.
 */

export type ArchiveFormat = 'zip' | 'tar' | 'tar.gz' | 'tar.bz2' | 'tar.xz' | '7z';

export type CompressionLevel = 0 | 1 | 3 | 5 | 7 | 9;

export type CompressionMethod = 'store' | 'deflate' | 'lzma' | 'bzip2' | 'xz';

export interface CompressSource {
  /** Absolute path or content:// URI */
  path: string;
  name: string;
  isDirectory: boolean;
}

export interface CompressOptions {
  /** Files / folders to include */
  sources: CompressSource[];
  /** Output directory (parent folder for the archive) */
  outputDir: string;
  /** Archive file name without or with extension */
  archiveName: string;
  format: ArchiveFormat;
  level: CompressionLevel;
  method: CompressionMethod;
  /** Optional password (zip / 7z) */
  password?: string;
  /** Split size in MB; 0 = no split */
  splitSizeMb: number;
  /** Follow symlinks when packing */
  followSymlinks: boolean;
  /** Include hidden (dot) files */
  includeHidden: boolean;
  /** Solid archive (7z) */
  solid: boolean;
}

export const ARCHIVE_FORMAT_OPTIONS: Array<{
  value: ArchiveFormat;
  label: string;
  description: string;
  ext: string;
}> = [
  { value: 'zip', label: 'ZIP', description: 'Universal, password support', ext: '.zip' },
  { value: 'tar', label: 'TAR', description: 'Uncompressed tape archive', ext: '.tar' },
  { value: 'tar.gz', label: 'TAR.GZ', description: 'gzip compressed tar', ext: '.tar.gz' },
  { value: 'tar.bz2', label: 'TAR.BZ2', description: 'bzip2 compressed tar', ext: '.tar.bz2' },
  { value: 'tar.xz', label: 'TAR.XZ', description: 'xz compressed tar', ext: '.tar.xz' },
  { value: '7z', label: '7-Zip', description: 'High ratio, solid optional', ext: '.7z' },
];

export const LEVEL_OPTIONS: Array<{ value: string; label: string; description: string }> = [
  { value: '0', label: '0 — Store', description: 'No compression' },
  { value: '1', label: '1 — Fastest', description: 'Minimal CPU' },
  { value: '3', label: '3 — Fast', description: 'Good speed' },
  { value: '5', label: '5 — Normal', description: 'Balanced (default)' },
  { value: '7', label: '7 — Maximum', description: 'Slower, smaller' },
  { value: '9', label: '9 — Ultra', description: 'Slowest, best ratio' },
];

export const METHOD_OPTIONS: Array<{ value: CompressionMethod; label: string; description: string }> = [
  { value: 'store', label: 'Store', description: 'Copy only' },
  { value: 'deflate', label: 'Deflate', description: 'ZIP default' },
  { value: 'lzma', label: 'LZMA', description: '7z style' },
  { value: 'bzip2', label: 'BZip2', description: 'tar.bz2' },
  { value: 'xz', label: 'XZ', description: 'tar.xz' },
];

export const defaultCompressOptions = (
  sources: CompressSource[],
  outputDir: string,
): CompressOptions => {
  const base =
    sources.length === 1
      ? sources[0].name.replace(/\/$/, '')
      : 'archive';
  return {
    sources,
    outputDir,
    archiveName: base,
    format: 'zip',
    level: 5,
    method: 'deflate',
    password: '',
    splitSizeMb: 0,
    followSymlinks: false,
    includeHidden: true,
    solid: false,
  };
};

export function ensureArchiveExtension(name: string, format: ArchiveFormat): string {
  const ext = ARCHIVE_FORMAT_OPTIONS.find((f) => f.value === format)?.ext || '.zip';
  const lower = name.toLowerCase();
  for (const f of ARCHIVE_FORMAT_OPTIONS) {
    if (lower.endsWith(f.ext)) {
      return name.slice(0, -f.ext.length) + ext;
    }
  }
  return name.endsWith(ext) ? name : name + ext;
}
