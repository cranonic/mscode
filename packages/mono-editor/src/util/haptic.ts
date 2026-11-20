/**
 * Light tap feedback for editor chrome (icons, teardrop, etc.).
 * - Browser: navigator.vibrate
 * - Capacitor Android: @capacitor/haptics when available (optional peer)
 */
export type HapticStyle = 'light' | 'medium' | 'selection';

let capacitoHaptics: {
  impact: (opts: { style: string }) => Promise<void>;
  selectionStart?: () => Promise<void>;
} | null = null;
let triedCap = false;

async function loadCapacitorHaptics(): Promise<void> {
  if (triedCap) return;
  triedCap = true;
  try {
    // Optional dependency — app may add @capacitor/haptics
    const mod = await import(/* @vite-ignore */ '@capacitor/haptics');
    capacitoHaptics = mod.Haptics;
  } catch {
    capacitoHaptics = null;
  }
}

export function haptic(style: HapticStyle = 'light'): void {
  void loadCapacitorHaptics().then(() => {
    if (capacitoHaptics) {
      const map = { light: 'Light', medium: 'Medium', selection: 'Light' } as const;
      void capacitoHaptics.impact({ style: map[style] });
      return;
    }
    try {
      const ms = style === 'medium' ? 16 : style === 'selection' ? 10 : 8;
      navigator.vibrate?.(ms);
    } catch {
      /* WebView may block */
    }
  });

  // Sync fallback immediately (Android WebView often supports vibrate without Capacitor)
  try {
    const ms = style === 'medium' ? 16 : style === 'selection' ? 10 : 8;
    navigator.vibrate?.(ms);
  } catch {
    /* */
  }
}

/** Press scale animation — Android-like “zoom drop” */
export function attachPressFeedback(
  el: HTMLElement,
  opts?: { scale?: number; hapticOn?: boolean },
): void {
  const scale = opts?.scale ?? 0.86;
  const doHaptic = opts?.hapticOn !== false;

  const down = (e: Event) => {
    if ((e as PointerEvent).pointerType === 'mouse' && (e as PointerEvent).button !== 0) return;
    el.style.transition = 'transform 90ms cubic-bezier(0.2, 0.9, 0.3, 1.2)';
    el.style.transform = `scale(${scale})`;
    if (doHaptic) haptic('light');
  };
  const up = () => {
    el.style.transition = 'transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1)';
    el.style.transform = 'scale(1)';
  };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
  // Kill sticky CSS :hover on touch
  el.addEventListener('touchend', up, { passive: true });
}
