import { MEDIA_PREVIEW_EXTENSIONS } from '../mediaKinds';

export type LoopMode = 'off' | 'one' | 'all';

export interface PlaylistTrack {
  path: string;
  name: string;
}

export interface PlaylistState {
  tracks: PlaylistTrack[];
  index: number;
  loop: LoopMode;
  shuffle: boolean;
  /** shuffled order of indices when shuffle is on */
  order: number[];
}

const mediaExtSet = new Set(
  MEDIA_PREVIEW_EXTENSIONS.map((e) => e.toLowerCase()),
);

export function isMediaFileName(name: string): boolean {
  const m = name.match(/\.[0-9a-z]+$/i);
  if (!m) return false;
  return mediaExtSet.has(m[0].toLowerCase());
}

export function trackName(path: string): string {
  return (path || '').split(/[/\\]/).pop() || path;
}

export function createPlaylist(
  paths: string[],
  currentPath: string,
  loop: LoopMode = 'all',
  shuffle = false,
): PlaylistState {
  const tracks = paths.map((path) => ({ path, name: trackName(path) }));
  let index = tracks.findIndex(
    (t) => t.path === currentPath || t.path.endsWith(currentPath),
  );
  if (index < 0) index = 0;
  const order = buildOrder(tracks.length, shuffle, index);
  return { tracks, index, loop, shuffle, order };
}

function buildOrder(n: number, shuffle: boolean, current: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  if (!shuffle || n <= 1) return order;
  // Fisher-Yates but keep current at front of remaining cycle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const at = order.indexOf(current);
  if (at > 0) {
    order.splice(at, 1);
    order.unshift(current);
  }
  return order;
}

export function setShuffle(state: PlaylistState, shuffle: boolean): PlaylistState {
  const order = buildOrder(state.tracks.length, shuffle, state.index);
  return { ...state, shuffle, order };
}

export function setLoop(state: PlaylistState, loop: LoopMode): PlaylistState {
  return { ...state, loop };
}

/** Index in tracks[] for "logical" next given shuffle order */
export function peekNextIndex(state: PlaylistState): number | null {
  const { tracks, index, loop, shuffle, order } = state;
  if (tracks.length === 0) return null;
  if (loop === 'one') return index;

  if (shuffle) {
    const pos = order.indexOf(index);
    if (pos < 0) return (index + 1) % tracks.length;
    if (pos + 1 < order.length) return order[pos + 1];
    return loop === 'all' ? order[0] : null;
  }

  if (index + 1 < tracks.length) return index + 1;
  return loop === 'all' ? 0 : null;
}

export function peekPrevIndex(state: PlaylistState): number | null {
  const { tracks, index, loop, shuffle, order } = state;
  if (tracks.length === 0) return null;
  if (loop === 'one') return index;

  if (shuffle) {
    const pos = order.indexOf(index);
    if (pos < 0) return index > 0 ? index - 1 : loop === 'all' ? tracks.length - 1 : null;
    if (pos > 0) return order[pos - 1];
    return loop === 'all' ? order[order.length - 1] : null;
  }

  if (index > 0) return index - 1;
  return loop === 'all' ? tracks.length - 1 : null;
}

export function goTo(state: PlaylistState, index: number): PlaylistState {
  if (index < 0 || index >= state.tracks.length) return state;
  return { ...state, index };
}
