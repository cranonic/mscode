// src/features/editor/components/Teardrops/hooks/useTeardrops.ts
// Phase-2 fix: place handle body at line BOTTOM so caret sits ON the selected line
// (not one/two lines below).

import { useState, useCallback } from 'react';
import type { MutableRefObject, RefObject } from 'react';

interface UseTeardropsOptions {
  editorRef: MutableRefObject<any>;
  isDraggingRef: MutableRefObject<boolean>;
  isScrollingRef: MutableRefObject<boolean>;
  userScrollingRef: MutableRefObject<boolean>;
  cursorDOMRef: RefObject<HTMLDivElement | null>;
  selectionStartDOMRef: RefObject<HTMLDivElement | null>;
  selectionEndDOMRef: RefObject<HTMLDivElement | null>;
}

export function useTeardrops({
  editorRef,
  isDraggingRef,
  isScrollingRef,
  userScrollingRef,
  cursorDOMRef,
  selectionStartDOMRef,
  selectionEndDOMRef,
}: UseTeardropsOptions) {
  const [teardropsOn, setTeardropsOn] = useState<boolean>(true);

  const updateTeardrops = useCallback(() => {
    const editor = editorRef.current;
    // Drag path owns transforms while active
    if (!editor || isDraggingRef.current) return;

    const sel = editor.getSelection();

    if (sel && !sel.isEmpty()) {
      if (cursorDOMRef.current) {
        cursorDOMRef.current.style.display = 'none';
      }

      const sc = editor.getScrolledVisiblePosition(sel.getStartPosition());
      const ec = editor.getScrolledVisiblePosition(sel.getEndPosition());

      if (sc && ec && selectionStartDOMRef.current && selectionEndDOMRef.current) {
        // Transform = TOP of handle body at BOTTOM of selected line
        // Caret (absolute top: -CARET_H) draws upward onto the selected line
        // Teardrop hangs just under — not an extra full line down
        selectionStartDOMRef.current.style.display = 'block';
        selectionStartDOMRef.current.style.transform =
          `translate3d(${sc.left}px, ${sc.top + sc.height}px, 0)`;

        selectionEndDOMRef.current.style.display = 'block';
        selectionEndDOMRef.current.style.transform =
          `translate3d(${ec.left}px, ${ec.top + ec.height}px, 0)`;
      } else {
        if (selectionStartDOMRef.current) selectionStartDOMRef.current.style.display = 'none';
        if (selectionEndDOMRef.current) selectionEndDOMRef.current.style.display = 'none';
      }
    } else {
      if (selectionStartDOMRef.current) selectionStartDOMRef.current.style.display = 'none';
      if (selectionEndDOMRef.current) selectionEndDOMRef.current.style.display = 'none';

      const pos = editor.getPosition();
      const c = editor.getScrolledVisiblePosition(pos);

      if (c && cursorDOMRef.current) {
        cursorDOMRef.current.style.display = 'block';
        cursorDOMRef.current.style.transform =
          `translate3d(${c.left}px, ${c.top + c.height}px, 0)`;
      } else if (cursorDOMRef.current) {
        cursorDOMRef.current.style.display = 'none';
      }
    }
  }, [
    editorRef,
    isDraggingRef,
    isScrollingRef,
    userScrollingRef,
    cursorDOMRef,
    selectionStartDOMRef,
    selectionEndDOMRef,
  ]);

  return { teardropsOn, setTeardropsOn, updateTeardrops };
}
