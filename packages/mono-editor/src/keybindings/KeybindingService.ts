/**
 * Monaco-inspired keybinding layer.
 * Chord strings: "ctrl+z", "ctrl+shift+z", "ctrl+y", ...
 */

export type KeybindingWhen = () => boolean;

export interface MonoKeybinding {
  id: string;
  primary: string;
  handler: (e: KeyboardEvent) => void;
  when?: KeybindingWhen;
  weight?: number;
}

function keyTokenFromEvent(e: KeyboardEvent): string {
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
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(keyTokenFromEvent(e));
  return parts.join('+');
}

function prettyChord(chord: string): string {
  return chord
    .split('+')
    .map((p) => {
      const x = p.toLowerCase();
      if (x === 'ctrl') return 'Ctrl';
      if (x === 'shift') return 'Shift';
      if (x === 'alt') return 'Alt';
      if (x === 'space') return 'Space';
      return x.length === 1 ? x.toUpperCase() : x[0]!.toUpperCase() + x.slice(1);
    })
    .join('+');
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

  /** First primary chord label for command id (palette shortcut column). */
  getShortcutLabel(commandId: string): string | undefined {
    const b = this.bindings.find((x) => x.id === commandId);
    return b ? prettyChord(b.primary) : undefined;
  }

  chordOf(e: KeyboardEvent): string {
    return normalizeKey(e);
  }

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

export const MonoCommands = {
  Undo: 'undo',
  Redo: 'redo',
  Copy: 'editor.action.clipboardCopyAction',
  Cut: 'editor.action.clipboardCutAction',
  Paste: 'editor.action.clipboardPasteAction',
  SelectAll: 'editor.action.selectAll',
  CommandPalette: 'workbench.action.showCommands',
} as const;
