# window

## Namespaces

- [activityBar](namespaces/activityBar.md)
- [fileDecorations](namespaces/fileDecorations.md)
- [notification](namespaces/notification.md)
- [sidebar](namespaces/sidebar.md)
- [statusBar](namespaces/statusBar.md)
- [toast](namespaces/toast.md)

## Interfaces

### ToastController

Defined in: modules/window/toast.d.ts:75

Controller object returned when a toast is created.

#### Properties

##### dismiss

> **dismiss**: () => `void`

Defined in: modules/window/toast.d.ts:79

Programmatically removes this specific toast from the screen.

###### Returns

`void`

##### id

> **id**: `string`

Defined in: modules/window/toast.d.ts:77

The unique identifier of the created toast.

***

### ToastOptions

Defined in: modules/window/toast.d.ts:83

Configuration options for rendering a Toast.

#### Properties

##### action?

> `optional` **action?**: `object`

Defined in: modules/window/toast.d.ts:116

Add a clickable action button to the right side of the toast.

###### label

> **label**: `string`

The text label of the button (e.g., "Retry", "Undo")

###### onClick

> **onClick**: () => `void`

Callback function executed when the user clicks the button

###### Returns

`void`

##### className?

> `optional` **className?**: `string`

Defined in: modules/window/toast.d.ts:127

Custom CSS class name to apply to the toast wrapper.
Useful for scoping custom CSS rules.

##### description?

> `optional` **description?**: `string`

Defined in: modules/window/toast.d.ts:93

Secondary text to display below the main message.

##### duration?

> `optional` **duration?**: `number`

Defined in: modules/window/toast.d.ts:111

How long the toast should stay visible (in milliseconds).
Set to `0` to make the toast permanent (user must dismiss it or you call `.dismiss()`).

###### Default

```ts
3000
```

##### icon?

> `optional` **icon?**: `string`

Defined in: modules/window/toast.d.ts:104

Override the default icon with a custom icon name from the IconRegistry.

##### id?

> `optional` **id?**: `string`

Defined in: modules/window/toast.d.ts:88

A custom unique ID for the toast. If not provided, a random one is generated.
Providing the same ID twice will update the existing toast instead of creating a new one.

##### position?

> `optional` **position?**: `"bottom-center"` \| `"bottom-left"` \| `"bottom-right"` \| `"side-right"` \| `"side-left"`

Defined in: modules/window/toast.d.ts:99

The screen position where the toast should appear.

###### Default

```ts
'bottom-center'
```

##### style?

> `optional` **style?**: `Record`\<`string`, `string` \| `number`\>

Defined in: modules/window/toast.d.ts:133

Inline CSS styles to apply directly to the toast wrapper.
Allows dynamic customization like custom background colors or borders.

## Variables

### activeOutputChannel

> `const` **activeOutputChannel**: `string`

Defined in: modules/window/output.d.ts:37

The name of the currently active output channel.

***

### activeTab

> `const` **activeTab**: [`Tab`](../../../../modules/window/tab.md#tab) \| `undefined`

Defined in: modules/window/tab.d.ts:51

Retrieves the currently active (focused) tab.

***

### activeTerminal

> `const` **activeTerminal**: [`Terminal`](../../../../modules/window/terminal.md#terminal) \| `undefined`

Defined in: modules/window/terminal.d.ts:76

The currently focused active terminal element.

***

### activeTextEditor

> `const` **activeTextEditor**: [`TextEditor`](../../../../modules/window/editor.md#texteditor) \| `undefined`

Defined in: modules/window/editor.d.ts:137

The currently active text editor or `undefined` if no code editor is open/focused.

#### Description

This is a **Getter property**, not a function. You do not need to call it with `()`.
It dynamically fetches the latest state directly from the Mono Studio Engine.

#### Examples

```ts
// 1. Read document text
const editor = mscode.window.activeTextEditor;
if (editor) {
  console.log("Current file: ", editor.document.fileName);
  console.log("File content: ", editor.document.getText());
}
```

```ts
// 2. Modify document text safely
const editor = mscode.window.activeTextEditor;
editor?.edit(builder => {
  builder.insert(1, 1, "// Created by Mono Studio\n");
});
```

***

### outputChannels

> `const` **outputChannels**: `string`[]

Defined in: modules/window/output.d.ts:40

Array containing the names of all currently registered output channels.

***

### tabs

> `const` **tabs**: [`Tab`](../../../../modules/window/tab.md#tab)[]

Defined in: modules/window/tab.d.ts:48

Retrieves a list of all currently open tabs.

***

### terminals

> `const` **terminals**: [`Terminal`](../../../../modules/window/terminal.md#terminal)[]

Defined in: modules/window/terminal.d.ts:73

Array of all existing terminals registered in the environment.

## Functions

### closeAllTabs()

> **closeAllTabs**(): `void`

Defined in: modules/window/tab.d.ts:73

Closes all currently open tabs at once.

#### Returns

`void`

***

### closeTab()

> **closeTab**(`tabId`): `void`

Defined in: modules/window/tab.d.ts:70

Closes a specific tab by its unique identifier.
*

#### Parameters

##### tabId

`string`

The unique ID of the tab to be closed.

#### Returns

`void`

***

### createOutputChannel()

> **createOutputChannel**(`name`): [`OutputChannel`](../../../../modules/window/output.md#outputchannel)

Defined in: modules/window/output.d.ts:51

Creates a new output channel with the given name.
*

#### Parameters

##### name

`string`

The display name of the channel.

#### Returns

[`OutputChannel`](../../../../modules/window/output.md#outputchannel)

An object representing the output channel.
*

#### Example

```ts
const myLog = mscode.window.createOutputChannel("My Plugin");
myLog.appendLine("Plugin initialized successfully!");
myLog.show();
```

***

### createTerminal()

> **createTerminal**(`options?`): [`Terminal`](../../../../modules/window/terminal.md#terminal)

Defined in: modules/window/terminal.d.ts:87

Spawns a discrete, configurable terminal workspace execution layer instance window.
*

#### Parameters

##### options?

`string` \| [`TerminalOptions`](../../../../modules/window/terminal.md#terminaloptions)

Pass a simple title string layout name or configuration properties directly.

#### Returns

[`Terminal`](../../../../modules/window/terminal.md#terminal)

The public descriptor interface structure handles matching instance hooks.
*

#### Example

```ts
const term = mscode.window.createTerminal({ name: "Build Server", shell: "bash" });
term.show();
term.sendText("npm run build");
```

***

### createTreeView()

> **createTreeView**(`viewId`, `options`): [`TreeView`](../../../../modules/window/treeView.md#treeview)

Defined in: modules/window/treeView.d.ts:100

Allocates and hooks a stateful, data-agnostic tree container view into the application framework.
Leverages the `GenericTreeView` visual component upstream by binding the target data provider.
*

#### Parameters

##### viewId

`string`

The unique structural registration target path across the layout mapping coordinates.

##### options

[`TreeViewOptions`](../../../../modules/window/treeView.md#treeviewoptions)

Core tracking attributes configuration holding providers and descriptors.

#### Returns

[`TreeView`](../../../../modules/window/treeView.md#treeview)

An instantiated state handle conforming to the strict structural `TreeView` contract.
*

#### Example

```ts
const myDatabaseTree = mscode.window.createTreeView('mySqlExplorerView', {
title: 'SQL Database Explorer',
treeDataProvider: {
getChildren: async (element) => {
if (!element) return [{ id: 'cluster-1', label: 'Production', collapsibleState: 'expanded' }];
return [{ id: 'table-users', label: 'Users', collapsibleState: 'none', icon: 'file' }];
},
onItemClick: (item) => mscode.window.showInformationMessage(`Clicked: ${item.label}`)
}
});
```

***

### dismissNotification()

> **dismissNotification**(`id`): `void`

Defined in: modules/window/notification.d.ts:67

Dismisses a specific notification by its ID.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### focusTab()

> **focusTab**(`tabId`): `void`

Defined in: modules/window/tab.d.ts:79

Programmatically switches focus to a specific tab.
*

#### Parameters

##### tabId

`string`

The unique ID of the tab to focus.

#### Returns

`void`

***

### onDidChangeActiveOutputChannel()

> **onDidChangeActiveOutputChannel**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/output.d.ts:60

Fired when the active output channel changes.

#### Parameters

##### handler

(`channelName`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### onDidChangeActiveTab()

> **onDidChangeActiveTab**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/tab.d.ts:97

Fired when the user switches between tabs or when the active tab changes.

#### Parameters

##### handler

(`tab`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### onDidChangeActiveTerminal()

> **onDidChangeActiveTerminal**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/terminal.d.ts:96

Fires an event callback notification updating execution parameters when an index changes panel viewport assignments.

#### Parameters

##### handler

(`terminal`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### onDidCloseFilePicker()

> **onDidCloseFilePicker**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/filePicker.d.ts:93

Fired when the file/folder picker dialog is closed.
*

#### Parameters

##### handler

(`selectedPath`) => `void`

Callback function receiving the selected path(s), or `null` if cancelled.

#### Returns

[`Disposable`](../../index.md#disposable)

A disposable object to unregister the listener.

***

### onDidCloseOutputChannel()

> **onDidCloseOutputChannel**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/output.d.ts:57

Fired when an output channel is disposed/closed.

#### Parameters

##### handler

(`channelName`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### onDidCloseTab()

> **onDidCloseTab**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/tab.d.ts:94

Fired when a tab is closed.

#### Parameters

##### handler

(`tabId`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### onDidCloseTerminal()

> **onDidCloseTerminal**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/terminal.d.ts:93

Fires an event callback handler tracing historical instance context structures right as closures execute.

#### Parameters

##### handler

(`terminal`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### onDidOpenFilePicker()

> **onDidOpenFilePicker**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/filePicker.d.ts:86

Fired when the file/folder picker dialog is opened.
*

#### Parameters

##### handler

(`options`) => `void`

Callback function receiving the `PickerOptions` used to open the dialog.

#### Returns

[`Disposable`](../../index.md#disposable)

A disposable object to unregister the listener.

***

### onDidOpenOutputChannel()

> **onDidOpenOutputChannel**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/output.d.ts:54

Fired when a new output channel is created.

#### Parameters

##### handler

(`channelName`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### onDidOpenTab()

> **onDidOpenTab**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/tab.d.ts:91

Fired immediately after a new tab is opened.

#### Parameters

##### handler

(`tab`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### onDidOpenTerminal()

> **onDidOpenTerminal**(`handler`): [`Disposable`](../../index.md#disposable)

Defined in: modules/window/terminal.d.ts:90

Fires an event callback handler whenever a new terminal tab container gets created.

#### Parameters

##### handler

(`terminal`) => `void`

#### Returns

[`Disposable`](../../index.md#disposable)

***

### openTab()

> **openTab**(`tabOptions`): `void`

Defined in: modules/window/tab.d.ts:64

Opens a new tab or switches focus to it if it is already open.
*

#### Parameters

##### tabOptions

[`TabOptions`](../../../../modules/window/tab.md#taboptions)

Configuration for the tab. Must include 'id', 'title', and 'type'.
*

#### Returns

`void`

#### Example

```ts
mscode.window.openTab({ 
id: '/src/main.js', 
title: 'main.js', 
type: 'code', 
filePath: '/src/main.js' 
});
```

***

### registerCustomTab()

> **registerCustomTab**(`type`, `component`): `object`

Defined in: modules/window/tab.d.ts:86

Registers a custom React component to render for a specific tab type.

#### Parameters

##### type

`string`

The unique identifier for this tab type.

##### component

`any`

The React component.

#### Returns

`object`

##### dispose

> **dispose**: () => `void`

###### Returns

`void`

***

### showConfirmation()

> **showConfirmation**(`title`, `message`, `actions`): `string`

Defined in: modules/window/notification.d.ts:64

Shows a confirmation dialogue with custom action buttons.

#### Parameters

##### title

`string`

##### message

`string`

##### actions

[`NotificationAction`](../../../../modules/window/notification.md#notificationaction)[]

#### Returns

`string`

***

### showErrorMessage()

> **showErrorMessage**(`message`, `fullMessage?`): `string`

Defined in: modules/window/notification.d.ts:58

Shows an error message notification (VS Code Compatible).

#### Parameters

##### message

`string`

##### fullMessage?

`string`

#### Returns

`string`

***

### showInformationMessage()

#### Call Signature

> **showInformationMessage**(`message`, ...`items`): `string`

Defined in: modules/window/notification.d.ts:54

Shows an information message notification (VS Code Compatible).

##### Parameters

###### message

`string`

###### items

...`string`[]

##### Returns

`string`

#### Call Signature

> **showInformationMessage**(`message`, ...`items`): `string`

Defined in: modules/window/notification.d.ts:55

Shows an information message notification (VS Code Compatible).

##### Parameters

###### message

`string`

###### items

...[`NotificationAction`](../../../../modules/window/notification.md#notificationaction)[]

##### Returns

`string`

***

### showInputBox()

> **showInputBox**(`options?`): `Promise`\<`string` \| `undefined`\>

Defined in: modules/window/quickPick.d.ts:100

Shows an input box to the user using the Command Palette UI.
*

#### Parameters

##### options?

[`InputBoxOptions`](../../../../modules/window/quickPick.md#inputboxoptions)

Configuration options for the InputBox.

#### Returns

`Promise`\<`string` \| `undefined`\>

A promise that resolves to the typed string, or `undefined` if the user cancels.
*

#### Example

```ts
const name = await mscode.window.showInputBox({ placeHolder: 'Enter file name' });
if (name) console.log('User typed:', name);
```

***

### showModalDialog()

> **showModalDialog**(`options`): `Promise`\<`string` \| `null`\>

Defined in: modules/window/modal.d.ts:41

Displays a modal dialog and returns a promise that resolves when the user interacts with it.
*

#### Parameters

##### options

[`ModalOptions`](../../../../modules/window/modal.md#modaloptions)

Configuration for the modal (title, message, buttons, etc.).

#### Returns

`Promise`\<`string` \| `null`\>

A promise resolving to the string value of the clicked button or `null` if dismissed.
*

#### Example

```ts
const response = await window.showModalDialog({
title: "Delete File",
message: "Are you sure you want to permanently delete this file?",
iconName: "warning",
buttons: ["Delete", "Cancel"]
});
* if (response === "Delete") {
// Execute delete logic
}
```

***

### showOpenDialog()

#### Call Signature

> **showOpenDialog**(`options`): `Promise`\<`string` \| `null`\>

Defined in: modules/window/filePicker.d.ts:72

Shows a file, folder, or save-as dialog to the user.
*

##### Parameters

###### options

[`PickerOptions`](../../../../modules/window/filePicker.md#pickeroptions)

Configuration for the picker (e.g., mode, title, filters).

##### Returns

`Promise`\<`string` \| `null`\>

A promise that resolves to the selected path as a string, or `null` if cancelled.
*

##### Example

```ts
const selectedPath = await mscode.window.showOpenDialog({
mode: 'file',
title: 'Select a config file',
filters: [{ label: 'JSON Files', extensions: ['json'] }]
});
```

#### Call Signature

> **showOpenDialog**(`options`): `Promise`\<`string`[] \| `null`\>

Defined in: modules/window/filePicker.d.ts:79

Shows a file picker dialog that allows selecting multiple files.
*

##### Parameters

###### options

[`MultiPickerOptions`](../../../../modules/window/filePicker.md#multipickeroptions)

Configuration for the multi-picker.

##### Returns

`Promise`\<`string`[] \| `null`\>

A promise that resolves to an array of selected file paths, or `null` if cancelled.

***

### showQuickPick()

> **showQuickPick**(`items`, `options?`): `Promise`\<[`QuickPickItem`](../../../../modules/window/quickPick.md#quickpickitem) \| `undefined`\>

Defined in: modules/window/quickPick.d.ts:87

Shows a selection list to the user using the Command Palette UI.
*

#### Parameters

##### items

[`QuickPickItem`](../../../../modules/window/quickPick.md#quickpickitem)[] \| ((`query`) => [`QuickPickItem`](../../../../modules/window/quickPick.md#quickpickitem)[])

An array of items, or a function that dynamically returns items based on the user's search query.

##### options?

[`QuickPickOptions`](../../../../modules/window/quickPick.md#quickpickoptions)

Configuration options for the QuickPick.

#### Returns

`Promise`\<[`QuickPickItem`](../../../../modules/window/quickPick.md#quickpickitem) \| `undefined`\>

A promise that resolves to the selected item, or `undefined` if the user cancels.
*

#### Example

```ts
const selected = await mscode.window.showQuickPick([
{ id: '1', label: 'Create File', leftIcon: 'new-file' },
{ id: '2', label: 'Delete File', leftIcon: 'trash' }
], { placeHolder: 'Select an action...' });
```

***

### withProgress()

> **withProgress**(`title`, `message`): [`ProgressNotification`](../../../../modules/window/notification.md#progressnotification)

Defined in: modules/window/notification.d.ts:61

Shows a progress notification (VS Code Compatible).

#### Parameters

##### title

`string`

##### message

`string`

#### Returns

[`ProgressNotification`](../../../../modules/window/notification.md#progressnotification)
