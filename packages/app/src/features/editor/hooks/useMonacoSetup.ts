// src/features/editor/hooks/useMonacoSetup.ts

import { useRef, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { useEditorViewStateStore } from '@/features/editor/store/editorViewStateStore';

interface UseMonacoSetupOptions {
  tabId:                string;
  editorRef:            MutableRefObject<any>;
  isScrollingRef:       MutableRefObject<boolean>;
  userScrollingRef:     MutableRefObject<boolean>;
  updateTeardrops:      () => void;
  setTeardropsOn:       (v: boolean) => void;
  attachTouchListeners: (domNode: HTMLElement) => { dispose(): void } | undefined;
}

/**
 * Hook to coordinate initial mount registration pipelines inside the Monaco editor viewport.
 * Orchestrates cursor, selection range updates, scroll mitigation cycles, 
 * and touch event adapter interceptors.
 */
export function useMonacoSetup({
  tabId,
  editorRef,
  isScrollingRef,
  userScrollingRef,
  updateTeardrops,
  setTeardropsOn,
  attachTouchListeners,
}: UseMonacoSetupOptions) {
  const disposables    = useRef<Array<{ dispose(): void }>>([]);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<{ _scheduled?: boolean }>({});

  const updateViewState = useEditorViewStateStore(state => state.updateViewState);

  /**
   * Post-initialization mount adapter callback invoked by the code editor canvas wrapper.
   */
  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor;

    // Resolve previous viewport historical state maps out-of-band to safeguard layout loops.
    const currentViewState = useEditorViewStateStore.getState().viewStates[tabId];

    // Rehydrate vertical scroll projection anchors if records exist.
    if (currentViewState?.scrollPos) {
      editor.setScrollTop(currentViewState.scrollPos);
    }

    // ── Monaco Lifecycle Event Registries ──
    disposables.current.push(
      editor.onDidChangeCursorPosition(() => {
        updateTeardrops();
      }),
      editor.onDidChangeCursorSelection(() => {
        updateTeardrops();
      }),
      editor.onDidScrollChange((e: any) => {
        updateViewState(tabId, { scrollPos: e.scrollTop });
        // SPCK-style: reposition teardrops every scroll frame (rAF-coalesced)
        if (!(scrollRafRef as any)._scheduled) {
          (scrollRafRef as any)._scheduled = true;
          requestAnimationFrame(() => {
            (scrollRafRef as any)._scheduled = false;
            setTeardropsOn(true);
            updateTeardrops();
          });
        }
      }),
    );

    // ── Native Hardware Touch Interceptors ──
    const domNode = editor.getDomNode();
    if (domNode) {
      const touchDisposable = attachTouchListeners(domNode);
      if (touchDisposable) {
        disposables.current.push(touchDisposable);
      }
    }
  }, [
    tabId,
    editorRef,
    isScrollingRef,
    userScrollingRef,
    updateTeardrops,
    setTeardropsOn,
    attachTouchListeners,
    updateViewState,
  ]);

  /**
   * Synchronously flushes active text listener subscriptions and clears lingering timers.
   */
  const cleanupDisposables = useCallback(() => {
    disposables.current.forEach(d => d.dispose());
    disposables.current = [];
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
  }, []);

  return { handleEditorDidMount, cleanupDisposables };
}