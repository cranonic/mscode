// src/features/terminal/components/TerminalInstance.tsx
import React, { useCallback, useRef } from 'react';
import { useTerminalInstance } from '../hooks/useTerminalInstance';
import { StartDropSVG, EndDropSVG, DROP_W } from '@/features/editor/components/Teardrops/components/TeardropsShapes';

interface TerminalInstanceProps {
  terminalId: string;
  isActive:   boolean;
}

export const TerminalInstance: React.FC<TerminalInstanceProps> = ({ terminalId, isActive }) => {
  const {
    containerRef,
    focus,
    fit,
    selection,
    handleCopy,
    handlePaste,
    beginHandleDrag,
    moveHandleDrag,
    endHandleDrag,
  } = useTerminalInstance({ terminalId });

  const draggingRef = useRef<'start' | 'end' | null>(null);

  useEffectFocus(isActive, fit, focus);

  // ── Teardrop drag (pointer events → works for mouse + touch) ─────────────

  const onHandlePointerDown = useCallback((
    which: 'start' | 'end',
    e: React.PointerEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    draggingRef.current = which;
    beginHandleDrag(which, e.clientX, e.clientY);
  }, [beginHandleDrag]);

  const onHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    moveHandleDrag(draggingRef.current, e.clientX, e.clientY);
  }, [moveHandleDrag]);

  const onHandlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    endHandleDrag();
    draggingRef.current = null;
  }, [endHandleDrag]);

  // Menu sits above the selection start; clamp so it stays on-screen
  const menuX = selection
    ? Math.max(8, Math.min(selection.startX, (typeof window !== 'undefined' ? window.innerWidth : 400) - 140))
    : 0;
  const menuY = selection
    ? Math.max(8, selection.startY - 48)
    : 0;

  return (
    <div style={{ position: 'absolute', inset: 0, visibility: isActive ? 'visible' : 'hidden' }}>
      <div
        ref={containerRef}
        className="ms-terminal-container"
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      />

      {/* SELECTION OVERLAY */}
      {isActive && selection && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            touchAction: 'none',
          }}
        >
          {/* Start teardrop — bottom of first selected cell */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${selection.startX - DROP_W / 2}px, ${selection.startY}px, 0)`,
              pointerEvents: 'auto',
              touchAction: 'none',
              cursor: 'grab',
              zIndex: 2,
            }}
            onPointerDown={(e) => onHandlePointerDown('start', e)}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
          >
            <StartDropSVG />
          </div>

          {/* End teardrop — bottom of last selected cell */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${selection.endX - DROP_W / 2}px, ${selection.endY}px, 0)`,
              pointerEvents: 'auto',
              touchAction: 'none',
              cursor: 'grab',
              zIndex: 2,
            }}
            onPointerDown={(e) => onHandlePointerDown('end', e)}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
          >
            <EndDropSVG />
          </div>

          {/* Floating Copy / Paste menu */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${menuX}px, ${menuY}px, 0)`,
              background: 'var(--ms-bg-main)',
              border: '1px solid var(--ms-border-light)',
              display: 'flex',
              borderRadius: '6px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              pointerEvents: 'auto',
              zIndex: 3,
            }}
          >
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
            <div style={{ width: '1px', background: 'var(--ms-border-light)', margin: '4px 0' }} />
            <button
              type="button"
              onClick={handlePaste}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Paste
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Focus + fit when tab becomes active (keeps main component clean). */
function useEffectFocus(
  isActive: boolean,
  fit: () => void,
  focus: () => void
) {
  React.useEffect(() => {
    if (isActive) {
      const t = setTimeout(() => {
        fit();
        focus();
      }, 30);
      return () => clearTimeout(t);
    }
  }, [isActive, fit, focus]);
}
