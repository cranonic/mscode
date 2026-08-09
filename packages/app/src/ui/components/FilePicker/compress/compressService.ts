/**
 * Compress engine facade — UI-agnostic.
 * Currently builds a shell plan for Termux/Bionic (zip/tar); callers can
 * execute via terminal tasks later without changing the modal.
 */

import type { CompressOptions } from './compressTypes';
import { ensureArchiveExtension } from './compressTypes';

export interface CompressPlan {
  /** Absolute output archive path */
  outputPath: string;
  /** Shell command sequence suitable for NativeTerminal / pkg environment */
  shellCommand: string;
  /** Human summary for logs / toast */
  summary: string;
  options: CompressOptions;
}

export function buildCompressPlan(options: CompressOptions): CompressPlan {
  const fileName = ensureArchiveExtension(options.archiveName.trim() || 'archive', options.format);
  const outputPath = `${options.outputDir.replace(/\/$/, '')}/${fileName}`;
  const sources = options.sources.map((s) => s.path);
  const quoted = (p: string) => `"${p.replace(/"/g, '\\"')}"`;

  let shellCommand = '';
  const level = options.level;

  switch (options.format) {
    case 'zip': {
      // busybox/zip style; -P password when set
      const pwd = options.password ? ` -P ${quoted(options.password)}` : '';
      const store = options.method === 'store' || level === 0 ? ' -0' : ` -${level}`;
      shellCommand =
        `cd ${quoted(options.outputDir)} && ` +
        `zip -r${store}${pwd} ${quoted(outputPath)} ${sources.map(quoted).join(' ')}`;
      break;
    }
    case 'tar':
      shellCommand =
        `tar -cf ${quoted(outputPath)} -C ${quoted(options.outputDir)} ` +
        sources.map((p) => quoted(p)).join(' ');
      break;
    case 'tar.gz':
      shellCommand =
        `tar -czf ${quoted(outputPath)} ${sources.map(quoted).join(' ')}`;
      break;
    case 'tar.bz2':
      shellCommand =
        `tar -cjf ${quoted(outputPath)} ${sources.map(quoted).join(' ')}`;
      break;
    case 'tar.xz':
      shellCommand =
        `tar -cJf ${quoted(outputPath)} ${sources.map(quoted).join(' ')}`;
      break;
    case '7z': {
      const pwd = options.password ? ` -p${quoted(options.password)}` : '';
      const solid = options.solid ? ' -ms=on' : ' -ms=off';
      shellCommand =
        `7z a -t7z -mx=${level}${solid}${pwd} ${quoted(outputPath)} ${sources.map(quoted).join(' ')}`;
      break;
    }
    default:
      shellCommand = `echo "Unsupported format"`;
  }

  if (options.splitSizeMb > 0 && options.format === 'zip') {
    shellCommand += ` && echo "[split ${options.splitSizeMb}MB — apply with zip -s if supported]"`;
  }

  const summary = `Compress ${options.sources.length} item(s) → ${fileName} (${options.format}, level ${level})`;

  return { outputPath, shellCommand, summary, options };
}

/**
 * Entry used by modal — returns plan; execution is left to the host
 * (terminal task, native plugin, etc.).
 */
export async function prepareCompress(options: CompressOptions): Promise<CompressPlan> {
  return buildCompressPlan(options);
}
