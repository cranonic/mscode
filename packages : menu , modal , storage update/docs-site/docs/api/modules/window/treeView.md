# modules/window/treeView

## Interfaces

### TreeDataProvider

Defined in: modules/window/treeView.d.ts:41

Dynamic data-source abstraction layer feeding nested labels, icons, badges, 
and async child streams to the UI.

#### Properties

##### onItemClick?

> `optional` **onItemClick?**: (`item`) => `void`

Defined in: modules/window/treeView.d.ts:51

Optional: Triggered when the user clicks on a tree item.

###### Parameters

###### item

[`TreeItem`](#treeitem)

The item that was clicked.

###### Returns

`void`

#### Methods

##### getChildren()

> **getChildren**(`element?`): `Promise`\<[`TreeItem`](#treeitem)[]\>

Defined in: modules/window/treeView.d.ts:46

Called to get root items (if element is undefined) or children of a specific item.

###### Parameters

###### element?

[`TreeItem`](#treeitem)

The parent item, or undefined if requesting the root elements.

###### Returns

`Promise`\<[`TreeItem`](#treeitem)[]\>

A promise resolving to an array of TreeItems.

***

### TreeItem

Defined in: modules/window/treeView.d.ts:8

Represents an individual node within a custom Tree View.

#### Properties

##### badge?

> `optional` **badge?**: `string`

Defined in: modules/window/treeView.d.ts:22

Small text badge (e.g., '3', 'M') displayed at the end of the row.

##### badgeColor?

> `optional` **badgeColor?**: `string`

Defined in: modules/window/treeView.d.ts:25

CSS color for the badge (e.g., '#ff0000', 'var(--ms-error)').

##### collapsibleState

> **collapsibleState**: `"none"` \| `"expanded"` \| `"collapsed"`

Defined in: modules/window/treeView.d.ts:31

Dictates whether this node has children and its initial visual state.

##### contextValue?

> `optional` **contextValue?**: `string`

Defined in: modules/window/treeView.d.ts:34

Context value used for registering right-click context menus later.

##### description?

> `optional` **description?**: `string`

Defined in: modules/window/treeView.d.ts:16

Dimmed text displayed after the label.

##### icon?

> `optional` **icon?**: `string`

Defined in: modules/window/treeView.d.ts:19

Icon name (matches your IconRegistry) to display alongside the item.

##### id

> **id**: `string`

Defined in: modules/window/treeView.d.ts:10

Unique identifier for the item.

##### label

> **label**: `string`

Defined in: modules/window/treeView.d.ts:13

Primary text displayed for the node.

##### tooltip?

> `optional` **tooltip?**: `string`

Defined in: modules/window/treeView.d.ts:28

Tooltip displayed when the user hovers over the item.

***

### TreeView

Defined in: modules/window/treeView.d.ts:69

Handle contract returned to extensions when instantiating a custom tree interface.
Exposes standard lifecycle modifiers allowing plugins to dynamically control states.

#### Properties

##### id

> `readonly` **id**: `string`

Defined in: modules/window/treeView.d.ts:71

The unique channel identifier matching this structural panel slot.

##### title

> **title**: `string`

Defined in: modules/window/treeView.d.ts:74

Title text rendered dynamically inside the sidebar container panel wrapper.

#### Methods

##### dispose()

> **dispose**(): `void`

Defined in: modules/window/treeView.d.ts:77

Safe destructor sequence removing this tree container context immediately from the core system state.

###### Returns

`void`

***

### TreeViewOptions

Defined in: modules/window/treeView.d.ts:57

Metadata configuration settings supplied by extensions during custom Tree initialization.

#### Properties

##### title?

> `optional` **title?**: `string`

Defined in: modules/window/treeView.d.ts:62

Natural text caption rendered visible to users inside the sidebar header.

##### treeDataProvider

> **treeDataProvider**: [`TreeDataProvider`](#treedataprovider)

Defined in: modules/window/treeView.d.ts:59

The data provider that supplies the tree data.

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
