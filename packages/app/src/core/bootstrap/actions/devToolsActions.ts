// src/core/bootstrap/actions/devToolsActions.ts
// Menu inspector, Suger DevTools
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { useTabStore } from '@/store/tabStore';

export function registerDevToolsActions(): void {
  commands.registerCommand('workbench.action.openMenuInspector', () => {
    useTabStore.getState().addTab({
      id: 'menu-inspector-tab',
      title: 'Menu Inspector',
      icon: 'list-tree',
      type: 'menus',
      showStatusBar: false,
    });
  });

  commands.registerCommand('workbench.action.toggleDevTools', () => {
    const suger = (window as any).suger;
    try {
      suger?.init?.();
    } catch (err) {
      console.error('Failed to launch Suger DevTools:', err);
    }
  });
}
