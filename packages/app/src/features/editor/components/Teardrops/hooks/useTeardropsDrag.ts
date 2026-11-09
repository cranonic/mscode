// src/features/editor/components/Teardrops/hooks/useTeardropsDrag.ts
//
// Visual vs logic split (SPCK):
// - Teardrop handle: 100% free under finger (any %, no 50% stepping)
// - Selection line: only changes when finger/caret crosses >50% of CURRENT line (up)
// - On grab after double-tap: sticky line = existing selection edge (no instant jump up)

import { useRef, useState, useCallback } from 'react';
import type { MutableRefObject, RefObject } from 'react';

const DROP_H = 36;
const CARET_H = 22;
/** Default distance from finger on teardrop bulb to handle origin (top tip of teardrop) */
const DEFAULT_HANDLE_LIFT = 28;
const LINE_SWITCH_FRAC_DOWN = 0.42;
/** Up only when past >50% of the current selected line */
const LINE_SWITCH_FRAC_UP = 0.51;

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
  /** Selection sticky line — independent of free handle Y */
  const stickyLineRef = useRef<number | null>(null);
  /** Which edge we are dragging — set on first move */
  const dragTypeRef = useRef<'cursor' | 'start' | 'end' | null>(null);
  /** Finger offset below handle origin (teardrop tip / bottom of caret) */
  const handleLiftRef = useRef<number>(DEFAULT_HANDLE_LIFT);

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
      dragTypeRef.current = null;

      // Measure exact finger distance below the handle origin (bottom of selected line)
      const touch = e.touches[0];
      const handleEl = e.currentTarget as HTMLElement | null;
      if (touch && handleEl) {
        const handleRect = handleEl.getBoundingClientRect();
        const rawLift = touch.clientY - handleRect.top;
        handleLiftRef.current = Math.max(18, Math.min(DROP_H + 4, rawLift));
      } else {
        handleLiftRef.current = DEFAULT_HANDLE_LIFT;
      }

      if (onDragStartCb) onDragStartCb();
    },
    [isDraggingRef, onDragStartCb],
  );

  /**
   * Selection position from finger — sticky line hysteresis only.
   * Uses the exact middle of the visible Caret (handleLift + half caret height).
   */
  const positionFromFinger = useCallback(
    (editor: any, clientX: number, clientY: number, type: 'cursor' | 'start' | 'end') => {
      // Middle of the visible Caret = handle tip (clientY - handleLift) minus half caret height
      const hitLift = handleLiftRef.current + CARET_H * 0.45;

      const raw =
        editor.getTargetAtClientPoint(clientX, clientY - hitLift) ||
        editor.getTargetAtClientPoint(clientX, clientY - handleLiftRef.current) ||
        editor.getTargetAtClientPoint(clientX, clientY - 16);

      if (!raw?.position) return null;

      let column = raw.position.column;
      const hitLine = raw.position.lineNumber;
      const dom = editor.getDomNode?.() as HTMLElement | null;

      // ── Seed sticky from EXISTING selection edge (prevents jump on grab) ──
      if (stickyLineRef.current == null) {
        const sel = editor.getSelection?.();
        if (sel && !sel.isEmpty() && type !== 'cursor') {
          stickyLineRef.current =
            type === 'start'
              ? sel.getStartPosition().lineNumber
              : sel.getEndPosition().lineNumber;
        } else if (sel && sel.isEmpty() && type === 'cursor') {
          stickyLineRef.current = sel.getStartPosition().lineNumber;
        } else {
          stickyLineRef.current = hitLine;
        }
      }

      const sticky = stickyLineRef.current!;
      const stickyVis = editor.getScrolledVisiblePosition({ lineNumber: sticky, column: 1 });
      const lineHeight = Math.max(14, stickyVis?.height ?? 20);

      if (stickyVis && dom) {
        const rect = dom.getBoundingClientRect();
        // Caret mid sample relative to CURRENT selection line mid
        const lineMidClientY = rect.top + stickyVis.top + stickyVis.height / 2;
        const dy = clientY - hitLift - lineMidClientY;

        if (dy > lineHeight * LINE_SWITCH_FRAC_DOWN) {
          const maxLine = editor.getModel()?.getLineCount?.() ?? sticky + 1;
          stickyLineRef.current = Math.min(maxLine, sticky + 1);
        } else if (dy < -lineHeight * LINE_SWITCH_FRAC_UP) {
          // Only after >50% of current line upward
          stickyLineRef.current = Math.max(1, sticky - 1);
        }
        // else: stay on sticky — no jump
      }

      const lineNumber = stickyLineRef.current ?? hitLine;

      // Column from X on sticky line mid (character-precise)
      const stickyVis2 = editor.getScrolledVisiblePosition({ lineNumber, column: 1 });
      if (stickyVis2 && dom) {
        const rect = dom.getBoundingClientRect();
        const yOnLine = rect.top + stickyVis2.top + stickyVis2.height * 0.5;
        const hit =
          editor.getTargetAtClientPoint(clientX, yOnLine) ||
          editor.getTargetAtClientPoint(clientX, clientY - hitLift);
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
    },
    [],
  );

  /**
   * PURE free visual — finger stays on the teardrop bulb (localY to localY + DROP_H),
   * while the Caret (localY - CARET_H to localY) sits one line above on the selected line.
   */
  const placeHandleFree = useCallback(
    (type: 'cursor' | 'start' | 'end', clientX: number, clientY: number, container: HTMLElement) => {
      const rect = container.getBoundingClientRect();
      const localX = clientX - rect.left;
      // Lift handle origin by handleLiftRef so teardrop stays under finger & caret sits on selected line
      const localY = clientY - rect.top - handleLiftRef.current;

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
      dragTypeRef.current = type;

      const touch = e.touches[0];
      if (!touch) return;
      const clientX = touch.clientX;
      const clientY = touch.clientY;

      latestTouchRef.current = { x: clientX, y: clientY, type };
      onLensMove?.({ x: clientX, y: clientY, type });

      const container = containerRef.current;
      // Immediate free visual every sample — zero lag, any %
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

        // Keep visual in sync with latest finger (rAF may lag one sample)
        placeHandleFree(t, x, y, container);

        const rect = container.getBoundingClientRect();
        const EDGE = 56;
        let delta = 0;
        if (y < rect.top + EDGE) delta = -14;
        else if (y > rect.bottom - EDGE) delta = 14;
        autoScrollDeltaRef.current = delta;
        if (delta !== 0) ensureAutoScrollLoop();
        else stopAutoScroll();

        // Selection logic only (sticky line + column)
        const newPos = positionFromFinger(editor, x, y, t);
        if (!newPos) return;

        const last = lastPosRef.current;
        if (last && last.lineNumber === newPos.lineNumber && last.column === newPos.column) {
          return; // visual already updated; selection unchanged
        }
        lastPosRef.current = { lineNumber: newPos.lineNumber, column: newPos.column };

        if (t === 'cursor') {
          editor.setPosition(newPos);
          return;
        }

        let anchor = dragAnchorRef.current;
        if (!anchor) {
          const currentSel = editor.getSelection();
          if (!currentSel) return;
          anchor = t === 'start' ? currentSel.getEndPosition() : currentSel.getStartPosition();
          dragAnchorRef.current = anchor;
        }

        if (newPos.lineNumber === anchor.lineNumber && newPos.column === anchor.column) {
          return;
        }

        editor.setSelection(
          new monaco.Selection(anchor.lineNumber, anchor.column, newPos.lineNumber, newPos.column),
        );

        // Opposite handle stays on real edge (not free-finger)
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
    dragTypeRef.current = null;
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

    // Snap handles back to real selection edges only on release
    updateTeardrops();
    setTimeout(() => {
      if (onDragEndCb) onDragEndCb();
    }, 150);
  }, [isDraggingRef, isPointerBlockRef, updateTeardrops, onDragEndCb, stopAutoScroll, onLensMove]);

  return { activeDragType, handleDragStart, handleDragMove, handleDragEnd };
}