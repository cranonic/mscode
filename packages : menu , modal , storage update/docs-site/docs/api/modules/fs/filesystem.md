# modules/fs/filesystem

## Interfaces

### CopyOptions

Defined in: modules/fs/filesystem.d.ts:23

#### Properties

##### overwrite?

> `optional` **overwrite?**: `boolean`

Defined in: modules/fs/filesystem.d.ts:25

Overwrite the destination if it already exists.

###### Default

```ts
true
```

***

### FileStat

Defined in: modules/fs/filesystem.d.ts:9

Normalized directory snapshot metadata record.
Represents standard file or folder attributes returned during traversal passes.

#### Properties

##### isDirectory

> **isDirectory**: `boolean`

Defined in: modules/fs/filesystem.d.ts:15

Flags whether the current node represents a container directory layout branch.

##### name

> **name**: `string`

Defined in: modules/fs/filesystem.d.ts:11

The natural name of the node including extensions (e.g., 'index.tsx' or 'styles').

##### path

> **path**: `string`

Defined in: modules/fs/filesystem.d.ts:13

Complete absolute canonical layout path target (e.g., '/sdcard/project/index.tsx').

***

### FileSystemAPI

Defined in: modules/fs/filesystem.d.ts:32

Primary Core File System API.
Gives extensions platform-agnostic access to read, write, and manipulate the workspace file system.

#### Methods

##### copy()

> **copy**(`fromPath`, `toPath`, `options?`): `Promise`\<`void`\>

Defined in: modules/fs/filesystem.d.ts:84

Recursively copies a file or directory.
Safely clones non-empty directories along with their child contents.

###### Parameters

###### fromPath

`string`

###### toPath

`string`

###### options?

[`CopyOptions`](#copyoptions)

###### Returns

`Promise`\<`void`\>

##### delete()

> **delete**(`path`): `Promise`\<`void`\>

Defined in: modules/fs/filesystem.d.ts:90

Recursively deletes a file or directory.
Silently succeeds when the path does not exist to avoid strict disruption.

###### Parameters

###### path

`string`

###### Returns

`Promise`\<`void`\>

##### exists()

> **exists**(`path`): `Promise`\<`boolean`\>

Defined in: modules/fs/filesystem.d.ts:99

Checks whether a path currently exists (can be a file or a directory).
*

###### Parameters

###### path

`string`

###### Returns

`Promise`\<`boolean`\>

###### Example

```ts
if (await mscode.fs.exists('/sdcard/project/.git')) {
// Git repository detected
}
```

##### mkdir()

> **mkdir**(`path`): `Promise`\<`void`\>

Defined in: modules/fs/filesystem.d.ts:71

Creates a directory (and any missing parent chains automatically).

###### Parameters

###### path

`string`

###### Returns

`Promise`\<`void`\>

##### readDir()

> **readDir**(`path`): `Promise`\<[`FileStat`](#filestat)[]\>

Defined in: modules/fs/filesystem.d.ts:40

Lists the entries inside a directory.
Returns an empty array (never throws) when the path does not exist.
*

###### Parameters

###### path

`string`

###### Returns

`Promise`\<[`FileStat`](#filestat)[]\>

###### Example

```ts
const entries = await mscode.fs.readDir('/sdcard/project/src');
const tsFiles = entries.filter(e => !e.isDirectory && e.name.endsWith('.ts'));
```

##### readFile()

> **readFile**(`path`): `Promise`\<`string`\>

Defined in: modules/fs/filesystem.d.ts:48

Reads a file's content.
Returns raw UTF-8 string for code files, and a Base64 encoded string for binary/image files.
*

###### Parameters

###### path

`string`

###### Returns

`Promise`\<`string`\>

###### Example

```ts
const json = await mscode.fs.readFile('/sdcard/project/package.json');
```

##### readJson()

> **readJson**\<`T`\>(`path`): `Promise`\<`T`\>

Defined in: modules/fs/filesystem.d.ts:54

Reads a file and parses it as JSON securely in one step.
Throws a descriptive error when the file is missing or malformed.

###### Type Parameters

###### T

`T` = `unknown`

###### Parameters

###### path

`string`

###### Returns

`Promise`\<`T`\>

##### rename()

> **rename**(`oldPath`, `newPath`): `Promise`\<`void`\>

Defined in: modules/fs/filesystem.d.ts:78

Renames or moves a file or directory.
*

###### Parameters

###### oldPath

`string`

###### newPath

`string`

###### Returns

`Promise`\<`void`\>

###### Example

```ts
await mscode.fs.rename('/sdcard/old.ts', '/sdcard/new.ts');
```

##### stat()

> **stat**(`path`): `Promise`\<[`FileStat`](#filestat) \| `null`\>

Defined in: modules/fs/filesystem.d.ts:105

Returns basic metadata for a path without reading its full memory content.
Returns `null` when the targeted path does not exist.

###### Parameters

###### path

`string`

###### Returns

`Promise`\<[`FileStat`](#filestat) \| `null`\>

##### walk()

> **walk**(`dirPath`): `Promise`\<`string`[]\>

Defined in: modules/fs/filesystem.d.ts:111

Recursively lists ALL files under a directory (directories themselves are excluded).
Extremely useful for deep workspace searches or building syntax indexing trees.

###### Parameters

###### dirPath

`string`

###### Returns

`Promise`\<`string`[]\>

##### writeFile()

> **writeFile**(`path`, `content`, `options?`): `Promise`\<`void`\>

Defined in: modules/fs/filesystem.d.ts:61

Writes (or overwrites) a file. Parent directories are created automatically.
*

###### Parameters

###### path

`string`

Absolute target file path.

###### content

`string`

Raw string or Base64 (for binary files) to save.

###### options?

[`WriteOptions`](#writeoptions)

###### Returns

`Promise`\<`void`\>

##### writeJson()

> **writeJson**(`path`, `value`, `indent?`): `Promise`\<`void`\>

Defined in: modules/fs/filesystem.d.ts:66

Serializes a JavaScript value to JSON and writes it to a file securely.

###### Parameters

###### path

`string`

###### value

`unknown`

###### indent?

`number`

###### Returns

`Promise`\<`void`\>

***

### WriteOptions

Defined in: modules/fs/filesystem.d.ts:18

#### Properties

##### recursive?

> `optional` **recursive?**: `boolean`

Defined in: modules/fs/filesystem.d.ts:20

Create intermediate directories if they do not exist.

###### Default

```ts
true
```

## Variables

### fs

> `const` **fs**: [`FileSystemAPI`](#filesystemapi)

Defined in: modules/fs/filesystem.d.ts:115

## References

### ActivityBarItemOptions

Re-exports [ActivityBarItemOptions](../window/activityBar.md#activitybaritemoptions)

***

### app

Re-exports [app](../app/app/namespaces/app.md)

***

### authentication

Re-exports [authentication](../authentication/authentication/namespaces/authentication.md)

***

### BookmarkFolder

Re-exports [BookmarkFolder](../workspace/recent.md#bookmarkfolder)

***

### CommandMetadata

Re-exports [CommandMetadata](../commands/commands/index.md#commandmetadata)

***

### commands

Re-exports [commands](../commands/commands/namespaces/commands.md)

***

### CommitOptions

Re-exports [CommitOptions](../git/git/index.md#commitoptions)

***

### ConfigurationProperty

Re-exports [ConfigurationProperty](../workspace/configuration.md#configurationproperty)

***

### Diagnostic

Re-exports [Diagnostic](../languages/diagnostics.md#diagnostic)

***

### DiagnosticCollection

Re-exports [DiagnosticCollection](../languages/diagnostics.md#diagnosticcollection)

***

### DiagnosticSeverity

Re-exports [DiagnosticSeverity](../languages/diagnostics.md#diagnosticseverity)

***

### Disposable

Re-exports [Disposable](../../core/globals/index.md#disposable)

***

### DocumentSymbol

Re-exports [DocumentSymbol](../languages/symbols.md#documentsymbol)

***

### ExtensionContext

Re-exports [ExtensionContext](../../core/globals/index.md#extensioncontext)

***

### ExtensionInfo

Re-exports [ExtensionInfo](../extensions/extensions/index.md#extensioninfo)

***

### extensions

Re-exports [extensions](../extensions/extensions/namespaces/extensions.md)

***

### FileDecoration

Re-exports [FileDecoration](../window/fileDecorations.md#filedecoration)

***

### FileFilter

Re-exports [FileFilter](../window/filePicker.md#filefilter)

***

### FindOptions

Re-exports [FindOptions](../search/search/index.md#findoptions)

***

### git

Re-exports [git](../git/git/namespaces/git/index.md)

***

### GitBranch

Re-exports [GitBranch](../git/git/index.md#gitbranch)

***

### GitChangedFile

Re-exports [GitChangedFile](../git/git/index.md#gitchangedfile)

***

### GitCommit

Re-exports [GitCommit](../git/git/index.md#gitcommit)

***

### GitFileStatus

Re-exports [GitFileStatus](../git/git/index.md#gitfilestatus)

***

### GitHubUser

Re-exports [GitHubUser](../authentication/authentication/index.md#githubuser)

***

### GitRepository

Re-exports [GitRepository](../git/git/index.md#gitrepository)

***

### GitSortMode

Re-exports [GitSortMode](../git/git/index.md#gitsortmode)

***

### GitStash

Re-exports [GitStash](../git/git/index.md#gitstash)

***

### IConfigurationSection

Re-exports [IConfigurationSection](../workspace/configuration.md#iconfigurationsection)

***

### IconThemeDefinition

Re-exports [IconThemeDefinition](../themes/themes/index.md#iconthemedefinition)

***

### IconThemeMap

Re-exports [IconThemeMap](../themes/themes/index.md#iconthememap)

***

### InputBoxOptions

Re-exports [InputBoxOptions](../window/quickPick.md#inputboxoptions)

***

### languages

Re-exports [languages](../../core/globals/namespaces/languages.md)

***

### lsp

Re-exports [lsp](../lsp/lsp/namespaces/lsp.md)

***

### LspServerConfig

Re-exports [LspServerConfig](../lsp/lsp/index.md#lspserverconfig)

***

### MenuItem

Re-exports [MenuItem](../menus/menus/index.md#menuitem)

***

### menus

Re-exports [menus](../menus/menus/namespaces/menus.md)

***

### ModalOptions

Re-exports [ModalOptions](../window/modal.md#modaloptions)

***

### MSCodeUIColors

Re-exports [MSCodeUIColors](../themes/themes/index.md#mscodeuicolors)

***

### MultiPickerOptions

Re-exports [MultiPickerOptions](../window/filePicker.md#multipickeroptions)

***

### NotificationAction

Re-exports [NotificationAction](../window/notification.md#notificationaction)

***

### OutputChannel

Re-exports [OutputChannel](../window/output.md#outputchannel)

***

### PickerOptions

Re-exports [PickerOptions](../window/filePicker.md#pickeroptions)

***

### Position

Re-exports [Position](../window/editor.md#position)

***

### ProgressNotification

Re-exports [ProgressNotification](../window/notification.md#progressnotification)

***

### QuickPickItem

Re-exports [QuickPickItem](../window/quickPick.md#quickpickitem)

***

### QuickPickOptions

Re-exports [QuickPickOptions](../window/quickPick.md#quickpickoptions)

***

### RecentWorkspace

Re-exports [RecentWorkspace](../workspace/recent.md#recentworkspace)

***

### ReplaceOptions

Re-exports [ReplaceOptions](../search/search/index.md#replaceoptions)

***

### ResolvedIcon

Re-exports [ResolvedIcon](../themes/themes/index.md#resolvedicon)

***

### search

Re-exports [search](../search/search/namespaces/search.md)

***

### SearchFileResult

Re-exports [SearchFileResult](../search/search/index.md#searchfileresult)

***

### SearchMatch

Re-exports [SearchMatch](../search/search/index.md#searchmatch)

***

### Selection

Re-exports [Selection](../window/editor.md#selection)

***

### SettingOption

Re-exports [SettingOption](../workspace/configuration.md#settingoption)

***

### SettingType

Re-exports [SettingType](../workspace/configuration.md#settingtype)

***

### SidebarPanelDef

Re-exports [SidebarPanelDef](../window/sidebar.md#sidebarpaneldef)

***

### SidebarPanelHeader

Re-exports [SidebarPanelHeader](../window/sidebar.md#sidebarpanelheader)

***

### SidebarSectionContent

Re-exports [SidebarSectionContent](../window/sidebar.md#sidebarsectioncontent)

***

### SidebarSectionContext

Re-exports [SidebarSectionContext](../window/sidebar.md#sidebarsectioncontext)

***

### SidebarSectionDef

Re-exports [SidebarSectionDef](../window/sidebar.md#sidebarsectiondef)

***

### SidebarState

Re-exports [SidebarState](../window/sidebar.md#sidebarstate)

***

### SilentSearchOptions

Re-exports [SilentSearchOptions](../search/search/index.md#silentsearchoptions)

***

### StashOptions

Re-exports [StashOptions](../git/git/index.md#stashoptions)

***

### StatusBarAlignment

Re-exports [StatusBarAlignment](../window/statusBar.md#statusbaralignment)

***

### StatusBarItemController

Re-exports [StatusBarItemController](../window/statusBar.md#statusbaritemcontroller)

***

### StatusBarItemOptions

Re-exports [StatusBarItemOptions](../window/statusBar.md#statusbaritemoptions)

***

### SymbolKind

Re-exports [SymbolKind](../languages/symbols.md#symbolkind)

***

### SymbolProvider

Re-exports [SymbolProvider](../languages/symbols.md#symbolprovider)

***

### Tab

Re-exports [Tab](../window/tab.md#tab)

***

### TabDiffData

Re-exports [TabDiffData](../window/tab.md#tabdiffdata-1)

***

### TabOptions

Re-exports [TabOptions](../window/tab.md#taboptions)

***

### TabType

Re-exports [TabType](../window/tab.md#tabtype-1)

***

### TaskExecution

Re-exports [TaskExecution](../tasks/tasks/index.md#taskexecution)

***

### TaskOptions

Re-exports [TaskOptions](../tasks/tasks/index.md#taskoptions)

***

### tasks

Re-exports [tasks](../tasks/tasks/namespaces/tasks.md)

***

### Terminal

Re-exports [Terminal](../window/terminal.md#terminal)

***

### TerminalExitStatus

Re-exports [TerminalExitStatus](../window/terminal.md#terminalexitstatus-1)

***

### TerminalOptions

Re-exports [TerminalOptions](../window/terminal.md#terminaloptions)

***

### termis

Re-exports [termis](../termis/termis/namespaces/termis.md)

***

### TermisView

Re-exports [TermisView](../termis/termis/index.md#termisview)

***

### TextDocument

Re-exports [TextDocument](../window/editor.md#textdocument)

***

### TextEditor

Re-exports [TextEditor](../window/editor.md#texteditor)

***

### TextEditorEdit

Re-exports [TextEditorEdit](../window/editor.md#texteditoredit-1)

***

### TextEditorOptions

Re-exports [TextEditorOptions](../window/editor.md#texteditoroptions-1)

***

### ThemeDefinition

Re-exports [ThemeDefinition](../themes/themes/index.md#themedefinition)

***

### themes

Re-exports [themes](../themes/themes/namespaces/themes/index.md)

***

### TokenColor

Re-exports [TokenColor](../themes/themes/index.md#tokencolor)

***

### TreeDataProvider

Re-exports [TreeDataProvider](../window/treeView.md#treedataprovider)

***

### TreeItem

Re-exports [TreeItem](../window/treeView.md#treeitem)

***

### TreeView

Re-exports [TreeView](../window/treeView.md#treeview)

***

### TreeViewOptions

Re-exports [TreeViewOptions](../window/treeView.md#treeviewoptions)

***

### window

Re-exports [window](../../core/globals/namespaces/window/index.md)

***

### workspace

Re-exports [workspace](../../core/globals/namespaces/workspace.md)

***

### WorkspaceConfiguration

Re-exports [WorkspaceConfiguration](../workspace/configuration.md#workspaceconfiguration)

***

### WorkspaceFolder

Re-exports [WorkspaceFolder](../workspace/workspace.md#workspacefolder)
