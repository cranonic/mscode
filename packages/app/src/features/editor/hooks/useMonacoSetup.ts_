// src/features/editor/hooks/useMonacoSetup.ts
// Phase 1 SPCK: rAF teardrops on scroll; skip cursor updates while handle-dragging

import { useRef, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { useEditorViewStateStore } from '@/features/editor/store/editorViewStateStore';
import { ensureMsCodeCoreConfig } from '@/features/editor/monaco/monacoBoot';

interface UseMonacoSetupOptions {
  tabId: string;
  editorRef: MutableRefObject<any>;
  isScrollingRef: MutableRefObject<boolean>;
  userScrollingRef: MutableRefObject<boolean>;
  /** When true, handle drag owns transforms — do not fight with updateTeardrops */
  isDraggingRef?: MutableRefObject<boolean>;
  updateTeardrops: () => void;
  setTeardropsOn: (v: boolean) => void;
  attachTouchListeners: (domNode: HTMLElement) => { dispose(): void } | undefined;
}

export function useMonacoSetup({
  tabId,
  editorRef,
  // isScrollingRef,
  // userScrollingRef,
  isDraggingRef,
  updateTeardrops,
  setTeardropsOn,
  attachTouchListeners,
}: UseMonacoSetupOptions) {
  const disposables = useRef<Array<{ dispose(): void }>>([]);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef(false);
  const cursorRafRef = useRef(false);

  const updateViewState = useEditorViewStateStore(state => state.updateViewState);

  const scheduleTeardrops = useCallback(() => {
    if (isDraggingRef?.current) return; // drag path writes transforms
    if (cursorRafRef.current) return;
    cursorRafRef.current = true;
    requestAnimationFrame(() => {
      cursorRafRef.current = false;
      if (isDraggingRef?.current) return;
      setTeardropsOn(true);
      updateTeardrops();
    });
  }, [isDraggingRef, setTeardropsOn, updateTeardrops]);

  const handleEditorDidMount = useCallback(
    (editor: any) => {
      ensureMsCodeCoreConfig();
      editorRef.current = editor;

      const currentViewState = useEditorViewStateStore.getState().viewStates[tabId];
      if (currentViewState?.scrollPos) {
        editor.setScrollTop(currentViewState.scrollPos);
      }

      disposables.current.push(
        editor.onDidChangeCursorPosition(() => {
          scheduleTeardrops();
        }),
        editor.onDidChangeCursorSelection(() => {
          scheduleTeardrops();
        }),
        editor.onDidScrollChange((e: any) => {
          updateViewState(tabId, { scrollPos: e.scrollTop });
          // One teardrop layout pass per frame max
          if (scrollRafRef.current) return;
          scrollRafRef.current = true;
          requestAnimationFrame(() => {
            scrollRafRef.current = false;
            if (isDraggingRef?.current) return;
            setTeardropsOn(true);
            updateTeardrops();
          });
        }),
      );

      const domNode = editor.getDomNode();
      if (domNode) {
        // Compositor hint for scroll layer
        domNode.style.willChange = 'transform';
        const touchDisposable = attachTouchListeners(domNode);
        if (touchDisposable) disposables.current.push(touchDisposable);
      }
    },
    [
      tabId,
      editorRef,
      isDraggingRef,
      updateTeardrops,
      setTeardropsOn,
      attachTouchListeners,
      updateViewState,
      scheduleTeardrops,
    ],
  );

  const cleanupDisposables = useCallback(() => {
    disposables.current.forEach(d => d.dispose());
    disposables.current = [];
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
  }, []);

  return { handleEditorDidMount, cleanupDisposables };
}
