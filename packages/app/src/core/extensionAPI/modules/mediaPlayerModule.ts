/**
 * Extension-facing Media Player API.
 * Exposed as mscode.mediaPlayer.*
 */
import {
  openMedia,
  registerBackend,
  unregisterBackend,
  listBackends,
  registerVisualizer,
  unregisterVisualizer,
  listVisualizers,
  setPreferredVisualizer,
  getActivePlayer,
  getActiveSnapshot,
  pauseAll,
  type BackendFactory,
  type VisualizerContribution,
  type OpenMediaOptions,
} from '@/ui/previewer/MediaPlayer/core/api/mediaPlayerAPI';

export type { BackendFactory, VisualizerContribution, OpenMediaOptions };

export const createMediaPlayerModule = (_extId: string) => ({
  /**
   * Open a media file in the built-in VLC Player tab.
   * @example
   * mscode.mediaPlayer.open('/sdcard/Music/song.mp3');
   * mscode.mediaPlayer.open(path, { mode: 'audio' });
   */
  open: openMedia,

  /**
   * Register a custom playback backend (e.g. wasm decoder).
   * Higher priority overrides Html5Backend (priority 0).
   * @returns dispose function
   */
  registerBackend,

  unregisterBackend,

  listBackends,

  /**
   * Register a custom audio visualizer React component.
   * @returns dispose function
   */
  registerVisualizer,

  unregisterVisualizer,

  listVisualizers,

  /** Prefer a visualizer by id (settings). null = auto. */
  setPreferredVisualizer,

  /** Active MediaEngine instance, if any */
  getActivePlayer,

  /** Snapshot of the active player (or null) */
  getActiveSnapshot,

  /** Pause every open player tab */
  pauseAll,
});
