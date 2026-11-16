// src/core/bootstrap/actions/getActiveMonacoEditor.ts
import * as monaco from 'monaco-editor';
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { useTabStore } from '@/store/tabStore';

/**
 * Resolves the Monaco editor instance that the user is actually working in.
 *
 * Priority:
 *   1. commands.getActiveEditor() — set on mount / focus by useEditorLifecycle
 *   2. Editor with text focus
 *   3. Editor whose model URI matches the active tab's filePath
 *   4. First editor (last resort)
 *
 * NEVER use getEditors()[0] alone — multi-tab layouts break.
 */
export function getActiveMonacoEditor(): monaco.editor.ICodeEditor | null {
  try {
    const tracked = commands.getActiveEditor?.();
    if (tracked) return tracked;
  } catch { /* registry may not expose it yet */ }

  const all = monaco.editor.getEditors();
  if (!all.length) return null;

  const focused = all.find(e => e.hasTextFocus());
  if (focused) return focused;

  // Match active tab path → model URI (handles multi-tab without focus race)
  const { activeTabId, tabs } = useTabStore.getState();
  const tab = tabs.find(t => t.id === activeTabId);
  const filePath = tab?.filePath || activeTabId;
  if (filePath) {
    const match = all.find(e => {
      const uri = e.getModel()?.uri;
      if (!uri) return false;
      const s = uri.toString();
      const path = (uri as any).path || (uri as any).fsPath || '';
      return (
        s.includes(filePath) ||
        path === filePath ||
        path.endsWith(filePath) ||
        s.endsWith(filePath)
      );
    });
    if (match) return match;
  }

  return all[0] ?? null;
}

/** Focus the active editor and run a Monaco action by id. */
export function triggerOnActiveEditor(actionId: string): void {
  const editor = getActiveMonacoEditor();
  if (!editor) {
    console.warn(`[actions] No active editor for: ${actionId}`);
    return;
  }
  editor.focus();
  editor.trigger('keyboard', actionId, null);
}
