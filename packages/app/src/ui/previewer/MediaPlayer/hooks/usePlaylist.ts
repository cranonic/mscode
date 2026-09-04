import { useCallback, useEffect, useState } from 'react';
import { loadFolderTracks } from '../core/playlist/loadFolderTracks';
import {
  createPlaylist,
  goTo,
  peekNextIndex,
  peekPrevIndex,
  setLoop,
  setShuffle,
  type LoopMode,
  type PlaylistState,
} from '../core/playlist/PlaylistModel';
import { loadPrefs, savePrefs } from '../core/playlist/sessionStore';

export function usePlaylist(initialPath: string) {
  const prefs = loadPrefs();
  const [activePath, setActivePath] = useState(initialPath);
  const [playlist, setPlaylist] = useState<PlaylistState>(() =>
    createPlaylist([initialPath], initialPath, prefs.loop, prefs.shuffle),
  );
  const [ready, setReady] = useState(false);

  // Load folder siblings when seed path changes from outside
  useEffect(() => {
    let alive = true;
    setReady(false);
    loadFolderTracks(initialPath).then((paths) => {
      if (!alive) return;
      const p = loadPrefs();
      setPlaylist(createPlaylist(paths, initialPath, p.loop, p.shuffle));
      setActivePath(initialPath);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [initialPath]);

  const current = playlist.tracks[playlist.index] || {
    path: activePath,
    name: activePath,
  };

  const selectIndex = useCallback((index: number) => {
    setPlaylist((s) => {
      const next = goTo(s, index);
      const track = next.tracks[next.index];
      if (track) setActivePath(track.path);
      return next;
    });
  }, []);

  const next = useCallback(() => {
    setPlaylist((s) => {
      const ni = peekNextIndex(s);
      if (ni == null) return s;
      const nextState = goTo(s, ni);
      const track = nextState.tracks[nextState.index];
      if (track) setActivePath(track.path);
      return nextState;
    });
  }, []);

  const prev = useCallback(() => {
    setPlaylist((s) => {
      const pi = peekPrevIndex(s);
      if (pi == null) return s;
      const nextState = goTo(s, pi);
      const track = nextState.tracks[nextState.index];
      if (track) setActivePath(track.path);
      return nextState;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlaylist((s) => {
      const nextState = setShuffle(s, !s.shuffle);
      savePrefs({ shuffle: nextState.shuffle });
      return nextState;
    });
  }, []);

  const cycleLoop = useCallback(() => {
    setPlaylist((s) => {
      const order: LoopMode[] = ['off', 'all', 'one'];
      const i = order.indexOf(s.loop);
      const loop = order[(i + 1) % order.length];
      savePrefs({ loop });
      return setLoop(s, loop);
    });
  }, []);

  return {
    playlist,
    activePath,
    current,
    ready,
    selectIndex,
    next,
    prev,
    toggleShuffle,
    cycleLoop,
    hasNext: peekNextIndex(playlist) != null,
    hasPrev: peekPrevIndex(playlist) != null,
  };
}
