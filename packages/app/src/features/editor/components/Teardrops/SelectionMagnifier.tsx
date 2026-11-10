// src/features/editor/components/Teardrops/SelectionMagnifier.tsx
// Phase 2: richer line slice, centered caret, smart edge flip

import React, { useEffect, useRef } from 'react';

export interface SelectionMagnifierProps {
  enabled: boolean;
  active: boolean;
  clientX: number;
  clientY: number;
  editor: any;
  handleType?: 'cursor' | 'start' | 'end' | null;
  width?: number;
  height?: number;
  scale?: number;
}

const DROP_H = 36;
const CARET_H = 22;
const HIT_LIFT = DROP_H + CARET_H * 0.4;

export const SelectionMagnifier: React.FC<SelectionMagnifierProps> = ({
  enabled,
  active,
  clientX,
  clientY,
  editor,
  handleType = null,
  width = 180,
  height = 56,
  scale = 1.75,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const beforeRef = useRef<HTMLSpanElement>(null);
  const afterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled || !active || !editor || editor._isDisposed) {
      if (rootRef.current) rootRef.current.style.display = 'none';
      return;
    }

    const root = rootRef.current;
    const beforeEl = beforeRef.current;
    const afterEl = afterRef.current;
    if (!root || !beforeEl || !afterEl) return;

    let before = '';
    let after = '';
    try {
      const target =
        editor.getTargetAtClientPoint(clientX, clientY - HIT_LIFT) ||
        editor.getTargetAtClientPoint(clientX, clientY - DROP_H);
      const pos = target?.position;
      if (pos) {
        const model = editor.getModel?.();
        if (model) {
          const line = model.getLineContent(pos.lineNumber) as string;
          const col = Math.max(0, pos.column - 1);
          const pad = 14;
          const from = Math.max(0, col - pad);
          const to = Math.min(line.length, col + pad);
          before = line.slice(from, col);
          after = line.slice(col, to);
        }
      }
    } catch {
      /* ignore */
    }

    beforeEl.textContent = before || '\u00a0';
    afterEl.textContent = after || '\u00a0';

    let fontSize = 14;
    let fontFamily = 'monospace';
    try {
      // Monaco EditorOption.fontSize / fontFamily numeric ids vary; try getOption by name path
      fontSize = editor.getOption?.(50) ?? editor.getOption?.(48) ?? 14;
      fontFamily = editor.getOption?.(49) ?? editor.getOption?.(47) ?? 'monospace';
    } catch {
      /* ignore */
    }
    const magnified = Math.round(fontSize * scale);
    beforeEl.style.fontSize = afterEl.style.fontSize = `${magnified}px`;
    beforeEl.style.fontFamily = afterEl.style.fontFamily = fontFamily;

    const gap = 58;
    let left = clientX - width / 2;
    let top = clientY - height - gap;
    if (top < 8) top = clientY + gap * 0.55;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - height - 8));

    root.style.display = 'flex';
    root.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }, [enabled, active, clientX, clientY, editor, handleType, width, height, scale]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      className="ms-selection-magnifier"
      style={{
        position: 'fixed',
        top: '-80px',
        left: 0,
        width,
        height,
        zIndex: 10000,
        pointerEvents: 'none',
        display: 'none',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
        border: '1.5px solid rgba(255,255,255,0.2)',
        background: 'var(--ms-bg-side, #252526)',
        alignItems: 'center',
        justifyContent: 'center',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '100%',
          padding: '0 10px',
          overflow: 'hidden',
          whiteSpace: 'pre',
          color: 'var(--ms-text-main, #ccc)',
          lineHeight: 1.2,
        }}
      >
        <span ref={beforeRef} style={{ opacity: 0.95 }} />
        {/* Center caret bar between before/after */}
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1.1em',
            margin: '0 1px',
            background: 'var(--ms-accent, #007acc)',
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
        <span ref={afterRef} style={{ opacity: 0.95 }} />
      </div>
    </div>
  );
};
