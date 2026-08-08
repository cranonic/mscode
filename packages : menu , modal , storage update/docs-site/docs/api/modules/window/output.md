# modules/window/output

## Interfaces

### OutputChannel

Defined in: modules/window/output.d.ts:8

Represents an isolated channel for logging output data.

#### Properties

##### name

> `readonly` **name**: `string`

Defined in: modules/window/output.d.ts:10

The display name of the output channel.

#### Methods

##### append()

> **append**(`value`): `void`

Defined in: modules/window/output.d.ts:13

Appends text without a trailing newline.

###### Parameters

###### value

`string`

###### Returns

`void`

##### appendLine()

> **appendLine**(`value`): `void`

Defined in: modules/window/output.d.ts:16

Appends text with a trailing newline.

###### Parameters

###### value

`string`

###### Returns

`void`

##### clear()

> **clear**(): `void`

Defined in: modules/window/output.d.ts:19

Clears all logged data from the channel.

###### Returns

`void`

##### clearKillHandler()

> **clearKillHandler**(): `void`

Defined in: modules/window/output.d.ts:31

Removes the active kill handler.

###### Returns

`void`

##### dispose()

> **dispose**(): `void`

Defined in: modules/window/output.d.ts:25

Disposes and completely removes the channel from the IDE.

###### Returns

`void`

##### onDidKill()

> **onDidKill**(`handler`): `void`

Defined in: modules/window/output.d.ts:28

Registers a callback that fires when the user clicks the 'Kill/Stop' button on this channel.

###### Parameters

###### handler

() => `void`

###### Returns

`void`

##### show()

> **show**(): `void`

Defined in: modules/window/output.d.ts:22

Opens the output panel and switches to this specific channel.

###### Returns

`void`

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
