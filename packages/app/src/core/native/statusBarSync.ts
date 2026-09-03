// src/core/native/statusBarSync.ts
//
// Keeps the Android system status bar in sync with the active IDE theme.
// Uses @capacitor/status-bar when available; falls back to a MainActivity bridge.

import { Capacitor, registerPlugin } from '@capacitor/core';

interface MsStatusBarPlugin {
  setStyle?(options: { style: 'DARK' | 'LIGHT' }): Promise<void>;
  setBackgroundColor?(options: { color: string }): Promise<void>;
  setStatusBar?(options: { color: string; lightIcons: boolean }): Promise<void>;
}

const MsStatusBar = registerPlugin<MsStatusBarPlugin>('MsStatusBar', {
  web: () => ({
    setStyle: async () => {},
    setBackgroundColor: async () => {},
    setStatusBar: async () => {},
  }),
});

const IDE_DARK = '#1E1E1E';

function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Apply status-bar colors for a given IDE chrome background.
 * @param backgroundHex e.g. "#1E1E1E" (from --ms-bg-main)
 * @param darkChrome true when the UI is dark → white status icons
 */
export async function syncNativeStatusBar(
  backgroundHex: string = IDE_DARK,
  darkChrome: boolean = true,
): Promise<void> {
  if (!isNativeAndroid()) return;

  const color = backgroundHex?.startsWith('#') ? backgroundHex : `#${backgroundHex || '1E1E1E'}`;
  // Capacitor StatusBar: style DARK = light content (white icons) on dark bar
  const style = darkChrome ? 'DARK' : 'LIGHT';
  const lightIcons = !darkChrome; // Android: lightIcons = dark glyphs on light bar

  try {
    // Prefer official plugin if the project includes @capacitor/status-bar
    const mod = await import('@capacitor/status-bar').catch(() => null);
    if (mod?.StatusBar) {
      await mod.StatusBar.setBackgroundColor({ color });
      await mod.StatusBar.setStyle({
        style: darkChrome ? mod.Style.Dark : mod.Style.Light,
      });
      return;
    }
  } catch {
    /* optional dependency */
  }

  try {
    await MsStatusBar.setStatusBar?.({ color, lightIcons });
  } catch {
    try {
      await MsStatusBar.setBackgroundColor?.({ color });
      await MsStatusBar.setStyle?.({ style });
    } catch {
      /* no native bridge */
    }
  }
}

/** Call once at app boot for the default dark IDE theme. */
export function initNativeStatusBar(): void {
  void syncNativeStatusBar(IDE_DARK, true);
}

/**
 * Read current --ms-bg-main from :root and push to the system bar.
 * Safe to call after theme switches.
 */
export function syncStatusBarFromCss(): void {
  if (typeof document === 'undefined') return;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--ms-bg-main')
    .trim();
  const bg = raw || IDE_DARK;
  // Heuristic: luminance — treat near-dark as dark chrome
  const hex = bg.startsWith('#') ? bg.slice(1) : bg;
  let dark = true;
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    dark = lum < 0.5;
  }
  void syncNativeStatusBar(bg.startsWith('#') ? bg : `#${hex}`, dark);
}
