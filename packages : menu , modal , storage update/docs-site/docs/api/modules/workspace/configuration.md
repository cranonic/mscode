# modules/workspace/configuration

## Interfaces

### ConfigurationProperty

Defined in: modules/workspace/configuration.d.ts:23

Structural validation and metadata profile configuration for a single key-value setting.

#### Properties

##### category?

> `optional` **category?**: `string`

Defined in: modules/workspace/configuration.d.ts:47

Top-level grouping category in the settings UI.

###### Example

```ts
"Highlighting"
```

##### default?

> `optional` **default?**: `any`

Defined in: modules/workspace/configuration.d.ts:31

Baseline fallback configuration state. 
Note: Depending on the specific IDE engine parsing the JSON, this is sometimes keyed as `defaultValue`.

##### defaultValue?

> `optional` **defaultValue?**: `any`

Defined in: modules/workspace/configuration.d.ts:32

##### description?

> `optional` **description?**: `string`

Defined in: modules/workspace/configuration.d.ts:38

Plain text string providing baseline overview descriptions.

##### enum?

> `optional` **enum?**: (`string` \| `number` \| `boolean` \| `null`)[]

Defined in: modules/workspace/configuration.d.ts:65

Shorthand arrays declaring primitive acceptable fallback constraints natively.

##### enumItemLabels?

> `optional` **enumItemLabels?**: `string`[]

Defined in: modules/workspace/configuration.d.ts:68

Plain description names associated with structural positions inside alternative enum paths.

##### markdownDescription?

> `optional` **markdownDescription?**: `string`

Defined in: modules/workspace/configuration.d.ts:41

Markdown documentation strings (takes precedence over plain text).

##### maximum?

> `optional` **maximum?**: `number`

Defined in: modules/workspace/configuration.d.ts:74

Enforces numeric maximum evaluation parameters.

##### minimum?

> `optional` **minimum?**: `number`

Defined in: modules/workspace/configuration.d.ts:71

Enforces numeric minimum evaluation parameters.

##### options?

> `optional` **options?**: [`SettingOption`](#settingoption)[]

Defined in: modules/workspace/configuration.d.ts:62

Explicit array objects binding key indices directly into dynamic rendering selectors.

##### order?

> `optional` **order?**: `number`

Defined in: modules/workspace/configuration.d.ts:83

Positional arrangement sort criteria. Lower numbers appear first.

##### pattern?

> `optional` **pattern?**: `string`

Defined in: modules/workspace/configuration.d.ts:77

Regular expression validation string used to verify structure strings before saving.

##### patternErrorMessage?

> `optional` **patternErrorMessage?**: `string`

Defined in: modules/workspace/configuration.d.ts:80

Context error notification displayed when standard regular expression patterns fail.

##### subCategory?

> `optional` **subCategory?**: `string`

Defined in: modules/workspace/configuration.d.ts:53

Nested grouping in the settings UI. You can use `>` to create deeper nesting.

###### Example

```ts
"Highlighting > Semantic Highlighting"
```

##### tags?

> `optional` **tags?**: `string`[]

Defined in: modules/workspace/configuration.d.ts:59

Array of searchable keywords to help users find this setting easily.

###### Example

```ts
['display', 'highlight', 'color']
```

##### title?

> `optional` **title?**: `string`

Defined in: modules/workspace/configuration.d.ts:35

Visual header title caption label rendered on structural elements.

##### type

> **type**: [`SettingType`](#settingtype)

Defined in: modules/workspace/configuration.d.ts:25

Structural scalar configuration primitive target validation blueprint type.

***

### IConfigurationSection

Defined in: modules/workspace/configuration.d.ts:89

Top-level structure mapping configurations into contextual groups.

#### Properties

##### id

> **id**: `string`

Defined in: modules/workspace/configuration.d.ts:90

##### order?

> `optional` **order?**: `number`

Defined in: modules/workspace/configuration.d.ts:92

##### properties

> **properties**: `Record`\<`string`, [`ConfigurationProperty`](#configurationproperty)\>

Defined in: modules/workspace/configuration.d.ts:93

##### title

> **title**: `string`

Defined in: modules/workspace/configuration.d.ts:91

***

### SettingOption

Defined in: modules/workspace/configuration.d.ts:13

Structural definition for individual selections used in bounded 'select' schema varieties.

#### Properties

##### description?

> `optional` **description?**: `string`

Defined in: modules/workspace/configuration.d.ts:16

##### label

> **label**: `string`

Defined in: modules/workspace/configuration.d.ts:15

##### markdownDescription?

> `optional` **markdownDescription?**: `string`

Defined in: modules/workspace/configuration.d.ts:17

##### value

> **value**: `string`

Defined in: modules/workspace/configuration.d.ts:14

***

### WorkspaceConfiguration

Defined in: modules/workspace/configuration.d.ts:96

#### Methods

##### get()

> **get**\<`T`\>(`key`, `defaultValue?`): `T`

Defined in: modules/workspace/configuration.d.ts:103

Retrieves a configuration value.

###### Type Parameters

###### T

`T`

###### Parameters

###### key

`string`

The configuration key (e.g., 'port').

###### defaultValue?

`T`

The fallback value if the key is not found in user settings.

###### Returns

`T`

The value from settings or the provided default.

##### update()

> **update**(`key`, `value`): `void`

Defined in: modules/workspace/configuration.d.ts:110

Updates a configuration value globally.

###### Parameters

###### key

`string`

The configuration key (e.g., 'fontSize').

###### value

`any`

The new value to set.

###### Returns

`void`

## Type Aliases

### SettingType

> **SettingType** = `"string"` \| `"number"` \| `"boolean"` \| `"select"` \| `"textarea"` \| `"object"` \| `"array"` \| `"null"`

Defined in: modules/workspace/configuration.d.ts:8

Valid runtime scalar and complex primitive types supported by the setting definitions.

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

Re-exports [BookmarkFolder](recent.md#bookmarkfolder)

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

Re-exports [RecentWorkspace](recent.md#recentworkspace)

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

### SymbolKind

Re-exports [SymbolKind](../languages/symbols.md#symbolkind)

***

### SymbolProvider

Re-exports [SymbolProvider](../languages/symbols.md#symbolprovider)

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

### WorkspaceFolder

Re-exports [WorkspaceFolder](workspace.md#workspacefolder)

***

### WriteOptions

Re-exports [WriteOptions](../fs/filesystem.md#writeoptions)
