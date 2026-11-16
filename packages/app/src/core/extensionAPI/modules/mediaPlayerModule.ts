/**
 * Lightweight media helper for other extensions.
 * Full player UI lives in the `mscode.vlc-player` extension.
 * This module only opens a media tab + talks to the global audible registry.
 */
import { useTabStore } from '@/store/tabStore';
import { detectMediaMode } from '@/core/media/mediaKinds';
import {
  getActivePlayer,
  pauseAllPlayers,
  getActiveMediaTabId,
} from '@/core/media/playerRegistry';

function fileNameOf(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || path;
}

export interface OpenMediaOptions {
  mode?: 'audio' | 'video';
  focus?: boolean;
}

export function openMedia(uri: string, opts?: OpenMediaOptions): void {
  if (!uri) return;
  const mode = opts?.mode ?? detectMediaMode(uri);
  const isMedia = mode !== 'unknown' || !!opts?.mode;
  useTabStore.getState().addTab({
    id: uri,
    type: 'code',
    title: fileNameOf(uri),
    filePath: uri,
    ...(isMedia ? { showStatusBar: false, showBreadcrumb: false } : {}),
  });
}

export const createMediaPlayerModule = (_extId: string) => ({
  open: openMedia,
  getActivePlayer,
  getActiveMediaTabId,
  pauseAll: pauseAllPlayers,
  /**
   * Backend / visualizer registration is owned by the VLC Player extension.
   * Stubs kept so older call sites don't crash.
   */
  registerBackend: () => () => {},
  unregisterBackend: () => {},
  listBackends: () => [],
  registerVisualizer: () => () => {},
  unregisterVisualizer: () => {},
  listVisualizers: () => [],
  setPreferredVisualizer: () => {},
  getActiveSnapshot: () => {
    const p = getActivePlayer() as any;
    return p?.getSnapshot?.() ?? null;
  },
});
