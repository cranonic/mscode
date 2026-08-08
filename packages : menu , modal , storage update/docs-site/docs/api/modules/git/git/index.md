# modules/git/git

## Namespaces

- [git](namespaces/git/index.md)

## Interfaces

### CommitOptions

Defined in: modules/git/git.d.ts:77

#### Properties

##### all?

> `optional` **all?**: `boolean`

Defined in: modules/git/git.d.ts:79

Auto-stages all modified and deleted files before committing.

##### signoff?

> `optional` **signoff?**: `boolean`

Defined in: modules/git/git.d.ts:81

Adds a Signed-off-by trailer to the commit message.

***

### GitBranch

Defined in: modules/git/git.d.ts:12

Represents a Git branch (Local or Remote) in the current workspace.

#### Properties

##### ahead

> **ahead**: `number`

Defined in: modules/git/git.d.ts:22

Count of localized commits waiting to be pushed upstream.

##### behind

> **behind**: `number`

Defined in: modules/git/git.d.ts:24

Count of remote server commits waiting to be synchronized locally.

##### isCurrent

> **isCurrent**: `boolean`

Defined in: modules/git/git.d.ts:18

True if this is the active checked-out branch in the current HEAD reference.

##### isRemote

> **isRemote**: `boolean`

Defined in: modules/git/git.d.ts:16

Sentinel flag confirming if the branch resides exclusively on the upstream server.

##### name

> **name**: `string`

Defined in: modules/git/git.d.ts:14

Plain-text name designation of the branch tracking pointer.

##### upstream?

> `optional` **upstream?**: `string`

Defined in: modules/git/git.d.ts:20

Named tracking target identifier assigned to this branch on remote clusters.

***

### GitChangedFile

Defined in: modules/git/git.d.ts:42

Represents a file that has been modified, added, or deleted.

#### Properties

##### name

> **name**: `string`

Defined in: modules/git/git.d.ts:46

Individual baseline filename including its file extension.

##### oldPath?

> `optional` **oldPath?**: `string`

Defined in: modules/git/git.d.ts:50

Populated only during rename states to track historical layout targets.

##### path

> **path**: `string`

Defined in: modules/git/git.d.ts:44

Workspace relative canonical path to the file.

##### status

> **status**: [`GitFileStatus`](#gitfilestatus)

Defined in: modules/git/git.d.ts:48

Current active Git modification tree state mapping.

***

### GitCommit

Defined in: modules/git/git.d.ts:28

Represents a Git commit record in the local history.

#### Properties

##### author

> **author**: `string`

Defined in: modules/git/git.d.ts:36

Named metadata context identifying the commit owner.

##### date

> **date**: `string`

Defined in: modules/git/git.d.ts:38

Fully formatted ISO timestamp marking the exact completion pass window.

##### hash

> **hash**: `string`

Defined in: modules/git/git.d.ts:30

Complete 40-character hexadecimal representation string of the commit hash.

##### message

> **message**: `string`

Defined in: modules/git/git.d.ts:34

Plain text explanation description written by the committer.

##### shortHash

> **shortHash**: `string`

Defined in: modules/git/git.d.ts:32

Condensed short hash identifier representation (typically first 7 characters).

***

### GitRepository

Defined in: modules/git/git.d.ts:54

Represents the state of the active Git repository.

#### Properties

##### ahead

> **ahead**: `number`

Defined in: modules/git/git.d.ts:64

Outgoing local tracking node offset index metric.

##### behind

> **behind**: `number`

Defined in: modules/git/git.d.ts:66

Incoming remote server revision synchronization lag evaluation matrix.

##### branch

> **branch**: `string`

Defined in: modules/git/git.d.ts:62

Text pointer showing the current checking branch state on the layout.

##### id

> **id**: `string`

Defined in: modules/git/git.d.ts:56

Absolute hash token or internal routing signature key.

##### name

> **name**: `string`

Defined in: modules/git/git.d.ts:58

Individual readable workspace naming context assigned to the target folder.

##### path

> **path**: `string`

Defined in: modules/git/git.d.ts:60

Absolute operating system physical folder pathway routing target.

***

### GitStash

Defined in: modules/git/git.d.ts:70

Represents a saved Git stash.

#### Properties

##### description

> **description**: `string`

Defined in: modules/git/git.d.ts:74

Plain descriptive label tracking user annotations or branch references on stash actions.

##### index

> **index**: `number`

Defined in: modules/git/git.d.ts:72

Sequential placement index locator evaluating the stack trace coordinate.

***

### StashOptions

Defined in: modules/git/git.d.ts:84

#### Properties

##### includeUntracked?

> `optional` **includeUntracked?**: `boolean`

Defined in: modules/git/git.d.ts:86

Include untracked files in the stash.

##### staged?

> `optional` **staged?**: `boolean`

Defined in: modules/git/git.d.ts:88

Only stash currently staged files.

## Type Aliases

### GitFileStatus

> **GitFileStatus** = `"modified"` \| `"untracked"` \| `"added"` \| `"deleted"` \| `"renamed"` \| `"conflicted"`

Defined in: modules/git/git.d.ts:9

Represents the standard Git status classifications for tracked and untracked files
within the workspace subsystem.

***

### GitSortMode

> **GitSortMode** = `"discovery"` \| `"name"` \| `"path"` \| `"status"`

Defined in: modules/git/git.d.ts:92

Specifies available rendering sorting criteria paradigms inside the Changes panel views.

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

### CommandMetadata

Re-exports [CommandMetadata](../../commands/commands/index.md#commandmetadata)

***

### commands

Re-exports [commands](../../commands/commands/namespaces/commands.md)

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

### GitHubUser

Re-exports [GitHubUser](../../authentication/authentication/index.md#githubuser)

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
