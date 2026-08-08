# workspace

## Description

**Mono Studio Configuration API & Manifest Guide**

You can define your extension settings in `manifest.json` in two ways:

**Method 1: Direct Object Definition (Good for small settings)**
```json
// manifest.json
{
  "name": "my-extension",
  "configuration": {
    "my-extension.enable": {
      "type": "boolean",
      "defaultValue": true,
      "title": "Enable Extension"
    }
  }
}
```

**Method 2: External JSON File Reference (Recommended for large settings)**
```json
// manifest.json
{
  "name": "my-extension",
  "configuration": "./config/settings.json"
}
```

**Usage Example in Code:**
```javascript
import { workspace } from '@mscode/api';

// Read the settings
const config = workspace.getConfiguration('my-extension');
const isEnabled = config.get('enable', true);

// Listen for changes
workspace.onDidChangeConfiguration(() => {
  const updatedConfig = workspace.getConfiguration('my-extension');
  console.log("Setting changed:", updatedConfig.get('enable'));
});
```

## Variables

### bookmarks

> `const` **bookmarks**: [`BookmarkFolder`](../../../modules/workspace/recent.md#bookmarkfolder)[]

Defined in: modules/workspace/recent.d.ts:39

Retrieves the list of all user-saved bookmarked folders.

***

### name

> `const` **name**: `string` \| `undefined`

Defined in: modules/workspace/workspace.d.ts:22

The name of the current workspace/folder.
Returns `undefined` if no workspace is currently active.
*

#### Example

```ts
if (mscode.workspace.name) {
console.log("Working inside: ", mscode.workspace.name);
}
```

***

### onDidChangeConfiguration

> `const` **onDidChangeConfiguration**: (`listener`) => `object`

Defined in: modules/workspace/configuration.d.ts:165

Fires when the user modifies their settings.json or changes a setting via the UI.

#### Parameters

##### listener

() => `void`

#### Returns

`object`

##### dispose

> **dispose**: () => `void`

###### Returns

`void`

***

### recentWorkspaces

> `const` **recentWorkspaces**: [`RecentWorkspace`](../../../modules/workspace/recent.md#recentworkspace)[]

Defined in: modules/workspace/recent.d.ts:34

Retrieves the list of all recently opened workspaces.
The list is automatically sorted from most recent to oldest.
*

#### Example

```ts
const recents = mscode.workspace.recentWorkspaces;
if (recents.length > 0) {
console.log(`Last worked on: ${recents[0].name}`);
}
```

***

### workspacePath

> `const` **workspacePath**: `string` \| `undefined`

Defined in: modules/workspace/workspace.d.ts:33

The absolute file system path of the currently open workspace.
Returns `undefined` if no workspace is currently active.
*

#### Example

```ts
const rootPath = mscode.workspace.workspacePath;
if (rootPath) {
const packageJson = `${rootPath}/package.json`;
}
```

## Functions

### addBookmark()

> **addBookmark**(`name`, `path`): `Promise`\<`void`\>

Defined in: modules/workspace/recent.d.ts:60

Adds a directory path to the user's saved bookmarks.
Bookmarks typically appear pinned in the explorer or dashboard.
*

#### Parameters

##### name

`string`

The display name of the bookmarked folder.

##### path

`string`

The absolute system path to bookmark.

#### Returns

`Promise`\<`void`\>

***

### addRecentWorkspace()

> **addRecentWorkspace**(`name`, `path`): `Promise`\<`void`\>

Defined in: modules/workspace/recent.d.ts:47

Adds a new project or workspace to the recent history tracking.
If the path already exists, it is bumped to the top of the list.
*

#### Parameters

##### name

`string`

The display name of the project.

##### path

`string`

The absolute file system path.

#### Returns

`Promise`\<`void`\>

***

### clearRecentWorkspaces()

> **clearRecentWorkspaces**(): `Promise`\<`void`\>

Defined in: modules/workspace/recent.d.ts:52

Wipes the entire recent workspace history array from disk storage.

#### Returns

`Promise`\<`void`\>

***

### getConfiguration()

> **getConfiguration**(`section?`): [`WorkspaceConfiguration`](../../../modules/workspace/configuration.md#workspaceconfiguration)

Defined in: modules/workspace/configuration.d.ts:159

#### Parameters

##### section?

`string`

#### Returns

[`WorkspaceConfiguration`](../../../modules/workspace/configuration.md#workspaceconfiguration)

***

### onDidChangeWorkspace()

> **onDidChangeWorkspace**(`handler`): [`Disposable`](../index.md#disposable)

Defined in: modules/workspace/workspace.d.ts:57

An event that is emitted when a workspace folder is opened or changed.
*

#### Parameters

##### handler

(`folder`) => `void`

A callback function that receives the new workspace data.

#### Returns

[`Disposable`](../index.md#disposable)

A disposable to unregister the event listener.
*

#### Example

```ts
const dispose = mscode.workspace.onDidChangeWorkspace((folder) => {
if (folder.path) {
mscode.window.showInformationMessage(`Workspace switched to ${folder.name}`);
}
});
```

***

### openWorkspace()

> **openWorkspace**(`name`, `path`): `void`

Defined in: modules/workspace/workspace.d.ts:44

Programmatically loads and opens a new workspace folder in the IDE.
This will re-initialize the file explorer and set the new context.
*

#### Parameters

##### name

`string`

The display name of the workspace.

##### path

`string`

The absolute system path to the directory.
*

#### Returns

`void`

#### Example

```ts
// Automatically open a cloned repository
mscode.workspace.openWorkspace('MyNewApp', '/sdcard/Projects/MyNewApp');
```

***

### registerConfiguration()

> **registerConfiguration**(`schema`): `any`

Defined in: modules/workspace/configuration.d.ts:160

#### Parameters

##### schema

[`IConfigurationSection`](../../../modules/workspace/configuration.md#iconfigurationsection)

#### Returns

`any`

***

### removeBookmark()

> **removeBookmark**(`path`): `Promise`\<`void`\>

Defined in: modules/workspace/recent.d.ts:66

Removes a directory path from the user's saved bookmarks.
*

#### Parameters

##### path

`string`

The exact file system path to remove.

#### Returns

`Promise`\<`void`\>
