import { useEffect } from 'react';
import type { MediaEngine } from '../core/engine/MediaEngine';
import {
  claimPlayback,
  clearActiveMediaTab,
  registerPlayer,
} from '../core/engine/playerRegistry';
import type { EngineSnapshot } from '../core/engine/types';

/**
 * - Register engine in global registry (single audible player)
 * - Claim playback when this instance starts playing
 * - Pin owning tab so LRU / tab switch does NOT unmount the player
 *
 * Intentionally does NOT pause on document.hidden or IntersectionObserver —
 * media must keep playing in the background when the user switches tabs or
 * leaves the app (notification / media-session controls handle UX).
 */
export function usePlayerLifecycle(
  engineRef: React.MutableRefObject<MediaEngine | null>,
  snap: EngineSnapshot,
  _rootRef: React.RefObject<HTMLElement | null>,
  tabId?: string,
) {
  // Registry membership (re-bind when engine recreates after path change)
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    return registerPlayer(engine, tabId);
  }, [engineRef, snap.state, tabId]);

  // Claim when playing so other instances mute and layout pins this tab
  useEffect(() => {
    if (snap.state !== 'playing') return;
    const engine = engineRef.current;
    if (engine) claimPlayback(engine, tabId);
  }, [snap.state, engineRef, tabId]);

  // When this player unmounts entirely, drop the pin
  useEffect(() => {
    return () => {
      if (tabId) clearActiveMediaTab(tabId);
    };
  }, [tabId]);
}
