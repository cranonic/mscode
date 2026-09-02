// src/core/bootstrap/actions/viewLayoutActions.ts
// Palette, word-wrap, close all, settings, keybindings, status bar
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { useTabStore } from '@/store/tabStore';
import { usePaletteStore } from '@/store/paletteStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';

export function registerViewLayoutActions(): void {
  commands.registerCommand(
    'workbench.action.showCommands',
    () => usePaletteStore.setState({ isOpen: true, isQuickPick: false, query: '>' }),
    { title: 'Show All Commands', category: 'View', shortcut: 'Ctrl+Shift+P' },
  );

  commands.registerCommand(
    'editor.action.toggleWordWrap',
    () => {
      const { settings, updateSetting } = useSettingsStore.getState();
      const next = settings['editor.wordWrap'] === 'on' ? 'off' : 'on';
      updateSetting('editor.wordWrap', next);
    },
    { title: 'Toggle Word Wrap', category: 'View', icon: 'word-wrap', shortcut: 'Alt+Z' },
  );

  commands.registerCommand(
    'workbench.action.closeAllEditors',
    () => useTabStore.getState().clearTabs(),
    { title: 'Close All', category: 'View' },
  );

  commands.registerCommand(
    'workbench.action.openSettings',
    () => {
      useTabStore.getState().addTab({
        id: 'mscode://internal/settings.ui',
        type: 'settings',
        title: 'Settings',
        icon: 'settings',
      });
    },
    { title: 'Open Settings', category: 'Preferences', icon: 'settings', shortcut: 'Ctrl+,' },
  );

  commands.registerCommand(
    'workbench.action.openGlobalKeybindings',
    () => {
      useTabStore.getState().addTab({
        id: 'mscode://internal/keybindings.ui',
        type: 'keybindings',
        icon: 'keyboard',
        title: 'Key Shortcuts',
        filePath: 'mscode://internal/keybindings.ui',
        showQuickBar: false,
      });
    },
    {
      title: 'Preferences: Open Keyboard Shortcuts',
      category: 'Preferences',
      icon: 'keyboard',
      shortcut: 'Ctrl+K Ctrl+S',
    },
  );

  commands.registerCommand(
    'workbench.action.toggleStatusbarVisibility',
    () => {
      const { settings, updateSetting } = useSettingsStore.getState();
      const isVisible = settings['workbench.statusBar.visible'] ?? true;
      updateSetting('workbench.statusBar.visible', !isVisible);
    },
    { title: 'View: Toggle Status Bar', category: 'View', icon: 'layout-bottom' },
  );
}
