// Default engine: Mono Editor (canvas). Monaco removed from this path.
import React, { useEffect, useMemo, useRef } from 'react';
import { createMonoEditor, type IMonoEditor } from '@mono/editor';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useFileLoader } from './hooks/useFileLoader';
import { useEditorViewStateStore } from '@/features/editor/store/editorViewStateStore';
import { useTerminalBoot } from '@/features/termis/components/terminal/hooks/useTerminalBoot';
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
  const settings = useSettingsStore((s) => s.settings);
  const updateViewState = useEditorViewStateStore((s) => s.updateViewState);
  const { initialContent, isLoading, handleEditorChange } = useFileLoader({ tabId, filePath });

  useTerminalBoot();

  const fontSize = Number(settings['editor.fontSize'] ?? 14);
  const lineNumbers = settings['editor.lineNumbers'] === 'off' ? 'off' : 'on';
  const language = useMemo(() => guessLanguage(filePath), [filePath]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || isLoading) return;

    const editor = createMonoEditor(host, {
      value: initialContent,
      language,
      fontSize,
      lineNumbers: lineNumbers as 'on' | 'off',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        gutterBackground: '#1e1e1e',
        gutterForeground: '#858585',
        caret: '#aeafad',
        selection: '#264f78',
        lineHighlight: '#2a2a2a',
      },
    });
    editorRef.current = editor;

    const sub = editor.onDidChangeModelContent((e) => {
      handleEditorChange(e.value);
    });

    editor.focus();

    return () => {
      sub.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, [tabId, filePath, isLoading]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || isLoading) return;
    if (ed.getValue() !== initialContent) {
      ed.setValue(initialContent);
    }
  }, [initialContent, isLoading]);

  useEffect(() => {
    editorRef.current?.setLanguageId(language);
    updateViewState(filePath, { languageId: language });
  }, [language, filePath, updateViewState]);

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
