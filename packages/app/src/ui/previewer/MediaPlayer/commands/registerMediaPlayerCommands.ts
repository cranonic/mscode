import { commands } from '@/core/extensionAPI/registry/commandRegistry';

let registered = false;

/**
 * Command palette entries for the media player.
 * Safe to call multiple times.
 */
export function registerMediaPlayerCommands(): void {
  if (registered) return;
  registered = true;

  const openSettings = () => {
    document.dispatchEvent(new CustomEvent('ms-mediaplayer-open-settings'));
  };

  const playPause = () => {
    document.dispatchEvent(new CustomEvent('ms-mediaplayer-play-pause'));
  };

  const next = () => {
    document.dispatchEvent(new CustomEvent('ms-mediaplayer-next'));
  };

  const prev = () => {
    document.dispatchEvent(new CustomEvent('ms-mediaplayer-prev'));
  };

  try {
    commands.registerCommand(
      'mediaplayer.openSettings',
      openSettings,
      { title: 'Media Player: Open Settings' },
    );
    commands.registerCommand(
      'mediaplayer.playPause',
      playPause,
      { title: 'Media Player: Play / Pause' },
    );
    commands.registerCommand(
      'mediaplayer.next',
      next,
      { title: 'Media Player: Next Track' },
    );
    commands.registerCommand(
      'mediaplayer.previous',
      prev,
      { title: 'Media Player: Previous Track' },
    );
  } catch (e) {
    console.warn('[MediaPlayer] command register failed', e);
  }
}
