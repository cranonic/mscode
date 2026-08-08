// src/core/bootstrap/actions/editorEditActions.ts
// Select All, Find/Replace, Format, Rename Symbol, Go to Definition
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { getActiveMonacoEditor, triggerOnActiveEditor } from './getActiveMonacoEditor';

export function registerEditorEditActions(): void {
  // ── Select All ──────────────────────────────────────────────────────────
  commands.registerCommand('editor.action.selectAll', () => {
    triggerOnActiveEditor('editor.action.selectAll');
  });

  // ── Format ──────────────────────────────────────────────────────────────
  commands.registerCommand(
    'editor.action.formatDocument',
    () => triggerOnActiveEditor('editor.action.formatDocument'),
    { title: 'Format Document', category: 'Edit', icon: 'check', shortcut: 'Shift+Alt+F' },
  );

  commands.registerCommand(
    'editor.action.formatSelection',
    () => triggerOnActiveEditor('editor.action.formatSelection'),
    { title: 'Format Selection', category: 'Edit', icon: 'check' },
  );

  // ── Rename Symbol (LSP) — not file rename ───────────────────────────────
  commands.registerCommand(
    'editor.action.rename',
    () => triggerOnActiveEditor('editor.action.rename'),
    { title: 'Rename Symbol', category: 'Edit', icon: 'edit', shortcut: 'F2' },
  );

  // ── Go to Definition ────────────────────────────────────────────────────
  commands.registerCommand(
    'editor.action.revealDefinition',
    () => triggerOnActiveEditor('editor.action.revealDefinition'),
    { title: 'Go to Definition', category: 'Navigation', icon: 'go-to-file', shortcut: 'F12' },
  );

  // ── Find / Replace ──────────────────────────────────────────────────────
  commands.registerCommand(
    'actions.find',
    (editorArg?: any) => {
      const editor = editorArg || getActiveMonacoEditor() || commands.getActiveEditor?.();
      if (editor) {
        editor.trigger('keyboard', 'actions.find', null);
        editor.focus();
      } else {
        console.error('[FindCommand] No active editor found.');
      }
    },
    { title: 'Edit: Find', category: 'Edit', icon: 'search', shortcut: 'Ctrl+F' },
  );

  commands.registerCommand(
    'editor.action.startFindReplaceAction',
    () => triggerOnActiveEditor('editor.action.startFindReplaceAction'),
    { title: 'Edit: Replace', category: 'Edit', icon: 'replace', shortcut: 'Ctrl+H' },
  );

  commands.registerCommand(
    'editor.action.nextMatchFindAction',
    () => triggerOnActiveEditor('editor.action.nextMatchFindAction'),
    { title: 'Edit: Find Next', category: 'Edit', icon: 'arrow-down', shortcut: 'F3' },
  );

  commands.registerCommand(
    'editor.action.previousMatchFindAction',
    () => triggerOnActiveEditor('editor.action.previousMatchFindAction'),
    { title: 'Edit: Find Previous', category: 'Edit', icon: 'arrow-up', shortcut: 'Shift+F3' },
  );
}
