import { useEffect, useRef } from 'react';
import {
  useNotificationStore,
  type NotificationAction,
} from '@/store/notificationStore';
import type { EngineSnapshot } from '../core/engine/types';
import type { MediaMetadata as TagMeta } from '../core/metadata/types';
import {
  hideNativeMediaNotification,
  isNativeMediaNotificationAvailable,
  onNativeMediaAction,
  showNativeMediaNotification,
  updateNativeMediaNotification,
} from '../native/mediaNotification';

export const MEDIA_NOTIF_ID = 'mscode-now-playing';

/**
 * Sticky in-app "Now Playing" notification with transport controls.
 * Also drives the Android system MediaStyle notification when the native
 * plugin is registered.
 *
 * Behaviour (requested):
 * - While playing → notification present with Play/Pause · Prev · Next
 * - If user dismisses it while still playing → it comes back (sticky)
 * - After a dismiss+restore cycle, re-show without outer toast flash when possible
 * - New track / fresh play → toast visible again
 * - Paused / stopped → can be dismissed permanently until play resumes
 */
export function useMediaNowPlaying(opts: {
  meta: TagMeta;
  snap: EngineSnapshot;
  fileLabel: string;
  onPlay: () => void;
  onPause: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}) {
  const { meta, snap, fileLabel, onPlay, onPause, onNext, onPrev } = opts;
  const suppressOuterToast = useRef(false);
  const lastTitleRef = useRef<string>('');
  const playingRef = useRef(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  playingRef.current = snap.state === 'playing';

  // Native media-action buttons → JS transport
  useEffect(() => {
    if (!isNativeMediaNotificationAvailable()) return;
    let remove: (() => void) | undefined;
    void onNativeMediaAction((action) => {
      const o = optsRef.current;
      if (action === 'play') o.onPlay();
      else if (action === 'pause') o.onPause();
      else if (action === 'next') o.onNext?.();
      else if (action === 'prev') o.onPrev?.();
      else if (action === 'dismiss') {
        // sticky: if still playing, native service will be restarted by next effect
        if (playingRef.current) {
          suppressOuterToast.current = true;
        }
      }
    }).then((r) => {
      remove = r;
    });
    return () => remove?.();
  }, []);

  // Re-assert in-app notification if something removes it while still playing
  useEffect(() => {
    const unsub = useNotificationStore.subscribe((state, prev) => {
      if (!playingRef.current) return;
      const had = prev.notifications.some((n) => n.id === MEDIA_NOTIF_ID);
      const has = state.notifications.some((n) => n.id === MEDIA_NOTIF_ID);
      if (had && !has) {
        suppressOuterToast.current = true;
        queueMicrotask(() => {
          if (!playingRef.current) return;
          const o = optsRef.current;
          pushNowPlaying({
            meta: o.meta,
            snap: { ...o.snap, state: 'playing' },
            fileLabel: o.fileLabel,
            onPlay: o.onPlay,
            onPause: o.onPause,
            onNext: o.onNext,
            onPrev: o.onPrev,
            asToast: false,
          });
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const title = meta.title || fileLabel || 'MSCode Media';
    const isPlaying = snap.state === 'playing';
    const isActive =
      isPlaying ||
      snap.state === 'paused' ||
      snap.state === 'ready' ||
      snap.state === 'loading';

    if (!isActive) {
      useNotificationStore.getState().removeNotification(MEDIA_NOTIF_ID);
      void hideNativeMediaNotification();
      suppressOuterToast.current = false;
      lastTitleRef.current = '';
      return;
    }

    const trackChanged = title !== lastTitleRef.current;
    if (trackChanged) {
      lastTitleRef.current = title;
      suppressOuterToast.current = false;
    }

    const showToast = isPlaying && !suppressOuterToast.current;
    pushNowPlaying({
      meta,
      snap,
      fileLabel,
      onPlay,
      onPause,
      onNext,
      onPrev,
      asToast: showToast,
    });

    // Android system notification (foreground service)
    if (isNativeMediaNotificationAvailable()) {
      const payload = {
        title,
        artist: meta.artist || '',
        playing: isPlaying,
      };
      if (isPlaying || trackChanged) {
        void showNativeMediaNotification(payload);
      } else {
        void updateNativeMediaNotification(payload);
      }
    }
  }, [
    meta.title,
    meta.artist,
    meta.album,
    meta.artUrl,
    snap.state,
    fileLabel,
    onPlay,
    onPause,
    onNext,
    onPrev,
  ]);
}

function pushNowPlaying(args: {
  meta: TagMeta;
  snap: EngineSnapshot;
  fileLabel: string;
  onPlay: () => void;
  onPause: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  asToast: boolean;
}) {
  const { meta, snap, fileLabel, onPlay, onPause, onNext, onPrev, asToast } =
    args;
  const store = useNotificationStore.getState();
  const playing = snap.state === 'playing';
  const title = meta.title || fileLabel || 'MSCode Media';
  const message = [meta.artist, meta.album].filter(Boolean).join(' · ') ||
    (playing ? 'Playing' : 'Paused');

  const actions: NotificationAction[] = [
    {
      label: playing ? 'Pause' : 'Play',
      onClick: () => (playing ? onPause() : onPlay()),
      variant: 'type1',
    },
  ];
  if (onPrev) {
    actions.push({
      label: 'Prev',
      onClick: () => onPrev(),
      variant: 'type2',
    });
  }
  if (onNext) {
    actions.push({
      label: 'Next',
      onClick: () => onNext(),
      variant: 'type2',
    });
  }

  // Fixed id → update in place
  store.addNotification({
    id: MEDIA_NOTIF_ID,
    type: 'info',
    title: playing ? `▶ ${title}` : `❚❚ ${title}`,
    message,
    source: 'Media Player',
    iconUrl: meta.artUrl || undefined,
    actions,
  });

  // After add, force toast flag (addNotification always sets isToast true for new)
  if (!asToast) {
    store.dismissToast(MEDIA_NOTIF_ID);
  }
}
