import React, { useEffect, useRef } from 'react';
import { createMonoEditor } from '../api/MonoEditor';
import type { IMonoEditor, MonoEditorOptions } from '../api/types';

export interface MonoEditorProps extends Omit<MonoEditorOptions, 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function MonoEditor(props: MonoEditorProps): React.ReactElement {
  const { value = '', onChange, className, style, language, readOnly, fontFamily, fontSize, lineHeight, tabSize, lineNumbers, theme, overscan } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<IMonoEditor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const editor = createMonoEditor(host, { value, language, readOnly, fontFamily, fontSize, lineHeight, tabSize, lineNumbers, theme, overscan });
    editorRef.current = editor;
    const sub = editor.onDidChangeModelContent((e) => { onChangeRef.current?.(e.value); });
    return () => { sub.dispose(); editor.dispose(); editorRef.current = null; };
  }, []);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (ed.getValue() !== value) ed.setValue(value);
  }, [value]);

  useEffect(() => {
    editorRef.current?.setLanguageId(language ?? 'plaintext');
  }, [language]);

  return (
    <div ref={hostRef} className={className} style={{ width: '100%', height: '100%', minHeight: 120, ...style }} data-engine="mono-editor" />
  );
}

export default MonoEditor;
