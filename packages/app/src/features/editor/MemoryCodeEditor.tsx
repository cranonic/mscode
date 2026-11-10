// src/features/editor/MemoryCodeEditor.tsx

// Uses : ModalEditor, quick-edit panel, settings JSON editor etc.

import '@/features/editor/monaco/monacoSetup';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

// ── Stores ─────────────────────────────────────────────────────────────────────
import { useThemeStore } from '@/core/theme/store/themeStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useEditorMenuStore } from '@/features/editor/components/EditorMenu/store/editorMenuStore';
import { buildMonacoOptions } from './monaco/monacoOptions';

// ── Touch & Interaction Hooks (same as CodeEditor) ────────────────────────────
import { useEditorRefs } from './hooks/useEditorRefs';
import { useKeyboardHandler } from './hooks/useKeyboardHandler';
import { useTouchInterceptors } from './hooks/useTouchInterceptors';
import { useTeardrops } from './components/Teardrops/hooks/useTeardrops';
import { useTeardropsDrag } from './components/Teardrops/hooks/useTeardropsDrag';
import { useTouchScroll } from './hooks/useTouchScroll';
import { useMonacoSetup } from './hooks/useMonacoSetup';
import { useContextMenuSetup } from './hooks/useContextMenuSetup';

// ── UI Components ──────────────────────────────────────────────────────────────
import { TeardropsOverlay } from './components/Teardrops/TeardropsOverlay';
import { SelectionMagnifier } from './components/Teardrops/SelectionMagnifier';
import { EditorScrollbar, DEFAULT_SCROLLBAR_CONFIG } from './components/Scrollbar/EditorScrollbar';
import type { ScrollbarConfig } from './components/Scrollbar/EditorScrollbar';
import { Keyboard } from '@capacitor/keyboard';

import './CodeEditor.css';

/** Extended log tokenizer for Output panel (and plugins). */
function ensureLogLanguage(m: typeof Monaco): void {
  if (m.languages.getLanguages().some(l => l.id === 'log')) return;
  m.languages.register({ id: 'log' });
  m.languages.setMonarchTokensProvider('log', {
    tokenizer: {
      root: [
        [/\[?\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(\.\d{3}Z?)?\]?/, 'log-date'],
        [/\[\d{2}:\d{2}:\d{2}\]/, 'log-date'],
        [/\[?(ERROR|ERR|FAIL|FATAL|CRITICAL)\]?/i, 'log-error'],
        [/\[?(WARNING|WARN)\]?/i, 'log-warn'],
        [/\[?(INFO|NOTICE|LOG)\]?/i, 'log-info'],
        [/\[?(DEBUG)\]?/i, 'log-debug'],
        [/\[?(TRACE|VERBOSE)\]?/i, 'log-trace'],
        [/\[?(Running|Done|Success|OK|PASS)\]?/i, 'log-success'],
        [/\[?(System|PM|Java|Code Runner|ac|preflight|ChromeSessionService|Main)\]/, 'log-tag'],
        [/(https?|ws|wss|file):\/\/[^\s]+/, 'log-link'],
        [/((\/|\\|[a-zA-Z]:\\)[^\s]+\.\w+)/, 'log-path'],
        [/"([^"\\]|\\.)*"/, 'log-string'],
        [/'([^'\\]|\\.)*'/, 'log-string'],
        [/\b\d+(\.\d+)?(ms|s|px|%)?\b/, 'log-number'],
        [/\b(true|false|null|undefined|success|ok|failed|exitCode)\b/i, 'log-keyword'],
        [/\b(apk|pkg|npm|pip|java|javac|python|node|clang|g\+\+)\b/, 'log-cmd'],
      ],
    },
  });
  m.editor.defineTheme('log-color-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'log-error', foreground: 'f44747', fontStyle: 'bold' },
      { token: 'log-warn', foreground: 'cca700', fontStyle: 'bold' },
      { token: 'log-info', foreground: '3794ff' },
      { token: 'log-debug', foreground: 'b5cea8' },
      { token: 'log-trace', foreground: '888888' },
      { token: 'log-success', foreground: '3fb950', fontStyle: 'bold' },
      { token: 'log-tag', foreground: 'c586c0' },
      { token: 'log-date', foreground: '6e7681' },
      { token: 'log-link', foreground: '4ec9b0', fontStyle: 'underline' },
      { token: 'log-path', foreground: '4ec9b0' },
      { token: 'log-string', foreground: 'ce9178' },
      { token: 'log-number', foreground: 'b5cea8' },
      { token: 'log-keyword', foreground: '569cd6', fontStyle: 'italic' },
      { token: 'log-cmd', foreground: 'dcdcaa' },
    ],
    colors: { 'editor.background': '#1e1e1e' },
  });
}

export type MemoryEditorMenuId =
  | 'copy'
  | 'paste'
  | 'cut'
  | 'selectAll'
  | 'commandPalette'
  | string;

export interface MemoryCodeEditorProps {
  /**
   * Unique string per editor instance.
   * Used to build the Monaco model URI:  `inmemory://<instanceId>`
   * Keep stable across re-renders to avoid model recreation.
   */
  instanceId: string;
  /** Monaco language mode. Default: 'json'. Use `'log'` for output panel. */
  language?: string;
  /** Current text content (controlled). For streaming logs, pass model text or ''. */
  value?: string;
  /** Called on every content change (no-op safe when readOnly). */
  onChange?: (value: string) => void;
  /**
   * Called once after Monaco mounts.
   * Receives the editor instance so the parent can call e.g. getAction('formatDocument')
   * or `editor.setModel(getOrCreateModel(channel))` for shared models.
   */
  onEditorMount?: (editor: Monaco.editor.IStandaloneCodeEditor, monaco?: typeof Monaco) => void;
  /**
   * Called whenever the Monaco marker (error/warning) list changes for this model.
   * Parent uses this for real-time JSON validation status.
   */
  onMarkersChange?: (markers: Monaco.editor.IMarker[]) => void;

  // ── Customization (plugin / output / modal editors) ───────────────────────
  /** Read-only mode (output logs, previews). Default: false. */
  readOnly?: boolean;
  /**
   * When false, context / selection menu is never shown.
   * Default: true.
   */
  menuEnabled?: boolean;
  /**
   * Whitelist of menu action ids. When set, only these items appear.
   * Example for output: `['copy', 'selectAll']`
   */
  allowedMenuIds?: MemoryEditorMenuId[];
  /** Override / merge Monaco editor options (after buildMonacoOptions). */
  options?: Record<string, unknown>;
  /** Enable teardrop handles + magnifier. Default: true when not readOnly. */
  teardrops?: boolean;
  /** Theme id override; defaults to active app theme. */
  theme?: string;
  /** When true, keep model value in sync from `value` prop. Default: true. */
  syncValue?: boolean;
}

export const MemoryCodeEditor: React.FC<MemoryCodeEditorProps> = ({
  instanceId,
  language = 'json',
  value = '',
  onChange,
  onEditorMount,
  onMarkersChange,
  readOnly = false,
  menuEnabled = true,
  allowedMenuIds,
  options: optionsOverride,
  teardrops: teardropsProp,
  theme: themeOverride,
}) => {
  const refs = useEditorRefs();

  const [editorInstance, setEditorInstance] = useState<any>(null);
  const monaco = useMonaco();

  const [lens, setLens] = useState<{
    active: boolean;
    x: number;
    y: number;
    type: 'cursor' | 'start' | 'end' | null;
  }>({ active: false, x: 0, y: 0, type: null });

  const settings = useSettingsStore(s => s.settings);
  const activeThemeId = useThemeStore(s => s.activeThemeId);
  const foldingPosition = settings['editor.foldingPosition'] || 'right';

  const teardropsEnabled =
    teardropsProp !== undefined
      ? teardropsProp
      : !readOnly && settings['editor.teardrops.enabled'] !== false;
  const lensEnabled = settings['editor.teardrops.lens.enabled'] !== false;
  const lensScale = Number(settings['editor.teardrops.lens.scale'] ?? 1.75);

  const onLensMove = useCallback(
    (pos: { x: number; y: number; type: 'cursor' | 'start' | 'end' } | null) => {
      if (!pos) {
        setLens(s => (s.active ? { ...s, active: false } : s));
        return;
      }
      setLens({ active: true, x: pos.x, y: pos.y, type: pos.type });
    },
    [],
  );

  refs.closeMenuRef.current = () => {
    if (useEditorMenuStore.getState().isOpen) {
      useEditorMenuStore.getState().closeEditorMenu();
    }
  };

  useKeyboardHandler();
  useTouchInterceptors(refs.isPointerBlockRef);

  const { teardropsOn, setTeardropsOn, updateTeardrops } = useTeardrops({
    editorRef: refs.editorRef,
    isDraggingRef: refs.isDraggingRef,
    isScrollingRef: refs.isScrollingRef,
    userScrollingRef: refs.userScrollingRef,
    cursorDOMRef: refs.cursorDOMRef,
    selectionStartDOMRef: refs.selectionStartDOMRef,
    selectionEndDOMRef: refs.selectionEndDOMRef,
  });

  const { attachTouchListeners } = useTouchScroll({
    editorRef: refs.editorRef,
    isDraggingRef: refs.isDraggingRef,
    isScrollingRef: refs.isScrollingRef,
    isPointerBlockRef: refs.isPointerBlockRef,
    globalScrollRef: refs.globalScrollRef,
    userScrollingRef: refs.userScrollingRef,
    updateTeardrops,
    setTeardropsOn,
  });

  const { activeDragType, handleDragStart, handleDragMove, handleDragEnd } = useTeardropsDrag({
    editorRef: refs.editorRef,
    containerRef: refs.containerRef,
    isDraggingRef: refs.isDraggingRef,
    isPointerBlockRef: refs.isPointerBlockRef,
    monaco,
    updateTeardrops,
    cursorDOMRef: refs.cursorDOMRef,
    selectionStartDOMRef: refs.selectionStartDOMRef,
    selectionEndDOMRef: refs.selectionEndDOMRef,
    onHandleActive: type => {
      refs.lastActiveHandleRef.current = type;
    },
    onDragStartCb: () => refs.closeMenuRef.current(),
    onDragEndCb: () => refs.showMenuRef.current(),
    onLensMove,
  });

  useContextMenuSetup({
    editor: editorInstance,
    monaco,
    lastActiveHandleRef: refs.lastActiveHandleRef,
    handleHandleClickRef: refs.handleHandleClickRef,
    showMenuRef: refs.showMenuRef,
    closeMenuRef: refs.closeMenuRef,
    globalScrollRef: refs.globalScrollRef,
    userScrollingRef: refs.userScrollingRef,
    isDraggingRef: refs.isDraggingRef,
  });

  // Menu customization: disable entirely or whitelist actions
  useEffect(() => {
    if (!menuEnabled) {
      const noop = () => {};
      refs.showMenuRef.current = noop;
      refs.handleHandleClickRef.current = noop as any;
      return;
    }
    if (!allowedMenuIds || allowedMenuIds.length === 0) return;

    const allowed = new Set(allowedMenuIds);
    const origShow = refs.showMenuRef.current;
    refs.showMenuRef.current = () => {
      const store = useEditorMenuStore.getState();
      const origOpen = store.openEditorMenu.bind(store);
      store.openEditorMenu = ((id: string, x: number, y: number, items: any[], opts?: any) => {
        const filtered = (items || []).filter(
          (it: any) => it.type === 'separator' || allowed.has(it.id),
        );
        const cleaned: any[] = [];
        for (const it of filtered) {
          if (it.type === 'separator') {
            if (cleaned.length === 0 || cleaned[cleaned.length - 1].type === 'separator') continue;
          }
          cleaned.push(it);
        }
        while (cleaned.length && cleaned[cleaned.length - 1].type === 'separator') cleaned.pop();
        return origOpen(id, x, y, cleaned, opts);
      }) as any;
      try {
        origShow();
      } finally {
        store.openEditorMenu = origOpen;
      }
    };
  }, [menuEnabled, allowedMenuIds, editorInstance]);

  const { handleEditorDidMount: originalDidMount, cleanupDisposables } = useMonacoSetup({
    tabId: instanceId,
    editorRef: refs.editorRef,
    isScrollingRef: refs.isScrollingRef,
    userScrollingRef: refs.userScrollingRef,
    updateTeardrops,
    setTeardropsOn,
    attachTouchListeners,
  });

  const handleEditorDidMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof Monaco) => {
      refs.editorRef.current = editor;
      setEditorInstance(editor);

      originalDidMount(editor);

      if (language === 'log') {
        ensureLogLanguage(monacoInstance);
      }

      if (language === 'json') {
        (monacoInstance.languages as any).json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          allowComments: false,
          schemaValidation: 'warning',
        });
      }

      if (readOnly) {
        editor.updateOptions({ readOnly: true, domReadOnly: true });
      }

      if (onMarkersChange) {
        monacoInstance.editor.onDidChangeMarkers(() => {
          const model = editor.getModel();
          if (!model) return;
          const markers = monacoInstance.editor.getModelMarkers({ resource: model.uri });
          onMarkersChange(markers);
        });
      }

      onEditorMount?.(editor, monacoInstance);

      setTimeout(() => {
        if (refs.isMountedRef.current) {
          editor.layout();
          updateTeardrops();
        }
      }, 100);
    },
    [language, originalDidMount, onEditorMount, onMarkersChange, readOnly],
  );

  useEffect(() => {
    refs.isMountedRef.current = true;
    return () => {
      refs.isMountedRef.current = false;
      cleanupDisposables();
      setEditorInstance(null);
    };
  }, [cleanupDisposables]);

  const scrollbarConfig: Partial<ScrollbarConfig> = useMemo(() => {
    const v = settings['editor.scrollbar.vertical'];
    const h = settings['editor.scrollbar.horizontal'];
    return {
      showVertical: !(v === 'hidden' || v === false),
      showHorizontal: !(h === 'hidden' || h === false),
      verticalVisibility: v === 'visible' ? 'always' : 'auto',
      horizontalVisibility: h === 'visible' ? 'always' : 'auto',
      thumbWidth: settings['editor.scrollbar.thumbWidth'] ?? DEFAULT_SCROLLBAR_CONFIG.thumbWidth,
      trackWidth: settings['editor.scrollbar.trackWidth'] ?? DEFAULT_SCROLLBAR_CONFIG.trackWidth,
      thumbFixedSize:
        settings['editor.scrollbar.thumbFixedSize'] ?? DEFAULT_SCROLLBAR_CONFIG.thumbFixedSize,
      autoHideDelay:
        settings['editor.scrollbar.autoHideDelay'] ?? DEFAULT_SCROLLBAR_CONFIG.autoHideDelay,
      fadeOutDuration:
        settings['editor.scrollbar.fadeOutDuration'] ?? DEFAULT_SCROLLBAR_CONFIG.fadeOutDuration,
    };
  }, [settings]);

  const monacoOptions = useMemo(() => {
    const base = {
      ...buildMonacoOptions(settings),
      ...(optionsOverride || {}),
    } as Monaco.editor.IStandaloneEditorConstructionOptions;

    if (readOnly) {
      base.readOnly = true;
      base.domReadOnly = true;
      base.readOnlyMessage = { value: 'This editor is read-only' };
    }

    return base;
  }, [settings, optionsOverride, readOnly]);

  const handleWrapperClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.lightBulbWidget') ||
      target.closest('.monaco-menu-container') ||
      target.closest('.monaco-hover') ||
      target.closest('.colorpicker-widget') ||
      target.closest('.suggest-widget') ||
      target.closest('.ms-teardrop-handle') ||
      target.closest('.find-widget') ||
      target.closest('.ms-selection-magnifier')
    )
      return;

    if (
      refs.isPointerBlockRef.current ||
      refs.globalScrollRef.current ||
      refs.isDraggingRef.current
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const editor = refs.editorRef.current;
    if (editor && !editor.hasTextFocus()) editor.focus();
    if ('virtualKeyboard' in navigator) {
      (navigator as any).virtualKeyboard.show();
    }
  };

  const virtualPath = `inmemory://${instanceId}.${language === 'json' ? 'json' : language === 'log' ? 'log' : 'txt'}`;

  return (
    <div
      ref={refs.containerRef}
      className={`ms-code-editor-container ${foldingPosition === 'left' ? 'ms-folding-left' : ''}`}
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        touchAction: 'none',
        willChange: 'transform',
      }}
      onClick={handleWrapperClick}
      onTouchStart={() => refs.closeMenuRef.current()}
    >
      <Editor
        height="100%"
        width="100%"
        path={virtualPath}
        language={language}
        theme={themeOverride || activeThemeId}
        value={value}
        options={monacoOptions}
        onMount={handleEditorDidMount}
        onChange={v => onChange?.(v ?? '')}
        keepCurrentModel={true}
      />

      {editorInstance && <EditorScrollbar editor={editorInstance} config={scrollbarConfig} />}

      {teardropsEnabled && teardropsOn && (
        <TeardropsOverlay
          cursorDOMRef={refs.cursorDOMRef}
          selectionStartDOMRef={refs.selectionStartDOMRef}
          selectionEndDOMRef={refs.selectionEndDOMRef}
          activeDragType={activeDragType}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onHandleClick={type => refs.handleHandleClickRef.current(type)}
          onHandleDoubleClick={async () => {
            if (editorInstance) {
              const textarea = editorInstance.getDomNode()?.querySelector('textarea');
              if (textarea) textarea.focus();
              else editorInstance.focus();
              setTimeout(async () => {
                try {
                  await Keyboard.show();
                } catch {
                  if ('virtualKeyboard' in navigator) {
                    (navigator as any).virtualKeyboard.show();
                  }
                }
              }, 150);
            }
          }}
        />
      )}

      {lensEnabled && editorInstance && (
        <SelectionMagnifier
          enabled={lensEnabled}
          active={lens.active}
          clientX={lens.x}
          clientY={lens.y}
          editor={editorInstance}
          handleType={lens.type}
          scale={lensScale}
        />
      )}
    </div>
  );
};
