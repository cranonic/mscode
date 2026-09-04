/** Decode fs.readFile string (base64 or data-URL) to bytes. */
export function filePayloadToBytes(raw: string): Uint8Array {
  if (!raw) return new Uint8Array(0);
  if (raw.startsWith('data:')) {
    const i = raw.indexOf(',');
    const b64 = i >= 0 ? raw.slice(i + 1) : raw;
    return base64ToBytes(b64);
  }
  // Heuristic: pure base64 from Capacitor Filesystem
  try {
    return base64ToBytes(raw);
  } catch {
    // UTF-8 fallback (unlikely for binary media)
    const enc = new TextEncoder();
    return enc.encode(raw);
  }
}

export function base64ToBytes(b64: string): Uint8Array {
  const pure = b64.replace(/\s/g, '');
  const bin = atob(pure);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToObjectUrl(bytes: Uint8Array, mime: string): string {
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const blob = new Blob([copy], { type: mime });
  return URL.createObjectURL(blob);
}

export function dirname(filePath: string): string {
  const norm = filePath.replace(/\\/g, '/');
  const i = norm.lastIndexOf('/');
  return i >= 0 ? norm.slice(0, i) : '';
}

export function joinPath(dir: string, name: string): string {
  if (!dir) return name;
  return dir.endsWith('/') ? dir + name : dir + '/' + name;
}
