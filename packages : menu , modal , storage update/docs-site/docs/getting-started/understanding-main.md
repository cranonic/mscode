# Extension Anatomy

When developing an extension for Mono Studio (MS Code), understanding the foundational architecture is critical. Every extension operates within a defined lifecycle and relies on a specific entry point to execute its logic. 

This guide covers the fundamental structure of an MS Code extension, focusing on the main script file and the extension lifecycle.

## The Extension Entry Point

Every extension requires a primary entry point, typically named `main.js` (or `main.ts` if you are authoring in TypeScript). 

When a user installs and enables your extension, the MS Code extension host reads your `manifest.json` file, locates the `main` property, and executes the specified script in an isolated extension runtime environment.

## The Extension Lifecycle

The MS Code extension host strictly manages the lifecycle of your extension to ensure optimal performance and resource management. Your `main.js` file must export two specific functions: `activate` and `deactivate`.

### The `activate` Function

The `activate` function is executed the exact moment your extension is activated. Activation events are declared in your `manifest.json` (for example, upon application startup, or when a specific file type is opened).

```javascript
/**
 * This function is called when the extension is activated.
 * * @param {ExtensionContext} context - The context object provided by the MS Code extension host.
 */
export function activate(context) {
    console.log("Extension activated successfully.");
}

```

### The `deactivate` Function

The `deactivate` function is called when the extension is disabled or when the MS Code application is shutting down. This is your opportunity to clean up operations that are not automatically tracked by the system, such as clearing `setInterval` timers or closing active network connections.

```javascript
/**
 * This function is called when the extension is deactivated.
 */
export function deactivate() {
    console.log("Extension deactivated. Performing cleanup.");
}

```

## The Extension Context and Subscriptions

The `context` parameter provided to the `activate` function is an instance of `ExtensionContext`. This object provides utilities for your extension, the most important being the `subscriptions` array.

MS Code utilizes the **Disposable pattern** for resource management. Whenever you register a command, an event listener, or a custom tab, the API returns a `Disposable` object. You must push these disposables into the `context.subscriptions` array.

```javascript
export function activate(context) {
    const myCommand = mscode.commands.registerCommand('myExtension.doWork', () => {
        // Command logic here
    });

    // Pushing the disposable to the subscriptions array ensures 
    // it is properly disposed of when the extension is deactivated.
    context.subscriptions.push(myCommand);
}

```

:::note 
**Memory Management :**
When your extension is deactivated, the MS Code extension host iterates through the `context.subscriptions` array and calls `dispose()` on every item. Failing to add your registered commands and listeners to this array will result in memory leaks and degraded editor performance.
:::

By strictly adhering to this lifecycle architecture, your extension will run efficiently without negatively impacting the core IDE experience.