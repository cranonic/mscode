// Default engine: Mono Editor (canvas). Monaco removed from this path.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createMonoEditor,
  type IMonoEditor,
  monoThemeService,
  registerBuiltinThemes,
} from '@mono/editor';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useFileLoader } from './hooks/useFileLoader';
import { useEditorViewStateStore } from '@/features/editor/store/editorViewStateStore';
import { useTerminalBoot } from '@/features/termis/components/terminal/hooks/useTerminalBoot';
import { useMonoPaletteProviders } from './hooks/useMonoPaletteProviders';
import { useMonoEditorBridge } from './hooks/useMonoEditorBridge';
import { usePaletteStore } from '@/store/paletteStore';
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import './CodeEditor.css';

interface CodeEditorProps {
  tabId: string;
  filePath: string;
}

function guessLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
    py: 'python', java: 'java', kt: 'kotlin', rs: 'rust',
    go: 'go', c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp',
    html: 'html', htm: 'html', css: 'css', scss: 'scss',
    json: 'json', md: 'markdown', xml: 'xml', sh: 'shellscript',
    yaml: 'yaml', yml: 'yaml',
  };
  return map[ext] || 'plaintext';
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ tabId, filePath }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<IMonoEditor | null>(null);
  const [paletteHost, setPaletteHost] = useState<IMonoEditor | null>(null);
  const settings = useSettingsStore((s) => s.settings);
  const updateViewState = useEditorViewStateStore((s) => s.updateViewState);
  const { initialContent, isLoading, handleEditorChange } = useFileLoader({ tabId, filePath });

  useTerminalBoot();
  useMonoPaletteProviders(paletteHost);
  useMonoEditorBridge({
    editor: paletteHost,
    tabId,
    filePath,
    settings: settings as Record<string, unknown>,
    isLoading,
  });

  const fontSize = Number(settings['editor.fontSize'] ?? 14);
  const lineNumbers = settings['editor.lineNumbers'] === 'off' ? 'off' : 'on';
  const tabSize = Number(settings['editor.tabSize'] ?? 2);
  const language = useMemo(() => guessLanguage(filePath), [filePath]);

  // Create / dispose editor
  useEffect(() => {
    const host = hostRef.current;
    if (!host || isLoading) return;

    registerBuiltinThemes();
    const themePartial = monoThemeService.toPartialEditorTheme();

    const editor = createMonoEditor(host, {
      value: initialContent,
      language,
      fontSize,
      tabSize,
      lineNumbers: lineNumbers as 'on' | 'off',
      theme: themePartial,
    });

    editorRef.current = editor;
    setPaletteHost(editor);

    // Expose for Eruda / console testing
    const w = window as any;
    w.__monoEditor = editor;
    if (!w.__monoEditors) w.__monoEditors = new Set();
    w.__monoEditors.add(editor);
    w.__testMarkers = () => {
      editor.setModelMarkers('test', [
        { severity: 8, message: 'Unexpected token', startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 10 },
        { severity: 4, message: 'Unused variable', startLineNumber: 5, startColumn: 3, endLineNumber: 5, endColumn: 15 },
      ]);
      console.log('markers set, count=', editor.getModelMarkers().length);
    };

    // Ctrl+Shift+P from Mono → open app command palette
    const onShowCommands = () => {
      usePaletteStore.setState({ isOpen: true, isQuickPick: false, query: '>' });
    };
    window.addEventListener('mono:showCommands', onShowCommands);

    const onExecuteCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id) {
        void commands.executeCommand(detail.id, ...(detail.args || []));
      }
    };
    window.addEventListener('mono:executeCommand', onExecuteCommand);

    const sub = editor.onDidChangeModelContent((e) => {
      handleEditorChange(e.value);
    });

    // Layout when host size changes
    const ro = new ResizeObserver(() => {
      editor.layout();
    });
    ro.observe(host);

    editor.focus();

    return () => {
      ro.disconnect();
      sub.dispose();
      const w = window as any;
      if (w.__monoEditor === editor) w.__monoEditor = null;
      w.__monoEditors?.delete(editor);
      window.removeEventListener('mono:showCommands', onShowCommands);
      window.removeEventListener('mono:executeCommand', onExecuteCommand);
      editor.dispose();
      editorRef.current = null;
      setPaletteHost(null);
    };
    // Mount once per tab/file; content/settings applied via other effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId, filePath, isLoading]);

  // External content load (disk / cache)
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || isLoading) return;
    if (ed.getValue() !== initialContent) {
      ed.setValue(initialContent);
    }
  }, [initialContent, isLoading]);

  // Language
  useEffect(() => {
    editorRef.current?.setLanguageId(language);
    updateViewState(filePath, { languageId: language });
    updateViewState(tabId, { languageId: language });
  }, [language, filePath, tabId, updateViewState]);

  return (
    <div
      className="ms-code-editor-container"
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'var(--ms-editor-background, #1e1e1e)',
      }}
      data-engine="mono-editor"
      data-tab-id={tabId}
    >
      {isLoading && (
        <div style={{ padding: 20, color: 'var(--ms-text-faded)', fontStyle: 'italic' }}>
          Loading…
        </div>
      )}
      <div ref={hostRef} style={{ flex: 1, minHeight: 0, width: '100%' }} />
    </div>
  );
};
