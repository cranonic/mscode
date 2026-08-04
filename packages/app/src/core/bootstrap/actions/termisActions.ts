// src/core/bootstrap/actions/termisActions.ts
// Terminal / Output / Problems panel
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { useTabStore } from '@/store/tabStore';
import { useTermisStore } from '@/features/termis/store/termisStore';

const openTermisView = (view: 'terminal' | 'output' | 'problems'): void => {
  useTabStore.getState().addTab({
    id: 'terminal-main',
    type: 'termis',
    title: 'Termis',
    icon: 'terminal',
  });
  useTermisStore.getState().setActiveView(view);
};

export function registerTermisActions(): void {
  commands.registerCommand(
    'termis.open.terminal',
    () => openTermisView('terminal'),
    { title: 'View: Open Terminal', category: 'View', icon: 'terminal', shortcut: 'Ctrl+`' },
  );

  commands.registerCommand(
    'termis.open.output',
    () => openTermisView('output'),
    { title: 'View: Open Output', category: 'View', icon: 'output', shortcut: 'Ctrl+Shift+U' },
  );

  commands.registerCommand(
    'termis.open.problems',
    () => openTermisView('problems'),
    { title: 'View: Open Problems', category: 'View', icon: 'error', shortcut: 'Ctrl+Shift+M' },
  );
}
