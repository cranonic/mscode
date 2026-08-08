# modules/languages/symbols

## Enumerations

### SymbolKind

Defined in: modules/languages/symbols.d.ts:9

Kinds of document symbols. Represents the structural classification of a code token.
Aligns with Monaco Editor's and VS Code's internal language server specifications.

#### Enumeration Members

##### Array

> **Array**: `17`

Defined in: modules/languages/symbols.d.ts:27

##### Boolean

> **Boolean**: `16`

Defined in: modules/languages/symbols.d.ts:26

##### Class

> **Class**: `4`

Defined in: modules/languages/symbols.d.ts:14

##### Constant

> **Constant**: `13`

Defined in: modules/languages/symbols.d.ts:23

##### Constructor

> **Constructor**: `8`

Defined in: modules/languages/symbols.d.ts:18

##### Enum

> **Enum**: `9`

Defined in: modules/languages/symbols.d.ts:19

##### EnumMember

> **EnumMember**: `21`

Defined in: modules/languages/symbols.d.ts:31

##### Event

> **Event**: `23`

Defined in: modules/languages/symbols.d.ts:33

##### Field

> **Field**: `7`

Defined in: modules/languages/symbols.d.ts:17

##### File

> **File**: `0`

Defined in: modules/languages/symbols.d.ts:10

##### Function

> **Function**: `11`

Defined in: modules/languages/symbols.d.ts:21

##### Interface

> **Interface**: `10`

Defined in: modules/languages/symbols.d.ts:20

##### Key

> **Key**: `19`

Defined in: modules/languages/symbols.d.ts:29

##### Method

> **Method**: `5`

Defined in: modules/languages/symbols.d.ts:15

##### Module

> **Module**: `1`

Defined in: modules/languages/symbols.d.ts:11

##### Namespace

> **Namespace**: `2`

Defined in: modules/languages/symbols.d.ts:12

##### Null

> **Null**: `20`

Defined in: modules/languages/symbols.d.ts:30

##### Number

> **Number**: `15`

Defined in: modules/languages/symbols.d.ts:25

##### Object

> **Object**: `18`

Defined in: modules/languages/symbols.d.ts:28

##### Operator

> **Operator**: `24`

Defined in: modules/languages/symbols.d.ts:34

##### Package

> **Package**: `3`

Defined in: modules/languages/symbols.d.ts:13

##### Property

> **Property**: `6`

Defined in: modules/languages/symbols.d.ts:16

##### String

> **String**: `14`

Defined in: modules/languages/symbols.d.ts:24

##### Struct

> **Struct**: `22`

Defined in: modules/languages/symbols.d.ts:32

##### TypeParameter

> **TypeParameter**: `25`

Defined in: modules/languages/symbols.d.ts:35

##### Variable

> **Variable**: `12`

Defined in: modules/languages/symbols.d.ts:22

## Interfaces

### DocumentSymbol

Defined in: modules/languages/symbols.d.ts:42

Represents programming constructs like variables, functions, methods, or classes within a document.
This structural hierarchy directly populates features like the Outline View and Breadcrumb rails.

#### Properties

##### children?

> `optional` **children?**: [`DocumentSymbol`](#documentsymbol)[]

Defined in: modules/languages/symbols.d.ts:53

Sub-symbols or nested children contained hierarchically within this node block.

##### detail?

> `optional` **detail?**: `string`

Defined in: modules/languages/symbols.d.ts:47

Additional contextual details for this symbol, such as a function signature or return type.

##### kind

> **kind**: [`SymbolKind`](#symbolkind)

Defined in: modules/languages/symbols.d.ts:50

The structural taxonomy kind of this symbol (e.g., Class, Function, Interface).

##### name

> **name**: `string`

Defined in: modules/languages/symbols.d.ts:44

The name of this symbol, e.g., 'calculateTotal' or 'UserClass'.

***

### SymbolProvider

Defined in: modules/languages/symbols.d.ts:60

Structural interface blueprint that third-party extension engines must conform to
in order to inject custom syntax extraction logic into the global processing pipeline.

#### Methods

##### provideSymbols()

> **provideSymbols**(`text`, `languageId`, `model`): [`DocumentSymbol`](#documentsymbol)[] \| `Promise`\<[`DocumentSymbol`](#documentsymbol)[]\>

Defined in: modules/languages/symbols.d.ts:69

Parses document content and returns a collection of validated code symbols.

###### Parameters

###### text

`string`

The complete raw string value content of the targeted active editor document.

###### languageId

`string`

The programming language token scope string identifier (e.g., 'javascript', 'rust').

###### model

`any`

Pointers referencing the active, native Monaco text model engine framework instance.

###### Returns

[`DocumentSymbol`](#documentsymbol)[] \| `Promise`\<[`DocumentSymbol`](#documentsymbol)[]\>

An array of structured document symbols, or a Promise resolving to one.

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

### CopyOptions

Re-exports [CopyOptions](../fs/filesystem.md#copyoptions)

***

### Diagnostic

Re-exports [Diagnostic](diagnostics.md#diagnostic)

***

### DiagnosticCollection

Re-exports [DiagnosticCollection](diagnostics.md#diagnosticcollection)

***

### DiagnosticSeverity

Re-exports [DiagnosticSeverity](diagnostics.md#diagnosticseverity)

***

### Disposable

Re-exports [Disposable](../../core/globals/index.md#disposable)

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

***

### WriteOptions

Re-exports [WriteOptions](../fs/filesystem.md#writeoptions)
