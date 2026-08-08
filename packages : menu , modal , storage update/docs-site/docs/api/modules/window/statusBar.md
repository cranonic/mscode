# modules/window/statusBar

## Interfaces

### StatusBarItemController

Defined in: modules/window/statusBar.d.ts:55

Controller interface returned upon successfully registering a status bar item.
Allows dynamic, real-time patching of the item's properties.

#### Methods

##### dispose()

> **dispose**(): `void`

Defined in: modules/window/statusBar.d.ts:64

Completely removes the item from the registry and frees up memory allocations.

###### Returns

`void`

##### update()

> **update**(`patch`): `void`

Defined in: modules/window/statusBar.d.ts:61

Dynamically patches specific properties of the status bar item.

###### Parameters

###### patch

`Partial`\<`Omit`\<[`StatusBarItemOptions`](#statusbaritemoptions), `"id"`\>\>

An object containing only the properties you wish to update.

###### Returns

`void`

###### Example

```ts
statusItem.update({ label: 'Parsing...', spin: true });
```

***

### StatusBarItemOptions

Defined in: modules/window/statusBar.d.ts:15

Configuration object for registering a new Status Bar item.
This declarative pattern allows the IDE to evaluate visibility conditions
and layout constraints before rendering.

#### Properties

##### alignment?

> `optional` **alignment?**: [`StatusBarAlignment`](#statusbaralignment)

Defined in: modules/window/statusBar.d.ts:19

The alignment position in the status bar. Defaults to 'left'.

##### className?

> `optional` **className?**: `string`

Defined in: modules/window/statusBar.d.ts:46

Optional CSS class names for custom layout tracking.

##### color?

> `optional` **color?**: `string`

Defined in: modules/window/statusBar.d.ts:30

Custom hexadecimal or CSS variable color applied to text/icons (e.g., 'var(--ms-error)').

##### hidden?

> `optional` **hidden?**: `boolean`

Defined in: modules/window/statusBar.d.ts:34

If true, the item is registered but unmounted from the DOM layout.

##### icon?

> `optional` **icon?**: `string`

Defined in: modules/window/statusBar.d.ts:26

Codicon alphanumeric name string mapping the indicator icon next to text.

##### id

> **id**: `string`

Defined in: modules/window/statusBar.d.ts:17

The universally unique identifier for this item (e.g., 'myExt.linter').

##### label?

> `optional` **label?**: `string`

Defined in: modules/window/statusBar.d.ts:24

The natural descriptive text displayed in the status bar.

##### onClick?

> `optional` **onClick?**: (`e`) => `void`

Defined in: modules/window/statusBar.d.ts:43

Callback executed when the user clicks the status bar item.

###### Parameters

###### e

`MouseEvent`

###### Returns

`void`

##### priority?

> `optional` **priority?**: `number`

Defined in: modules/window/statusBar.d.ts:21

Layout priority. Higher numbers are placed closer to the outer edges. Defaults to 0.

##### spin?

> `optional` **spin?**: `boolean`

Defined in: modules/window/statusBar.d.ts:32

If true, applies an infinite spin animation to the icon.

##### style?

> `optional` **style?**: `CSSProperties`

Defined in: modules/window/statusBar.d.ts:48

Optional inline CSS styles passed down to the root block.

##### tooltip?

> `optional` **tooltip?**: `string`

Defined in: modules/window/statusBar.d.ts:28

Hover tooltip text shown to the user.

##### when?

> `optional` **when?**: `string`

Defined in: modules/window/statusBar.d.ts:40

Condition clause evaluated dynamically to determine if the item should be visible.

###### Example

```ts
"activeTabType == 'code' && isWorkspaceOpen"
```

## Type Aliases

### StatusBarAlignment

> **StatusBarAlignment** = `"left"` \| `"right"`

Defined in: modules/window/statusBar.d.ts:8

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
