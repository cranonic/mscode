import { useEffect, useRef } from 'react';
import type { MediaEngine } from '../core/engine/MediaEngine';
import {
  claimPlayback,
  pauseAllPlayers,
  registerPlayer,
} from '../core/engine/playerRegistry';
import type { EngineSnapshot } from '../core/engine/types';

/**
 * - Register engine in global registry (single audible player)
 * - Pause when document is hidden
 * - Claim playback when this instance starts playing
 */
export function usePlayerLifecycle(
  engineRef: React.MutableRefObject<MediaEngine | null>,
  snap: EngineSnapshot,
  rootRef: React.RefObject<HTMLElement | null>,
) {
  // Registry membership
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    return registerPlayer(engine);
  }, [engineRef, snap.state]); // re-bind after engine recreate (path change)

  // Claim when playing
  useEffect(() => {
    if (snap.state !== 'playing') return;
    const engine = engineRef.current;
    if (engine) claimPlayback(engine);
  }, [snap.state, engineRef]);

  // Pause when tab/app hidden
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        pauseAllPlayers();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Pause when player root is not displayed (inactive editor tab)
  const wasVisible = useRef(true);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = !!entry?.isIntersecting && entry.intersectionRatio > 0;
        if (wasVisible.current && !visible) {
          engineRef.current?.pause();
        }
        wasVisible.current = visible;
      },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootRef, engineRef]);
}
