// In-memory buffer editor powered by Mono Editor (canvas). Monaco removed.
import React, { useEffect, useRef } from 'react';
import { createMonoEditor, type IMonoEditor } from '@mono/editor';

export interface MemoryCodeEditorProps {
  value?: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onEditorMount?: (editor: IMonoEditor) => void;
  instanceId?: string;
  /** Legacy Monaco props — accepted as no-ops under Mono */
  menuEnabled?: boolean;
  onMarkersChange?: (markers: any[]) => void;
  allowedMenuIds?: string[];
  teardrops?: boolean;
  theme?: string;
  options?: Record<string, any>;
  [key: string]: any;
}

export const MemoryCodeEditor: React.FC<MemoryCodeEditorProps> = ({
  value = '',
  language = 'plaintext',
  readOnly = false,
  onChange,
  onEditorMount,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<IMonoEditor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const editor = createMonoEditor(host, {
      value,
      language,
      readOnly,
      fontSize: 14,
      lineNumbers: 'on',
    });
    editorRef.current = editor;
    onEditorMount?.(editor);
    const sub = editor.onDidChangeModelContent((e) => {
      onChangeRef.current?.(e.value);
    });
    return () => {
      sub.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (ed.getValue() !== value) ed.setValue(value);
  }, [value]);

  useEffect(() => {
    editorRef.current?.setLanguageId(language);
  }, [language]);

  return (
    <div
      ref={hostRef}
      className="ms-code-editor-container"
      data-engine="mono-editor"
      style={{ height: '100%', width: '100%', minHeight: 120 }}
    />
  );
};
