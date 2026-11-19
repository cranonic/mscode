/**
 * Registers command-palette providers into the APP paletteStore
 * (CommandPalette.tsx reads providers[prefix] only — not mono-editor PaletteService).
 *
 * Package name: @mono/editor
 *
 * Usage (editor shell):
 *   useMonoPaletteProviders(monoEditorInstance); // or null — app commands still list
 */
import { useEffect } from 'react';
import { usePaletteStore, type QuickPickItem } from '@/store/paletteStore';
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { keybindingManager } from '@/core/keybindings/keybindingManager';

/** Structural — avoids hard type coupling if build order lags */
export type MonoEditorPaletteHost = {
  getCommandsForPalette?: (filter?: string) => Array<{
    id: string;
    label: string;
    description?: string;
    category?: string;
    icon?: string;
    shortcut?: string;
    enabled: boolean;
  }>;
  executeCommand?: (id: string, ...args: unknown[]) => Promise<unknown>;
  getLineCount?: () => number;
  revealLine?: (line: number, column?: number) => void;
  setPosition?: (line: number, column?: number) => void;
  focus?: () => void;
};

function appCommandItems(filter: string): QuickPickItem[] {
  const q = (filter || '').toLowerCase().trim();
  const list = commands.getCommandsForPalette() || [];
  return list
    .filter((c) => {
      if (!c.title) return false;
      if (!q) return true;
      return (
        (c.title || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q)
      );
    })
    .map((c) => {
      let shortcut = c.shortcut;
      try {
        shortcut =
          (keybindingManager as any).getShortcutLabel?.(c.id) || c.shortcut;
      } catch {
        /* */
      }
      return {
        id: c.id,
        label: c.title || c.id,
        description: c.category,
        leftIcon: (c.icon as string) || 'terminal',
        shortcut,
        onSelect: () => {
          void commands.executeCommand(c.id);
        },
      } satisfies QuickPickItem;
    });
}

function editorCommandItems(
  editor: MonoEditorPaletteHost,
  filter: string,
): QuickPickItem[] {
  if (!editor.getCommandsForPalette) return [];
  try {
    return (editor.getCommandsForPalette(filter) || []).map((c) => ({
      id: c.id,
      label: c.label,
      description: c.category || c.description,
      leftIcon: c.icon || 'terminal',
      shortcut: c.shortcut,
      readonly: c.enabled === false,
      onSelect: () => {
        if (c.enabled === false) return;
        void editor.executeCommand?.(c.id);
      },
    }));
  } catch (e) {
    console.warn('[useMonoPaletteProviders] getCommandsForPalette failed', e);
    return [];
  }
}

function mergeCommands(
  editor: MonoEditorPaletteHost | null | undefined,
  filter: string,
): QuickPickItem[] {
  const fromEditor = editor ? editorCommandItems(editor, filter) : [];
  const seen = new Set(fromEditor.map((i) => i.id));
  const fromApp = appCommandItems(filter).filter((i) => !seen.has(i.id));
  return [...fromEditor, ...fromApp].sort((a, b) =>
    (a.label || '').localeCompare(b.label || ''),
  );
}

/**
 * Primary registration path for Mono Studio CommandPalette UI.
 */
export function useMonoPaletteProviders(
  editor: MonoEditorPaletteHost | null | undefined,
) {
  useEffect(() => {
    const { registerProvider, unregisterProvider } = usePaletteStore.getState();

    // ── Help (empty prefix) ───────────────────────────────────────────
    registerProvider({
      prefix: '',
      name: 'Help & Menu',
      provideItems: (search) => {
        if ((search || '').length > 0) return [];
        const setQuery = usePaletteStore.getState().setQuery;
        return [
          {
            id: 'help-cmd',
            label: 'Show And Run Commands',
            inlineDetail: '>',
            shortcut: 'F1',
            leftIcon: 'terminal',
            keepOpen: true,
            onSelect: () => setQuery('>'),
          },
          {
            id: 'help-line',
            label: 'Go to Line/Column...',
            inlineDetail: ':',
            shortcut: 'Ctrl+G',
            leftIcon: 'arrow-right',
            keepOpen: true,
            onSelect: () => setQuery(':'),
          },
          {
            id: 'help-recent',
            label: 'Recent Opened...',
            inlineDetail: '/',
            leftIcon: 'folder',
            keepOpen: true,
            onSelect: () => setQuery('/'),
          },
        ];
      },
    });

    // ── Commands (>) — MUST always return a list ─────────────────────
    registerProvider({
      prefix: '>',
      name: 'Show and Run Commands',
      placeholder: 'Type a command name...',
      provideItems: (search) => {
        const items = mergeCommands(editor, search || '');
        if (items.length === 0) {
          return [
            {
              id: 'no-cmds',
              label: 'No commands registered yet',
              description: 'Register via editor.addAction or commands.registerCommand',
              readonly: true,
            },
          ];
        }
        return items;
      },
    });

    // ── Go to line (:) ───────────────────────────────────────────────
    registerProvider({
      prefix: ':',
      name: 'Go to Line/Column',
      provideItems: (search) => {
        const total =
          editor?.getLineCount?.() ??
          99999;
        if (!search) {
          return [
            {
              id: 'hint',
              label: `Type a line number (1–${total === 99999 ? '…' : total})`,
              readonly: true,
            },
          ];
        }
        const parts = search.split(',');
        let line = parseInt(parts[0]!, 10);
        const col = parseInt(parts[1] || '1', 10) || 1;
        if (Number.isNaN(line)) {
          return [{ id: 'err', label: 'Invalid line number', readonly: true }];
        }
        if (total !== 99999) line = Math.max(1, Math.min(total, line));
        else line = Math.max(1, line);
        return [
          {
            id: 'goto',
            label: `Go to line ${line}${parts.length > 1 ? `, column ${col}` : ''}`,
            leftIcon: 'arrow-right',
            onSelect: () => {
              editor?.revealLine?.(line, col);
              editor?.setPosition?.(line, col);
              editor?.focus?.();
            },
          },
        ];
      },
    });

    // Keep '/' if recent provider not registered elsewhere — minimal stub
    registerProvider({
      prefix: '/',
      name: 'Recent',
      provideItems: () => [
        {
          id: 'recent-stub',
          label: 'Use workspace Recent list (explorer)',
          readonly: true,
        },
      ],
    });

    return () => {
      unregisterProvider('');
      unregisterProvider('>');
      unregisterProvider(':');
      unregisterProvider('/');
    };
  }, [editor]);
}
