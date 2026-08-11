// src/features/termis/components/terminal/settings/terminalSettings.ts
//
// Defaults + keys for terminal policy / UI.
// Full settings UI schema lives in:
//   features/settings/config/branchs/terminal/terminalSettings.ts
//
// Keep defaults in sync with that section.

export interface TerminalSettingsSchema {
  'terminal.integrated.username': string;
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
  'terminal.integrated.macOptionIsMeta': boolean;
  'terminal.integrated.rightClickSelectsWord': boolean;
  'terminal.integrated.fastScrollModifier': 'alt' | 'ctrl' | 'shift';

  'terminal.defaultExecMode': 'native' | 'proot';
  'terminal.exclusiveMode': boolean;
  'terminal.confirmBeforeKill': boolean;
  'terminal.skipConfirmIfIdle': boolean;
  'terminal.maxTotalTabs': number;
  'terminal.maxConcurrentNative': number;
  'terminal.maxConcurrentProot': number;
  'terminal.killGraceMs': number;

  /** @reserved */
  'terminal.lsp.enabled'?: boolean;
  /** @reserved */
  'terminal.lsp.killWithExclusiveSwitch'?: boolean;
}

export const TERMINAL_SETTINGS_DEFAULTS: TerminalSettingsSchema = {
  'terminal.integrated.username': 'mscode',
  'terminal.integrated.fontFamily': '',
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
  'terminal.integrated.macOptionIsMeta': true,
  'terminal.integrated.rightClickSelectsWord': false,
  'terminal.integrated.fastScrollModifier': 'alt',

  'terminal.defaultExecMode': 'native',
  'terminal.exclusiveMode': true,
  'terminal.confirmBeforeKill': true,
  'terminal.skipConfirmIfIdle': true,
  'terminal.maxTotalTabs': 8,
  'terminal.maxConcurrentNative': 6,
  'terminal.maxConcurrentProot': 2,
  'terminal.killGraceMs': 1500,

  'terminal.lsp.enabled': false,
  'terminal.lsp.killWithExclusiveSwitch': true,
};

export const TERMINAL_SETTING_KEYS = Object.keys(
  TERMINAL_SETTINGS_DEFAULTS,
) as (keyof TerminalSettingsSchema)[];

/** Apply user overrides onto TERMINAL_CONFIG-style runtime policy. */
export function policyFromSettings(
  settings: Partial<TerminalSettingsSchema> | Record<string, unknown>,
): {
  exclusiveMode: boolean;
  confirmBeforeKill: boolean;
  skipConfirmIfIdle: boolean;
  maxTotalTabs: number;
  maxConcurrentNative: number;
  maxConcurrentProot: number;
  killGraceMs: number;
  defaultExecMode: 'native' | 'proot';
} {
  const s = settings as Partial<TerminalSettingsSchema>;
  const d = TERMINAL_SETTINGS_DEFAULTS;
  return {
    exclusiveMode: (s['terminal.exclusiveMode'] ?? d['terminal.exclusiveMode']) as boolean,
    confirmBeforeKill: (s['terminal.confirmBeforeKill'] ?? d['terminal.confirmBeforeKill']) as boolean,
    skipConfirmIfIdle: (s['terminal.skipConfirmIfIdle'] ?? d['terminal.skipConfirmIfIdle']) as boolean,
    maxTotalTabs: (s['terminal.maxTotalTabs'] ?? d['terminal.maxTotalTabs']) as number,
    maxConcurrentNative: (s['terminal.maxConcurrentNative'] ?? d['terminal.maxConcurrentNative']) as number,
    maxConcurrentProot: (s['terminal.maxConcurrentProot'] ?? d['terminal.maxConcurrentProot']) as number,
    killGraceMs: (s['terminal.killGraceMs'] ?? d['terminal.killGraceMs']) as number,
    defaultExecMode: (s['terminal.defaultExecMode'] ?? d['terminal.defaultExecMode']) as 'native' | 'proot',
  };
}
