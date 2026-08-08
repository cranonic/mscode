# modules/window/sidebar

## Interfaces

### SidebarPanelDef

Defined in: modules/window/sidebar.d.ts:58

#### Properties

##### activityBarId

> **activityBarId**: `string`

Defined in: modules/window/sidebar.d.ts:59

##### header?

> `optional` **header?**: [`SidebarPanelHeader`](#sidebarpanelheader)

Defined in: modules/window/sidebar.d.ts:60

##### sections

> **sections**: [`SidebarSectionDef`](#sidebarsectiondef)[]

Defined in: modules/window/sidebar.d.ts:61

***

### SidebarPanelHeader

Defined in: modules/window/sidebar.d.ts:52

#### Properties

##### actions?

> `optional` **actions?**: [`MenuItem`](../menus/menus/index.md#menuitem)[]

Defined in: modules/window/sidebar.d.ts:54

##### maxOverflow?

> `optional` **maxOverflow?**: `number`

Defined in: modules/window/sidebar.d.ts:55

##### title

> **title**: `string`

Defined in: modules/window/sidebar.d.ts:53

***

### SidebarSectionContext

Defined in: modules/window/sidebar.d.ts:10

#### Properties

##### expanded

> **expanded**: `boolean`

Defined in: modules/window/sidebar.d.ts:12

##### height

> **height**: `number` \| `"auto"`

Defined in: modules/window/sidebar.d.ts:11

***

### SidebarSectionDef

Defined in: modules/window/sidebar.d.ts:20

#### Properties

##### actions?

> `optional` **actions?**: [`MenuItem`](../menus/menus/index.md#menuitem)[]

Defined in: modules/window/sidebar.d.ts:47

Menu items injected into the section header.

##### content

> **content**: [`SidebarSectionContent`](#sidebarsectioncontent)

Defined in: modules/window/sidebar.d.ts:24

##### defaultExpanded?

> `optional` **defaultExpanded?**: `boolean`

Defined in: modules/window/sidebar.d.ts:29

###### Default

```ts
true
```

##### defaultHeight?

> `optional` **defaultHeight?**: `number` \| `"auto"`

Defined in: modules/window/sidebar.d.ts:33

px or 'auto',

###### Default

```ts
150
```

##### fillHeight?

> `optional` **fillHeight?**: `boolean`

Defined in: modules/window/sidebar.d.ts:31

flex:1 — only one section per panel

##### hidden?

> `optional` **hidden?**: `boolean`

Defined in: modules/window/sidebar.d.ts:25

##### id

> **id**: `string`

Defined in: modules/window/sidebar.d.ts:21

##### maxHeight?

> `optional` **maxHeight?**: `number`

Defined in: modules/window/sidebar.d.ts:35

Max limit when height is 'auto'

##### maxOverflow?

> `optional` **maxOverflow?**: `number`

Defined in: modules/window/sidebar.d.ts:49

###### Default

```ts
3
```

##### minHeight?

> `optional` **minHeight?**: `number`

Defined in: modules/window/sidebar.d.ts:36

##### scrollX?

> `optional` **scrollX?**: `boolean`

Defined in: modules/window/sidebar.d.ts:40

###### Default

```ts
false
```

##### sticky?

> `optional` **sticky?**: `boolean`

Defined in: modules/window/sidebar.d.ts:41

##### stickyTop?

> `optional` **stickyTop?**: `number`

Defined in: modules/window/sidebar.d.ts:42

##### stickyZIndex?

> `optional` **stickyZIndex?**: `number`

Defined in: modules/window/sidebar.d.ts:43

##### title

> **title**: `ReactNode`

Defined in: modules/window/sidebar.d.ts:23

Empty string '' → static block (no collapsible)

## Type Aliases

### SidebarSectionContent

> **SidebarSectionContent** = `React.ReactNode` \| `React.ComponentType`\<`any`\> \| ((`ctx`) => `React.ReactNode`)

Defined in: modules/window/sidebar.d.ts:15

***

### SidebarState

> **SidebarState** = `"expanded"` \| `"collapsed"` \| `"hidden"`

Defined in: modules/window/sidebar.d.ts:8

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
