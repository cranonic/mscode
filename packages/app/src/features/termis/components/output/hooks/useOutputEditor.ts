// src/features/termis/components/output/hooks/useOutputEditor.ts
//
// Output log viewer must use the same local/patched Monaco instance as the
// main CodeEditor (touch patches, workers, MS_CODE_CORE_CONFIG). Never load
// Monaco from CDN here.

// Side-effect: configure loader + workers BEFORE any monaco.editor.create
import '@/features/editor/monaco/monacoSetup';

import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useOutputStore, getOrCreateModel } from '../store/outputStore';

/** Prefer the singleton registered by monacoSetup (same patched module graph). */
function getMonaco(): typeof monaco {
  const w = window as any;
  if (w.MONACO) return w.MONACO as typeof monaco;
  return monaco;
}

/**
 * Initializes and registers the structural declarative grammar tokenization specs
 * and matching visual color theme profiles for standard system output log feeds.
 */
const setupLogLanguage = (): void => {
  const m = getMonaco();
  if (m.languages.getLanguages().some(l => l.id === 'log')) return;

  m.languages.register({ id: 'log' });

  m.languages.setMonarchTokensProvider('log', {
    tokenizer: {
      root: [
        [/\[?\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(\.\d{3}Z?)?\]?/, 'log-date'],
        [/\[\d{2}:\d{2}:\d{2}\]/, 'log-date'],
        [/\[?(ERROR|ERR|FAIL|FATAL)\]?/i, 'log-error'],
        [/\[?(WARNING|WARN)\]?/i, 'log-warn'],
        [/\[?(INFO|NOTICE)\]?/i, 'log-info'],
        [/\[?(DEBUG)\]?/i, 'log-debug'],
        [/\[?(TRACE)\]?/i, 'log-trace'],
        [/\[?(Running|Done)\]?/i, 'log-success'],
        [/(https?|ws|file):\/\/[^\s]+/, 'log-link'],
        [/((\/|\\|[a-zA-Z]:\\)[^\s]+\.\w+)/, 'log-path'],
        [/"([^"\\]|\\.)*"/, 'log-string'],
        [/'([^'\\]|\\.)*'/, 'log-string'],
        [/\b\d+(\.\d+)?\b/, 'log-number'],
        [/\b(true|false|null|undefined|success|ok)\b/i, 'log-keyword'],
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
      { token: 'log-success', foreground: '1b8ef8', fontStyle: 'bold' },
      { token: 'log-date', foreground: '888888' },
      { token: 'log-link', foreground: '4ec9b0', fontStyle: 'underline' },
      { token: 'log-path', foreground: '4ec9b0' },
      { token: 'log-string', foreground: 'ce9178' },
      { token: 'log-number', foreground: 'b5cea8' },
      { token: 'log-keyword', foreground: '569cd6', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
    },
  });
};

/**
 * Read-only output buffer viewer on the app's patched Monaco instance.
 */
export function useOutputEditor(containerRef: React.RefObject<HTMLDivElement | null>) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const autoScrollRef = useRef(true);
  const activeChannel = useOutputStore(s => s.activeChannel);

  useEffect(() => {
    if (!containerRef.current) return;

    const m = getMonaco();
    setupLogLanguage();

    const editor = m.editor.create(containerRef.current, {
      model: getOrCreateModel(activeChannel),
      readOnly: true,
      domReadOnly: true,
      readOnlyMessage: { value: 'Output is read-only' },
      language: 'log',
      theme: 'log-color-theme',
      lineNumbers: 'off',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      folding: false,
      renderLineHighlight: 'none',
      fontSize: 12,
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
      contextmenu: true,
      automaticLayout: true,
      renderValidationDecorations: 'off',
      links: true,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'hidden',
      },
    });

    editor.onDidAttemptReadOnlyEdit?.(() => {
      /* swallow */
    });

    editorRef.current = editor;

    const scrollDisposable = editor.onDidScrollChange(e => {
      const totalHeight = editor.getScrollHeight();
      const visibleBot = e.scrollTop + editor.getLayoutInfo().height;
      autoScrollRef.current = totalHeight - visibleBot < 50;
    });

    const domNode = containerRef.current;
    let lastY = 0;
    let isTouching = false;

    const onTouchStart = (e: TouchEvent) => {
      isTouching = true;
      lastY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;
      e.preventDefault();
      e.stopPropagation();
      const currentY = e.touches[0].clientY;
      const deltaY = lastY - currentY;
      lastY = currentY;
      editor.setScrollTop(editor.getScrollTop() + deltaY);
    };

    const onTouchEnd = () => {
      isTouching = false;
    };

    domNode.addEventListener('touchstart', onTouchStart, { passive: false });
    domNode.addEventListener('touchmove', onTouchMove, { passive: false });
    domNode.addEventListener('touchend', onTouchEnd);
    domNode.addEventListener('touchcancel', onTouchEnd);

    return () => {
      scrollDisposable.dispose();
      editor.dispose();
      domNode.removeEventListener('touchstart', onTouchStart);
      domNode.removeEventListener('touchmove', onTouchMove);
      domNode.removeEventListener('touchend', onTouchEnd);
      domNode.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = getOrCreateModel(activeChannel);
    editor.setModel(model);
    if (autoScrollRef.current) {
      editor.revealLine(model.getLineCount());
    }
  }, [activeChannel]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = getOrCreateModel(activeChannel);
    const disposable = model.onDidChangeContent(() => {
      if (!autoScrollRef.current) return;
      setTimeout(() => {
        editor.revealLine(model.getLineCount());
      }, 0);
    });
    return () => disposable.dispose();
  }, [activeChannel]);

  return { editorRef, autoScrollRef };
}
