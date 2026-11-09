// src/features/editor/monaco/monacoBoot.ts
//
// Phase 1 — SPCK smooth: single scroll owner + mobile core flags.
// Import once from monacoSetup / App entry BEFORE any editor mounts.

export type MsCodeCoreConfig = {
  /** When true, external useTouchScroll is a no-op; Monaco Gesture owns pan/inertia */
  useInternalTouchScroll: boolean;
  /** Minimap default override (also in monacoOptions) */
  enableMinimap?: boolean;
  enableOverviewRuler?: boolean;
};

declare global {
  interface Window {
    MS_CODE_CORE_CONFIG?: MsCodeCoreConfig;
    __monacoTouchScrolling?: boolean;
    __monacoAllowScrollApply?: boolean;
    __monacoScrollbarDragging?: boolean;
  }
}

const DEFAULTS: MsCodeCoreConfig = {
  useInternalTouchScroll: true,
  enableMinimap: false,
  enableOverviewRuler: false,
};

/** Idempotent — safe to call multiple times */
export function ensureMsCodeCoreConfig(partial?: Partial<MsCodeCoreConfig>): MsCodeCoreConfig {
  const w = window as Window;
  w.MS_CODE_CORE_CONFIG = {
    ...DEFAULTS,
    ...w.MS_CODE_CORE_CONFIG,
    ...partial,
  };
  return w.MS_CODE_CORE_CONFIG;
}

// Auto-run on module load
ensureMsCodeCoreConfig();
