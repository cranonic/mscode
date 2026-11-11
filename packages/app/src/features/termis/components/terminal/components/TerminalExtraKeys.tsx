// src/features/termis/components/terminal/components/TerminalExtraKeys.tsx
//
// Soft-key row (Termux-style). CTRL/ALT are sticky modifiers:
//   1) Tap CTRL → stays active (accent color)
//   2) Next key (extra-keys OR soft keyboard) is sent with the modifier
//   3) Modifier clears after one key (unless toggled off earlier)
//
// Reference: Termux ExtraKeysView (META_CTRL_ON + inputCodePoint),
// and Acode quickTools sticky modifiers for the UX pattern.

import React, { useCallback, useEffect, useState } from 'react';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { terminalProcessRegistry } from '../core/TerminalRegistry';
import './TerminalExtraKeys.css';

export type ExtraKeyId =
  | 'esc' | 'slash' | 'minus' | 'home' | 'up' | 'end' | 'pgup'
  | 'tab' | 'ctrl' | 'alt' | 'left' | 'down' | 'right' | 'pgdn'
  | string;

export interface ExtraKeyDef {
  id: ExtraKeyId;
  label: string;
  seq?: string;
  modifier?: 'ctrl' | 'alt';
}

export const DEFAULT_EXTRA_KEYS: ExtraKeyDef[][] = [
  [
    { id: 'esc', label: 'ESC', seq: '\x1b' },
    { id: 'slash', label: '/', seq: '/' },
    { id: 'minus', label: '\u2212', seq: '-' },
    { id: 'home', label: 'HOME', seq: '\x1b[H' },
    { id: 'up', label: '\u2191', seq: '\x1b[A' },
    { id: 'end', label: 'END', seq: '\x1b[F' },
    { id: 'pgup', label: 'PGUP', seq: '\x1b[5~' },
  ],
  [
    { id: 'tab', label: '\u21b9', seq: '\t' },
    { id: 'ctrl', label: 'CTRL', modifier: 'ctrl' },
    { id: 'alt', label: 'ALT', modifier: 'alt' },
    { id: 'left', label: '\u2190', seq: '\x1b[D' },
    { id: 'down', label: '\u2193', seq: '\x1b[B' },
    { id: 'right', label: '\u2192', seq: '\x1b[C' },
    { id: 'pgdn', label: 'PGDN', seq: '\x1b[6~' },
  ],
];

/** Map a printable key under Ctrl → C0 control byte (Termux/xterm). */
function ctrlChar(ch: string): string | null {
  if (!ch || ch.length !== 1) return null;
  const c = ch.toLowerCase().charCodeAt(0);
  // a–z → 1–26; also @ [ \ ] ^ _ and space
  if (c >= 97 && c <= 122) return String.fromCharCode(c - 96);
  if (ch === '@') return '\x00';
  if (ch === '[') return '\x1b';
  if (ch === '\\') return '\x1c';
  if (ch === ']') return '\x1d';
  if (ch === '^') return '\x1e';
  if (ch === '_') return '\x1f';
  if (ch === ' ') return '\x00';
  if (ch === '?') return '\x7f'; // DEL often as Ctrl+?
  return null;
}

/** Apply sticky modifiers to a raw sequence before PTY write. */
function applyModifiers(seq: string, ctrl: boolean, alt: boolean): string {
  let out = seq;
  if (ctrl && seq.length === 1) {
    const cc = ctrlChar(seq);
    if (cc != null) out = cc;
  }
  // Alt → ESC prefix (meta)
  if (alt) out = '\x1b' + out;
  return out;
}

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

  const focusTerminal = useCallback(() => {
    requestAnimationFrame(() => {
      const host = document.querySelector('.ms-terminal-container') as HTMLElement | null;
      const ta = host?.querySelector('textarea') as HTMLTextAreaElement | null;
      if (ta) ta.focus();
      else host?.focus?.();
    });
  }, []);

  const write = useCallback(
    (seq: string, withMods = true) => {
      const proc = terminalProcessRegistry.get(terminalId);
      if (!proc?.write) return;
      const out = withMods ? applyModifiers(seq, ctrl, alt) : seq;
      void Promise.resolve(proc.write(out)).catch(() => {});
      if (withMods) {
        if (ctrl) setCtrl(false);
        if (alt) setAlt(false);
      }
      focusTerminal();
    },
    [terminalId, ctrl, alt, focusTerminal],
  );

  // Soft-keyboard intercept while CTRL/ALT sticky is on (Termux inputCodePoint path)
  useEffect(() => {
    if (!ctrl && !alt) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Only when a modifier is sticky and this is a real character/key
      if (!ctrl && !alt) return;
      if (e.isComposing) return;

      const key = e.key;
      if (key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta') return;

      // Let physical Ctrl/Alt combinations through untouched
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      e.preventDefault();
      e.stopPropagation();

      const proc = terminalProcessRegistry.get(terminalId);
      if (!proc?.write) return;

      let payload = '';
      if (key.length === 1) {
        payload = applyModifiers(key, ctrl, alt);
      } else if (key === 'Enter') {
        payload = applyModifiers('\r', ctrl, alt);
      } else if (key === 'Backspace') {
        payload = ctrl ? '\x08' : '\x7f';
        if (alt) payload = '\x1b' + payload;
      } else if (key === 'Tab') {
        payload = applyModifiers('\t', ctrl, alt);
      } else if (key === 'Escape') {
        payload = '\x1b';
      } else {
        // Arrows / Home / End while modifier sticky — send base CSI; still clear sticky
        const map: Record<string, string> = {
          ArrowUp: '\x1b[A',
          ArrowDown: '\x1b[B',
          ArrowRight: '\x1b[C',
          ArrowLeft: '\x1b[D',
          Home: '\x1b[H',
          End: '\x1b[F',
          PageUp: '\x1b[5~',
          PageDown: '\x1b[6~',
          Delete: '\x1b[3~',
        };
        payload = map[key] || '';
        if (!payload) return;
        if (alt) payload = '\x1b' + payload;
      }

      void Promise.resolve(proc.write(payload)).catch(() => {});
      if (ctrl) setCtrl(false);
      if (alt) setAlt(false);
    };

    // Capture phase so we beat xterm's own handler
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [ctrl, alt, terminalId]);

  const onKey = (k: ExtraKeyDef) => {
    if (k.modifier === 'ctrl') {
      setCtrl(v => !v);
      // Don't clear alt when toggling ctrl
      focusTerminal();
      return;
    }
    if (k.modifier === 'alt') {
      setAlt(v => !v);
      focusTerminal();
      return;
    }
    if (k.seq) write(k.seq, true);
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
                tabIndex={-1}
                className={`ms-term-extra-key${active ? ' active' : ''}`}
                aria-pressed={k.modifier ? active : undefined}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onKey(k);
                }}
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