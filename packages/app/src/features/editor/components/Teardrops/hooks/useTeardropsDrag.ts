// src/features/editor/components/Teardrops/hooks/useTeardropsDrag.ts
// Phase 2 SPCK selection feel:
// - Free handle under finger (smooth)
// - Caret on tip (overlay HandleCaret)
// - Tip Y lightly biased toward glyph baseline of sticky line (less float)
// - Line switch hysteresis: down 0.42×, up 0.55× lineHeight
// - Character-precise X via hit on sticky line mid

import { useRef, useState, useCallback } from 'react';
import type { MutableRefObject, RefObject } from 'react';

const DROP_H = 36;
const CARET_H = 22;
/** Hit-test lift: caret + drop tip into glyph row */
const HIT_LIFT = DROP_H + CARET_H * 0.4;
const LINE_SWITCH_FRAC_DOWN = 0.42;
const LINE_SWITCH_FRAC_UP = 0.55;
/** How much handle Y blends toward true baseline (0=pure finger, 1=locked to line) */
const BASELINE_BLEND = 0.35;

interface UseTeardropsDragOptions {
  editorRef: MutableRefObject<any>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  isDraggingRef: MutableRefObject<boolean>;
  isPointerBlockRef: MutableRefObject<boolean>;
  monaco: any;
  updateTeardrops: () => void;
  cursorDOMRef: RefObject<HTMLDivElement | null>;
  selectionStartDOMRef: RefObject<HTMLDivElement | null>;
  selectionEndDOMRef: RefObject<HTMLDivElement | null>;
  onHandleActive: (type: 'cursor' | 'start' | 'end') => void;
  onDragStartCb: () => void;
  onDragEndCb: () => void;
  onLensMove?: (pos: { x: number; y: number; type: 'cursor' | 'start' | 'end' } | null) => void;
}

export function useTeardropsDrag({
  editorRef,
  containerRef,
  isDraggingRef,
  isPointerBlockRef,
  monaco,
  updateTeardrops,
  cursorDOMRef,
  selectionStartDOMRef,
  selectionEndDOMRef,
  onHandleActive,
  onDragStartCb,
  onDragEndCb,
  onLensMove,
}: UseTeardropsDragOptions) {
  const autoScrollRafRef = useRef<number | null>(null);
  const dragMoveRafRef = useRef<number | null>(null);
  const autoScrollDeltaRef = useRef<number>(0);
  const dragAnchorRef = useRef<any>(null);
  const lastPosRef = useRef<{ lineNumber: number; column: number } | null>(null);
  const latestTouchRef = useRef<{ x: number; y: number; type: 'cursor' | 'start' | 'end' } | null>(null);
  const stickyLineRef = useRef<number | null>(null);

  const [activeDragType, setActiveDragType] = useState<'cursor' | 'start' | 'end' | null>(null);

  const ensureAutoScrollLoop = useCallback(() => {
    if (autoScrollRafRef.current) return;
    const loop = () => {
      if (!isDraggingRef.current || autoScrollDeltaRef.current === 0) {
        autoScrollRafRef.current = null;
        return;
      }
      const editor = editorRef.current;
      if (editor) {
        try {
          (globalThis as any).__monacoScrollbarDragging = true;
          editor.setScrollTop(editor.getScrollTop() + autoScrollDeltaRef.current);
        } finally {
          (globalThis as any).__monacoScrollbarDragging = false;
        }
      }
      autoScrollRafRef.current = requestAnimationFrame(loop);
    };
    autoScrollRafRef.current = requestAnimationFrame(loop);
  }, [editorRef, isDraggingRef]);

  const stopAutoScroll = useCallback(() => {
    autoScrollDeltaRef.current = 0;
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const handleDragStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      isDraggingRef.current = true;
      dragAnchorRef.current = null;
      lastPosRef.current = null;
      stickyLineRef.current = null;
      if (onDragStartCb) onDragStartCb();
    },
    [isDraggingRef, onDragStartCb],
  );

  const positionFromFinger = useCallback((editor: any, clientX: number, clientY: number) => {
    const raw =
      editor.getTargetAtClientPoint(clientX, clientY - HIT_LIFT) ||
      editor.getTargetAtClientPoint(clientX, clientY - DROP_H) ||
      editor.getTargetAtClientPoint(clientX, clientY - 16);

    if (!raw?.position) return null;

    let lineNumber = raw.position.lineNumber;
    let column = raw.position.column;

    if (stickyLineRef.current == null) {
      stickyLineRef.current = lineNumber;
    }

    const sticky = stickyLineRef.current!;
    const stickyVis = editor.getScrolledVisiblePosition({ lineNumber: sticky, column: 1 });
    const dom = editor.getDomNode?.() as HTMLElement | null;
    const lineHeight = Math.max(14, stickyVis?.height ?? 20);

    if (stickyVis && dom) {
      const rect = dom.getBoundingClientRect();
      const lineMidClientY = rect.top + stickyVis.top + stickyVis.height / 2;
      const dy = clientY - HIT_LIFT - lineMidClientY;

      if (dy > lineHeight * LINE_SWITCH_FRAC_DOWN) {
        const maxLine = editor.getModel()?.getLineCount?.() ?? sticky + 1;
        stickyLineRef.current = Math.min(maxLine, sticky + 1);
      } else if (dy < -lineHeight * LINE_SWITCH_FRAC_UP) {
        stickyLineRef.current = Math.max(1, sticky - 1);
      }
    }

    lineNumber = stickyLineRef.current ?? lineNumber;

    // Column from X on sticky line mid-Y (character precise, not next-line noise)
    const stickyVis2 = editor.getScrolledVisiblePosition({ lineNumber, column: 1 });
    if (stickyVis2 && dom) {
      const rect = dom.getBoundingClientRect();
      const yOnLine = rect.top + stickyVis2.top + stickyVis2.height * 0.5;
      const hit =
        editor.getTargetAtClientPoint(clientX, yOnLine) ||
        editor.getTargetAtClientPoint(clientX, clientY - HIT_LIFT);
      if (hit?.position) {
        const model = editor.getModel?.();
        const maxCol = model?.getLineMaxColumn?.(lineNumber) ?? hit.position.column;
        if (hit.position.lineNumber === lineNumber) {
          column = hit.position.column;
        } else {
          column = Math.max(1, Math.min(hit.position.column, maxCol));
        }
      }
    }

    return { lineNumber, column };
  }, []);

  /**
   * Free handle: X tracks finger; Y blends toward selection baseline so caret
   * tip sits nearer the glyph row (SPCK “anchored but free” feel).
   */
  const placeHandleFree = useCallback(
    (
      type: 'cursor' | 'start' | 'end',
      clientX: number,
      clientY: number,
      container: HTMLElement,
      edgePos?: { lineNumber: number; column: number } | null,
      editor?: any,
    ) => {
      const rect = container.getBoundingClientRect();
      let localX = clientX - rect.left;
      let localY = clientY - rect.top - DROP_H * 0.35;

      if (edgePos && editor) {
        const vis = editor.getScrolledVisiblePosition(edgePos);
        if (vis) {
          // Handle origin is top-left of stack; caret sits above drop.
          // Baseline for tip ≈ line bottom (vis.top + vis.height) in editor coords.
          const baselineY = vis.top + vis.height;
          const fingerY = clientY - rect.top - DROP_H * 0.35;
          localY = fingerY * (1 - BASELINE_BLEND) + baselineY * BASELINE_BLEND;
          // X stays mostly free; tiny pull toward edge column looks steadier
          localX = clientX - rect.left;
        }
      }

      const apply = (el: HTMLDivElement | null) => {
        if (!el) return;
        el.style.display = 'block';
        el.style.transform = `translate3d(${localX}px, ${localY}px, 0)`;
      };

      if (type === 'cursor') apply(cursorDOMRef.current);
      else if (type === 'start') apply(selectionStartDOMRef.current);
      else apply(selectionEndDOMRef.current);
    },
    [cursorDOMRef, selectionStartDOMRef, selectionEndDOMRef],
  );

  const placeOppositeFromSelection = useCallback(
    (editor: any, type: 'cursor' | 'start' | 'end') => {
      const sel = editor.getSelection?.();
      if (!sel) return;
      if (type === 'start') {
        const end = editor.getScrolledVisiblePosition(sel.getEndPosition());
        if (end && selectionEndDOMRef.current) {
          selectionEndDOMRef.current.style.display = 'block';
          selectionEndDOMRef.current.style.transform =
            `translate3d(${end.left}px, ${end.top + end.height}px, 0)`;
        }
      } else if (type === 'end') {
        const start = editor.getScrolledVisiblePosition(sel.getStartPosition());
        if (start && selectionStartDOMRef.current) {
          selectionStartDOMRef.current.style.display = 'block';
          selectionStartDOMRef.current.style.transform =
            `translate3d(${start.left}px, ${start.top + start.height}px, 0)`;
        }
      }
    },
    [selectionStartDOMRef, selectionEndDOMRef],
  );

  const handleDragMove = useCallback(
    (e: React.TouchEvent, type: 'cursor' | 'start' | 'end') => {
      e.stopPropagation();
      e.preventDefault();

      setActiveDragType(prev => (prev !== type ? type : prev));
      onHandleActive(type);

      const touch = e.touches[0];
      if (!touch) return;
      const clientX = touch.clientX;
      const clientY = touch.clientY;

      latestTouchRef.current = { x: clientX, y: clientY, type };
      onLensMove?.({ x: clientX, y: clientY, type });

      const container = containerRef.current;
      const editorNow = editorRef.current;
      if (container) {
        placeHandleFree(type, clientX, clientY, container, lastPosRef.current, editorNow);
      }

      if (dragMoveRafRef.current) return;
      dragMoveRafRef.current = requestAnimationFrame(() => {
        dragMoveRafRef.current = null;
        const sample = latestTouchRef.current;
        if (!sample) return;

        const editor = editorRef.current;
        if (!editor || !monaco || !container) return;

        const { x, y, type: t } = sample;

        const rect = container.getBoundingClientRect();
        const EDGE = 56;
        let delta = 0;
        if (y < rect.top + EDGE) delta = -14;
        else if (y > rect.bottom - EDGE) delta = 14;
        autoScrollDeltaRef.current = delta;
        if (delta !== 0) ensureAutoScrollLoop();
        else stopAutoScroll();

        const newPos = positionFromFinger(editor, x, y);
        if (!newPos) {
          placeHandleFree(t, x, y, container, lastPosRef.current, editor);
          return;
        }

        const last = lastPosRef.current;
        if (last && last.lineNumber === newPos.lineNumber && last.column === newPos.column) {
          placeHandleFree(t, x, y, container, newPos, editor);
          return;
        }
        lastPosRef.current = { lineNumber: newPos.lineNumber, column: newPos.column };

        if (t === 'cursor') {
          editor.setPosition(newPos);
          placeHandleFree(t, x, y, container, newPos, editor);
          return;
        }

        let anchor = dragAnchorRef.current;
        if (!anchor) {
          const currentSel = editor.getSelection();
          if (!currentSel) return;
          anchor = t === 'start' ? currentSel.getEndPosition() : currentSel.getStartPosition();
          dragAnchorRef.current = anchor;
          stickyLineRef.current = newPos.lineNumber;
        }

        if (newPos.lineNumber === anchor.lineNumber && newPos.column === anchor.column) {
          placeHandleFree(t, x, y, container, newPos, editor);
          return;
        }

        editor.setSelection(
          new monaco.Selection(anchor.lineNumber, anchor.column, newPos.lineNumber, newPos.column),
        );

        placeHandleFree(t, x, y, container, newPos, editor);
        placeOppositeFromSelection(editor, t);
      });
    },
    [
      editorRef,
      containerRef,
      monaco,
      ensureAutoScrollLoop,
      stopAutoScroll,
      onHandleActive,
      onLensMove,
      positionFromFinger,
      placeHandleFree,
      placeOppositeFromSelection,
    ],
  );

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setActiveDragType(null);
    dragAnchorRef.current = null;
    lastPosRef.current = null;
    stickyLineRef.current = null;
    latestTouchRef.current = null;
    onLensMove?.(null);

    stopAutoScroll();
    if (dragMoveRafRef.current) {
      cancelAnimationFrame(dragMoveRafRef.current);
      dragMoveRafRef.current = null;
    }

    isPointerBlockRef.current = true;
    setTimeout(() => {
      isPointerBlockRef.current = false;
    }, 300);

    updateTeardrops();
    setTimeout(() => {
      if (onDragEndCb) onDragEndCb();
    }, 150);
  }, [isDraggingRef, isPointerBlockRef, updateTeardrops, onDragEndCb, stopAutoScroll, onLensMove]);

  return { activeDragType, handleDragStart, handleDragMove, handleDragEnd };
}
