# Advanced React UI Integration

One of the most significant architectural advantages of Mono Studio (MS Code) over traditional editors like VS Code is its native UI rendering engine. 

In traditional extension development, creating a custom user interface requires utilizing `Webview` panels. These are essentially isolated `iframe` instances that require complex, asynchronous message-passing bridges to communicate with the extension host. This approach is notoriously slow, resource-intensive, and difficult to style consistently.

Mono Studio eliminates this overhead entirely. **In MS Code, you author your custom interfaces using Pure React.**

## The Native UI Kit (`@mscode/ui`)

MS Code exposes its internal React component library directly to extension developers via the `@mscode/ui` module. By utilizing these components, your extension automatically inherits the IDE's exact design tokens, CSS variables, and interaction paradigms.

Available components include `Button`, `Modal`, `Collapsible`, `InputBox`, and more.

## Registering Custom Editor Tabs

To render a React component as an Editor Tab, you must register it with the window engine and then invoke a command to mount it.

### Step 1: Define the React Component

Since you are utilizing React, your extension file must use the `.jsx` or `.tsx` extension, and you must import React.

```jsx
import React from 'react';
import { Button } from '@mscode/ui';
import { window } from '@mscode/api';

/**
 * A custom React component that will serve as the content for our editor tab.
 */
const DashboardView = () => {
    return (
        <div style={{ padding: '24px', color: 'var(--ms-text-normal)' }}>
            <h2>Extension Dashboard</h2>
            <p>This interface is rendered natively within the editor DOM.</p>
            <Button 
                label="Execute Process" 
                variant="type1" 
                onClick={() => window.showInformationMessage('Process initiated.')} 
            />
        </div>
    );
};

```

### Step 2: Register and Instantiate the Tab

You do not need to manually interact with the internal Tab Registries. The `window` API provides a streamlined method to register your component and bind it to a unique tab type.

```jsx
import { window, commands } from '@mscode/api';

export function activate(context) {
    // Register the component against a unique type identifier
    const viewDisposable = window.registerCustomTab('myExtension.dashboardView', DashboardView);

    // Register a command that the user can execute to open the tab
    const openCommand = commands.registerCommand('myExtension.openDashboard', () => {
        window.openTab({
            id: 'dashboard-instance-1',       // Unique instance ID
            title: 'My Dashboard',            // Display text on the tab
            type: 'myExtension.dashboardView',// Must match the registered type above
            icon: 'dashboard'                 // Codicon identifier
        });
    });

    // Ensure all resources are disposed of properly
    context.subscriptions.push(viewDisposable, openCommand);
}

export function deactivate() {}

```

When the `myExtension.openDashboard` command is executed, the extension host instructs the layout engine to mount your `DashboardView` component within the main editor workspace. State management (like `useState` or `useEffect`) functions exactly as it does in a standard React application.