import { useEffect } from 'react';

/**
 * Keyboard shortcuts while the player root contains focus (or is active).
 * Space — play/pause · arrows — seek · M — mute · [ ] — rate optional via callbacks
 */
export function usePlayerKeyboard(
  rootRef: React.RefObject<HTMLElement | null>,
  handlers: {
    onToggle: () => void;
    onSeek: (delta: number) => void;
    onMute?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    enabled?: boolean;
  },
) {
  const { onToggle, onSeek, onMute, onNext, onPrev, enabled = true } = handlers;

  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root) return;
      // Only when focus is inside player or no input focused
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      const inside = root.contains(t) || document.activeElement === root;
      // Also allow when player is visible and user presses media-like keys
      if (!inside && e.code !== 'MediaPlayPause') return;

      switch (e.code) {
        case 'Space':
        case 'MediaPlayPause':
          e.preventDefault();
          onToggle();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSeek(5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSeek(-5);
          break;
        case 'KeyM':
          onMute?.();
          break;
        case 'MediaTrackNext':
          onNext?.();
          break;
        case 'MediaTrackPrevious':
          onPrev?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rootRef, onToggle, onSeek, onMute, onNext, onPrev, enabled]);
}
