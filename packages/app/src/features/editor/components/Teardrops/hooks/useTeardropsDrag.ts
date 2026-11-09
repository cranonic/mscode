// src/features/editor/components/Teardrops/hooks/useTeardropsDrag.ts
//
// Character-precise handle drag (Android-style):
// - Finger sits ON the teardrop BELOW the glyph line
// - Hit-test is lifted UP by ~handle height so we target the text, not the next line
// - Handle DOM follows the real selection edge (not the raw finger Y)
// - Magnifier gets finger coords via onLensMove

import { useRef, useState, useCallback } from 'react';
import type { MutableRefObject, RefObject } from 'react';

/** Visual teardrop height — must match TeardropsShapes.DROP_H */
const DROP_H = 36;
/** Extra lift so hit lands in the glyph row above the handle (not the line below finger) */
const HIT_LIFT = DROP_H + 8; // ~44px

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
  /** Finger position for magnifier lens (client coords). null = hide */
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
  /** Last applied position — skip redundant setSelection that feels "sticky" */
  const lastPosRef         = useRef<{ lineNumber: number; column: number } | null>(null);
  /** Latest touch sample (read inside rAF so we never drop the newest point) */
  const latestTouchRef     = useRef<{ x: number; y: number; type: 'cursor' | 'start' | 'end' } | null>(null);

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
    if (onDragStartCb) onDragStartCb();
  }, [isDraggingRef, onDragStartCb]);

  /**
   * Map finger (on handle below text) → character position on the glyph line.
   * Without HIT_LIFT, getTargetAtClientPoint hits the *next* line → word/line jumps.
   */
  const positionFromFinger = useCallback((editor: any, clientX: number, clientY: number) => {
    // Primary: lift above handle into the text row
    let target = editor.getTargetAtClientPoint(clientX, clientY - HIT_LIFT);
    if (target?.position) return target.position;

    // Fallback: smaller lifts if edge of viewport
    for (const lift of [DROP_H, 20, 10, 0]) {
      target = editor.getTargetAtClientPoint(clientX, clientY - lift);
      if (target?.position) return target.position;
    }
    return null;
  }, []);

  const placeHandle = useCallback((
    type: 'cursor' | 'start' | 'end',
    startCoords: { left: number; top: number; height: number } | null,
    endCoords: { left: number; top: number; height: number } | null,
    cursorCoords: { left: number; top: number; height: number } | null,
  ) => {
    if (type === 'cursor' && cursorCoords && cursorDOMRef.current) {
      cursorDOMRef.current.style.display = 'block';
      cursorDOMRef.current.style.transform =
        `translate3d(${cursorCoords.left}px, ${cursorCoords.top + cursorCoords.height}px, 0)`;
    }
    if (startCoords && selectionStartDOMRef.current) {
      selectionStartDOMRef.current.style.display = 'block';
      selectionStartDOMRef.current.style.transform =
        `translate3d(${startCoords.left}px, ${startCoords.top + startCoords.height}px, 0)`;
    }
    if (endCoords && selectionEndDOMRef.current) {
      selectionEndDOMRef.current.style.display = 'block';
      selectionEndDOMRef.current.style.transform =
        `translate3d(${endCoords.left}px, ${endCoords.top + endCoords.height}px, 0)`;
    }
  }, [cursorDOMRef, selectionStartDOMRef, selectionEndDOMRef]);

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

    // Coalesce to one apply per frame, but always use the *latest* sample
    if (dragMoveRafRef.current) return;
    dragMoveRafRef.current = requestAnimationFrame(() => {
      dragMoveRafRef.current = null;
      const sample = latestTouchRef.current;
      if (!sample) return;

      const editor = editorRef.current;
      const container = containerRef.current;
      if (!editor || !monaco || !container) return;

      const { x, y, type: t } = sample;

      // Edge auto-scroll
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

      // Skip no-op updates (reduces "sticky" feeling from repeated setSelection)
      const last = lastPosRef.current;
      if (last && last.lineNumber === newPos.lineNumber && last.column === newPos.column) {
        return;
      }
      lastPosRef.current = { lineNumber: newPos.lineNumber, column: newPos.column };

      if (t === 'cursor') {
        editor.setPosition(newPos);
        const c = editor.getScrolledVisiblePosition(newPos);
        placeHandle('cursor', null, null, c);
        return;
      }

      let anchor = dragAnchorRef.current;
      if (!anchor) {
        const currentSel = editor.getSelection();
        if (!currentSel) return;
        // Opposite end is the fixed pivot
        anchor = t === 'start' ? currentSel.getEndPosition() : currentSel.getStartPosition();
        dragAnchorRef.current = anchor;
      }

      if (newPos.lineNumber === anchor.lineNumber && newPos.column === anchor.column) {
        return;
      }

      // Character-precise selection (NOT word-level APIs)
      editor.setSelection(
        new monaco.Selection(
          anchor.lineNumber,
          anchor.column,
          newPos.lineNumber,
          newPos.column,
        ),
      );

      const newSel = editor.getSelection();
      if (!newSel) return;
      const sortedStart = newSel.getStartPosition();
      const sortedEnd = newSel.getEndPosition();
      const startCoords = editor.getScrolledVisiblePosition(sortedStart);
      const endCoords = editor.getScrolledVisiblePosition(sortedEnd);
      placeHandle(t, startCoords, endCoords, null);
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
    placeHandle,
  ]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setActiveDragType(null);
    dragAnchorRef.current = null;
    lastPosRef.current = null;
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
