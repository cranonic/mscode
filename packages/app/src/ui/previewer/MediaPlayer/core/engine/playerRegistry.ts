// Ensure only one MediaEngine is audibly active at a time.
// Also tracks which editor tab owns the active player so MainLayout can
// keep that tab mounted (LRU would otherwise unmount → destroy → stop audio).

import type { MediaEngine } from './MediaEngine';

const engines = new Set<MediaEngine>();
let active: MediaEngine | null = null;
let activeTabId: string | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

/** Subscribe to active-tab / active-engine changes (for layout pin). */
export function subscribeMediaRegistry(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function registerPlayer(engine: MediaEngine, tabId?: string): () => void {
  engines.add(engine);
  return () => {
    engines.delete(engine);
    if (active === engine) {
      active = null;
      if (activeTabId && tabId && activeTabId === tabId) {
        activeTabId = null;
        emit();
      } else if (activeTabId && !tabId) {
        // engine destroyed without tab id — clear if this was active
        activeTabId = null;
        emit();
      }
    }
  };
}

/** Call when this engine starts playing — pauses every other instance. */
export function claimPlayback(engine: MediaEngine, tabId?: string): void {
  active = engine;
  if (tabId) {
    activeTabId = tabId;
    emit();
  }
  for (const e of engines) {
    if (e !== engine) {
      try {
        e.pause();
      } catch {
        /* ignore */
      }
    }
  }
}

export function releasePlayback(engine: MediaEngine): void {
  if (active === engine) {
    active = null;
    // keep activeTabId so the tab stays pinned while paused on that track
  }
}

export function clearActiveMediaTab(tabId?: string): void {
  if (!tabId || activeTabId === tabId) {
    activeTabId = null;
    emit();
  }
}

export function pauseAllPlayers(): void {
  for (const e of engines) {
    try {
      e.pause();
    } catch {
      /* ignore */
    }
  }
}

export function getActivePlayer(): MediaEngine | null {
  return active;
}

export function getActiveMediaTabId(): string | null {
  return activeTabId;
}
