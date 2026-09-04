/**
 * Thin bridge to the Android MediaNotification Capacitor plugin.
 * No-ops on web / when the plugin is not registered.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

export type MediaAction = 'play' | 'pause' | 'next' | 'prev' | 'dismiss' | string;

interface MediaNotificationPlugin {
  show(opts: {
    title: string;
    artist?: string;
    playing: boolean;
    artBase64?: string;
  }): Promise<void>;
  update(opts: {
    title: string;
    artist?: string;
    playing: boolean;
    artBase64?: string;
  }): Promise<void>;
  hide(): Promise<void>;
  addListener(
    event: 'mediaAction',
    cb: (data: { action: MediaAction }) => void,
  ): Promise<{ remove: () => void }>;
}

const MediaNotification = registerPlugin<MediaNotificationPlugin>('MediaNotification');

export function isNativeMediaNotificationAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function showNativeMediaNotification(opts: {
  title: string;
  artist?: string;
  playing: boolean;
  artBase64?: string;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await MediaNotification.show(opts);
  } catch (e) {
    console.warn('[MediaNotification] show failed', e);
  }
}

export async function updateNativeMediaNotification(opts: {
  title: string;
  artist?: string;
  playing: boolean;
  artBase64?: string;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await MediaNotification.update(opts);
  } catch (e) {
    console.warn('[MediaNotification] update failed', e);
  }
}

export async function hideNativeMediaNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await MediaNotification.hide();
  } catch (e) {
    console.warn('[MediaNotification] hide failed', e);
  }
}

export async function onNativeMediaAction(
  cb: (action: MediaAction) => void,
): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => {};
  try {
    const handle = await MediaNotification.addListener('mediaAction', (data) => {
      cb((data?.action || '').toLowerCase());
    });
    return () => {
      try {
        handle.remove();
      } catch {
        /* ignore */
      }
    };
  } catch {
    return () => {};
  }
}
