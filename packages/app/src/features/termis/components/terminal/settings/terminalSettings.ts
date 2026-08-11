// src/features/termis/components/terminal/settings/terminalSettings.ts
//
// Terminal-related settings moved out of workbench/*.
// Keys mirror VS Code–style `terminal.integrated.*` where applicable.
//
// LSP-related flags are declared as placeholders only — do not wire until
// LSP modules are provided.

export interface TerminalSettingsSchema {
  'terminal.integrated.fontFamily': string;
  'terminal.integrated.fontSize': number;
  'terminal.integrated.fontWeight': string | number;
  'terminal.integrated.letterSpacing': number;
  'terminal.integrated.cursorStyle': 'block' | 'underline' | 'bar';
  'terminal.integrated.cursorBlink': boolean;
  'terminal.integrated.cursorWidth': number;
  'terminal.integrated.scrollback': number;
  'terminal.integrated.tabStopWidth': number;
  'terminal.integrated.fontLigatures': boolean;
  'terminal.integrated.mouseWheelZoom': boolean;

  /** Default backend when + is long-pressed / default New Terminal. */
  'terminal.defaultExecMode': 'native' | 'proot';

  // ── From TERMINAL_CONFIG (user-overridable copies) ──────────────────────
  'terminal.exclusiveMode': boolean;
  'terminal.confirmBeforeKill': boolean;
  'terminal.skipConfirmIfIdle': boolean;
  'terminal.maxTotalTabs': number;
  'terminal.maxConcurrentNative': number;
  'terminal.maxConcurrentProot': number;
  'terminal.killGraceMs': number;

  // ── LSP placeholders (not wired yet) ───────────────────────────────────
  /** @reserved */
  'terminal.lsp.enabled'?: boolean;
  /** @reserved */
  'terminal.lsp.killWithExclusiveSwitch'?: boolean;
}

export const TERMINAL_SETTINGS_DEFAULTS: TerminalSettingsSchema = {
  'terminal.integrated.fontFamily': "'Fira Code', 'Cascadia Code', Consolas, monospace",
  'terminal.integrated.fontSize': 13,
  'terminal.integrated.fontWeight': 'normal',
  'terminal.integrated.letterSpacing': 0,
  'terminal.integrated.cursorStyle': 'bar',
  'terminal.integrated.cursorBlink': true,
  'terminal.integrated.cursorWidth': 2,
  'terminal.integrated.scrollback': 10000,
  'terminal.integrated.tabStopWidth': 8,
  'terminal.integrated.fontLigatures': false,
  'terminal.integrated.mouseWheelZoom': false,

  'terminal.defaultExecMode': 'native',

  'terminal.exclusiveMode': true,
  'terminal.confirmBeforeKill': true,
  'terminal.skipConfirmIfIdle': true,
  'terminal.maxTotalTabs': 8,
  'terminal.maxConcurrentNative': 6,
  'terminal.maxConcurrentProot': 2,
  'terminal.killGraceMs': 1500,

  // reserved
  'terminal.lsp.enabled': false,
  'terminal.lsp.killWithExclusiveSwitch': true,
};

/** Setting keys that belong to terminal (for migration from workbench). */
export const TERMINAL_SETTING_KEYS = Object.keys(
  TERMINAL_SETTINGS_DEFAULTS,
) as (keyof TerminalSettingsSchema)[];
