// Persist playhead + player preferences (localStorage)

const POS_KEY = 'mscode.mediaPlayer.positions';
const PREFS_KEY = 'mscode.mediaPlayer.prefs';

export type LoopModePref = 'off' | 'one' | 'all';
export type MotionPref = 'full' | 'reduced' | 'off';

export interface PlayerPrefs {
  loop: LoopModePref;
  shuffle: boolean;
  volume: number;
  autoplay: boolean;
  restorePosition: boolean;
  followIdeTheme: boolean;
  reducedMotion: boolean;
  motion: MotionPref;
  defaultRate: number;
  showPlaylistOnOpen: boolean;
}

const defaultPrefs: PlayerPrefs = {
  loop: 'all',
  shuffle: false,
  volume: 0.85,
  autoplay: true,
  restorePosition: true,
  followIdeTheme: true,
  reducedMotion: false,
  motion: 'full',
  defaultRate: 1,
  showPlaylistOnOpen: false,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadPrefs(): PlayerPrefs {
  if (typeof localStorage === 'undefined') return { ...defaultPrefs };
  return { ...defaultPrefs, ...safeParse(localStorage.getItem(PREFS_KEY), {}) };
}

export function savePrefs(prefs: Partial<PlayerPrefs>): PlayerPrefs {
  const next = { ...loadPrefs(), ...prefs };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }
  try {
    document.dispatchEvent(
      new CustomEvent('ms-mediaplayer-prefs', { detail: next }),
    );
  } catch {
    /* ignore */
  }
  return next;
}

export function resetPrefs(): PlayerPrefs {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PREFS_KEY, JSON.stringify(defaultPrefs));
  }
  return { ...defaultPrefs };
}

export function loadPosition(path: string): number {
  if (typeof localStorage === 'undefined' || !path) return 0;
  const map = safeParse<Record<string, number>>(localStorage.getItem(POS_KEY), {});
  const t = map[path];
  return typeof t === 'number' && t > 0 ? t : 0;
}

export function savePosition(path: string, time: number, duration?: number): void {
  if (typeof localStorage === 'undefined' || !path) return;
  if (time < 2) return;
  if (duration && duration > 0 && time > duration - 3) {
    clearPosition(path);
    return;
  }
  const map = safeParse<Record<string, number>>(localStorage.getItem(POS_KEY), {});
  map[path] = time;
  const keys = Object.keys(map);
  if (keys.length > 200) {
    for (const k of keys.slice(0, keys.length - 200)) delete map[k];
  }
  localStorage.setItem(POS_KEY, JSON.stringify(map));
}

export function clearPosition(path: string): void {
  if (typeof localStorage === 'undefined' || !path) return;
  const map = safeParse<Record<string, number>>(localStorage.getItem(POS_KEY), {});
  delete map[path];
  localStorage.setItem(POS_KEY, JSON.stringify(map));
}

export function clearAllPositions(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(POS_KEY);
}
