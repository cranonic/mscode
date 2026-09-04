import { fs } from '@/core/fileSystem';
import { detectMediaMode, displayName, extensionOf } from '../mediaKinds';
import { filePayloadToBytes } from './bytes';
import { resolveFolderArt } from './FolderArtResolver';
import { readId3Metadata } from './Id3Reader';
import type { MediaMetadata } from './types';

/**
 * Load display metadata for a media file.
 * Audio: ID3 tags + embedded APIC, then folder cover fallback.
 * Video: filename title only (folder poster optional later).
 */
export async function loadMediaMetadata(filePath: string): Promise<MediaMetadata> {
  const mode = detectMediaMode(filePath);
  const fallbackTitle = displayName(filePath);
  const base: MediaMetadata = {
    title: fallbackTitle,
    artUrl: null,
    artSource: 'none',
  };

  if (mode === 'unknown') return base;

  // Folder art (both audio & video can use poster-style folder image)
  let folderArt: string | null = null;
  try {
    folderArt = await resolveFolderArt(filePath);
  } catch {
    folderArt = null;
  }

  if (mode === 'audio') {
    const ext = extensionOf(filePath);
    // ID3 is primarily mp3; still try for others (some m4a won't have ID3)
    if (ext === 'mp3' || ext === 'mp2' || ext === 'mpga') {
      try {
        const raw = await fs.readFile(filePath);
        const bytes = filePayloadToBytes(raw);
        const id3 = readId3Metadata(bytes);
        const meta: MediaMetadata = {
          title: id3.title || fallbackTitle,
          artist: id3.artist,
          album: id3.album,
          artUrl: id3.artUrl || folderArt,
          artSource: id3.artUrl ? 'embedded' : folderArt ? 'folder' : 'none',
        };
        // If embedded art preferred but we also got folderArt unused, revoke folder
        if (id3.artUrl && folderArt && folderArt !== id3.artUrl) {
          try {
            URL.revokeObjectURL(folderArt);
          } catch {
            /* ignore */
          }
        }
        return meta;
      } catch {
        /* fall through to folder/title */
      }
    }

    return {
      title: fallbackTitle,
      artUrl: folderArt,
      artSource: folderArt ? 'folder' : 'none',
    };
  }

  // video
  return {
    title: fallbackTitle,
    artUrl: folderArt,
    artSource: folderArt ? 'folder' : 'none',
  };
}

export function revokeMetadataArt(meta: MediaMetadata | null | undefined) {
  if (meta?.artUrl && meta.artUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(meta.artUrl);
    } catch {
      /* ignore */
    }
  }
}
