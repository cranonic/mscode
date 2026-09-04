// Look for cover art files next to the media file
import { fs } from '@/core/fileSystem';
import { bytesToObjectUrl, dirname, filePayloadToBytes, joinPath } from './bytes';

const CANDIDATES = [
  'cover.jpg',
  'cover.jpeg',
  'cover.png',
  'cover.webp',
  'folder.jpg',
  'folder.jpeg',
  'folder.png',
  'AlbumArt.jpg',
  'AlbumArt.jpeg',
  'AlbumArtSmall.jpg',
  'albumart.jpg',
  'front.jpg',
  'front.png',
  'artwork.jpg',
  'artwork.png',
];

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Returns an object URL for the first matching cover file in the same directory,
 * or null. Caller must revoke the URL.
 */
export async function resolveFolderArt(mediaPath: string): Promise<string | null> {
  const dir = dirname(mediaPath);
  if (!dir) return null;

  let entries: { name: string; isDirectory?: boolean }[] = [];
  try {
    entries = await fs.readDir(dir);
  } catch {
    // Directory listing may fail on some SAF paths — try direct reads
    for (const name of CANDIDATES) {
      const url = await tryReadArt(joinPath(dir, name));
      if (url) return url;
    }
    return null;
  }

  const lowerMap = new Map<string, string>();
  for (const e of entries) {
    if (e.isDirectory) continue;
    lowerMap.set(e.name.toLowerCase(), e.name);
  }

  for (const cand of CANDIDATES) {
    const real = lowerMap.get(cand.toLowerCase());
    if (!real) continue;
    const url = await tryReadArt(joinPath(dir, real));
    if (url) return url;
  }

  // Any image named *cover* / *folder*
  for (const e of entries) {
    if (e.isDirectory) continue;
    const n = e.name.toLowerCase();
    if (!/\.(jpe?g|png|webp)$/i.test(n)) continue;
    if (n.includes('cover') || n.includes('folder') || n.includes('album')) {
      const url = await tryReadArt(joinPath(dir, e.name));
      if (url) return url;
    }
  }

  return null;
}

async function tryReadArt(path: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(path);
    const bytes = filePayloadToBytes(raw);
    if (bytes.length < 24) return null;
    const ext = path.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = MIME[ext] || 'image/jpeg';
    return bytesToObjectUrl(bytes, mime);
  } catch {
    return null;
  }
}
