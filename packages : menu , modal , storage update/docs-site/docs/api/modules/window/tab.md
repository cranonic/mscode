# modules/window/tab

## Interfaces

### Tab

Defined in: modules/window/tab.d.ts:17

Defines the schema for a workspace tab.

#### Properties

##### diffData?

> `optional` **diffData?**: [`TabDiffData`](#tabdiffdata-1)

Defined in: modules/window/tab.d.ts:35

Configuration for diff views (Split Editor).

##### filePath?

> `optional` **filePath?**: `string`

Defined in: modules/window/tab.d.ts:25

The underlying file path, if applicable.

##### icon?

> `optional` **icon?**: `string`

Defined in: modules/window/tab.d.ts:27

Codicon name to display next to the tab title.

##### id

> **id**: `string`

Defined in: modules/window/tab.d.ts:19

Unique identifier for the tab (usually the file path).

##### showBreadcrumb?

> `optional` **showBreadcrumb?**: `boolean`

Defined in: modules/window/tab.d.ts:33

Whether to show the breadcrumb navigation.

##### showQuickBar?

> `optional` **showQuickBar?**: `boolean`

Defined in: modules/window/tab.d.ts:29

Whether to show the editor's quick action bar.

##### showStatusBar?

> `optional` **showStatusBar?**: `boolean`

Defined in: modules/window/tab.d.ts:31

Whether to show the bottom status bar for this tab.

##### title

> **title**: `string`

Defined in: modules/window/tab.d.ts:23

The display name of the tab.

##### type

> **type**: `string`

Defined in: modules/window/tab.d.ts:21

The fundamental type/category of the tab.

***

### TabDiffData

Defined in: modules/window/tab.d.ts:5

#### Properties

##### filePath

> **filePath**: `string`

Defined in: modules/window/tab.d.ts:9

##### modifiedContent

> **modifiedContent**: `string` \| `null`

Defined in: modules/window/tab.d.ts:7

##### originalContent

> **originalContent**: `string`

Defined in: modules/window/tab.d.ts:6

##### readOnly

> **readOnly**: `boolean`

Defined in: modules/window/tab.d.ts:8

***

### TabOptions

Defined in: modules/window/tab.d.ts:39

Configuration required to open a new tab.

#### Extends

- `Partial`\<[`Tab`](#tab)\>

#### Properties

##### diffData?

> `optional` **diffData?**: [`TabDiffData`](#tabdiffdata-1)

Defined in: modules/window/tab.d.ts:35

Configuration for diff views (Split Editor).

###### Inherited from

[`Tab`](#tab).[`diffData`](#diffdata)

##### filePath?

> `optional` **filePath?**: `string`

Defined in: modules/window/tab.d.ts:25

The underlying file path, if applicable.

###### Inherited from

[`Tab`](#tab).[`filePath`](#filepath)

##### icon?

> `optional` **icon?**: `string`

Defined in: modules/window/tab.d.ts:27

Codicon name to display next to the tab title.

###### Inherited from

[`Tab`](#tab).[`icon`](#icon)

##### id

> **id**: `string`

Defined in: modules/window/tab.d.ts:40

Unique identifier for the tab (usually the file path).

###### Overrides

[`Tab`](#tab).[`id`](#id)

##### showBreadcrumb?

> `optional` **showBreadcrumb?**: `boolean`

Defined in: modules/window/tab.d.ts:33

Whether to show the breadcrumb navigation.

###### Inherited from

[`Tab`](#tab).[`showBreadcrumb`](#showbreadcrumb)

##### showQuickBar?

> `optional` **showQuickBar?**: `boolean`

Defined in: modules/window/tab.d.ts:29

Whether to show the editor's quick action bar.

###### Inherited from

[`Tab`](#tab).[`showQuickBar`](#showquickbar)

##### showStatusBar?

> `optional` **showStatusBar?**: `boolean`

Defined in: modules/window/tab.d.ts:31

Whether to show the bottom status bar for this tab.

###### Inherited from

[`Tab`](#tab).[`showStatusBar`](#showstatusbar)

##### title

> **title**: `string`

Defined in: modules/window/tab.d.ts:41

The display name of the tab.

###### Overrides

[`Tab`](#tab).[`title`](#title)

##### type

> **type**: `string`

Defined in: modules/window/tab.d.ts:42

The fundamental type/category of the tab.

###### Overrides

[`Tab`](#tab).[`type`](#type)

## Type Aliases

### TabType

> **TabType** = `"code"` \| `"extension"` \| `"page"` \| `"settings"` \| `"image"` \| `"welcome"` \| `"termis"` \| `"keybindings"` \| `"diff"` \| `"custom"` \| `string`

Defined in: modules/window/tab.d.ts:12

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

### Position

Re-exports [Position](editor.md#position)

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

### Selection

Re-exports [Selection](editor.md#selection)

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

### TextDocument

Re-exports [TextDocument](editor.md#textdocument)

***

### TextEditor

Re-exports [TextEditor](editor.md#texteditor)

***

### TextEditorEdit

Re-exports [TextEditorEdit](editor.md#texteditoredit-1)

***

### TextEditorOptions

Re-exports [TextEditorOptions](editor.md#texteditoroptions-1)

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
