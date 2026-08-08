// src/main.ts — {{EXT_NAME}}
// Entry point for Mono Studio Code (MSCode) Extension.

import { commands, window, menus, ExtensionContext } from '@mscode/api';
import manifest from '../manifest.json';

export function activate(context: ExtensionContext): void {
  const extName = manifest.name;
  const extVersion = manifest.version;
  
  window.showInformationMessage(`${extName} (v${extVersion}) is now active!`);

  // 1. Define action for commands registered in Manifest
  const helloCmd = commands.registerCommand('{{CMD_PREFIX}}.sayHello', () => {
    window.showInformationMessage(`Hello from ${extName} menu!`);
  });

  const buildCmd = commands.registerCommand('{{CMD_PREFIX}}.buildAction', () => {
    window.showInformationMessage('Building project...');
  });

  // 2. Dynamic menu push in editor top title bar
  const dynamicMenuGroup = menus.registerItems('editor/title', [
    {
      id: '{{CMD_PREFIX}}.sep.dynamic',
      type: 'separator',
      order: 250
    },
    {
      id: '{{CMD_PREFIX}}.dynamicMagic',
      label: 'Magic Tool',
      icon: 'zap',
      order: 255,
      onClick: () => {
        window.showInformationMessage('Magic action executed dynamically!');
      }
    }
  ]);

  // 3. Add to subscriptions to ensure proper cleanup on deactivate
  context.subscriptions.push(helloCmd, buildCmd, dynamicMenuGroup);
}

export function deactivate(): void {
  // Cleanups are handled automatically via context.subscriptions
}