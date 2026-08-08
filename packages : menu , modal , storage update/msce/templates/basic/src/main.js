// src/main.js — {{EXT_NAME}}
// Entry point for Mono Studio Code (MSCode) Extension.

import { commands, window } from '@mscode/api';
import manifest from '../manifest.json';

/**
 * Called once when the extension activates.
 * @param {import('@mscode/api').ExtensionContext} context
 */
export function activate(context) {
  const extId = manifest.id;
  const extName = manifest.name;
  const extVersion = manifest.version;

  console.log(`[${extId}] Activating version ${extVersion}...`);

  // Registering a basic command
  const cmd = commands.registerCommand(
    '{{CMD_PREFIX}}.helloWorld',
    () => {
      window.showInformationMessage(`Hello from ${extName}! 👋`);
    }
  );

  // Push to subscriptions to ensure proper cleanup when the extension is deactivated
  context.subscriptions.push(cmd);
}

export function deactivate() {
  // Logic to run when extension is deactivated (if any)
}