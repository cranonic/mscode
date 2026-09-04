// Lightweight ID3v2 tag reader (title/artist/album + APIC cover)
// No npm dependency — works on browser + Android WebView.

import { bytesToObjectUrl } from './bytes';
import type { MediaMetadata } from './types';

function synchsafeToSize(b0: number, b1: number, b2: number, b3: number): number {
  return (b0 & 0x7f) * 0x200000 + (b1 & 0x7f) * 0x4000 + (b2 & 0x7f) * 0x80 + (b3 & 0x7f);
}

function decodeId3Text(data: Uint8Array): string {
  if (data.length === 0) return '';
  const encoding = data[0];
  const body = data.subarray(1);
  try {
    if (encoding === 0) {
      // ISO-8859-1
      let s = '';
      for (let i = 0; i < body.length; i++) {
        if (body[i] === 0) break;
        s += String.fromCharCode(body[i]);
      }
      return s.trim();
    }
    if (encoding === 3) {
      // UTF-8
      const nul = body.indexOf(0);
      const slice = nul >= 0 ? body.subarray(0, nul) : body;
      return new TextDecoder('utf-8').decode(slice).trim();
    }
    if (encoding === 1 || encoding === 2) {
      // UTF-16 with/without BOM
      const dec = new TextDecoder(encoding === 1 ? 'utf-16' : 'utf-16be');
      let end = body.length;
      for (let i = 0; i + 1 < body.length; i += 2) {
        if (body[i] === 0 && body[i + 1] === 0) {
          end = i;
          break;
        }
      }
      return dec.decode(body.subarray(0, end)).replace(/\0/g, '').trim();
    }
  } catch {
    /* fall through */
  }
  return '';
}

function parseApic(data: Uint8Array): { mime: string; bytes: Uint8Array } | null {
  if (data.length < 4) return null;
  const encoding = data[0];
  let i = 1;
  // MIME type (latin1, null-terminated)
  let mime = '';
  while (i < data.length && data[i] !== 0) {
    mime += String.fromCharCode(data[i]);
    i++;
  }
  i++; // null
  if (i >= data.length) return null;
  i++; // picture type byte
  // description (encoding-dependent, null terminated)
  if (encoding === 0 || encoding === 3) {
    while (i < data.length && data[i] !== 0) i++;
    i++;
  } else {
    while (i + 1 < data.length && !(data[i] === 0 && data[i + 1] === 0)) i += 2;
    i += 2;
  }
  if (i >= data.length) return null;
  const img = data.subarray(i);
  if (img.length < 24) return null;
  if (!mime || mime === '-->') mime = 'image/jpeg';
  return { mime, bytes: img };
}

function readId3v1(bytes: Uint8Array): Partial<MediaMetadata> {
  if (bytes.length < 128) return {};
  const tag = bytes.subarray(bytes.length - 128);
  if (tag[0] !== 0x54 || tag[1] !== 0x41 || tag[2] !== 0x47) return {}; // TAG
  const latin = (start: number, len: number) => {
    let s = '';
    for (let i = start; i < start + len; i++) {
      if (tag[i] === 0) break;
      s += String.fromCharCode(tag[i]);
    }
    return s.trim();
  };
  return {
    title: latin(3, 30) || undefined,
    artist: latin(33, 30) || undefined,
    album: latin(63, 30) || undefined,
  };
}

/**
 * Extract basic tags + embedded art from an MP3 (or ID3-bearing) buffer.
 * Returns art as object URL — caller must revoke.
 */
export function readId3Metadata(bytes: Uint8Array): MediaMetadata {
  const out: MediaMetadata = { artSource: 'none', artUrl: null };

  if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const ver = bytes[3];
    const flags = bytes[5];
    let size = synchsafeToSize(bytes[6], bytes[7], bytes[8], bytes[9]);
    let offset = 10;
    if (flags & 0x40) {
      // extended header
      if (ver >= 4) {
        const ex = synchsafeToSize(bytes[10], bytes[11], bytes[12], bytes[13]);
        offset += ex;
      } else {
        const ex =
          (bytes[10] << 24) | (bytes[11] << 16) | (bytes[12] << 8) | bytes[13];
        offset += 4 + ex;
      }
    }
    const end = Math.min(bytes.length, 10 + size);

    while (offset + 10 <= end) {
      const id = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3],
      );
      if (id === '\0\0\0\0' || bytes[offset] === 0) break;

      let frameSize: number;
      if (ver >= 4) {
        frameSize = synchsafeToSize(
          bytes[offset + 4],
          bytes[offset + 5],
          bytes[offset + 6],
          bytes[offset + 7],
        );
      } else {
        frameSize =
          (bytes[offset + 4] << 24) |
          (bytes[offset + 5] << 16) |
          (bytes[offset + 6] << 8) |
          bytes[offset + 7];
      }
      const dataStart = offset + 10;
      const dataEnd = dataStart + frameSize;
      if (frameSize <= 0 || dataEnd > bytes.length + 1024) break;
      const data = bytes.subarray(dataStart, Math.min(dataEnd, bytes.length));

      if (id === 'TIT2' || id === 'TT2') {
        out.title = decodeId3Text(data) || out.title;
      } else if (id === 'TPE1' || id === 'TP1') {
        out.artist = decodeId3Text(data) || out.artist;
      } else if (id === 'TALB' || id === 'TAL') {
        out.album = decodeId3Text(data) || out.album;
      } else if ((id === 'APIC' || id === 'PIC') && !out.artUrl) {
        const pic = parseApic(data);
        if (pic) {
          out.artUrl = bytesToObjectUrl(pic.bytes, pic.mime);
          out.artSource = 'embedded';
        }
      }

      offset = dataEnd;
    }
  }

  // ID3v1 fallback for text
  const v1 = readId3v1(bytes);
  if (!out.title && v1.title) out.title = v1.title;
  if (!out.artist && v1.artist) out.artist = v1.artist;
  if (!out.album && v1.album) out.album = v1.album;

  return out;
}
