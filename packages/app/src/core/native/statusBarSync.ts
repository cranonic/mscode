// src/core/native/statusBarSync.ts
//
// Android system status bar ↔ IDE theme.
//
// Colors (from computed CSS on :root / body):
//   --ms-statusbar-bg    → fallback --ms-bg-side
//   --ms-statusbar-text  → fallback --ms-text-main
//
// Native path: MsStatusBar Capacitor plugin → MainActivity.setStatusBarFromHex

import { Capacitor, registerPlugin } from '@capacitor/core';

interface MsStatusBarPlugin {
  setStatusBar(options: { color: string; lightIcons: boolean }): Promise<void>;
  setBackgroundColor?(options: { color: string }): Promise<void>;
  setStyle?(options: { style: 'DARK' | 'LIGHT' }): Promise<void>;
}

const MsStatusBar = registerPlugin<MsStatusBarPlugin>('MsStatusBar');

const FALLBACK_BG = '#252526';
const FALLBACK_FG = '#cccccc';

function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

function toHexColor(raw: string, fallback: string): string {
  const s = (raw || '').trim();
  if (!s) return fallback;

  if (s.startsWith('#')) {
    if (s.length === 4) {
      const r = s[1], g = s[2], b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    if (s.length >= 7) return s.slice(0, 7).toLowerCase();
  }

  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    const h = (n: string) =>
      Math.max(0, Math.min(255, parseInt(n, 10)))
        .toString(16)
        .padStart(2, '0');
    return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
  }

  return fallback;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return 0.2;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Prefer :root, then body (themeService / MainLayout may set either). */
function readCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  const fromRoot = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (fromRoot) return fromRoot;
  if (document.body) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }
  return '';
}

export function resolveStatusBarThemeColors(): {
  bg: string;
  text: string;
  darkChrome: boolean;
} {
  const bgRaw =
    readCssVar('--ms-statusbar-bg') ||
    readCssVar('--ms-bg-side') ||
    FALLBACK_BG;
  const textRaw =
    readCssVar('--ms-statusbar-text') ||
    readCssVar('--ms-text-main') ||
    FALLBACK_FG;

  const bg = toHexColor(bgRaw, FALLBACK_BG);
  const text = toHexColor(textRaw, FALLBACK_FG);
  // Light text / dark bg → white system icons (lightIcons=false)
  const darkChrome = luminance(text) > 0.45 || luminance(bg) < 0.55;

  return { bg, text, darkChrome };
}

export async function syncNativeStatusBar(
  backgroundHex: string = FALLBACK_BG,
  darkChrome: boolean = true,
): Promise<void> {
  if (!isNativeAndroid()) {
    console.debug('[statusBarSync] skip — not native Android');
    return;
  }

  const color = toHexColor(backgroundHex, FALLBACK_BG);
  const lightIcons = !darkChrome;

  console.log('[statusBarSync] apply', { color, lightIcons, darkChrome });

  // 1) Our plugin → MainActivity
  let pluginOk = false;
  try {
    await MsStatusBar.setStatusBar({ color, lightIcons });
    pluginOk = true;
    console.log('[statusBarSync] MsStatusBar plugin resolved OK');
  } catch (e) {
    console.warn('[statusBarSync] MsStatusBar.setStatusBar failed', e);
  }

  // 2) Official plugin — disable overlay so color is visible (Capacitor default often overlays)
  try {
    const mod = await import('@capacitor/status-bar').catch(() => null);
    if (mod?.StatusBar) {
      try {
        await mod.StatusBar.setOverlaysWebView({ overlay: false });
      } catch { /* older plugin */ }
      await mod.StatusBar.setBackgroundColor({ color });
      await mod.StatusBar.setStyle({
        style: darkChrome ? mod.Style.Dark : mod.Style.Light,
      });
      console.log('[statusBarSync] @capacitor/status-bar applied', color);
      return;
    }
  } catch (e) {
    console.warn('[statusBarSync] @capacitor/status-bar failed', e);
  }

  if (pluginOk) return;
}

export function syncStatusBarFromCss(): void {
  if (typeof document === 'undefined') return;
  const { bg, darkChrome } = resolveStatusBarThemeColors();
  void syncNativeStatusBar(bg, darkChrome);
}

let _timer: ReturnType<typeof setTimeout> | null = null;
export function scheduleStatusBarSync(delayMs = 50): void {
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(() => {
    _timer = null;
    syncStatusBarFromCss();
  }, delayMs);
}

export function initNativeStatusBar(): void {
  syncStatusBarFromCss();
  scheduleStatusBarSync(100);
  scheduleStatusBarSync(400);
}

/**
 * Watch theme switches on <html> AND <body>, plus ms-theme-changed events.
 */
export function watchThemeStatusBar(): () => void {
  if (typeof document === 'undefined') return () => {};

  const observe = (el: Element | null) => {
    if (!el) return null;
    const mo = new MutationObserver(() => scheduleStatusBarSync(40));
    mo.observe(el, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });
    return mo;
  };

  const moRoot = observe(document.documentElement);
  const moBody = observe(document.body);

  const onThemeEvent = () => scheduleStatusBarSync(40);
  document.addEventListener('ms-theme-changed', onThemeEvent);
  window.addEventListener('ms-theme-changed', onThemeEvent);

  const onVis = () => {
    if (document.visibilityState === 'visible') scheduleStatusBarSync(80);
  };
  document.addEventListener('visibilitychange', onVis);

  scheduleStatusBarSync(0);

  return () => {
    moRoot?.disconnect();
    moBody?.disconnect();
    document.removeEventListener('ms-theme-changed', onThemeEvent);
    window.removeEventListener('ms-theme-changed', onThemeEvent);
    document.removeEventListener('visibilitychange', onVis);
    if (_timer) clearTimeout(_timer);
  };
}

/** Call when workbench.theme / themeService.applyTheme completes. */
export function notifyThemeChanged(): void {
  try {
    document.dispatchEvent(new CustomEvent('ms-theme-changed'));
  } catch {
    /* ignore */
  }
  scheduleStatusBarSync(60);
}
