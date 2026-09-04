import { useEffect } from 'react';
import type { EngineSnapshot } from '../core/engine/types';
import type { MediaMetadata as TagMeta } from '../core/metadata/types';

/**
 * Wire navigator.mediaSession (lock screen / headset / OS media keys).
 */
export function useMediaSession(opts: {
  enabled?: boolean;
  meta: TagMeta;
  snap: EngineSnapshot;
  onPlay: () => void;
  onPause: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeek?: (time: number) => void;
}) {
  const { enabled = true, meta, snap, onPlay, onPause, onNext, onPrev, onSeek } =
    opts;

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }
    const ms = navigator.mediaSession;

    try {
      const artwork: MediaImage[] = [];
      if (meta.artUrl) {
        artwork.push({
          src: meta.artUrl,
          sizes: '512x512',
          type: 'image/jpeg',
        });
      }
      ms.metadata = new MediaMetadata({
        title: meta.title || 'MSCode Media',
        artist: meta.artist || '',
        album: meta.album || '',
        artwork,
      });
    } catch {
      /* older webviews */
    }

    const setHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* unsupported action */
      }
    };

    setHandler('play', () => onPlay());
    setHandler('pause', () => onPause());
    setHandler('previoustrack', onPrev ? () => onPrev() : null);
    setHandler('nexttrack', onNext ? () => onNext() : null);
    setHandler('seekto', (details) => {
      if (details.seekTime != null && onSeek) onSeek(details.seekTime);
    });
    setHandler('seekbackward', (details) => {
      const off = details.seekOffset ?? 10;
      if (onSeek) onSeek(Math.max(0, snap.currentTime - off));
    });
    setHandler('seekforward', (details) => {
      const off = details.seekOffset ?? 10;
      if (onSeek) {
        const d = snap.duration || snap.currentTime + off;
        onSeek(Math.min(d, snap.currentTime + off));
      }
    });

    return () => {
      setHandler('play', null);
      setHandler('pause', null);
      setHandler('previoustrack', null);
      setHandler('nexttrack', null);
      setHandler('seekto', null);
      setHandler('seekbackward', null);
      setHandler('seekforward', null);
    };
  }, [
    enabled,
    meta.title,
    meta.artist,
    meta.album,
    meta.artUrl,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onSeek,
    snap.currentTime,
    snap.duration,
  ]);

  // Playback state + position state
  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }
    const ms = navigator.mediaSession;
    try {
      if (snap.state === 'playing') ms.playbackState = 'playing';
      else if (snap.state === 'paused' || snap.state === 'ready')
        ms.playbackState = 'paused';
      else ms.playbackState = 'none';
    } catch {
      /* ignore */
    }

    try {
      if (
        snap.duration > 0 &&
        'setPositionState' in ms &&
        typeof ms.setPositionState === 'function'
      ) {
        ms.setPositionState({
          duration: snap.duration,
          position: Math.min(snap.currentTime, snap.duration),
          playbackRate: snap.rate || 1,
        });
      }
    } catch {
      /* ignore */
    }
  }, [enabled, snap.state, snap.currentTime, snap.duration, snap.rate]);
}
