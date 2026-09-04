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
 *
 * Crash fix (Android 12+/15 ForegroundServiceDidNotStartInTimeException):
 * Engine state churns loading → ready → playing in a few ms. Each change used
 * to fire show()/update(), and both paths called startForegroundService() on
 * the native side. We now:
 *  - call show() only once when the native notification is first needed
 *    (or when the track changes while active)
 *  - call update() for subsequent state flips
 *  - debounce rapid successive native calls (~80ms) so a single FG start
 *    window is enough even on mid-range devices
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

  // Native side: has the system notification been shown at least once for
  // the current "session" (until hide / inactive)?
  const nativeShownRef = useRef(false);
  // Debounce handle for native show/update
  const nativeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Last payload we actually sent (to skip identical updates)
  const lastNativePayloadRef = useRef<string>('');

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
          // Dismiss means service is stopping — allow a fresh show() next time
          nativeShownRef.current = false;
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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (nativeDebounceRef.current) {
        clearTimeout(nativeDebounceRef.current);
        nativeDebounceRef.current = null;
      }
    };
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
      nativeShownRef.current = false;
      lastNativePayloadRef.current = '';
      if (nativeDebounceRef.current) {
        clearTimeout(nativeDebounceRef.current);
        nativeDebounceRef.current = null;
      }
      return;
    }

    const trackChanged = title !== lastTitleRef.current;
    if (trackChanged) {
      lastTitleRef.current = title;
      suppressOuterToast.current = false;
      // New track → allow a fresh show() so metadata is correct
      nativeShownRef.current = false;
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
      const payloadKey = `${payload.title}|${payload.artist}|${payload.playing}`;

      // Skip if identical to what we already sent
      if (payloadKey === lastNativePayloadRef.current && nativeShownRef.current) {
        return;
      }

      // Debounce rapid state churn (loading → ready → playing)
      if (nativeDebounceRef.current) {
        clearTimeout(nativeDebounceRef.current);
      }
      nativeDebounceRef.current = setTimeout(() => {
        nativeDebounceRef.current = null;
        const key = `${payload.title}|${payload.artist}|${payload.playing}`;
        lastNativePayloadRef.current = key;

        if (!nativeShownRef.current || trackChanged) {
          nativeShownRef.current = true;
          void showNativeMediaNotification(payload);
        } else {
          void updateNativeMediaNotification(payload);
        }
      }, 80);
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
