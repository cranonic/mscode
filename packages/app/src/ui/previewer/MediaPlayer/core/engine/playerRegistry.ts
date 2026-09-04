// Ensure only one MediaEngine is audibly active at a time.

import type { MediaEngine } from './MediaEngine';

const engines = new Set<MediaEngine>();
let active: MediaEngine | null = null;

export function registerPlayer(engine: MediaEngine): () => void {
  engines.add(engine);
  return () => {
    engines.delete(engine);
    if (active === engine) active = null;
  };
}

/** Call when this engine starts playing — pauses every other instance. */
export function claimPlayback(engine: MediaEngine): void {
  active = engine;
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
