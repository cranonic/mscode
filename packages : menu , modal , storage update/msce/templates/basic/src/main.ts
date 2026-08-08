// src/main.ts — {{EXT_NAME}}
// Entry point for Mono Studio Code (MSCode) Extension.

import { commands, window, ExtensionContext } from '@mscode/api';
import manifest from '../manifest.json';

export function activate(context: ExtensionContext): void {
  const extId = manifest.id;
  const extName = manifest.name;
  const extVersion = manifest.version;

  console.log(`[${extId}] Activating version ${extVersion}...`);

  // Registering a basic command
  const cmd = commands.registerCommand(
    '{{CMD_PREFIX}}.helloWorld',
    () => {
      window.showInformationMessage(`Hello from ${extName}! 👋`);
      
      // Or use the MSCode specific notification module:
      // window.notification.showInformationMessage(`Hello from ${extName}! 👋`);
    }
  );

  // Push to subscriptions to ensure proper cleanup when the extension is deactivated
  context.subscriptions.push(cmd);
}

export function deactivate(): void {
  // Logic to run when extension is deactivated (if any)
}