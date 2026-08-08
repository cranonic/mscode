# modules/search/search

## Namespaces

- [search](namespaces/search.md)

## Interfaces

### FindOptions

Defined in: modules/search/search.d.ts:42

Constraints and filters applied when executing a search query.

#### Extended by

- [`SilentSearchOptions`](#silentsearchoptions)

#### Properties

##### excludes?

> `optional` **excludes?**: `string`[]

Defined in: modules/search/search.d.ts:54

Array of glob patterns defining files or directories to skip (e.g., `['node_modules', '*.min.js']`).

##### includes?

> `optional` **includes?**: `string`[]

Defined in: modules/search/search.d.ts:52

Array of glob patterns defining files to exclusively search inside (e.g., `['*.ts', 'src/**']`).

##### matchCase?

> `optional` **matchCase?**: `boolean`

Defined in: modules/search/search.d.ts:46

Whether the search should strictly match casing (e.g., 'A' != 'a').

##### query

> **query**: `string`

Defined in: modules/search/search.d.ts:44

The literal text or regular expression to search for.

##### useRegex?

> `optional` **useRegex?**: `boolean`

Defined in: modules/search/search.d.ts:50

Evaluates the query string as a Regular Expression if true.

##### wholeWord?

> `optional` **wholeWord?**: `boolean`

Defined in: modules/search/search.d.ts:48

Whether the search should only match full, isolated words.

***

### ReplaceOptions

Defined in: modules/search/search.d.ts:60

Parameters required to perform a text replacement operation.

#### Properties

##### filePath?

> `optional` **filePath?**: `string`

Defined in: modules/search/search.d.ts:64

Optional target file. If omitted, applies the replacement across ALL files currently in the results.

##### matchId?

> `optional` **matchId?**: `string`

Defined in: modules/search/search.d.ts:66

Optional target match ID. If omitted, applies the replacement to ALL matches inside the targeted file.

##### replacement

> **replacement**: `string`

Defined in: modules/search/search.d.ts:62

The text string that will replace the matched queries.

***

### SearchFileResult

Defined in: modules/search/search.d.ts:26

Represents a file that contains one or more search matches.

#### Properties

##### dirPath

> **dirPath**: `string`

Defined in: modules/search/search.d.ts:32

The parent directory path of the file.

##### expanded

> **expanded**: `boolean`

Defined in: modules/search/search.d.ts:36

UI State: Whether the file's match list is expanded in the sidebar.

##### fileName

> **fileName**: `string`

Defined in: modules/search/search.d.ts:30

The base name of the file (e.g., 'index.ts').

##### filePath

> **filePath**: `string`

Defined in: modules/search/search.d.ts:28

Absolute canonical path to the file.

##### matches

> **matches**: [`SearchMatch`](#searchmatch)[]

Defined in: modules/search/search.d.ts:34

Array of all matches discovered within this specific file.

***

### SearchMatch

Defined in: modules/search/search.d.ts:8

Represents an individual text match found within a file.

#### Properties

##### column

> **column**: `number`

Defined in: modules/search/search.d.ts:14

The 1-based column number where the match begins.

##### id

> **id**: `string`

Defined in: modules/search/search.d.ts:10

Unique identifier for this specific match occurrence.

##### line

> **line**: `number`

Defined in: modules/search/search.d.ts:12

The 1-based line number where the match occurred.

##### matchLength

> **matchLength**: `number`

Defined in: modules/search/search.d.ts:20

The character length of the matched text.

##### matchStart

> **matchStart**: `number`

Defined in: modules/search/search.d.ts:18

The zero-based index of the match within the preview string.

##### preview

> **preview**: `string`

Defined in: modules/search/search.d.ts:16

A small text snippet of the line containing the match (used for UI preview).

***

### SilentSearchOptions

Defined in: modules/search/search.d.ts:72

Extended options for silent, programmatic background searches.

#### Extends

- [`FindOptions`](#findoptions)

#### Properties

##### basePath?

> `optional` **basePath?**: `string`

Defined in: modules/search/search.d.ts:74

Optional override for the root directory to search within. Defaults to the active workspace.

##### excludes?

> `optional` **excludes?**: `string`[]

Defined in: modules/search/search.d.ts:54

Array of glob patterns defining files or directories to skip (e.g., `['node_modules', '*.min.js']`).

###### Inherited from

[`FindOptions`](#findoptions).[`excludes`](#excludes)

##### includes?

> `optional` **includes?**: `string`[]

Defined in: modules/search/search.d.ts:52

Array of glob patterns defining files to exclusively search inside (e.g., `['*.ts', 'src/**']`).

###### Inherited from

[`FindOptions`](#findoptions).[`includes`](#includes)

##### matchCase?

> `optional` **matchCase?**: `boolean`

Defined in: modules/search/search.d.ts:46

Whether the search should strictly match casing (e.g., 'A' != 'a').

###### Inherited from

[`FindOptions`](#findoptions).[`matchCase`](#matchcase)

##### query

> **query**: `string`

Defined in: modules/search/search.d.ts:44

The literal text or regular expression to search for.

###### Inherited from

[`FindOptions`](#findoptions).[`query`](#query)

##### useRegex?

> `optional` **useRegex?**: `boolean`

Defined in: modules/search/search.d.ts:50

Evaluates the query string as a Regular Expression if true.

###### Inherited from

[`FindOptions`](#findoptions).[`useRegex`](#useregex)

##### wholeWord?

> `optional` **wholeWord?**: `boolean`

Defined in: modules/search/search.d.ts:48

Whether the search should only match full, isolated words.

###### Inherited from

[`FindOptions`](#findoptions).[`wholeWord`](#wholeword)

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

### ResolvedIcon

Re-exports [ResolvedIcon](../../themes/themes/index.md#resolvedicon)

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
