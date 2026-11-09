// src/features/editor/components/Teardrops/SelectionMagnifier.tsx
// Android-style rectangular magnifier during teardrop / selection handle drag.

import React, { useEffect, useRef } from 'react';

export interface SelectionMagnifierProps {
  enabled: boolean;
  /** Show only while a handle is being dragged */
  active: boolean;
  /** Finger / handle client coordinates (viewport) */
  clientX: number;
  clientY: number;
  /** Monaco editor instance */
  editor: any;
  /** Optional: which handle — used for vertical offset bias */
  handleType?: 'cursor' | 'start' | 'end' | null;
  /** Lens size in CSS px */
  width?: number;
  height?: number;
  /** Zoom factor */
  scale?: number;
}

/**
 * Renders a floating rectangle that shows a magnified snapshot of the editor
 * around the caret/selection point. Position is smart-clamped inside the viewport
 * (above finger by default, flips below near top edge — like Android text select).
 */
export const SelectionMagnifier: React.FC<SelectionMagnifierProps> = ({
  enabled,
  active,
  clientX,
  clientY,
  editor,
  handleType = null,
  width = 160,
  height = 56,
  scale = 1.6,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !active || !editor || editor._isDisposed) return;

    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Prefer Monaco's DOM node under finger for a simple visual lift
    const dom = editor.getDomNode?.() as HTMLElement | null;
    if (!dom) return;

    const rect = dom.getBoundingClientRect();
    // Source region in editor local coords (unscaled)
    const srcW = width / scale;
    const srcH = height / scale;
    let srcX = clientX - rect.left - srcW / 2;
    let srcY = clientY - rect.top - srcH / 2;

    // Clamp source into editor bounds
    srcX = Math.max(0, Math.min(srcX, rect.width - srcW));
    srcY = Math.max(0, Math.min(srcY, rect.height - srcH));

    // Draw: try html2canvas-free path — paint solid + sample via foreignObject is heavy;
    // Use a lightweight approach: clone visible text via getTargetAtClientPoint + fill bg
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getComputedStyle(dom).backgroundColor || '#1e1e1e';
    ctx.fillRect(0, 0, width, height);

    // Draw magnified editor surface using CSS transform trick via offscreen isn't available;
    // Approximate: render caret guide + line highlight strip
    try {
      const target = editor.getTargetAtClientPoint?.(clientX, clientY);
      const pos = target?.position;
      if (pos) {
        const vis = editor.getScrolledVisiblePosition(pos);
        if (vis) {
          ctx.fillStyle = 'rgba(0, 122, 204, 0.15)';
          ctx.fillRect(0, height / 2 - 10, width, 20);
          ctx.strokeStyle = '#007acc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width / 2, 4);
          ctx.lineTo(width / 2, height - 4);
          ctx.stroke();
        }
      }
    } catch {
      /* ignore */
    }

    // Position lens: prefer above finger; flip if near top
    const gap = 48;
    let left = clientX - width / 2;
    let top = clientY - height - gap;
    if (top < 8) top = clientY + gap;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - height - 8));

    root.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    root.style.display = 'block';

    return () => {
      if (root) root.style.display = 'none';
    };
  }, [enabled, active, clientX, clientY, editor, handleType, width, height, scale]);

  if (!enabled || !active) return null;

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
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.18)',
        willChange: 'transform',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
