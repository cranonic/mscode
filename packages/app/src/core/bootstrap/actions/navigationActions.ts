// src/core/bootstrap/actions/navigationActions.ts
// Go to Line / Symbol / Recent
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { usePaletteStore } from '@/store/paletteStore';

export function registerNavigationActions(): void {
  commands.registerCommand(
    'workbench.action.gotoLine',
    () => usePaletteStore.setState({ isOpen: true, isQuickPick: false, query: ':' }),
    { title: 'Go to Line...', category: 'Navigation', shortcut: 'Ctrl+G' },
  );

  commands.registerCommand(
    'workbench.action.gotoSymbol',
    () => usePaletteStore.setState({ isOpen: true, isQuickPick: false, query: '@' }),
    { title: 'Go to Symbol in Editor...', category: 'Navigation', shortcut: 'Ctrl+Shift+O' },
  );

  commands.registerCommand(
    'workbench.action.openRecent',
    () => usePaletteStore.setState({ isOpen: true, isQuickPick: false, query: '/' }),
    { title: 'File: Open Recent...', category: 'File', shortcut: 'Ctrl+R' },
  );
}
