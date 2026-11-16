// src/features/editor/hooks/useLongPressWordSelect.ts
// Phase 2 SPCK: long-press selects the word under finger, then shows handles.
// Does NOT start scroll (Gesture already requires stayedStill for Contextmenu).

import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

interface Options {
  editor: any;
  monaco: any;
  /** Skip when teardrop drag active */
  isDraggingRef: MutableRefObject<boolean>;
  /** Called after word selection so menu/teardrops can update */
  onWordSelected?: () => void;
}

/**
 * Listens for Monaco contextmenu (from Gesture long-press) and, when selection
 * is empty, expands to the word at that position — SPCK-style.
 * Custom android menu still opens via existing useContextMenuSetup.
 */
export function useLongPressWordSelect({
  editor,
  monaco,
  isDraggingRef,
  onWordSelected,
}: Options) {
  useEffect(() => {
    if (!editor || !monaco) return;

    const disposable = editor.onContextMenu((e: any) => {
      if (isDraggingRef.current) return;
      if ((globalThis as any).__monacoTouchScrolling) return;

      const pos = e?.target?.position;
      if (!pos) return;

      const sel = editor.getSelection();
      // Only expand when there is no range yet (caret-only long-press)
      if (sel && !sel.isEmpty()) return;

      try {
        // Prefer Monaco's word-at-position helper
        const model = editor.getModel();
        if (!model) return;

        let word = model.getWordAtPosition?.(pos);
        if (!word) {
          // Fallback: simple alphanumeric span
          const line = model.getLineContent(pos.lineNumber) as string;
          const idx = pos.column - 1;
          if (idx < 0 || idx > line.length) return;
          const isWord = (ch: string) => /[A-Za-z0-9_$]/.test(ch);
          let a = idx;
          let b = idx;
          while (a > 0 && isWord(line[a - 1])) a--;
          while (b < line.length && isWord(line[b])) b++;
          if (a === b) return;
          word = { startColumn: a + 1, endColumn: b + 1 };
        }

        editor.setSelection(
          new monaco.Selection(
            pos.lineNumber,
            word.startColumn,
            pos.lineNumber,
            word.endColumn,
          ),
        );
        onWordSelected?.();
      } catch {
        /* ignore */
      }
    });

    return () => disposable.dispose();
  }, [editor, monaco, isDraggingRef, onWordSelected]);
}
