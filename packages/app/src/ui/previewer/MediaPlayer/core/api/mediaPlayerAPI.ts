/**
 * Public Media Player API surface used by other extensions via mscode.mediaPlayer.
 */
import { useTabStore } from '@/store/tabStore';
import { detectMediaMode } from '../mediaKinds';
import {
  registerBackend,
  unregisterBackend,
  listBackends,
  type BackendFactory,
} from './backendRegistry';
import {
  registerVisualizer,
  unregisterVisualizer,
  listVisualizers,
  setPreferredVisualizer,
  type VisualizerContribution,
} from './visualizerRegistry';
import {
  getActivePlayer,
  pauseAllPlayers,
} from '../engine/playerRegistry';
import type { EngineSnapshot } from '../engine/types';

export interface OpenMediaOptions {
  /** Force mode; default auto-detect from path */
  mode?: 'audio' | 'video';
  /** Focus the tab after open (default true) */
  focus?: boolean;
}

function fileNameOf(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || path;
}

/**
 * Open a local media file in the VLC Player previewer tab.
 * Same path as explorer double-click.
 */
export function openMedia(uri: string, opts?: OpenMediaOptions): void {
  if (!uri) return;
  const mode = opts?.mode ?? detectMediaMode(uri);
  if (mode === 'unknown' && !opts?.mode) {
    console.warn('[mediaPlayer.open] unknown media type for', uri);
  }
  const isMedia = mode !== 'unknown' || !!opts?.mode;
  useTabStore.getState().addTab({
    id: uri,
    type: 'code',
    title: fileNameOf(uri),
    filePath: uri,
    ...(isMedia
      ? { showStatusBar: false, showBreadcrumb: false }
      : {}),
  });
}

export function getActiveSnapshot(): EngineSnapshot | null {
  return getActivePlayer()?.getSnapshot() ?? null;
}

export function pauseAll(): void {
  pauseAllPlayers();
}

export type {
  BackendFactory,
  VisualizerContribution,
  EngineSnapshot,
};

export {
  registerBackend,
  unregisterBackend,
  listBackends,
  registerVisualizer,
  unregisterVisualizer,
  listVisualizers,
  setPreferredVisualizer,
  getActivePlayer,
};
