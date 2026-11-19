/**
 * Bridge Mono Editor palette engine → existing app CommandPalette UI.
 *
 * Replace monaco-based usePaletteProviders with this once the active
 * editor is a MonoEditor (or dual-stack during migration).
 *
 * Usage in editor shell:
 *   useMonoPaletteProviders(monoEditor);
 *
 * Requires paletteStore.registerProvider API (same as before).
 */
import { useEffect } from 'react';
import type { PaletteService } from '@mscode/mono-editor'; // adjust import path
import { usePaletteStore } from '@/store/paletteStore';
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { keybindingManager } from '@/core/keybindings/keybindingManager';

type MonoEditorLike = {
  getPaletteService: () => PaletteService;
  executeCommand: (id: string, ...args: unknown[]) => Promise<unknown>;
  getCommandsForPalette: (filter?: string) => Array<{
    id: string;
    label: string;
    description?: string;
    category?: string;
    icon?: string;
    shortcut?: string;
    enabled: boolean;
  }>;
  // optional navigation helpers for : and @ providers
  getLineCount?: () => number;
  revealLine?: (line: number, col?: number) => void;
};

export function useMonoPaletteProviders(editor: MonoEditorLike | null | undefined) {
  useEffect(() => {
    if (!editor) return;
    const { registerProvider } = usePaletteStore.getState();
    const palette = editor.getPaletteService();
    const disposers: Array<{ dispose(): void }> = [];

    // Help (empty prefix)
    disposers.push(
      palette.registerProvider({
        id: 'app-help',
        prefix: '',
        label: 'Help & Menu',
        provideItems: (search) => {
          if (search.length > 0) return [];
          const setQuery = usePaletteStore.getState().setQuery;
          return [
            {
              id: 'help-cmd',
              label: 'Show And Run Commands',
              detail: '>',
              shortcut: 'F1',
              icon: 'terminal',
              keepOpen: true,
              onSelect: () => setQuery('>'),
            },
            {
              id: 'help-line',
              label: 'Go to Line/Column...',
              detail: ':',
              shortcut: 'Ctrl+G',
              icon: 'arrow-right',
              keepOpen: true,
              onSelect: () => setQuery(':'),
            },
          ];
        },
      }),
    );

    // Commands: merge mono-editor + app commandRegistry
    disposers.push(
      palette.registerProvider({
        id: 'commands',
        prefix: '>',
        label: 'Show and Run Commands',
        provideItems: (filter) => {
          const fromEditor = editor.getCommandsForPalette(filter).map((c) => ({
            id: c.id,
            label: c.label,
            description: c.category,
            icon: c.icon || 'terminal',
            shortcut: c.shortcut,
            enabled: c.enabled,
            onSelect: () => {
              if (c.enabled) void editor.executeCommand(c.id);
            },
          }));

          const seen = new Set(fromEditor.map((c) => c.id));
          const fromApp = commands.getCommandsForPalette()
            .filter((c) => c.title && !seen.has(c.id))
            .filter((c) => {
              if (!filter) return true;
              const q = filter.toLowerCase();
              return (
                (c.title || '').toLowerCase().includes(q) ||
                (c.category || '').toLowerCase().includes(q) ||
                c.id.toLowerCase().includes(q)
              );
            })
            .map((c) => ({
              id: c.id,
              label: c.title || c.id,
              description: c.category,
              icon: (c.icon as string) || 'terminal',
              shortcut:
                keybindingManager.getShortcutLabel?.(c.id) || c.shortcut,
              enabled: true,
              onSelect: () => void commands.executeCommand(c.id),
            }));

          return [...fromEditor, ...fromApp].sort((a, b) =>
            a.label.localeCompare(b.label),
          );
        },
      }),
    );

    // Go to line
    disposers.push(
      palette.registerProvider({
        id: 'goto-line',
        prefix: ':',
        label: 'Go to Line/Column',
        provideItems: (search) => {
          const total = editor.getLineCount?.() ?? 1;
          if (!search) {
            return [
              {
                id: 'hint',
                label: `Type a line number (1–${total})`,
                enabled: false,
              },
            ];
          }
          const parts = search.split(',');
          let line = parseInt(parts[0]!, 10);
          const col = parseInt(parts[1] || '1', 10) || 1;
          if (Number.isNaN(line)) {
            return [{ id: 'err', label: 'Invalid line number', enabled: false }];
          }
          line = Math.max(1, Math.min(total, line));
          return [
            {
              id: 'goto',
              label: `Go to line ${line}${parts.length > 1 ? `, column ${col}` : ''}`,
              icon: 'arrow-right',
              onSelect: () => editor.revealLine?.(line, col),
            },
          ];
        },
      }),
    );

    // Optional: also mirror into app paletteStore providers for legacy UI path
    registerProvider?.({
      prefix: '>',
      name: 'Show and Run Commands',
      provideItems: async (search: string) => {
        const r = await palette.resolve('>' + (search || ''));
        return r.items.map((it) => ({
          id: it.id,
          label: it.label,
          description: it.description,
          shortcut: it.shortcut,
          leftIcon: it.icon || 'terminal',
          onSelect: () => it.onSelect?.(),
        }));
      },
    });

    return () => disposers.forEach((d) => d.dispose());
  }, [editor]);
}
