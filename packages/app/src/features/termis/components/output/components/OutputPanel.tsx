// src/features/termis/components/output/components/OutputPanel.tsx
//
// Uses MemoryCodeEditor (patched Monaco) in read-only mode.
// Menu: Copy + Select All only.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type * as Monaco from 'monaco-editor';
import { MemoryCodeEditor } from '@/features/editor/MemoryCodeEditor';
import { useOutputStore, getOrCreateModel } from '../store/outputStore';
import { Icon } from '@/ui/components/Icon/IconRegistry';
import { Select } from '@/ui/components/Select/Select';
import { InputBox } from '@/ui/components/InputBox/InputBox';
import { useMenuStore } from '@/store/menuStore';
import './OutputPanel.css';

export const OutputPanel: React.FC = () => {
  const {
    channels,
    activeChannel,
    setActiveChannel,
    clearChannel,
    killHandlers,
    triggerKill,
    saveLog,
    openInEditor,
  } = useOutputStore();

  const { openMenu } = useMenuStore();
  const [filter, setFilter] = useState('');
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const autoScrollRef = useRef(true);

  const channelOptions = channels.map(ch => ({ value: ch, label: ch }));

  const onEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      const model = getOrCreateModel(activeChannel);
      editor.setModel(model);
      editor.revealLine(model.getLineCount());

      editor.onDidScrollChange(e => {
        const total = editor.getScrollHeight();
        const bot = e.scrollTop + editor.getLayoutInfo().height;
        autoScrollRef.current = total - bot < 50;
      });

      model.onDidChangeContent(() => {
        if (!autoScrollRef.current) return;
        setTimeout(() => editor.revealLine(model.getLineCount()), 0);
      });
    },
    // activeChannel applied in effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = getOrCreateModel(activeChannel);
    editor.setModel(model);
    if (autoScrollRef.current) editor.revealLine(model.getLineCount());
  }, [activeChannel]);

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const items: any[] = [
      {
        id: 'open-editor',
        label: 'Open Log in Editor',
        icon: 'file-code',
        onClick: () => openInEditor(activeChannel),
      },
      {
        id: 'save-log',
        label: 'Save Output Logs',
        icon: 'save',
        onClick: () => saveLog(activeChannel),
      },
    ];
    if (killHandlers[activeChannel]) {
      items.push({ id: 'sep-kill', type: 'separator' });
      items.push({
        id: 'kill-process',
        label: 'Kill Process',
        icon: 'circle-slash',
        onClick: () => triggerKill(activeChannel),
      });
    }
    openMenu('output/context', rect.left - 150, rect.bottom + 8, items);
  };

  return (
    <div className="ms-output-panel">
      <div className="ms-output-toolbar">
        <div className="ms-output-toolbar-left">
          <Select
            options={channelOptions}
            value={activeChannel}
            onChange={setActiveChannel}
            style={{ width: 'auto' }}
          />
        </div>
        <div className="ms-output-toolbar-middle">
          <InputBox
            value={filter}
            onChange={setFilter}
            placeholder="Filter logs..."
            leftInsideIcon={<Icon name="filter" size={13} color="var(--ms-text-faded)" />}
          />
        </div>
        <div className="ms-output-actions">
          <button title="Clear Output" onClick={() => clearChannel(activeChannel)}>
            <Icon name="clear-all" size={14} />
          </button>
          <button title="Save Output Logs" onClick={() => saveLog(activeChannel)}>
            <Icon name="save" size={14} />
          </button>
          <button title="More Actions..." onClick={handleMoreClick}>
            <Icon name="more" size={14} />
          </button>
        </div>
      </div>

      <div className="ms-output-editor-container">
        <MemoryCodeEditor
          instanceId={`output-${activeChannel}`}
          language="log"
          value=""
          onChange={() => {}}
          readOnly
          menuEnabled
          allowedMenuIds={['copy', 'selectAll']}
          teardrops={false}
          theme="log-color-theme"
          options={{
            lineNumbers: 'off',
            minimap: { enabled: false },
            wordWrap: 'on',
            folding: false,
            renderLineHighlight: 'none',
            fontSize: 12,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            scrollBeyondLastLine: false,
            contextmenu: true,
            automaticLayout: true,
          }}
          onEditorMount={onEditorMount}
        />
      </div>
    </div>
  );
};
