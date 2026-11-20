/**
 * Call once at app boot (e.g. App.tsx useEffect) so F1 / ">" works
 * even when no CodeEditor is mounted yet.
 *
 *   import { registerPaletteProviders } from '@/features/editor/hooks/registerPaletteProviders';
 *   useEffect(() => registerPaletteProviders(), []);
 */
import { usePaletteStore, type QuickPickItem } from '@/store/paletteStore';
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { keybindingManager } from '@/core/keybindings/keybindingManager';

function listAppCommands(filter: string): QuickPickItem[] {
  const q = (filter || '').toLowerCase().trim();
  const list = commands.getCommandsForPalette() || [];
  return list
    .filter((c) => {
      if (!c.title) return false;
      if (!q) return true;
      const hay = `${c.title} ${c.category || ''} ${c.id}`.toLowerCase();
      return hay.includes(q);
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
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Idempotent — safe to call multiple times. */
export function registerPaletteProviders(): () => void {
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
      const items = listAppCommands(search || '');
      if (!items.length) {
        // Still show a diagnostic row so user knows service is alive
        return [
          {
            id: 'diag-empty',
            label: 'No commands with a title are registered',
            description:
              'commands.registerCommand(id, fn, { title }) or editor.addAction',
            readonly: true,
          },
        ];
      }
      return items;
    },
  });

  registerProvider({
    prefix: ':',
    name: 'Go to Line',
    provideItems: (search) => {
      if (!search) {
        return [{ id: 'hint', label: 'Type a line number', readonly: true }];
      }
      const line = parseInt(search.split(',')[0]!, 10);
      if (Number.isNaN(line)) {
        return [{ id: 'err', label: 'Invalid line', readonly: true }];
      }
      return [
        {
          id: 'goto',
          label: `Go to line ${line}`,
          leftIcon: 'arrow-right',
          onSelect: () => {
            /* CodeEditor/host may refine with active editor */
          },
        },
      ];
    },
  });

  return () => {
    unregisterProvider('');
    unregisterProvider('>');
    unregisterProvider(':');
  };
}
