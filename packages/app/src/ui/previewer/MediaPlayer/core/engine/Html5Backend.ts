// HTML5 <audio> / <video> backend
import type { MediaBackend } from './types';

export class Html5Backend implements MediaBackend {
  readonly element: HTMLMediaElement;

  constructor(kind: 'audio' | 'video') {
    if (kind === 'video') {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.playsInline = true;
      video.controls = false;
      this.element = video;
    } else {
      const audio = document.createElement('audio');
      audio.preload = 'auto';
      this.element = audio;
    }
  }

  async load(url: string, mimeHint?: string): Promise<void> {
    const el = this.element;
    el.pause();

    // Clear previous sources (src attribute + <source> children)
    el.removeAttribute('src');
    while (el.firstChild) el.removeChild(el.firstChild);
    // Reset internal error state
    try {
      el.load();
    } catch {
      /* ignore */
    }

    // Prefer <source type="..."> so Android WebView can pick a decoder.
    // Blob/object URLs often fail "no supported sources" without an explicit type.
    const source = document.createElement('source');
    source.src = url;
    if (mimeHint) source.type = mimeHint;
    el.appendChild(source);

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const onReady = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onErr = () => {
        if (settled) return;
        settled = true;
        cleanup();
        const code = el.error?.code;
        const msg =
          el.error?.message ||
          (code === 4
            ? 'The element has no supported sources.'
            : code === 2
              ? 'Network error while loading media'
              : code === 3
                ? 'Media decode error'
                : 'Failed to load media');
        reject(new Error(msg));
      };
      const cleanup = () => {
        el.removeEventListener('loadedmetadata', onReady);
        el.removeEventListener('canplay', onReady);
        el.removeEventListener('error', onErr);
        source.removeEventListener('error', onErr);
      };
      el.addEventListener('loadedmetadata', onReady);
      el.addEventListener('canplay', onReady);
      el.addEventListener('error', onErr);
      source.addEventListener('error', onErr);
      el.load();
    });
  }

  async play(): Promise<void> {
    await this.element.play();
  }

  pause(): void {
    this.element.pause();
  }

  seek(time: number): void {
    if (Number.isFinite(time)) this.element.currentTime = Math.max(0, time);
  }

  setVolume(v: number): void {
    this.element.volume = Math.min(1, Math.max(0, v));
  }

  setMuted(m: boolean): void {
    this.element.muted = m;
  }

  setRate(r: number): void {
    this.element.playbackRate = r;
  }

  destroy(): void {
    const el = this.element;
    el.pause();
    el.removeAttribute('src');
    while (el.firstChild) el.removeChild(el.firstChild);
    try {
      el.load();
    } catch {
      /* ignore */
    }
    el.remove();
  }
}
