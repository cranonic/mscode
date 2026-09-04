// Facade over Html5Backend + object-URL lifecycle
import { fs } from '@/core/fileSystem';
import { Html5Backend } from './Html5Backend';
import type { EngineListener, EngineSnapshot, EngineState, MediaBackend } from './types';
import { detectMediaMode, extensionOf } from '../mediaKinds';

const MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  m4v: 'video/mp4',
};

function base64ToBytes(b64: string): Uint8Array {
  const pure = b64.includes(',') ? b64.split(',')[1] : b64;
  const bin = atob(pure);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export class MediaEngine {
  private backend: MediaBackend | null = null;
  private objectUrl: string | null = null;
  private listeners = new Set<EngineListener>();
  private snap: EngineSnapshot = {
    state: 'idle',
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    muted: false,
    rate: 1,
    error: null,
  };
  private unbind: (() => void) | null = null;

  subscribe(fn: EngineListener): () => void {
    this.listeners.add(fn);
    fn(this.snap);
    return () => this.listeners.delete(fn);
  }

  getSnapshot(): EngineSnapshot {
    return this.snap;
  }

  getMediaElement(): HTMLMediaElement | null {
    return this.backend?.element ?? null;
  }

  private emit(patch: Partial<EngineSnapshot> & { state?: EngineState }) {
    this.snap = { ...this.snap, ...patch };
    for (const l of this.listeners) l(this.snap);
  }

  private bindElement(el: HTMLMediaElement) {
    this.unbind?.();
    const onTime = () =>
      this.emit({
        currentTime: el.currentTime || 0,
        duration: Number.isFinite(el.duration) ? el.duration : this.snap.duration,
      });
    const onPlay = () => this.emit({ state: 'playing' });
    const onPause = () => {
      if (this.snap.state !== 'ended' && this.snap.state !== 'error') {
        this.emit({ state: 'paused' });
      }
    };
    const onEnded = () => this.emit({ state: 'ended', currentTime: el.duration || 0 });
    const onErr = () =>
      this.emit({
        state: 'error',
        error: el.error?.message || 'Playback error',
      });
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onErr);
    el.addEventListener('durationchange', onTime);
    this.unbind = () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onErr);
      el.removeEventListener('durationchange', onTime);
    };
  }

  async openFile(filePath: string, opts?: { autoplay?: boolean; volume?: number; startTime?: number }): Promise<void> {
    this.disposeMediaOnly();
    const mode = detectMediaMode(filePath);
    if (mode === 'unknown') {
      this.emit({ state: 'error', error: 'Unsupported media type' });
      return;
    }

    this.emit({ state: 'loading', error: null, currentTime: 0, duration: 0 });

    try {
      const raw = await fs.readFile(filePath);
      const ext = extensionOf(filePath);
      const mime = MIME[ext] || (mode === 'video' ? 'video/mp4' : 'audio/mpeg');

      let url: string;
      if (typeof raw === 'string' && raw.startsWith('blob:')) {
        url = raw;
      } else if (typeof raw === 'string' && raw.startsWith('data:')) {
        url = raw;
      } else if (typeof raw === 'string') {
        const bytes = base64ToBytes(raw);
        const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: mime });
        url = URL.createObjectURL(blob);
        this.objectUrl = url;
      } else {
        const blob = new Blob([raw as BlobPart], { type: mime });
        url = URL.createObjectURL(blob);
        this.objectUrl = url;
      }

      const backend = new Html5Backend(mode === 'video' ? 'video' : 'audio');
      this.backend = backend;
      this.bindElement(backend.element);

      const vol = opts?.volume ?? this.snap.volume;
      backend.setVolume(vol);
      this.emit({ volume: vol });

      await backend.load(url, mime);
      const duration = Number.isFinite(backend.element.duration)
        ? backend.element.duration
        : 0;
      this.emit({ state: 'ready', duration });

      const start = opts?.startTime ?? 0;
      if (start > 1 && (!duration || start < duration - 2)) {
        backend.seek(start);
        this.emit({ currentTime: start });
      }

      if (opts?.autoplay !== false) {
        try {
          await backend.play();
        } catch {
          this.emit({ state: 'paused' });
        }
      } else {
        this.emit({ state: 'paused' });
      }
    } catch (e: any) {
      this.emit({
        state: 'error',
        error: e?.message || String(e) || 'Failed to open media',
      });
    }
  }

  async togglePlay(): Promise<void> {
    if (!this.backend) return;
    if (this.snap.state === 'playing') {
      this.backend.pause();
    } else {
      try {
        await this.backend.play();
      } catch (e: any) {
        this.emit({ state: 'error', error: e?.message || 'Play failed' });
      }
    }
  }

  pause(): void {
    this.backend?.pause();
  }

  seek(time: number): void {
    this.backend?.seek(time);
    this.emit({ currentTime: time });
  }

  setVolume(v: number): void {
    this.backend?.setVolume(v);
    this.emit({ volume: v, muted: v === 0 ? this.snap.muted : this.snap.muted });
  }

  setMuted(m: boolean): void {
    this.backend?.setMuted(m);
    this.emit({ muted: m });
  }

  setRate(r: number): void {
    this.backend?.setRate(r);
    this.emit({ rate: r });
  }

  private disposeMediaOnly() {
    this.unbind?.();
    this.unbind = null;
    this.backend?.destroy();
    this.backend = null;
    if (this.objectUrl) {
      try {
        URL.revokeObjectURL(this.objectUrl);
      } catch {
        /* ignore */
      }
      this.objectUrl = null;
    }
  }

  destroy(): void {
    this.disposeMediaOnly();
    this.listeners.clear();
    this.emit({ state: 'idle', currentTime: 0, duration: 0, error: null });
  }
}
