/**
 * Global single-audible-player registry.
 * Lives in core so MainLayout can pin media tabs even when the player
 * UI runs inside an external extension.
 */

export interface AudibleEngine {
  pause(): void;
}

const engines = new Set<AudibleEngine>();
let active: AudibleEngine | null = null;
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

export function subscribeMediaRegistry(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function registerPlayer(engine: AudibleEngine, tabId?: string): () => void {
  engines.add(engine);
  return () => {
    engines.delete(engine);
    if (active === engine) {
      active = null;
      if (activeTabId && tabId && activeTabId === tabId) {
        activeTabId = null;
        emit();
      } else if (activeTabId && !tabId) {
        activeTabId = null;
        emit();
      }
    }
  };
}

export function claimPlayback(engine: AudibleEngine, tabId?: string): void {
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

export function releasePlayback(engine: AudibleEngine): void {
  if (active === engine) {
    active = null;
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

export function getActivePlayer(): AudibleEngine | null {
  return active;
}

export function getActiveMediaTabId(): string | null {
  return activeTabId;
}

/** Bridge for extension sandbox — real window, not the sandbox proxy. */
export function installMediaRegistryGlobal(): void {
  try {
    const g = typeof window !== 'undefined' ? window : null;
    if (!g) return;
    (g as any).__msMediaRegistry = {
      registerPlayer,
      claimPlayback,
      releasePlayback,
      clearActiveMediaTab,
      pauseAllPlayers,
      getActivePlayer,
      getActiveMediaTabId,
      subscribeMediaRegistry,
    };
  } catch {
    /* ignore */
  }
}
