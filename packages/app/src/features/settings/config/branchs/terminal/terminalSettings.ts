// src/features/settings/config/branchs/terminal/terminalSettings.ts
//
// All terminal settings live here (moved out of workbench).
// Includes: integrated UI + exclusive native/proot policy + reserved LSP flags.

import type { IConfigurationSection } from '@/core/extensionAPI/registry/configurationRegistry';

export const terminalSection: IConfigurationSection = {
  id: 'terminal',
  title: 'Terminal',
  order: 25,
  properties: {
    // ── Prompt / identity ────────────────────────────────────────────────────
    'terminal.integrated.username': {
      title: 'Terminal Username',
      subCategory: 'Prompt',
      type: 'string',
      defaultValue: 'mscode',
      order: 1,
      tags: ['terminal', 'prompt'],
      markdownDescription:
        'Controls the hostname/username displayed in the terminal prompt.\n\n**Example:** If set to `hacker`, the prompt becomes `ide@hacker:~$`.\n\n> **Note:** Changes apply to new sessions; some shells pick it up instantly.',
    },

    // ── Font / display ───────────────────────────────────────────────────────
    'terminal.integrated.fontFamily': {
      title: 'Font Family',
      type: 'string',
      subCategory: 'Appearance',
      defaultValue: '',
      order: 10,
      tags: ['terminal', 'font'],
      markdownDescription:
        'Controls the font family of the terminal.\n\n> **Note:** Leave blank to inherit `#editor.fontFamily#`.',
    },

    'terminal.integrated.fontSize': {
      title: 'Font Size',
      type: 'number',
      subCategory: 'Appearance',
      defaultValue: 13,
      minimum: 6,
      maximum: 100,
      order: 11,
      tags: ['terminal', 'font'],
      markdownDescription: 'Controls the font size in pixels of the terminal.',
    },

    'terminal.integrated.fontWeight': {
      title: 'Font Weight',
      type: 'select',
      subCategory: 'Appearance',
      defaultValue: 'normal',
      order: 12,
      tags: ['terminal', 'font'],
      markdownDescription: 'Font weight for non-bold terminal text.',
      enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
      enumItemLabels: [
        'Normal',
        'Bold',
        '100 — Thin',
        '200 — Extra Light',
        '300 — Light',
        '400 — Regular',
        '500 — Medium',
        '600 — Semi Bold',
        '700 — Bold',
        '800 — Extra Bold',
        '900 — Black',
      ],
    },

    'terminal.integrated.letterSpacing': {
      title: 'Letter Spacing',
      type: 'number',
      subCategory: 'Appearance',
      defaultValue: 0,
      order: 13,
      tags: ['terminal', 'font'],
      markdownDescription: 'Letter spacing in the terminal. `0` = default.',
    },

    'terminal.integrated.theme': {
      title: 'Terminal Theme',
      type: 'select',
      subCategory: 'Appearance',
      defaultValue: 'mscode',
      order: 15,
      tags: ['terminal', 'theme'],
      markdownDescription:
        'Color theme for the integrated terminal.\n\n**MS Code Dark** is the default polished look. Other built-in themes: VS Code Dark, Light, Dracula, Nord, One Dark, Solarized Dark.',
      enum: ['mscode', 'vscode', 'light', 'dracula', 'nord', 'onedark', 'solarized'],
      enumItemLabels: [
        'MS Code Dark (default)',
        'VS Code Dark',
        'Light',
        'Dracula',
        'Nord',
        'One Dark',
        'Solarized Dark',
      ],
    },

    'terminal.integrated.showLens': {
      title: 'Show Selection Lens',
      type: 'boolean',
      subCategory: 'Appearance',
      defaultValue: true,
      order: 16,
      tags: ['terminal', 'selection'],
      markdownDescription:
        'When dragging terminal selection teardrops, show a magnifier-style lens (Android-like) above or below the finger for precise adjustment.',
    },

    'terminal.integrated.fontLigatures': {
      title: 'Font Ligatures',
      type: 'boolean',
      subCategory: 'Appearance',
      defaultValue: false,
      order: 14,
      tags: ['terminal', 'font'],
      markdownDescription:
        'Enables font ligatures (requires a ligature font + `@xterm/addon-ligatures`).',
    },

    'terminal.integrated.cursorStyle': {
      title: 'Cursor Style',
      type: 'select',
      subCategory: 'Cursor',
      defaultValue: 'bar',
      order: 20,
      tags: ['terminal', 'cursor'],
      markdownDescription: 'Style of the terminal cursor: block / underline / bar.',
      enum: ['block', 'underline', 'bar'],
      enumItemLabels: ['Block', 'Underline', 'Bar'],
    },

    'terminal.integrated.cursorBlink': {
      title: 'Cursor Blink',
      type: 'boolean',
      subCategory: 'Cursor',
      defaultValue: true,
      order: 21,
      tags: ['terminal', 'cursor'],
      markdownDescription: 'Whether the terminal cursor blinks.',
    },

    'terminal.integrated.cursorWidth': {
      title: 'Cursor Width',
      type: 'number',
      subCategory: 'Cursor',
      defaultValue: 2,
      minimum: 1,
      maximum: 5,
      order: 22,
      tags: ['terminal', 'cursor'],
      markdownDescription: 'Width of the bar cursor.',
    },

    'terminal.integrated.scrollback': {
      title: 'Scrollback',
      type: 'number',
      subCategory: 'Buffer',
      defaultValue: 10000,
      minimum: 100,
      maximum: 50000,
      order: 30,
      tags: ['terminal', 'history'],
      markdownDescription: 'Maximum lines kept in the terminal buffer.',
    },

    'terminal.integrated.tabStopWidth': {
      title: 'Tab Stop Width',
      type: 'number',
      subCategory: 'Buffer',
      defaultValue: 8,
      minimum: 1,
      maximum: 16,
      order: 31,
      tags: ['terminal'],
      markdownDescription: 'Number of cells in a tab stop.',
    },

    'terminal.integrated.mouseWheelZoom': {
      title: 'Mouse Wheel Zoom',
      type: 'boolean',
      subCategory: 'Interaction',
      defaultValue: false,
      order: 40,
      tags: ['terminal', 'interaction'],
      markdownDescription: 'Zoom font with Ctrl + mouse wheel.',
    },

    'terminal.integrated.macOptionIsMeta': {
      title: 'Mac Option Is Meta',
      type: 'boolean',
      subCategory: 'Interaction',
      defaultValue: true,
      order: 41,
      tags: ['terminal', 'keyboard', 'mac'],
      markdownDescription: 'Treat the Option key as Meta on macOS.',
    },

    'terminal.integrated.rightClickSelectsWord': {
      title: 'Right Click Selects Word',
      type: 'boolean',
      subCategory: 'Interaction',
      defaultValue: false,
      order: 42,
      tags: ['terminal', 'mouse'],
      markdownDescription: 'Right-click selects the word under the cursor.',
    },

    'terminal.integrated.fastScrollModifier': {
      title: 'Fast Scroll Modifier',
      type: 'select',
      subCategory: 'Interaction',
      defaultValue: 'alt',
      order: 43,
      tags: ['terminal', 'mouse', 'scroll'],
      markdownDescription: 'Modifier key that multiplies scroll speed.',
      enum: ['alt', 'ctrl', 'shift'],
      enumItemLabels: ['Alt', 'Ctrl', 'Shift'],
    },

    // ── Backend / exclusive native ↔ proot ───────────────────────────────────
    'terminal.defaultExecMode': {
      title: 'Default Terminal Backend',
      type: 'select',
      subCategory: 'Backend',
      defaultValue: 'proot',
      order: 50,
      tags: ['terminal', 'backend'],
      markdownDescription:
        'Default backend for **New Terminal**, Git, and most plugins.\n\n**Linux Alpine (proot)** is the recommended default for everyday work.\n**Android bionic (native)** is kept for heavier native-only tasks (future Android build / Java tooling).\n\nBoth backends remain available; only the default changes.',
      enum: ['native', 'proot'],
      enumItemLabels: ['Android bionic (native)', 'Linux Alpine (proot)'],
    },

    'terminal.exclusiveMode': {
      title: 'Exclusive Native / PRoot',
      type: 'boolean',
      subCategory: 'Backend',
      defaultValue: true,
      order: 51,
      tags: ['terminal', 'backend'],
      markdownDescription:
        '**ON (default):** only one backend type may have live sessions. Opening the other type closes existing sessions of the previous type (see Confirm Before Exclusive Kill).\n\n**OFF:** both native and proot may run side-by-side. The Termis `+` button then shows a picker (Android bionic / Linux proot) instead of spawning the default only.',
    },

    'terminal.clearDataProot': {
      title: 'Clear Linux (Alpine) Data',
      type: 'button',
      subCategory: 'Data',
      defaultValue: null,
      order: 60,
      tags: ['terminal', 'clear', 'proot', 'alpine'],
      buttonLabel: 'Clear Data…',
      buttonAction: 'terminal.clearData.proot',
      markdownDescription:
        'Permanently wipe the **Linux Alpine (proot)** rootfs, or open a dialog to remove individual packages.\n\nThis is not a session clear — the next proot terminal will download/setup Alpine again.\n\nUse only when you want a full reset.',
    },

    'terminal.clearDataNative': {
      title: 'Clear Native Terminal Data',
      type: 'button',
      subCategory: 'Data',
      defaultValue: null,
      order: 61,
      tags: ['terminal', 'clear', 'native'],
      buttonLabel: 'Clear Data…',
      buttonAction: 'terminal.clearData.native',
      markdownDescription:
        'Permanently wipe the **Android bionic** `$PREFIX` bootstrap (installed packages), or remove selected packages.\n\nThe next native terminal will reinstall bootstrap as needed.\n\nUse only when you want a full reset.',
    },

    'terminal.confirmBeforeKill': {
      title: 'Confirm Before Exclusive Kill',
      type: 'boolean',
      subCategory: 'Backend',
      defaultValue: true,
      order: 52,
      tags: ['terminal', 'backend'],
      markdownDescription: 'Show a confirmation dialog before killing the other backend’s sessions.',
    },

    'terminal.skipConfirmIfIdle': {
      title: 'Skip Confirm If Idle',
      type: 'boolean',
      subCategory: 'Backend',
      defaultValue: true,
      order: 53,
      tags: ['terminal', 'backend'],
      markdownDescription: 'Skip the confirm dialog when no session of the other type is marked busy.',
    },

    'terminal.maxTotalTabs': {
      title: 'Max Total Tabs',
      type: 'number',
      subCategory: 'Backend',
      defaultValue: 8,
      minimum: 1,
      maximum: 32,
      order: 54,
      tags: ['terminal', 'backend'],
      markdownDescription: 'Hard cap on native + proot terminal tabs combined.',
    },

    'terminal.maxConcurrentNative': {
      title: 'Max Concurrent Native',
      type: 'number',
      subCategory: 'Backend',
      defaultValue: 6,
      minimum: 1,
      maximum: 16,
      order: 55,
      tags: ['terminal', 'backend'],
      markdownDescription: 'Max concurrent **native** sessions (also applied under exclusive mode).',
    },

    'terminal.maxConcurrentProot': {
      title: 'Max Concurrent PRoot',
      type: 'number',
      subCategory: 'Backend',
      defaultValue: 2,
      minimum: 1,
      maximum: 8,
      order: 56,
      tags: ['terminal', 'backend'],
      markdownDescription: 'Max concurrent **proot / Alpine** sessions.',
    },

    'terminal.killGraceMs': {
      title: 'Kill Grace Period (ms)',
      type: 'number',
      subCategory: 'Backend',
      defaultValue: 1500,
      minimum: 0,
      maximum: 10000,
      order: 57,
      tags: ['terminal', 'backend'],
      markdownDescription:
        'After sending Ctrl+C / `exit`, wait this many milliseconds before force-killing sessions during exclusive switch.',
    },

    // ── LSP placeholders (not wired) ─────────────────────────────────────────
    'terminal.lsp.enabled': {
      title: 'Terminal LSP Integration',
      type: 'boolean',
      subCategory: 'Language Servers',
      defaultValue: false,
      order: 90,
      tags: ['terminal', 'lsp'],
      markdownDescription: '**Reserved.** Enable when LSP modules are shipped.',
    },

    'terminal.lsp.killWithExclusiveSwitch': {
      title: 'Kill LSP on Exclusive Switch',
      type: 'boolean',
      subCategory: 'Language Servers',
      defaultValue: true,
      order: 91,
      tags: ['terminal', 'lsp'],
      markdownDescription: '**Reserved.** Tear down proot-context LSP servers when switching backend.',
    },
  },
};