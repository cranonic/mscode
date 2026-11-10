// src/features/termis/components/terminal/components/TerminalInstance.tsx
import React, { useCallback, useRef, useState } from 'react';
import { useTerminalInstance } from '../hooks/useTerminalInstance';
import { StartDropSVG, EndDropSVG, DROP_W } from '@/features/editor/components/Teardrops/components/TeardropsShapes';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { TerminalExtraKeys } from './TerminalExtraKeys';

interface TerminalInstanceProps {
  terminalId: string;
  isActive: boolean;
}

const LENS_W = 120;
const LENS_H = 72;
const LENS_ZOOM = 2.2;

export const TerminalInstance: React.FC<TerminalInstanceProps> = ({ terminalId, isActive }) => {
  const {
    containerRef,
    focus,
    fit,
    selection,
    menuReady,
    handleCopy,
    handlePaste,
    beginHandleDrag,
    moveHandleDrag,
    endHandleDrag,
  } = useTerminalInstance({ terminalId });

  const draggingRef = useRef<'start' | 'end' | null>(null);
  // const showLensSetting = !!useSettingsStore.getState().settings?.['terminal.integrated.showLens'];
  // Default true if setting missing
  const showLens =
    useSettingsStore.getState().settings?.['terminal.integrated.showLens'] !== false;

  const [lens, setLens] = useState<{
    x: number;
    y: number;
    srcX: number;
    srcY: number;
  } | null>(null);
  const lensCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffectFocus(isActive, fit, focus);

  const paintLens = useCallback((clientX: number, clientY: number) => {
    if (!showLens) return;
    const container = containerRef.current;
    if (!container) return;
    const canvas = container.querySelector(
      '.xterm-screen canvas, canvas',
    ) as HTMLCanvasElement | null;
    if (!canvas) {
      setLens({ x: clientX, y: clientY, srcX: 0, srcY: 0 });
      return;
    }

    const cr = container.getBoundingClientRect();
    const localX = clientX - cr.left;
    const localY = clientY - cr.top;

    // Map CSS pixels → canvas bitmap pixels
    const scaleX = canvas.width / (canvas.clientWidth || canvas.width || 1);
    const scaleY = canvas.height / (canvas.clientHeight || canvas.height || 1);
    const srcCssW = LENS_W / LENS_ZOOM;
    const srcCssH = LENS_H / LENS_ZOOM;
    const srcX = Math.max(0, localX - srcCssW / 2) * scaleX;
    const srcY = Math.max(0, localY - srcCssH / 2) * scaleY;
    const srcW = srcCssW * scaleX;
    const srcH = srcCssH * scaleY;

    const above = clientY > cr.top + 100;
    const lx = clientX;
    const ly = above ? clientY - LENS_H - 28 : clientY + 36;

    setLens({ x: lx, y: ly, srcX, srcY });

    // Paint after state flush
    requestAnimationFrame(() => {
      const lc = lensCanvasRef.current;
      if (!lc) return;
      const ctx = lc.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, LENS_W, LENS_H);
      try {
        ctx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, LENS_W, LENS_H);
      } catch {
        /* cross-origin / empty */
      }
      // Crosshair
      ctx.strokeStyle = 'rgba(88, 166, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LENS_W / 2, 0);
      ctx.lineTo(LENS_W / 2, LENS_H);
      ctx.moveTo(0, LENS_H / 2);
      ctx.lineTo(LENS_W, LENS_H / 2);
      ctx.stroke();
    });
  }, [showLens, containerRef]);

  const onHandlePointerDown = useCallback(
    (which: 'start' | 'end', e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      draggingRef.current = which;
      beginHandleDrag(which, e.clientX, e.clientY);
      paintLens(e.clientX, e.clientY);
    },
    [beginHandleDrag, paintLens],
  );

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      moveHandleDrag(draggingRef.current, e.clientX, e.clientY);
      paintLens(e.clientX, e.clientY);
    },
    [moveHandleDrag, paintLens],
  );

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        /* */
      }
      endHandleDrag();
      draggingRef.current = null;
      setLens(null);
    },
    [endHandleDrag],
  );

  const winW = typeof window !== 'undefined' ? window.innerWidth : 400;
  const viewH = containerRef.current?.clientHeight ?? 400;
  const menuW = 140;

  // Menu anchors to the END (right) teardrop — can sit above OR below that line
  const menuX = selection
    ? Math.max(8, Math.min(selection.endX - menuW / 2, winW - menuW - 8))
    : 0;
  let menuY = selection ? selection.endY - 52 : 0;
  if (selection) {
    // Prefer above end handle; if not enough room, place below
    if (menuY < 8) menuY = Math.min(selection.endY + 12, viewH - 44);
    menuY = Math.max(8, Math.min(menuY, viewH - 44));
  }

  // Extra outward placement (metricsToUI already offsets; add DROP half alignment)
  const LEFT_EDGE_ZONE = 32;
  let startHandleX = selection ? selection.startX : 0;
  let endHandleX = selection ? selection.endX : 0;
  if (selection && selection.startX < LEFT_EDGE_ZONE) {
    // Keep left handle usable near screen edge
    startHandleX = Math.min(selection.startX + 20, selection.endX - 16);
  }

  const showMenu = !!(selection && menuReady && !draggingRef.current);

  // Pinch-to-zoom (two-finger) — gated by settings
  const pinchEnabled =
    useSettingsStore.getState().settings?.['terminal.integrated.pinchZoom'] !== false;
  const pinchRef = React.useRef<{ dist: number; font: number } | null>(null);

  React.useEffect(() => {
    if (!isActive || !pinchEnabled) return;
    const el = containerRef.current;
    if (!el) return;

    const dist = (t: TouchList) => {
      if (t.length < 2) return 0;
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const s = useSettingsStore.getState().settings;
        const font =
          Number(s?.['terminal.integrated.fontSize'] ?? s?.['editor.fontSize'] ?? 13) || 13;
        pinchRef.current = { dist: dist(e.touches), font };
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const d = dist(e.touches);
      if (d < 8) return;
      const scale = d / Math.max(1, pinchRef.current.dist);
      let next = Math.round(pinchRef.current.font * scale);
      next = Math.max(8, Math.min(40, next));
      useSettingsStore.getState().updateSetting?.('terminal.integrated.fontSize', next);
    };
    const onEnd = () => {
      pinchRef.current = null;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [isActive, pinchEnabled, containerRef]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        visibility: isActive ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        ref={containerRef}
        className="ms-terminal-container"
        style={{ position: 'relative', flex: 1, overflow: 'hidden', minHeight: 0 }}
      />

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
          {/* Start teardrop */}
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

          {/* End teardrop */}
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

          {/* Rectangular magnifier lens with real terminal pixels */}
          {showLens && lens && (
            <div
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: LENS_W,
                height: LENS_H,
                borderRadius: 8,
                border: '2px solid rgba(255,255,255,0.55)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 5,
                transform: `translate3d(${lens.x - LENS_W / 2}px, ${lens.y - LENS_H / 2}px, 0)`,
                background: 'var(--ms-bg-main, #1e1e1e)',
              }}
            >
              <canvas
                ref={lensCanvasRef}
                width={LENS_W}
                height={LENS_H}
                style={{ width: LENS_W, height: LENS_H, display: 'block' }}
              />
            </div>
          )}

          {/* Copy / Paste — only after selection is released */}
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate3d(${menuX}px, ${menuY}px, 0)`,
                background: 'var(--ms-bg-main)',
                border: '1px solid var(--ms-border-light)',
                display: 'flex',
                borderRadius: 6,
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
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
              <div
                style={{
                  width: 1,
                  background: 'var(--ms-border-light)',
                  margin: '4px 0',
                }}
              />
              <button
                type="button"
                onClick={handlePaste}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: 'white',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Paste
              </button>
            </div>
          )}
        </div>
      )}

      {isActive && <TerminalExtraKeys terminalId={terminalId} />}
    </div>
  );
};

function useEffectFocus(isActive: boolean, fit: () => void, focus: () => void) {
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
