// src/features/editor/components/Scrollbar/EditorScrollbar.tsx
// Continuous thumb drag: editor always follows thumb (no stop mid-drag).

import React, { useEffect, useState, useRef, useCallback } from 'react';
import './EditorScrollbar.css';

export interface ScrollbarConfig {
  showVertical: boolean;
  showHorizontal: boolean;
  verticalVisibility: 'auto' | 'always';
  horizontalVisibility: 'auto' | 'always';
  thumbWidth: number;
  trackWidth: number;
  thumbFixedSize: number;
  autoHideDelay: number;
  fadeOutDuration: number;
  showOnMount: boolean;
  mountFlashDuration: number;
}

export const DEFAULT_SCROLLBAR_CONFIG: ScrollbarConfig = {
  showVertical: true,
  showHorizontal: true,
  verticalVisibility: 'auto',
  horizontalVisibility: 'auto',
  thumbWidth: 15,
  trackWidth: 32,
  thumbFixedSize: 50,
  autoHideDelay: 1200,
  fadeOutDuration: 350,
  showOnMount: true,
  mountFlashDuration: 1000,
};

interface EditorScrollbarProps {
  editor: any;
  config?: Partial<ScrollbarConfig>;
}

function beginScrollApply() {
  try {
    (globalThis as any).__monacoScrollbarDragging = true;
    (globalThis as any).__monacoAllowScrollApply = true;
    // Don't let touch-scroll block path win mid-drag
    (globalThis as any).__monacoTouchScrolling = false;
  } catch { /* ignore */ }
}

function endScrollApply() {
  try {
    (globalThis as any).__monacoScrollbarDragging = false;
    (globalThis as any).__monacoAllowScrollApply = false;
  } catch { /* ignore */ }
}

export const EditorScrollbar: React.FC<EditorScrollbarProps> = ({ editor, config: cfgOverride }) => {
  const cfg: ScrollbarConfig = { ...DEFAULT_SCROLLBAR_CONFIG, ...cfgOverride };

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [contentH, setContentH] = useState(1);
  const [contentW, setContentW] = useState(1);
  const [viewH, setViewH] = useState(1);
  const [viewW, setViewW] = useState(1);

  const yAlways = cfg.verticalVisibility === 'always';
  const xAlways = cfg.horizontalVisibility === 'always';
  const [yVis, setYVis] = useState<0 | 1>(yAlways ? 1 : 0);
  const [xVis, setXVis] = useState<0 | 1>(xAlways ? 1 : 0);

  const yTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const xTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const metricsRef = useRef({
    scrollTop: 0, scrollLeft: 0, contentH: 1, contentW: 1, viewH: 1, viewW: 1, maxST: 0, maxSL: 0,
  });
  const yThumbRef = useRef<HTMLDivElement>(null);
  const xThumbRef = useRef<HTMLDivElement>(null);
  const yTrackRef = useRef<HTMLDivElement>(null);
  const xTrackRef = useRef<HTMLDivElement>(null);

  const yDrag = useRef({ on: false, pointerId: -1, startClient: 0, startScroll: 0 });
  const xDrag = useRef({ on: false, pointerId: -1, startClient: 0, startScroll: 0 });

  const showY = useCallback((delay: number) => {
    if (yAlways) return;
    setYVis(1);
    clearTimeout(yTimer.current);
    yTimer.current = setTimeout(() => setYVis(0), delay);
  }, [yAlways]);

  const showX = useCallback((delay: number) => {
    if (xAlways) return;
    setXVis(1);
    clearTimeout(xTimer.current);
    xTimer.current = setTimeout(() => setXVis(0), delay);
  }, [xAlways]);

  const keepYVisible = useCallback(() => { if (!yAlways) setYVis(1); }, [yAlways]);
  const keepXVisible = useCallback(() => { if (!xAlways) setXVis(1); }, [xAlways]);

  /** Live metrics from editor — never trust stale maxST mid-drag */
  const refreshMetrics = useCallback(() => {
    if (!editor || editor._isDisposed) return metricsRef.current;
    const st = editor.getScrollTop();
    const sl = editor.getScrollLeft?.() ?? 0;
    const ch = editor.getScrollHeight?.() ?? editor.getContentHeight?.() ?? 1;
    const cw = editor.getScrollWidth?.() ?? 1;
    const li = editor.getLayoutInfo();
    const vh = li.height;
    const vw = li.width;
    // Prefer scrollHeight - height for max (matches Monaco internal)
    const maxST = Math.max(0, ch - vh);
    const maxSL = Math.max(0, cw - vw);
    metricsRef.current = {
      scrollTop: st, scrollLeft: sl, contentH: ch, contentW: cw, viewH: vh, viewW: vw, maxST, maxSL,
    };
    return metricsRef.current;
  }, [editor]);

  const updateThumbDom = useCallback(() => {
    const m = metricsRef.current;
    const yThumbH = cfg.thumbFixedSize;
    const maxYOffset = Math.max(0, m.viewH - yThumbH);
    const yOffset = m.maxST > 0 ? (m.scrollTop / m.maxST) * maxYOffset : 0;
    if (yThumbRef.current) {
      yThumbRef.current.style.transform = `translate3d(0, ${yOffset}px, 0)`;
    }
    const xThumbW = cfg.thumbFixedSize;
    const maxXOffset = Math.max(0, m.viewW - xThumbW);
    const xOffset = m.maxSL > 0 ? (m.scrollLeft / m.maxSL) * maxXOffset : 0;
    if (xThumbRef.current) {
      xThumbRef.current.style.transform = `translate3d(${xOffset}px, 0, 0)`;
    }
  }, [cfg.thumbFixedSize]);

  /** Apply scroll immediately with flags held open */
  const applyScrollTop = useCallback((top: number) => {
    if (!editor || editor._isDisposed) return;
    beginScrollApply();
    try {
      editor.setScrollTop(top);
      // If Monaco still ignored, force via layout API
      const got = editor.getScrollTop();
      if (Math.abs(got - top) > 1) {
        editor.setScrollTop(top);
      }
      metricsRef.current.scrollTop = editor.getScrollTop();
    } finally {
      // keep dragging flag true while finger is down — endScrollApply only on pointerup
      if (!yDrag.current.on && !xDrag.current.on) endScrollApply();
      else beginScrollApply();
    }
  }, [editor]);

  const applyScrollLeft = useCallback((left: number) => {
    if (!editor || editor._isDisposed) return;
    beginScrollApply();
    try {
      editor.setScrollLeft?.(left);
      metricsRef.current.scrollLeft = editor.getScrollLeft?.() ?? left;
    } finally {
      if (!yDrag.current.on && !xDrag.current.on) endScrollApply();
      else beginScrollApply();
    }
  }, [editor]);

  useEffect(() => {
    if (!editor || editor._isDisposed) return;

    const sync = () => {
      const m = refreshMetrics();
      setScrollTop(m.scrollTop);
      setScrollLeft(m.scrollLeft);
      setContentH(m.contentH);
      setContentW(m.contentW);
      setViewH(m.viewH);
      setViewW(m.viewW);
      updateThumbDom();
    };
    sync();
    if (cfg.showOnMount) {
      showY(cfg.mountFlashDuration);
      showX(cfg.mountFlashDuration);
    }

    const subs = [
      editor.onDidScrollChange((e: any) => {
        metricsRef.current.scrollTop = e.scrollTop;
        metricsRef.current.scrollLeft = e.scrollLeft;
        if (yDrag.current.on || xDrag.current.on) {
          // During drag thumb is driven by finger math; still sync metrics
          return;
        }
        if (e.scrollTopChanged) {
          setScrollTop(e.scrollTop);
          showY(cfg.autoHideDelay);
        }
        if (e.scrollLeftChanged) {
          setScrollLeft(e.scrollLeft);
          showX(cfg.autoHideDelay);
        }
        updateThumbDom();
      }),
      editor.onDidContentSizeChange((e: any) => {
        metricsRef.current.contentH = e.contentHeight;
        metricsRef.current.contentW = e.contentWidth ?? 1;
        const m = refreshMetrics();
        setContentH(m.contentH);
        setContentW(m.contentW);
      }),
      editor.onDidLayoutChange(() => {
        const m = refreshMetrics();
        setViewH(m.viewH);
        setViewW(m.viewW);
      }),
    ];

    const onPointerMove = (e: PointerEvent) => {
      if (yDrag.current.on && e.pointerId === yDrag.current.pointerId) {
        e.preventDefault();
        beginScrollApply();
        const m = refreshMetrics();
        const maxYOffset = Math.max(1, m.viewH - cfg.thumbFixedSize);
        const ratio = m.maxST / maxYOffset;
        const delta = e.clientY - yDrag.current.startClient;
        const next = Math.max(0, Math.min(yDrag.current.startScroll + delta * ratio, m.maxST));
        // Thumb tracks intended scroll (even if editor lags one frame)
        metricsRef.current.scrollTop = next;
        metricsRef.current.maxST = m.maxST;
        metricsRef.current.viewH = m.viewH;
        updateThumbDom();
        applyScrollTop(next);
        keepYVisible();
      }
      if (xDrag.current.on && e.pointerId === xDrag.current.pointerId) {
        e.preventDefault();
        beginScrollApply();
        const m = refreshMetrics();
        const maxXOffset = Math.max(1, m.viewW - cfg.thumbFixedSize);
        const ratio = m.maxSL / maxXOffset;
        const delta = e.clientX - xDrag.current.startClient;
        const next = Math.max(0, Math.min(xDrag.current.startScroll + delta * ratio, m.maxSL));
        metricsRef.current.scrollLeft = next;
        metricsRef.current.maxSL = m.maxSL;
        metricsRef.current.viewW = m.viewW;
        updateThumbDom();
        applyScrollLeft(next);
        keepXVisible();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (yDrag.current.on && e.pointerId === yDrag.current.pointerId) {
        yDrag.current.on = false;
        endScrollApply();
        showY(cfg.autoHideDelay);
        const m = refreshMetrics();
        setScrollTop(m.scrollTop);
        updateThumbDom();
      }
      if (xDrag.current.on && e.pointerId === xDrag.current.pointerId) {
        xDrag.current.on = false;
        endScrollApply();
        showX(cfg.autoHideDelay);
        const m = refreshMetrics();
        setScrollLeft(m.scrollLeft);
        updateThumbDom();
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      subs.forEach(s => s.dispose());
      clearTimeout(yTimer.current);
      clearTimeout(xTimer.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      endScrollApply();
    };
  }, [editor, cfg, showY, showX, keepYVisible, keepXVisible, updateThumbDom, refreshMetrics, applyScrollTop, applyScrollLeft]);

  const maxST = Math.max(0, contentH - viewH);
  const maxSL = Math.max(0, contentW - viewW);
  const yThumbH = cfg.thumbFixedSize;
  const maxYOffset = viewH - yThumbH;
  const yOffset = maxST > 0 ? (scrollTop / maxST) * maxYOffset : 0;
  const xThumbW = cfg.thumbFixedSize;
  const maxXOffset = viewW - xThumbW;
  const xOffset = maxSL > 0 ? (scrollLeft / maxSL) * maxXOffset : 0;
  const hasY = cfg.showVertical && maxST > 0;
  const hasX = cfg.showHorizontal && maxSL > 0;
  const hasBoth = hasY && hasX;

  const beginY = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    const m = refreshMetrics();
    yDrag.current = {
      on: true,
      pointerId: e.pointerId,
      startClient: e.clientY,
      startScroll: m.scrollTop,
    };
    clearTimeout(yTimer.current);
    keepYVisible();
    beginScrollApply();
  };

  const beginX = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    const m = refreshMetrics();
    xDrag.current = {
      on: true,
      pointerId: e.pointerId,
      startClient: e.clientX,
      startScroll: m.scrollLeft,
    };
    clearTimeout(xTimer.current);
    keepXVisible();
    beginScrollApply();
  };

  const onYTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== yTrackRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = yTrackRef.current!.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const m = refreshMetrics();
    const next = Math.max(0, Math.min(ratio * m.contentH - m.viewH / 2, m.maxST));
    beginScrollApply();
    applyScrollTop(next);
    endScrollApply();
    showY(cfg.autoHideDelay);
  };

  const onXTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== xTrackRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = xTrackRef.current!.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const m = refreshMetrics();
    const next = Math.max(0, Math.min(ratio * m.contentW - m.viewW / 2, m.maxSL));
    beginScrollApply();
    applyScrollLeft(next);
    endScrollApply();
    showX(cfg.autoHideDelay);
  };

  if (!editor || (!hasY && !hasX)) return null;

  return (
    <div className="ms-sb-root" style={{ ['--ms-sb-fade-dur' as any]: `${cfg.fadeOutDuration}ms` }}>
      {hasY && (
        <div
          ref={yTrackRef}
          className="ms-sb-track ms-sb-track--y"
          style={{
            opacity: yVis,
            width: cfg.trackWidth,
            height: hasBoth ? `calc(100% - ${cfg.trackWidth}px)` : '100%',
          }}
          onPointerDown={onYTrackDown}
        >
          <div
            ref={yThumbRef}
            className="ms-sb-thumb ms-sb-thumb--y"
            style={{
              height: yThumbH,
              width: cfg.thumbWidth,
              transform: `translate3d(0, ${yOffset}px, 0)`,
            }}
            onPointerDown={beginY}
          />
        </div>
      )}
      {hasX && (
        <div
          ref={xTrackRef}
          className="ms-sb-track ms-sb-track--x"
          style={{
            opacity: xVis,
            height: cfg.trackWidth,
            width: hasBoth ? `calc(100% - ${cfg.trackWidth}px)` : '100%',
          }}
          onPointerDown={onXTrackDown}
        >
          <div
            ref={xThumbRef}
            className="ms-sb-thumb ms-sb-thumb--x"
            style={{
              width: xThumbW,
              height: cfg.thumbWidth,
              transform: `translate3d(${xOffset}px, 0, 0)`,
            }}
            onPointerDown={beginX}
          />
        </div>
      )}
    </div>
  );
};
