/**
 * Always-on palette providers (no editor required).
 * Registers help menu and workbench commands so the palette works
 * even when no file is open.
 */
import { useEffect } from 'react';
import { usePaletteStore, type QuickPickItem } from '@/store/paletteStore';
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { keybindingManager } from '@/core/keybindings/keybindingManager';

function appCommandItems(filter: string): QuickPickItem[] {
  const q = (filter || '').toLowerCase().trim();
  const raw = commands.getCommandsForPalette?.() || [];
  return raw
    .filter((c: any) => {
      if (!c?.title) return false;
      if (!q) return true;
      return `${c.title} ${c.category || ''} ${c.id}`.toLowerCase().includes(q);
    })
    .map((c: any) => {
      let shortcut = c.shortcut;
      try {
        shortcut = (keybindingManager as any)?.getShortcutLabel?.(c.id) || c.shortcut;
      } catch {
        /* */
      }
      return {
        id: c.id,
        label: c.title || c.id,
        description: c.category,
        leftIcon: c.icon || 'terminal',
        shortcut,
        onSelect: () => {
          void commands.executeCommand(c.id);
        },
      } as QuickPickItem;
    });
}

export function useAppPaletteProviders() {
  useEffect(() => {
    const { registerProvider, unregisterProvider } = usePaletteStore.getState();

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
            leftIcon: 'arrow-right',
            keepOpen: true,
            onSelect: () => setQuery(':'),
          },
        ];
      },
    });

    registerProvider({
      prefix: '>',
      name: 'Show and Run Commands',
      provideItems: (search) => {
        const items = appCommandItems(search || '');
        if (items.length === 0) {
          return [
            {
              id: 'empty-cmds',
              label: 'No commands registered',
              readonly: true,
            },
          ];
        }
        return items;
      },
    });

    return () => {
      unregisterProvider('');
      unregisterProvider('>');
    };
  }, []);
}
