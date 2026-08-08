# modules/window/editor

## Interfaces

### Position

Defined in: modules/window/editor.d.ts:7

#### Properties

##### character

> **character**: `number`

Defined in: modules/window/editor.d.ts:11

The 1-based character/column value.

##### line

> **line**: `number`

Defined in: modules/window/editor.d.ts:9

The 1-based line value.

***

### Selection

Defined in: modules/window/editor.d.ts:14

#### Properties

##### end

> **end**: [`Position`](#position)

Defined in: modules/window/editor.d.ts:18

The end position of the selection.

##### start

> **start**: [`Position`](#position)

Defined in: modules/window/editor.d.ts:16

The start position of the selection.

***

### TextDocument

Defined in: modules/window/editor.d.ts:21

#### Properties

##### fileName

> `readonly` **fileName**: `string`

Defined in: modules/window/editor.d.ts:25

The file name without the path (e.g., 'main.js').

##### languageId

> `readonly` **languageId**: `string`

Defined in: modules/window/editor.d.ts:27

The identifier of the language associated with this document (e.g., 'javascript').

##### uri

> `readonly` **uri**: `string`

Defined in: modules/window/editor.d.ts:23

The associated URI for this document (e.g., 'file:///src/main.js').

#### Methods

##### getText()

> **getText**(): `string`

Defined in: modules/window/editor.d.ts:33

Retrieves the complete text content of this document.

###### Returns

`string`

The text of this document as a string.

***

### TextEditor

Defined in: modules/window/editor.d.ts:71

Represents an active text editor in Mono Studio.
Gives access to the document content, cursor selection, and safe editing methods.

#### Properties

##### \_rawMonacoEditor

> `readonly` **\_rawMonacoEditor**: `any`

Defined in: modules/window/editor.d.ts:109

⚠️ ADVANCED / ESCAPE HATCH: Returns the raw underlying Monaco Editor instance.
Modifying the editor directly may bypass internal MS Code event listeners and cause memory leaks.
Use this ONLY when you need to access advanced native Monaco APIs (like decorations or widgets).

###### Example

```ts
const editor = mscode.window.activeTextEditor;
const monacoInstance = editor._rawMonacoEditor;
if (monacoInstance) {
   monacoInstance.focus();
}
```

##### cursor

> `readonly` **cursor**: `object`

Defined in: modules/window/editor.d.ts:77

The current cursor position (1-based index).

###### column

> **column**: `number`

###### line

> **line**: `number`

##### document

> `readonly` **document**: [`TextDocument`](#textdocument)

Defined in: modules/window/editor.d.ts:73

The document associated with this text editor.

##### options

> `readonly` **options**: [`TextEditorOptions`](#texteditoroptions-1)

Defined in: modules/window/editor.d.ts:79

Text editor layout and indentation options.

##### selection

> `readonly` **selection**: [`Selection`](#selection) \| `null`

Defined in: modules/window/editor.d.ts:75

The primary selection on this text editor.

#### Methods

##### edit()

> **edit**(`callback`): `boolean`

Defined in: modules/window/editor.d.ts:95

Perform an edit on the document associated with this text editor.
The edits are safely pushed to the editor's undo/redo stack.

###### Parameters

###### callback

(`editBuilder`) => `void`

A function that receives an `editBuilder` to queue modifications.

###### Returns

`boolean`

`true` if the edit was successfully applied, `false` otherwise.

###### Example

```ts
const editor = mscode.window.activeTextEditor;
editor.edit((editBuilder) => {
  // Insert a console.log at line 1, column 1
  editBuilder.insert(1, 1, "console.log('Hello');\n");
});
```

***

### TextEditorEdit

Defined in: modules/window/editor.d.ts:47

A complex edit that will be applied in one transaction on a TextEditor.
This is passed to the callback of the `TextEditor.edit` method.

#### Methods

##### insert()

> **insert**(`line`, `column`, `text`): `void`

Defined in: modules/window/editor.d.ts:54

Insert text at a specific location.

###### Parameters

###### line

`number`

The 1-based line number.

###### column

`number`

The 1-based column number.

###### text

`string`

The text to insert.

###### Returns

`void`

##### replace()

> **replace**(`startLine`, `startCol`, `endLine`, `endCol`, `text`): `void`

Defined in: modules/window/editor.d.ts:64

Replace a certain text region with a new value.

###### Parameters

###### startLine

`number`

The 1-based start line number.

###### startCol

`number`

The 1-based start column number.

###### endLine

`number`

The 1-based end line number.

###### endCol

`number`

The 1-based end column number.

###### text

`string`

The new text to insert.

###### Returns

`void`

***

### TextEditorOptions

Defined in: modules/window/editor.d.ts:36

#### Properties

##### insertSpaces

> **insertSpaces**: `boolean`

Defined in: modules/window/editor.d.ts:40

Whether spaces should be used instead of tabs.

##### tabSize

> **tabSize**: `number`

Defined in: modules/window/editor.d.ts:38

The size in spaces a tab takes.

## References

### ActivityBarItemOptions

Re-exports [ActivityBarItemOptions](activityBar.md#activitybaritemoptions)

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

### CopyOptions

Re-exports [CopyOptions](../fs/filesystem.md#copyoptions)

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

Re-exports [FileDecoration](fileDecorations.md#filedecoration)

***

### FileFilter

Re-exports [FileFilter](filePicker.md#filefilter)

***

### FileStat

Re-exports [FileStat](../fs/filesystem.md#filestat)

***

### FileSystemAPI

Re-exports [FileSystemAPI](../fs/filesystem.md#filesystemapi)

***

### FindOptions

Re-exports [FindOptions](../search/search/index.md#findoptions)

***

### fs

Re-exports [fs](../fs/filesystem.md#fs)

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

Re-exports [InputBoxOptions](quickPick.md#inputboxoptions)

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

Re-exports [ModalOptions](modal.md#modaloptions)

***

### MSCodeUIColors

Re-exports [MSCodeUIColors](../themes/themes/index.md#mscodeuicolors)

***

### MultiPickerOptions

Re-exports [MultiPickerOptions](filePicker.md#multipickeroptions)

***

### NotificationAction

Re-exports [NotificationAction](notification.md#notificationaction)

***

### OutputChannel

Re-exports [OutputChannel](output.md#outputchannel)

***

### PickerOptions

Re-exports [PickerOptions](filePicker.md#pickeroptions)

***

### ProgressNotification

Re-exports [ProgressNotification](notification.md#progressnotification)

***

### QuickPickItem

Re-exports [QuickPickItem](quickPick.md#quickpickitem)

***

### QuickPickOptions

Re-exports [QuickPickOptions](quickPick.md#quickpickoptions)

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

### SettingOption

Re-exports [SettingOption](../workspace/configuration.md#settingoption)

***

### SettingType

Re-exports [SettingType](../workspace/configuration.md#settingtype)

***

### SidebarPanelDef

Re-exports [SidebarPanelDef](sidebar.md#sidebarpaneldef)

***

### SidebarPanelHeader

Re-exports [SidebarPanelHeader](sidebar.md#sidebarpanelheader)

***

### SidebarSectionContent

Re-exports [SidebarSectionContent](sidebar.md#sidebarsectioncontent)

***

### SidebarSectionContext

Re-exports [SidebarSectionContext](sidebar.md#sidebarsectioncontext)

***

### SidebarSectionDef

Re-exports [SidebarSectionDef](sidebar.md#sidebarsectiondef)

***

### SidebarState

Re-exports [SidebarState](sidebar.md#sidebarstate)

***

### SilentSearchOptions

Re-exports [SilentSearchOptions](../search/search/index.md#silentsearchoptions)

***

### StashOptions

Re-exports [StashOptions](../git/git/index.md#stashoptions)

***

### StatusBarAlignment

Re-exports [StatusBarAlignment](statusBar.md#statusbaralignment)

***

### StatusBarItemController

Re-exports [StatusBarItemController](statusBar.md#statusbaritemcontroller)

***

### StatusBarItemOptions

Re-exports [StatusBarItemOptions](statusBar.md#statusbaritemoptions)

***

### SymbolKind

Re-exports [SymbolKind](../languages/symbols.md#symbolkind)

***

### SymbolProvider

Re-exports [SymbolProvider](../languages/symbols.md#symbolprovider)

***

### Tab

Re-exports [Tab](tab.md#tab)

***

### TabDiffData

Re-exports [TabDiffData](tab.md#tabdiffdata-1)

***

### TabOptions

Re-exports [TabOptions](tab.md#taboptions)

***

### TabType

Re-exports [TabType](tab.md#tabtype-1)

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

Re-exports [Terminal](terminal.md#terminal)

***

### TerminalExitStatus

Re-exports [TerminalExitStatus](terminal.md#terminalexitstatus-1)

***

### TerminalOptions

Re-exports [TerminalOptions](terminal.md#terminaloptions)

***

### termis

Re-exports [termis](../termis/termis/namespaces/termis.md)

***

### TermisView

Re-exports [TermisView](../termis/termis/index.md#termisview)

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

Re-exports [TreeDataProvider](treeView.md#treedataprovider)

***

### TreeItem

Re-exports [TreeItem](treeView.md#treeitem)

***

### TreeView

Re-exports [TreeView](treeView.md#treeview)

***

### TreeViewOptions

Re-exports [TreeViewOptions](treeView.md#treeviewoptions)

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

***

### WriteOptions

Re-exports [WriteOptions](../fs/filesystem.md#writeoptions)
