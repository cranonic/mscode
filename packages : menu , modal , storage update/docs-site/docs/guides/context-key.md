# Context Keys & 'when' Clauses

Welcome! When building an extension for MS Code, you will often want to show or hide parts of your UI based on what the user is currently doing. 

For example:
* *"I only want to show my 'Format JSON' menu button if the user is actually editing a `.json` file."*
* *"I want my custom Activity Bar icon to appear only when a workspace folder is open."*
* *"I want my Sidebar section to hide if the user turns off a specific setting."*

To do this, MS Code uses a powerful system called **Context Keys** and **`when` clauses**.

---

## What is a Context Key?

Think of Context Keys as **background variables** or **status flags** that MS Code constantly updates. 

Whenever the user changes a tab, opens the terminal, or toggles a setting, MS Code updates these hidden variables. You can then read these variables using a `"when"` statement to decide if your UI should be visible or hidden.

### Where can you use `when` clauses?
Currently, MS Code's core engine supports the `when` property in almost all major UI registries:
1. **Menus (`MenuItem`):** Context menus, Top Bar actions, and dropdowns.
2. **Activity Bar (`ActivityBarItem`):** The icons on the far left of the editor.
3. **Sidebar Sections (`SidebarSectionDef`):** Expandable panels inside the sidebar (like Explorer or Outline).
4. **Keybindings:** Deciding when a keyboard shortcut should be active.

---

## Built-in Context Keys

MS Code provides several pre-defined context keys out of the box. You do not need to do anything to set them up; they are automatically available!

### 1. Tab & Editor States
| Context Key | Type | Description |
|---|---|---|
| `hasActiveTab` | `boolean` | `true` if there is at least one tab open in the editor. |
| `activeTabType` | `string` | The type of the current tab (e.g., `'code'`, `'termis'`, `'settings'`, `'extension'`). |
| `hasFilePath` | `boolean` | `true` if the current tab is saved on the disk (not an "Untitled" file). |
| `editorTextFocus` | `boolean` | `true` if a code editor tab is currently active and focused. |
| `terminalFocus` | `boolean` | `true` if the integrated terminal (Termis) is active and focused. |

### 2. Language & File Types
| Context Key | Type | Description |
|---|---|---|
| `activeTabExt` | `string` | The file extension of the active tab (e.g., `'.json'`, `'.js'`, `'.py'`). |
| `activeTabLangId` | `string` | The Monaco language ID of the active tab (e.g., `'json'`, `'javascript'`, `'python'`). |

### 3. Workspace & Platform
| Context Key | Type | Description |
|---|---|---|
| `isWorkspaceOpen` | `boolean` | `true` if a folder/workspace is currently open. |
| `isMac` | `boolean` | `true` if the user is running the app on macOS or iOS. |
| `isWeb` | `boolean` | `true` if the app is running in a standard web browser. |

### 4. User Settings (Dynamic)
Every setting inside the user's `settings.json` is automatically available as a context key by simply adding the `config.` prefix!
* **Example:** `config.editor.wordWrap` (Returns the value of the word wrap setting).
* **Example:** `config.workbench.theme` (Returns the current theme name).

---

## How to Use 'when' Clauses (With Examples)

A `when` clause is just a simple string containing a logical condition. If the condition evaluates to `true`, your item is shown. If `false`, it is hidden.

**Supported Operators:**
* `==` or `===` : Equals
* `!=` or `!==` : Not Equals
* `!` : NOT (Opposite)
* `&&` : AND (Both must be true)
* `||` : OR (Either one can be true)

### Example 1: Context Menu Item (File Type Check)
Imagine you are adding a button to the Top Bar. You only want it to show up if the user is editing a Javascript or TypeScript file.

```json
{
  "id": "myExt.runJS",
  "label": "Run JavaScript",
  "icon": "play",
  "command": "extension.runCode",
  "when": "activeTabExt == '.js' || activeTabExt == '.ts'"
}

```

### Example 2: Activity Bar Icon (Workspace Check)

You built a Git extension, but you only want your Git icon to appear in the Activity Bar if a workspace folder is actually open.

```typescript
import { activityBarRegistry } from '@mscode/api';

activityBarRegistry.registerItem({
  id: 'git-view',
  icon: 'source-control',
  label: 'Source Control',
  when: 'isWorkspaceOpen', // Only shows if a folder is open
  openSidebarContent: true
});

```

### Example 3: Sidebar Section (Editor Focus & Settings)

You have a custom "Code Outline" section in the sidebar. It should only appear when the user is looking at code, AND only if they haven't disabled it in their settings.

```typescript
import { sidebarRegistry } from '@mscode/api';

sidebarRegistry.registerPanel({
  activityBarId: 'explorer',
  sections: [
    {
      id: 'custom-outline',
      title: 'OUTLINE',
      // Shows ONLY if looking at code AND user enabled it in settings
      when: 'editorTextFocus && config.myPlugin.showOutline == true',
      content: () => <MyOutlineComponent/>
    }
  ]
});

```

---

## Adding Custom Context Keys

As an extension developer, you might want to create your own context keys!

For example, if your extension has a "Debugging Mode", you might want to create a context key called `myExt.isDebugging`. You can set this dynamically from your extension's JavaScript/TypeScript code using the `commands` API.

### 1. Setting a Custom Context Key

```javascript
import { commands } from '@mscode/api';

// Set a custom context key to true
commands.executeCommand('setContext', 'myExt.isDebugging', true);

// You can also store strings
commands.executeCommand('setContext', 'myExt.currentFramework', 'react');

```

### 2. Using Your Custom Key

Once registered, you can immediately use this custom key in any `when` clause!

```json
{
  "id": "myExt.stopDebug",
  "label": "Stop Debugging",
  "icon": "stop",
  "command": "myExt.stop",
  "when": "myExt.isDebugging"
}

```

:::tip
Always prefix your custom context keys with your extension's ID (e.g., `myExtensionName.isReady`) to avoid colliding with MS Code's built-in keys or keys from other extensions!
:::