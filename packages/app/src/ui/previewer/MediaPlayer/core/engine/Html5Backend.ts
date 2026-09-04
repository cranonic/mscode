// HTML5 <audio> / <video> backend
import type { MediaBackend } from './types';

export class Html5Backend implements MediaBackend {
  readonly element: HTMLMediaElement;

  constructor(kind: 'audio' | 'video') {
    this.element =
      kind === 'video'
        ? document.createElement('video')
        : document.createElement('audio');
    this.element.preload = 'metadata';
    this.element.playsInline = true;
    (this.element as HTMLVideoElement).controls = false;
  }

  async load(url: string, _mimeHint?: string): Promise<void> {
    const el = this.element;
    el.pause();
    el.removeAttribute('src');
    el.load();
    el.src = url;
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onErr = () => {
        cleanup();
        reject(new Error(el.error?.message || 'Failed to load media'));
      };
      const cleanup = () => {
        el.removeEventListener('loadedmetadata', onReady);
        el.removeEventListener('error', onErr);
      };
      el.addEventListener('loadedmetadata', onReady);
      el.addEventListener('error', onErr);
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
    el.load();
    el.remove();
  }
}
