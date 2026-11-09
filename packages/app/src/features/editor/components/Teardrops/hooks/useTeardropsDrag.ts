// src/features/editor/components/Teardrops/hooks/useTeardropsDrag.ts
//
// SPCK-style selection handles:
// - Handle is free: visual follows finger smoothly during drag
// - Selection is character-precise on X
// - Line changes only after ~0.45× lineHeight past current line mid (a bit under half)
// - Upward line-change needs slightly more travel than downward (less top sensitivity)

import { useRef, useState, useCallback } from 'react';
import type { MutableRefObject, RefObject } from 'react';

const DROP_H = 36;
/** Finger sits on handle below glyphs — lift hit into the text row */
const HIT_LIFT = DROP_H + 6;
/** Fraction of lineHeight past mid before line switch (SPCK ≈ half, slightly under) */
const LINE_SWITCH_FRAC_DOWN = 0.42;
/** Slightly harder to switch upward (user request: top less sensitive) */
const LINE_SWITCH_FRAC_UP = 0.55;

interface UseTeardropsDragOptions {
  editorRef:            MutableRefObject<any>;
  containerRef:         MutableRefObject<HTMLDivElement | null>;
  isDraggingRef:        MutableRefObject<boolean>;
  isPointerBlockRef:    MutableRefObject<boolean>;
  monaco:               any;
  updateTeardrops:      () => void;
  cursorDOMRef:         RefObject<HTMLDivElement | null>;
  selectionStartDOMRef: RefObject<HTMLDivElement | null>;
  selectionEndDOMRef:   RefObject<HTMLDivElement | null>;
  onHandleActive:       (type: 'cursor' | 'start' | 'end') => void;
  onDragStartCb:        () => void;
  onDragEndCb:          () => void;
  onLensMove?:          (pos: { x: number; y: number; type: 'cursor' | 'start' | 'end' } | null) => void;
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

  const autoScrollRafRef   = useRef<number | null>(null);
  const dragMoveRafRef     = useRef<number | null>(null);
  const autoScrollDeltaRef = useRef<number>(0);
  const dragAnchorRef      = useRef<any>(null);
  const lastPosRef         = useRef<{ lineNumber: number; column: number } | null>(null);
  const latestTouchRef     = useRef<{ x: number; y: number; type: 'cursor' | 'start' | 'end' } | null>(null);
  /** Sticky line during drag — only changes after hysteresis threshold */
  const stickyLineRef      = useRef<number | null>(null);

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

  const handleDragStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    isDraggingRef.current = true;
    dragAnchorRef.current = null;
    lastPosRef.current = null;
    stickyLineRef.current = null;
    if (onDragStartCb) onDragStartCb();
  }, [isDraggingRef, onDragStartCb]);

  /**
   * SPCK-style position from finger:
   * - X: free character hit (with lift)
   * - Y: sticky line until finger crosses ~half lineHeight past mid
   * - Up needs more travel than down
   */
  const positionFromFinger = useCallback((editor: any, clientX: number, clientY: number) => {
    const raw =
      editor.getTargetAtClientPoint(clientX, clientY - HIT_LIFT) ||
      editor.getTargetAtClientPoint(clientX, clientY - DROP_H) ||
      editor.getTargetAtClientPoint(clientX, clientY - 20);

    if (!raw?.position) return null;

    let lineNumber = raw.position.lineNumber;
    let column = raw.position.column;

    // Line height from visible metrics of sticky or raw line
    const probeLine = stickyLineRef.current ?? lineNumber;
    const probePos = { lineNumber: probeLine, column: 1 };
    const vis = editor.getScrolledVisiblePosition(probePos);
    const lineHeight = Math.max(14, vis?.height ?? 20);

    if (stickyLineRef.current == null) {
      stickyLineRef.current = lineNumber;
    }

    const sticky = stickyLineRef.current!;
    const stickyVis = editor.getScrolledVisiblePosition({ lineNumber: sticky, column: 1 });
    if (stickyVis) {
      // Mid of sticky line in client space: container-relative top is stickyVis.top
      // getScrolledVisiblePosition is relative to editor viewport — convert via dom rect
      const dom = editor.getDomNode?.() as HTMLElement | null;
      if (dom) {
        const rect = dom.getBoundingClientRect();
        const lineMidClientY = rect.top + stickyVis.top + stickyVis.height / 2;
        const dy = (clientY - HIT_LIFT) - lineMidClientY;

        if (dy > lineHeight * LINE_SWITCH_FRAC_DOWN) {
          // move down
          stickyLineRef.current = Math.min(
            editor.getModel()?.getLineCount?.() ?? sticky + 1,
            sticky + 1,
          );
        } else if (dy < -lineHeight * LINE_SWITCH_FRAC_UP) {
          // move up (harder)
          stickyLineRef.current = Math.max(1, sticky - 1);
        }
      }
    }

    lineNumber = stickyLineRef.current ?? lineNumber;

    // Column from X on the sticky line — re-hit at sticky line's vertical center
    const stickyVis2 = editor.getScrolledVisiblePosition({ lineNumber, column: 1 });
    if (stickyVis2) {
      const dom = editor.getDomNode?.() as HTMLElement | null;
      if (dom) {
        const rect = dom.getBoundingClientRect();
        const yOnLine = rect.top + stickyVis2.top + stickyVis2.height * 0.5;
        const hit =
          editor.getTargetAtClientPoint(clientX, yOnLine) ||
          editor.getTargetAtClientPoint(clientX, clientY - HIT_LIFT);
        if (hit?.position && hit.position.lineNumber === lineNumber) {
          column = hit.position.column;
        } else if (hit?.position) {
          // X hit fell on another line — keep column from model line length clamp
          const model = editor.getModel?.();
          if (model) {
            const maxCol = model.getLineMaxColumn(lineNumber);
            column = Math.max(1, Math.min(hit.position.column, maxCol));
          }
        }
      }
    }

    return { lineNumber, column };
  }, []);

  /** Free handle: follow finger immediately (SPCK feel) */
  const placeHandleFree = useCallback((
    type: 'cursor' | 'start' | 'end',
    clientX: number,
    clientY: number,
    container: HTMLElement,
  ) => {
    const rect = container.getBoundingClientRect();
    const localX = clientX - rect.left;
    // Handle tip sits slightly above finger contact for comfort
    const localY = clientY - rect.top - 4;

    const apply = (el: HTMLDivElement | null, xBias: number) => {
      if (!el) return;
      el.style.display = 'block';
      el.style.transform = `translate3d(${localX + xBias}px, ${localY}px, 0)`;
    };

    if (type === 'cursor') {
      apply(cursorDOMRef.current, 0);
    } else if (type === 'start') {
      apply(selectionStartDOMRef.current, 0);
      // keep opposite end on real selection edge if available
    } else {
      apply(selectionEndDOMRef.current, 0);
    }
  }, [cursorDOMRef, selectionStartDOMRef, selectionEndDOMRef]);

  /** Snap non-dragged handle to real selection edge */
  const placeOppositeFromSelection = useCallback((
    editor: any,
    type: 'cursor' | 'start' | 'end',
  ) => {
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
  }, [selectionStartDOMRef, selectionEndDOMRef]);

  const handleDragMove = useCallback((e: React.TouchEvent, type: 'cursor' | 'start' | 'end') => {
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

    // Free handle moves every event (not only rAF) — max smoothness
    const container = containerRef.current;
    if (container) {
      placeHandleFree(type, clientX, clientY, container);
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
      const EDGE = 60;
      let delta = 0;
      if (y < rect.top + EDGE) delta = -12;
      else if (y > rect.bottom - EDGE) delta = 12;
      autoScrollDeltaRef.current = delta;
      if (delta !== 0) ensureAutoScrollLoop();
      else stopAutoScroll();

      const newPos = positionFromFinger(editor, x, y);
      if (!newPos) return;

      const last = lastPosRef.current;
      if (last && last.lineNumber === newPos.lineNumber && last.column === newPos.column) {
        placeHandleFree(t, x, y, container);
        return;
      }
      lastPosRef.current = { lineNumber: newPos.lineNumber, column: newPos.column };

      if (t === 'cursor') {
        editor.setPosition(newPos);
        placeHandleFree(t, x, y, container);
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
        placeHandleFree(t, x, y, container);
        return;
      }

      editor.setSelection(
        new monaco.Selection(
          anchor.lineNumber,
          anchor.column,
          newPos.lineNumber,
          newPos.column,
        ),
      );

      placeHandleFree(t, x, y, container);
      placeOppositeFromSelection(editor, t);
    });
  }, [
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
  ]);

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

    // Snap handles back to real selection edges
    updateTeardrops();
    setTimeout(() => {
      if (onDragEndCb) onDragEndCb();
    }, 150);
  }, [isDraggingRef, isPointerBlockRef, updateTeardrops, onDragEndCb, stopAutoScroll, onLensMove]);

  return { activeDragType, handleDragStart, handleDragMove, handleDragEnd };
}
