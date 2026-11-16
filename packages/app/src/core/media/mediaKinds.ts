// Detect audio vs video from path / MIME — used by shell mode switch.

const AUDIO_EXT = new Set([
  'mp3', 'wav', 'ogg', 'opus', 'm4a', 'aac', 'flac', 'wma', 'oga', 'weba',
]);

const VIDEO_EXT = new Set([
  'mp4', 'webm', 'ogv', 'mov', 'mkv', 'avi', 'm4v', '3gp',
]);

export type MediaMode = 'audio' | 'video' | 'unknown';

export function extensionOf(filePath: string): string {
  const base = (filePath || '').split(/[/\\]/).pop() || '';
  const i = base.lastIndexOf('.');
  return i >= 0 ? base.slice(i + 1).toLowerCase() : '';
}

export function detectMediaMode(filePath: string): MediaMode {
  const ext = extensionOf(filePath);
  if (AUDIO_EXT.has(ext)) return 'audio';
  if (VIDEO_EXT.has(ext)) return 'video';
  return 'unknown';
}

export function displayName(filePath: string): string {
  const base = (filePath || '').split(/[/\\]/).pop() || filePath || 'Media';
  const i = base.lastIndexOf('.');
  return i > 0 ? base.slice(0, i) : base;
}

/** Extensions registered with the previewer (Phase 0–2 set). */
export const MEDIA_PREVIEW_EXTENSIONS = [
  '.mp3', '.wav', '.ogg', '.opus', '.m4a', '.aac', '.flac',
  '.mp4', '.webm', '.ogv', '.mov', '.mkv', '.m4v',
] as const;
