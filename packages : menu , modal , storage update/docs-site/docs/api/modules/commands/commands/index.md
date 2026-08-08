# modules/commands/commands

## Namespaces

- [commands](namespaces/commands.md)

## Interfaces

### CommandMetadata

Defined in: modules/commands/commands.d.ts:8

Metadata defining how a command appears in the IDE's UI (e.g., Command Palette, Menus).

#### Properties

##### category?

> `optional` **category?**: `string`

Defined in: modules/commands/commands.d.ts:18

Grouping category shown in the Command Palette (e.g., 'File', 'Git').

##### icon?

> `optional` **icon?**: `string`

Defined in: modules/commands/commands.d.ts:21

Codicon name to display alongside the command in menus.

##### id

> **id**: `string`

Defined in: modules/commands/commands.d.ts:10

The unique identifier of the command (e.g., 'myExtension.sayHello').

##### shortcut?

> `optional` **shortcut?**: `string`

Defined in: modules/commands/commands.d.ts:24

Keyboard shortcut hint (e.g., 'Ctrl+Shift+B'). Used purely for visual display.

##### title?

> `optional` **title?**: `string`

Defined in: modules/commands/commands.d.ts:15

The human-readable title of the command. 
**Note:** If omitted, the command will NOT appear in the Command Palette.

## References

### ActivityBarItemOptions

Re-exports [ActivityBarItemOptions](../../window/activityBar.md#activitybaritemoptions)

***

### app

Re-exports [app](../../app/app/namespaces/app.md)

***

### authentication

Re-exports [authentication](../../authentication/authentication/namespaces/authentication.md)

***

### BookmarkFolder

Re-exports [BookmarkFolder](../../workspace/recent.md#bookmarkfolder)

***

### CommitOptions

Re-exports [CommitOptions](../../git/git/index.md#commitoptions)

***

### ConfigurationProperty

Re-exports [ConfigurationProperty](../../workspace/configuration.md#configurationproperty)

***

### CopyOptions

Re-exports [CopyOptions](../../fs/filesystem.md#copyoptions)

***

### Diagnostic

Re-exports [Diagnostic](../../languages/diagnostics.md#diagnostic)

***

### DiagnosticCollection

Re-exports [DiagnosticCollection](../../languages/diagnostics.md#diagnosticcollection)

***

### DiagnosticSeverity

Re-exports [DiagnosticSeverity](../../languages/diagnostics.md#diagnosticseverity)

***

### Disposable

Re-exports [Disposable](../../../core/globals/index.md#disposable)

***

### DocumentSymbol

Re-exports [DocumentSymbol](../../languages/symbols.md#documentsymbol)

***

### ExtensionContext

Re-exports [ExtensionContext](../../../core/globals/index.md#extensioncontext)

***

### ExtensionInfo

Re-exports [ExtensionInfo](../../extensions/extensions/index.md#extensioninfo)

***

### extensions

Re-exports [extensions](../../extensions/extensions/namespaces/extensions.md)

***

### FileDecoration

Re-exports [FileDecoration](../../window/fileDecorations.md#filedecoration)

***

### FileFilter

Re-exports [FileFilter](../../window/filePicker.md#filefilter)

***

### FileStat

Re-exports [FileStat](../../fs/filesystem.md#filestat)

***

### FileSystemAPI

Re-exports [FileSystemAPI](../../fs/filesystem.md#filesystemapi)

***

### FindOptions

Re-exports [FindOptions](../../search/search/index.md#findoptions)

***

### fs

Re-exports [fs](../../fs/filesystem.md#fs)

***

### git

Re-exports [git](../../git/git/namespaces/git/index.md)

***

### GitBranch

Re-exports [GitBranch](../../git/git/index.md#gitbranch)

***

### GitChangedFile

Re-exports [GitChangedFile](../../git/git/index.md#gitchangedfile)

***

### GitCommit

Re-exports [GitCommit](../../git/git/index.md#gitcommit)

***

### GitFileStatus

Re-exports [GitFileStatus](../../git/git/index.md#gitfilestatus)

***

### GitHubUser

Re-exports [GitHubUser](../../authentication/authentication/index.md#githubuser)

***

### GitRepository

Re-exports [GitRepository](../../git/git/index.md#gitrepository)

***

### GitSortMode

Re-exports [GitSortMode](../../git/git/index.md#gitsortmode)

***

### GitStash

Re-exports [GitStash](../../git/git/index.md#gitstash)

***

### IConfigurationSection

Re-exports [IConfigurationSection](../../workspace/configuration.md#iconfigurationsection)

***

### IconThemeDefinition

Re-exports [IconThemeDefinition](../../themes/themes/index.md#iconthemedefinition)

***

### IconThemeMap

Re-exports [IconThemeMap](../../themes/themes/index.md#iconthememap)

***

### InputBoxOptions

Re-exports [InputBoxOptions](../../window/quickPick.md#inputboxoptions)

***

### languages

Re-exports [languages](../../../core/globals/namespaces/languages.md)

***

### lsp

Re-exports [lsp](../../lsp/lsp/namespaces/lsp.md)

***

### LspServerConfig

Re-exports [LspServerConfig](../../lsp/lsp/index.md#lspserverconfig)

***

### MenuItem

Re-exports [MenuItem](../../menus/menus/index.md#menuitem)

***

### menus

Re-exports [menus](../../menus/menus/namespaces/menus.md)

***

### ModalOptions

Re-exports [ModalOptions](../../window/modal.md#modaloptions)

***

### MSCodeUIColors

Re-exports [MSCodeUIColors](../../themes/themes/index.md#mscodeuicolors)

***

### MultiPickerOptions

Re-exports [MultiPickerOptions](../../window/filePicker.md#multipickeroptions)

***

### NotificationAction

Re-exports [NotificationAction](../../window/notification.md#notificationaction)

***

### OutputChannel

Re-exports [OutputChannel](../../window/output.md#outputchannel)

***

### PickerOptions

Re-exports [PickerOptions](../../window/filePicker.md#pickeroptions)

***

### Position

Re-exports [Position](../../window/editor.md#position)

***

### ProgressNotification

Re-exports [ProgressNotification](../../window/notification.md#progressnotification)

***

### QuickPickItem

Re-exports [QuickPickItem](../../window/quickPick.md#quickpickitem)

***

### QuickPickOptions

Re-exports [QuickPickOptions](../../window/quickPick.md#quickpickoptions)

***

### RecentWorkspace

Re-exports [RecentWorkspace](../../workspace/recent.md#recentworkspace)

***

### ReplaceOptions

Re-exports [ReplaceOptions](../../search/search/index.md#replaceoptions)

***

### ResolvedIcon

Re-exports [ResolvedIcon](../../themes/themes/index.md#resolvedicon)

***

### search

Re-exports [search](../../search/search/namespaces/search.md)

***

### SearchFileResult

Re-exports [SearchFileResult](../../search/search/index.md#searchfileresult)

***

### SearchMatch

Re-exports [SearchMatch](../../search/search/index.md#searchmatch)

***

### Selection

Re-exports [Selection](../../window/editor.md#selection)

***

### SettingOption

Re-exports [SettingOption](../../workspace/configuration.md#settingoption)

***

### SettingType

Re-exports [SettingType](../../workspace/configuration.md#settingtype)

***

### SidebarPanelDef

Re-exports [SidebarPanelDef](../../window/sidebar.md#sidebarpaneldef)

***

### SidebarPanelHeader

Re-exports [SidebarPanelHeader](../../window/sidebar.md#sidebarpanelheader)

***

### SidebarSectionContent

Re-exports [SidebarSectionContent](../../window/sidebar.md#sidebarsectioncontent)

***

### SidebarSectionContext

Re-exports [SidebarSectionContext](../../window/sidebar.md#sidebarsectioncontext)

***

### SidebarSectionDef

Re-exports [SidebarSectionDef](../../window/sidebar.md#sidebarsectiondef)

***

### SidebarState

Re-exports [SidebarState](../../window/sidebar.md#sidebarstate)

***

### SilentSearchOptions

Re-exports [SilentSearchOptions](../../search/search/index.md#silentsearchoptions)

***

### StashOptions

Re-exports [StashOptions](../../git/git/index.md#stashoptions)

***

### StatusBarAlignment

Re-exports [StatusBarAlignment](../../window/statusBar.md#statusbaralignment)

***

### StatusBarItemController

Re-exports [StatusBarItemController](../../window/statusBar.md#statusbaritemcontroller)

***

### StatusBarItemOptions

Re-exports [StatusBarItemOptions](../../window/statusBar.md#statusbaritemoptions)

***

### SymbolKind

Re-exports [SymbolKind](../../languages/symbols.md#symbolkind)

***

### SymbolProvider

Re-exports [SymbolProvider](../../languages/symbols.md#symbolprovider)

***

### Tab

Re-exports [Tab](../../window/tab.md#tab)

***

### TabDiffData

Re-exports [TabDiffData](../../window/tab.md#tabdiffdata-1)

***

### TabOptions

Re-exports [TabOptions](../../window/tab.md#taboptions)

***

### TabType

Re-exports [TabType](../../window/tab.md#tabtype-1)

***

### TaskExecution

Re-exports [TaskExecution](../../tasks/tasks/index.md#taskexecution)

***

### TaskOptions

Re-exports [TaskOptions](../../tasks/tasks/index.md#taskoptions)

***

### tasks

Re-exports [tasks](../../tasks/tasks/namespaces/tasks.md)

***

### Terminal

Re-exports [Terminal](../../window/terminal.md#terminal)

***

### TerminalExitStatus

Re-exports [TerminalExitStatus](../../window/terminal.md#terminalexitstatus-1)

***

### TerminalOptions

Re-exports [TerminalOptions](../../window/terminal.md#terminaloptions)

***

### termis

Re-exports [termis](../../termis/termis/namespaces/termis.md)

***

### TermisView

Re-exports [TermisView](../../termis/termis/index.md#termisview)

***

### TextDocument

Re-exports [TextDocument](../../window/editor.md#textdocument)

***

### TextEditor

Re-exports [TextEditor](../../window/editor.md#texteditor)

***

### TextEditorEdit

Re-exports [TextEditorEdit](../../window/editor.md#texteditoredit-1)

***

### TextEditorOptions

Re-exports [TextEditorOptions](../../window/editor.md#texteditoroptions-1)

***

### ThemeDefinition

Re-exports [ThemeDefinition](../../themes/themes/index.md#themedefinition)

***

### themes

Re-exports [themes](../../themes/themes/namespaces/themes/index.md)

***

### TokenColor

Re-exports [TokenColor](../../themes/themes/index.md#tokencolor)

***

### TreeDataProvider

Re-exports [TreeDataProvider](../../window/treeView.md#treedataprovider)

***

### TreeItem

Re-exports [TreeItem](../../window/treeView.md#treeitem)

***

### TreeView

Re-exports [TreeView](../../window/treeView.md#treeview)

***

### TreeViewOptions

Re-exports [TreeViewOptions](../../window/treeView.md#treeviewoptions)

***

### window

Re-exports [window](../../../core/globals/namespaces/window/index.md)

***

### workspace

Re-exports [workspace](../../../core/globals/namespaces/workspace.md)

***

### WorkspaceConfiguration

Re-exports [WorkspaceConfiguration](../../workspace/configuration.md#workspaceconfiguration)

***

### WorkspaceFolder

Re-exports [WorkspaceFolder](../../workspace/workspace.md#workspacefolder)

***

### WriteOptions

Re-exports [WriteOptions](../../fs/filesystem.md#writeoptions)
