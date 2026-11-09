// src/features/editor/components/Teardrops/SelectionMagnifier.tsx
// Android-style rectangular loupe while dragging teardrop handles.

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
const HIT_LIFT = DROP_H + 8;

export const SelectionMagnifier: React.FC<SelectionMagnifierProps> = ({
  enabled,
  active,
  clientX,
  clientY,
  editor,
  handleType = null,
  width = 168,
  height = 52,
  scale = 1.75,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !active || !editor || editor._isDisposed) {
      if (rootRef.current) rootRef.current.style.display = 'none';
      return;
    }

    const root = rootRef.current;
    const textEl = textRef.current;
    if (!root || !textEl) return;

    // Read characters around the hit point (lifted into glyph line)
    let label = '';
    try {
      const target = editor.getTargetAtClientPoint(clientX, clientY - HIT_LIFT)
        || editor.getTargetAtClientPoint(clientX, clientY - DROP_H);
      const pos = target?.position;
      if (pos) {
        const model = editor.getModel?.();
        if (model) {
          const line = model.getLineContent(pos.lineNumber) as string;
          const col = pos.column - 1; // 0-based
          const pad = 12;
          const from = Math.max(0, col - pad);
          const to = Math.min(line.length, col + pad);
          const slice = line.slice(from, to);
          const caretInSlice = col - from;
          // Mark caret with thin space marker
          label = slice.slice(0, caretInSlice) + '│' + slice.slice(caretInSlice);
        }
      }
    } catch {
      /* ignore */
    }

    textEl.textContent = label || ' ';
    // Magnify font relative to editor
    let fontSize = 14;
    try {
      fontSize = editor.getOption?.(50 /* fontSize */) ?? 14;
    } catch {
      /* ignore */
    }
    textEl.style.fontSize = `${Math.round(fontSize * scale)}px`;
    textEl.style.fontFamily =
      (typeof editor.getOption === 'function'
        ? editor.getOption(49 /* fontFamily */)
        : null) || 'monospace';

    // Smart position: above finger, flip below near top edge
    const gap = 56;
    let left = clientX - width / 2;
    let top = clientY - height - gap;
    if (top < 8) top = clientY + gap * 0.6;
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
        top: 0,
        left: 0,
        width,
        height,
        zIndex: 10000,
        pointerEvents: 'none',
        display: 'none',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        border: '1.5px solid rgba(255,255,255,0.22)',
        background: 'var(--ms-bg-side, #252526)',
        alignItems: 'center',
        justifyContent: 'center',
        willChange: 'transform',
      }}
    >
      <div
        ref={textRef}
        style={{
          padding: '0 12px',
          whiteSpace: 'pre',
          color: 'var(--ms-text-main, #ccc)',
          lineHeight: 1.2,
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      />
      {/* caret accent bar in center of lens */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 6,
          bottom: 6,
          width: 2,
          marginLeft: -1,
          background: 'var(--ms-accent, #007acc)',
          opacity: 0.85,
          borderRadius: 1,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
