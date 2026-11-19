/**
 * Monaco-inspired keybinding layer.
 *
 * Chord strings: "ctrl+z", "ctrl+shift+z", "ctrl+y", "ctrl+c", ...
 * Matches both `event.key` and `event.code` (KeyZ) so hardware keyboards
 * work consistently in Capacitor / Android WebView.
 */

export type KeybindingWhen = () => boolean;

export interface MonoKeybinding {
  id: string;
  /** e.g. "ctrl+z" | "ctrl+shift+z" | "ctrl+y" | "ctrl+x" */
  primary: string;
  handler: (e: KeyboardEvent) => void;
  when?: KeybindingWhen;
  /** Lower = higher priority when same key */
  weight?: number;
}

function keyTokenFromEvent(e: KeyboardEvent): string {
  // Prefer event.code for letters (KeyZ → z) — stable across layouts
  const code = e.code || '';
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  switch (code) {
    case 'Space':
      return 'space';
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      return code.replace('Arrow', '').toLowerCase();
    case 'Enter':
    case 'Tab':
    case 'Backspace':
    case 'Delete':
    case 'Escape':
    case 'Home':
    case 'End':
      return code.toLowerCase();
    default:
      break;
  }
  let k = e.key || '';
  if (k === ' ') return 'space';
  if (k.length === 1) return k.toLowerCase();
  return k.toLowerCase();
}

function normalizeKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  // Treat meta (Cmd) same as ctrl for cross-platform bindings
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(keyTokenFromEvent(e));
  return parts.join('+');
}

export class KeybindingService {
  private bindings: MonoKeybinding[] = [];

  add(binding: MonoKeybinding): () => void {
    this.bindings.push(binding);
    this.bindings.sort((a, b) => (a.weight ?? 100) - (b.weight ?? 100));
    return () => {
      this.bindings = this.bindings.filter((b) => b !== binding);
    };
  }

  addMany(list: MonoKeybinding[]): () => void {
    const disposers = list.map((b) => this.add(b));
    return () => disposers.forEach((d) => d());
  }

  remove(id: string): void {
    this.bindings = this.bindings.filter((b) => b.id !== id);
  }

  clear(): void {
    this.bindings = [];
  }

  list(): MonoKeybinding[] {
    return this.bindings.map((b) => ({ ...b }));
  }

  /** Resolve chord for debugging / tests */
  chordOf(e: KeyboardEvent): string {
    return normalizeKey(e);
  }

  /**
   * Resolve and run. Returns true if handled (caller should preventDefault).
   */
  dispatch(e: KeyboardEvent): boolean {
    const chord = normalizeKey(e);
    for (const b of this.bindings) {
      if (b.primary.toLowerCase() !== chord) continue;
      if (b.when && !b.when()) continue;
      b.handler(e);
      return true;
    }
    return false;
  }
}

/** Built-in command ids (Monaco-compatible names where practical) */
export const MonoCommands = {
  Undo: 'undo',
  Redo: 'redo',
  Copy: 'editor.action.clipboardCopyAction',
  Cut: 'editor.action.clipboardCutAction',
  Paste: 'editor.action.clipboardPasteAction',
  SelectAll: 'editor.action.selectAll',
} as const;
