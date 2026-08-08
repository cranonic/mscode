# Commands Module

The `commands` namespace provides the core API for registering and executing commands within Mono Studio Code (MSCode). Commands form the backbone of the editor's interactive capabilities, allowing extensions to contribute actions that users can invoke via the Command Palette, keybindings, menus, or programmatic calls from other extensions.

All command registrations return a `Disposable` object, which must be pushed to the extension's subscription context to ensure proper cleanup upon extension deactivation.

## Import Syntax

To use the commands API, you must import it from the MSCode API package:

```typescript
import { commands } from '@mscode/api';

```

---

## Methods

### `registerCommand`

Registers a new command with a unique identifier and an associated handler function.

**Signature:**

```typescript
registerCommand(id: string, handler: (...args: any[]) => any): Disposable

```

**Parameters:**

* **`id`** (`string`): A unique identifier for the command. To prevent naming collisions, it is highly recommended to prefix the command ID with your extension identifier (e.g., `'myExtension.actionName'`).
* **`handler`** (`(...args: any[]) => any`): The callback function to execute when the command is invoked. The arguments passed to this handler depend entirely on how the command is triggered (e.g., via a context menu, it may receive a URI context).

**Returns:**

* **`Disposable`**: An object containing a `dispose()` method. When invoked, it removes the command registration from the system's command registry.

**Example: Registering a Basic Command**

```typescript
import { commands, window, ExtensionContext } from '@mscode/api';

export function activate(context: ExtensionContext) {
    const helloCommand = commands.registerCommand('myExt.helloWorld', () => {
        window.showInformationMessage('Hello World from my extension!');
    });

    // Ensure the command is cleaned up when the extension is deactivated
    context.subscriptions.push(helloCommand);
}

```

---

### `executeCommand`

Programmatically executes a command that has been registered in the editor, either by the core system or by another active extension.

**Signature:**

```typescript
executeCommand<T>(id: string, ...args: any[]): Promise<T | undefined>

```

**Parameters:**

* **`id`** (`string`): The unique identifier of the command to execute (e.g., `'editor.action.formatDocument'`).
* **`...args`** (`any[]`): Optional parameters to pass directly into the target command's handler function.

**Returns:**

* **`Promise<T undefined |>`**: A promise that resolves with the result of the command's handler function. If the command does not return a value, fails, or is not found, it resolves appropriately (often to `undefined`).

**Example: Executing Built-in and Custom Commands**

```typescript
import { commands, window, ExtensionContext } from '@mscode/api';

export async function activate(context: ExtensionContext) {
    const formatBtn = commands.registerCommand('myExt.formatAndSave', async () => {
        
        // Programmatically trigger the editor's built-in formatting action
        await commands.executeCommand('editor.action.formatDocument');
        
        // Programmatically trigger the save action
        await commands.executeCommand('workbench.action.files.save');
        
        window.showInformationMessage('Document formatted and saved successfully!');
    });

    context.subscriptions.push(formatBtn);
}

```