// src/features/termis/components/terminal/components/TerminalExtraKeys.tsx
//
// Soft-key row above the soft keyboard (Termux-style).
// Layout defaults match the product screenshot:
//   ESC / - HOME ↑ END PGUP
//   ↹ CTRL ALT ← ↓ → PGDN

import React, { useCallback, useState } from 'react';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { terminalProcessRegistry } from '../core/TerminalRegistry';
import './TerminalExtraKeys.css';

export type ExtraKeyId =
  | 'esc' | 'slash' | 'minus' | 'home' | 'up' | 'end' | 'pgup'
  | 'tab' | 'ctrl' | 'alt' | 'left' | 'down' | 'right' | 'pgdn'
  | string;

export interface ExtraKeyDef {
  id: ExtraKeyId;
  /** Label shown on the button */
  label: string;
  /** Key sequence written to the PTY (when not a modifier) */
  seq?: string;
  /** Modifier toggle */
  modifier?: 'ctrl' | 'alt';
}

export const DEFAULT_EXTRA_KEYS: ExtraKeyDef[][] = [
  [
    { id: 'esc', label: 'ESC', seq: '\x1b' },
    { id: 'slash', label: '/', seq: '/' },
    { id: 'minus', label: '−', seq: '-' },
    { id: 'home', label: 'HOME', seq: '\x1b[H' },
    { id: 'up', label: '↑', seq: '\x1b[A' },
    { id: 'end', label: 'END', seq: '\x1b[F' },
    { id: 'pgup', label: 'PGUP', seq: '\x1b[5~' },
  ],
  [
    { id: 'tab', label: '↹', seq: '\t' },
    { id: 'ctrl', label: 'CTRL', modifier: 'ctrl' },
    { id: 'alt', label: 'ALT', modifier: 'alt' },
    { id: 'left', label: '←', seq: '\x1b[D' },
    { id: 'down', label: '↓', seq: '\x1b[B' },
    { id: 'right', label: '→', seq: '\x1b[C' },
    { id: 'pgdn', label: 'PGDN', seq: '\x1b[6~' },
  ],
];

interface Props {
  terminalId: string;
}

export const TerminalExtraKeys: React.FC<Props> = ({ terminalId }) => {
  const settings = useSettingsStore(s => s.settings);
  const enabled = settings['terminal.integrated.extraKeys.enabled'] !== false;
  const custom = settings['terminal.integrated.extraKeys.layout'] as ExtraKeyDef[][] | undefined;
  const rows = Array.isArray(custom) && custom.length ? custom : DEFAULT_EXTRA_KEYS;

  const [ctrl, setCtrl] = useState(false);
  const [alt, setAlt] = useState(false);

  const write = useCallback(
    (seq: string) => {
      const proc = terminalProcessRegistry.get(terminalId);
      if (!proc?.write) return;
      let out = seq;
      // Ctrl+letter → control char when single a-z pressed after ctrl
      if (ctrl && seq.length === 1) {
        const c = seq.toLowerCase().charCodeAt(0);
        if (c >= 97 && c <= 122) out = String.fromCharCode(c - 96);
      }
      if (alt) out = '\x1b' + out;
      proc.write(out);
      if (ctrl) setCtrl(false);
      if (alt) setAlt(false);
    },
    [terminalId, ctrl, alt],
  );

  const onKey = (k: ExtraKeyDef) => {
    if (k.modifier === 'ctrl') {
      setCtrl(v => !v);
      return;
    }
    if (k.modifier === 'alt') {
      setAlt(v => !v);
      return;
    }
    if (k.seq) write(k.seq);
  };

  if (!enabled) return null;

  return (
    <div className="ms-term-extra-keys" role="toolbar" aria-label="Terminal extra keys">
      {rows.map((row, ri) => (
        <div className="ms-term-extra-keys-row" key={ri}>
          {row.map(k => {
            const active =
              (k.modifier === 'ctrl' && ctrl) || (k.modifier === 'alt' && alt);
            return (
              <button
                key={k.id}
                type="button"
                className={`ms-term-extra-key${active ? ' active' : ''}`}
                onClick={() => onKey(k)}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
