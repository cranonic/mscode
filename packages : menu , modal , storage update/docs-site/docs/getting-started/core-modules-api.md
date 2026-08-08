# Core Modules and API Usage

Mono Studio (MS Code) provides a robust, pre-bundled set of APIs that allow your extension to interact with the editor, the file system, and the user interface. 

Unlike standard Node.js or web development where you must install external libraries via a package manager, MS Code utilizes a virtual module resolution system.

## The Virtual Module System

**You do not need to use `npm install` for core MS Code APIs.**

The extension host provides the API and UI components internally. You can import them directly into your `main.js` or `main.ts` files using predefined virtual namespaces. This approach keeps your compiled extension bundle incredibly small and ensures seamless compatibility with the IDE's current version.

### Available Namespaces

1. **`@mscode/api`**: The Core Engine.
   Provides access to logic, commands, background tasks, the file system, window management, and editor manipulation.
   
2. **`@mscode/ui`**: The Native React UI Kit.
   Provides standard Mono Studio UI components (such as Buttons, Modals, and Inputs) ensuring your extension's interface matches the native IDE design system.

## Basic API Usage: Commands and Notifications

To understand how to utilize the API, let us build a functional feature: registering a command that triggers a native notification.

```javascript
import { window, commands } from '@mscode/api';

export function activate(context) {
    // Register a command. The command ID must match the one defined in your manifest.json.
    const helloCommand = commands.registerCommand('myExtension.sayHello', () => {
        
        // Display a native toast notification in the editor's UI
        window.showInformationMessage("Hello from Mono Studio Extension API.");
        
    });

    // Ensure the command is disposed of upon deactivation
    context.subscriptions.push(helloCommand);
}

export function deactivate() {}

```

When the user opens the Command Palette and executes this command, the extension host routes the execution to your registered callback, triggering the notification.

## Debugging with Output Channels

A common mistake made by new extension developers is relying on `console.log()` for debugging and user feedback.

Because MS Code extensions run within an isolated, sandboxed extension host, standard `console.log` statements are routed to the internal developer tools, which are **completely invisible to the end-user**. If your extension encounters an error or needs to display compilation progress, `console.log` will fail to communicate this to the user.

### The Solution: `window.createOutputChannel`

To provide visible, persistent, and exportable logs, you must utilize the **Output Channel API**. This API creates a dedicated logging interface within the IDE's Termis (Terminal/Output) panel.

```javascript
import { window, commands } from '@mscode/api';

export function activate(context) {
    // 1. Initialize a dedicated Output Channel for your extension
    const diagnosticChannel = window.createOutputChannel("My Extension Diagnostics");

    const runProcessCommand = commands.registerCommand('myExtension.runProcess', () => {
        // 2. Force the Output panel to open and focus your specific channel
        diagnosticChannel.show();

        // 3. Append logs directly to the native UI
        diagnosticChannel.appendLine(`[${new Date().toLocaleTimeString()}] Process initiated.`);
        
        try {
            // Simulate a complex operation
            diagnosticChannel.appendLine("[INFO] Resolving dependencies...");
            // ... execution logic ...
            diagnosticChannel.appendLine("[SUCCESS] Operation completed without errors.");
            
        } catch (error) {
            // Surface errors to the user in a readable format
            diagnosticChannel.appendLine(`[ERROR] Critical failure: ${error.message}`);
            window.showErrorMessage("Process failed. Check the Output channel for details.");
        }
    });

    // Ensure the output channel is destroyed when the extension is disabled
    context.subscriptions.push(runProcessCommand, diagnosticChannel);
}

export function deactivate() {}

```

### Benefits of Output Channels

1. **User Visibility:** The logs appear natively in the bottom panel, providing an authentic IDE experience.
2. **Persistence:** Users can review the historical logs of your extension's execution.
3. **Exportability:** The native Output Store allows users to save the channel's log directly to their local filesystem for external debugging.
4. **Lifecycle Management:** The channel provides an `onDidKill` event, allowing you to gracefully terminate background processes if the user manually closes your log channel.

## Moderate API Usage: Executing Background Tasks

For complex extensions that perform heavy lifting—such as invoking compilers, linters, or package managers—you should pair your Output Channel with the **Task API**.

```javascript
import { window, commands, tasks } from '@mscode/api';

export function activate(context) {
    const buildChannel = window.createOutputChannel("My Extension Builder");

    const buildCommand = commands.registerCommand('myExtension.buildProject', () => {
        buildChannel.show();
        buildChannel.appendLine("Starting build process...");

        // Execute a system task in the background
        tasks.runInBackground('npm run build')
            .then(() => {
                buildChannel.appendLine("[SUCCESS] Build finished.");
            })
            .catch((error) => {
                buildChannel.appendLine(`[FATAL] Build interrupted: ${error.message}`);
            });
    });

    context.subscriptions.push(buildCommand, buildChannel);
}

export function deactivate() {}

```