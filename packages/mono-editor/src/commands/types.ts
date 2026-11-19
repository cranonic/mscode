/** Monaco / VS Code–style command + action contracts (engine only, no UI). */

export interface MonoDisposable {
  dispose(): void;
}

/** Context key name → value (boolean/string/number). */
export type MonoContextKeyValue = boolean | string | number;

export interface MonoCommand {
  id: string;
  /** Palette / menu label. If omitted, command is hidden from palette. */
  title?: string;
  category?: string;
  icon?: string;
  /**
   * When-clause (Monaco-like):
   * - string: "editorTextFocus && !editorReadonly"
   * - fn: () => boolean
   */
  precondition?: string | (() => boolean);
  /** Hide from command palette even if title set */
  paletteHide?: boolean;
  /** Sort within category (lower first) */
  order?: number;
}

export type MonoCommandHandler = (...args: unknown[]) => unknown | Promise<unknown>;

export interface MonoRegisteredCommand extends MonoCommand {
  handler: MonoCommandHandler;
}

/**
 * Monaco `editor.addAction` equivalent — one shot:
 * command + optional keybinding + palette metadata.
 */
export interface MonoAction extends MonoCommand {
  /** Primary chord e.g. "ctrl+shift+f" */
  keybinding?: string;
  /** Extra chords */
  keybindings?: string[];
  /** Keybinding when-clause (defaults to precondition) */
  keybindingWhen?: string | (() => boolean);
  weight?: number;
  run: MonoCommandHandler;
}

/** Serializable row for palette UI (app renders this). */
export interface MonoPaletteCommandItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
  icon?: string;
  shortcut?: string;
  enabled: boolean;
}

export interface MonoPaletteProvider {
  /** "" | ">" | ":" | "@" | "/" | custom */
  prefix: string;
  id: string;
  label: string;
  /** Return items for current filter (text after prefix). */
  provideItems: (filter: string, ctx: MonoPaletteProvideContext) =>
    | MonoPaletteItem[]
    | Promise<MonoPaletteItem[]>;
}

export interface MonoPaletteProvideContext {
  executeCommand: (id: string, ...args: unknown[]) => Promise<unknown>;
  listCommands: () => MonoPaletteCommandItem[];
  getContext: (key: string) => MonoContextKeyValue | undefined;
}

export interface MonoPaletteItem {
  id: string;
  label: string;
  description?: string;
  detail?: string;
  icon?: string;
  shortcut?: string;
  /** Separator row */
  type?: 'item' | 'separator';
  enabled?: boolean;
  keepOpen?: boolean;
  onSelect?: () => void | Promise<void>;
}
