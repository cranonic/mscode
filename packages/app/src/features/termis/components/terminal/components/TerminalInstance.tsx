// src/features/termis/components/terminal/components/TerminalInstance.tsx
import React, { useCallback, useRef } from 'react';
import { useTerminalInstance } from '../hooks/useTerminalInstance';
import { StartDropSVG, EndDropSVG, DROP_W } from '@/features/editor/components/Teardrops/components/TeardropsShapes';
import { useSettingsStore } from '@/features/settings/store/settingsStore';

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
  const showLens = !!useSettingsStore.getState().settings?.['terminal.integrated.showLens'];
  const [lens, setLens] = React.useState<{ x: number; y: number } | null>(null);

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
    if (showLens) {
      const above = e.clientY > 120;
      setLens({ x: e.clientX, y: above ? e.clientY - 90 : e.clientY + 70 });
    }
  }, [moveHandleDrag, showLens]);

  const onHandlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    endHandleDrag();
    draggingRef.current = null;
    setLens(null);
  }, [endHandleDrag]);

  // Menu follows the RIGHT (end) handle / cursor — not the left edge
  const winW = typeof window !== 'undefined' ? window.innerWidth : 400;
  const menuW = 140;
  const menuX = selection
    ? Math.max(8, Math.min(selection.endX - menuW / 2, winW - menuW - 8))
    : 0;
  const menuY = selection
    ? Math.max(8, Math.min(selection.endY, selection.startY) - 52)
    : 0;

  // Teardrop offsets: push slightly outward from selection edges
  const EDGE_INSET = 2; // px outward from cell edge
  let startHandleX = selection ? selection.startX - EDGE_INSET : 0;
  let endHandleX = selection ? selection.endX + EDGE_INSET : 0;
  // Near left screen edge: shift left teardrop inward so it stays usable
  const LEFT_EDGE_ZONE = 28;
  if (selection && selection.startX < LEFT_EDGE_ZONE) {
    startHandleX = Math.min(selection.startX + 18, selection.endX - 12);
  }

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
              transform: `translate3d(${startHandleX - DROP_W / 2}px, ${selection.startY}px, 0)`,
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
              transform: `translate3d(${endHandleX - DROP_W / 2}px, ${selection.endY}px, 0)`,
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


          {/* Android-style selection lens */}
          {showLens && lens && (
            <div
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.5)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 4,
                transform: `translate3d(${lens.x - 36}px, ${lens.y - 36}px, 0)`,
                background: 'var(--ms-bg-main, #1e1e1e)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 2,
                  height: 16,
                  marginLeft: -1,
                  marginTop: -8,
                  background: '#58a6ff',
                  borderRadius: 1,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 16,
                  height: 2,
                  marginLeft: -8,
                  marginTop: -1,
                  background: '#58a6ff',
                  borderRadius: 1,
                }}
              />
            </div>
          )}

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
