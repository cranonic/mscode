# Understanding `main.js` (Zero to Hero)

The `src/main.js` (or `main.ts`) file is the living heartbeat of your extension. While `manifest.json` tells MS Code *what* your extension does, `main.js` dictates *how* it does it.

Every MS Code extension runs in an isolated, sandboxed runtime and communicates with the editor via the global `mscode` API. 

In this guide, we will take you from a basic script to a fully integrated, production-ready extension.

---

## Level 1: The Bare Minimum (Console Logging)

Every extension must export two core lifecycle functions: `activate(context)` and `deactivate()`. 
Here is the absolute minimum code required to make your extension run:

```javascript
// src/main.js

function activate(context) {
    console.log("[My Extension] Activated!");
}

function deactivate() {
    console.log("🛑 [My Extension] Deactivated!");
}

module.exports = { activate, deactivate };

```

:::warning 
<b>Why `console.log` is NOT Recommended :</b>
Because MS Code is a mobile-first IDE, accessing standard Chrome/Web DevTools to see `console.log` output requires connecting your device via USB debugging or may be Suger or Eruda devtool. This is terrible for user experience!

Instead, MS Code provides native **Output Channels** which let users see logs directly inside the editor's UI.
:::

---

## Level 2: The Best Practice (Using Output Channels)

To create a professional logging experience, you should use the `mscode.window.createOutputChannel` API. This creates a dedicated tab in the bottom panel where your extension can print messages safely.

```javascript
function activate(context) {
    // 1. Create a dedicated output channel
    const myLogger = mscode.window.createOutputChannel("My Extension Logs");
    
    // 2. Write to the channel
    myLogger.appendLine("Extension successfully activated!");
    myLogger.appendLine("Initializing core services...");

    // 3. (Optional) Force the panel to open so the user sees it
    myLogger.show();

    // 4. IMPORTANT: Push it to subscriptions for auto-cleanup on uninstall/disable
    context.subscriptions.push(myLogger);
}

```

---

## Level 3: Interactivity (Commands & Notifications)

Extensions usually perform actions when a user triggers them (e.g., clicking a button or using the Command Palette). To do this, we register a **Command** and use the **Notification API** to show a toast message.

:::tip 
**Manifest Requirement :**
If you register a command named `myExt.sayHello`, you should also declare it in your `manifest.json` under `contributes.commands`.
:::

```javascript
function activate(context) {
    const helloCmd = mscode.commands.registerCommand('myExt.sayHello', () => {
        mscode.window.showInformationMessage("Hello from MS Code Extension!");
    });
    context.subscriptions.push(helloCmd);
}

```

--- 

## Level 4: Simple UI Integration (Activity Bar Icon)

Want to add your own icon to the left-side Activity Bar? You can inject it dynamically. 

:::tip Best Practice: Declare in Manifest
While you can create icons purely via code, it is highly recommended to declare them in your `manifest.json`. This allows MS Code to render the icon instantly when the app loads (Fast UI), even before your `main.js` finishes executing!
:::

**Step 1: Declare in `manifest.json`** Add this block under the `contributes` section of your manifest file:

```json
"contributes": {
  "activityBar": [
    {
      "id":       "my-simple-action",
      "title":    "Run Quick Action",
      "icon":     "rocket",
      "position": "top",
      "priority": 90
    }
  ]
}

```

**Step 2: Attach Logic in `main.js**` Now, use the `createActivityBarItem` API in your script. Make sure the `id` perfectly matches the one in your manifest. This will "hydrate" the UI icon with your actual JavaScript logic!

```javascript
function activate(context) {
    const mySidebarIcon = mscode.window.createActivityBarItem({
        id: 'my-simple-action', // 👈 Must match the ID in manifest.json
        title: 'Run Quick Action',
        icon: 'rocket',
        onClick: () => {
            mscode.window.showInformationMessage("Activity Bar Icon Clicked!");
        }
    });
    
    context.subscriptions.push(mySidebarIcon);
}

```

---

## Level 5: Advanced Sidebar (Panels, Sections & Actions)

If your extension requires a complex UI (like the File Explorer or Source Control), you need a **Sidebar Panel**.
A Panel consists of **Sections** (collapsible accordions) and **Actions** (inline buttons on the header).

:::info 
**The Max Overflow Magic :**
When you add `actions` to a section, MS Code automatically renders them as inline icons. If you add more than 3 icons, the engine intelligently hides the rest inside a `...` (More Actions) dropdown menu!
:::

```javascript
function activate(context) {
    // 1. Register the Activity Bar Icon (Set openSidebarContent to true)
    const sidebarIcon = mscode.window.createActivityBarItem({
        id: 'my-advanced-view',
        title: 'Plugin Dashboard',
        icon: 'package',
        openSidebarContent: true // This tells the engine to open a panel instead of just clicking
    });

    // 2. Register the Panel Content for that Icon
    const sidebarPanel = mscode.window.registerSidebarPanel({
        activityBarId: 'my-advanced-view', // Must match the ID above
        
        // ── Main Header ──
        header: {
            title: 'My Dashboard',
            actions: [
                { id: 'dash-refresh', icon: 'refresh', label: 'Refresh', onClick: () => console.log('Refreshed!') }
            ]
        },

        // ── Collapsible Sections ──
        sections: [
            {
                id: 'section-tools',
                title: 'Quick Tools',
                defaultExpanded: true,
                // Actions appear inline next to the section title
                actions: [
                    { id: 'tool-add', icon: 'add', onClick: () => console.log('Add') },
                    { id: 'tool-edit', icon: 'edit', onClick: () => console.log('Edit') },
                    { id: 'tool-delete', icon: 'trash', onClick: () => console.log('Delete') },
                    { id: 'tool-extra', icon: 'settings', onClick: () => console.log('Settings') } // This 4th item goes into the '...' menu!
                ],
                // For now, render basic HTML/Text. Later you can inject Webviews or React nodes.
                content: () => `<div style="padding: 10px; color: gray;">Tool controls will appear here.</div>`
            },
            {
                id: 'section-info',
                title: 'Information',
                defaultExpanded: false,
                content: () => `<div style="padding: 10px;">Version 1.0.0</div>`
            }
        ]
    });

    context.subscriptions.push(sidebarIcon, sidebarPanel);
}

```

---

## Level 6: Injecting Menus (The Triple-Dot Magic)

To place a button on the Editor's Top Title Bar (like a "Play" button) or inside a Context Menu, we use the powerful `menusModule`.

*Note: MS Code uses a Deep-Merge system. You can push your action inside another extension's menu!*

```javascript
function activate(context) {
    const runMenuBtn = mscode.menus.registerItem('editor/title', {
        id: 'myExt.run-anchor',
        label: 'Run File',
        icon: 'play',
        order: 10,
        // Using "children" enables MS Code's advanced Auto-Flattening feature.
        // Because there is only 1 child, it will display as a direct Play button!
        children: [
            {
                id: 'myExt.run-action',
                label: 'Run File',
                icon: 'play',
                onClick: () => mscode.commands.executeCommand('myExt.runLogic')
            }
        ]
    });

    context.subscriptions.push(runMenuBtn);
}

```

---

## Level 7: The "Hero" Template (Putting it all together)

Here is a complete, production-ready `main.js` template that combines **Logs, Notifications, Commands, Menus, and the Advanced Sidebar**, all with proper memory management (`subscriptions`):

```javascript
// src/main.js

function activate(context) {
    // ─── 1. INITIALIZE LOGGER ───
    const logger = mscode.window.createOutputChannel("Hero Extension");
    logger.appendLine("[System] Hero Extension Booting Up...");
    context.subscriptions.push(logger);

    // ─── 2. REGISTER COMMAND ───
    const actionCmd = mscode.commands.registerCommand('heroExt.doAction', () => {
        logger.show();
        mscode.window.showInformationMessage("Hero Action Executed Successfully!");
    });
    context.subscriptions.push(actionCmd);

    // ─── 3. REGISTER ADVANCED SIDEBAR ───
    const sidebarView = mscode.window.createActivityBarItem({
        id: 'hero-view',
        title: 'Hero Tools',
        icon: 'hubot',
        openSidebarContent: true
    });
    
    const sidebarPanel = mscode.window.registerSidebarPanel({
        activityBarId: 'hero-view',
        header: { title: 'Hero Dashboard' },
        sections: [
            {
                id: 'hero-actions',
                title: 'Actions',
                actions: [{ id: 'hero-run', icon: 'zap', onClick: () => mscode.commands.executeCommand('heroExt.doAction') }],
                content: () => `<div style="padding: 15px;">Click the zap icon above!</div>`
            }
        ]
    });
    context.subscriptions.push(sidebarView, sidebarPanel);

    // ─── 4. REGISTER EDITOR MENU BUTTON ───
    const topMenuBtn = mscode.menus.registerItem('editor/title', {
        id: 'heroExt.run-anchor',
        icon: 'zap',
        children: [{ id: 'heroExt.run-child', onClick: () => mscode.commands.executeCommand('heroExt.doAction') }]
    });
    context.subscriptions.push(topMenuBtn);

    logger.appendLine("[System] Boot complete. Ready for action.");
}

function deactivate() {
    console.log("Hero Extension safely shut down.");
}

module.exports = { activate, deactivate };

```

## Summary

You are now an MS Code API Hero! You learned:

1. Why native **Output Channels** beat `console.log`.
2. How to register **Commands** & popup UI **Notifications**.
3. How to build a complex **Sidebar Panel** with collapsible sections and auto-overflow actions.
4. How to safely inject buttons into the **Menu/Toolbar** ecosystem.