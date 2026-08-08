# modules/themes/themes

## Namespaces

- [themes](namespaces/themes/index.md)

## Interfaces

### IconThemeDefinition

Defined in: modules/themes/themes.d.ts:114

Complete blueprint defining an installable Icon Theme.

#### Properties

##### id

> **id**: `string`

Defined in: modules/themes/themes.d.ts:116

Universally unique identifier for the theme (e.g., 'my-material-icons').

##### name

> **name**: `string`

Defined in: modules/themes/themes.d.ts:118

Human-readable display name rendered in the Settings UI drop-down.

##### themeMap

> **themeMap**: `Partial`\<[`IconThemeMap`](#iconthememap)\>

Defined in: modules/themes/themes.d.ts:120

The mapping rules connecting file types to specific Codicon or SVG names.

***

### IconThemeMap

Defined in: modules/themes/themes.d.ts:88

Structure defining the mapping rules between file names, extensions, and their visual icons.

#### Properties

##### file?

> `optional` **file?**: `string`

Defined in: modules/themes/themes.d.ts:90

Default icon for files that don't match any specific rule.

##### fileExtensions?

> `optional` **fileExtensions?**: `Record`\<`string`, `string`\>

Defined in: modules/themes/themes.d.ts:106

Mapping of file extensions to icon names (e.g., 'ts': 'typescript').

##### fileNames?

> `optional` **fileNames?**: `Record`\<`string`, `string`\>

Defined in: modules/themes/themes.d.ts:104

Mapping of exact file names to icon names (e.g., 'package.json': 'npm').

##### folder?

> `optional` **folder?**: `string`

Defined in: modules/themes/themes.d.ts:92

Default icon for folders.

##### folderExpanded?

> `optional` **folderExpanded?**: `string`

Defined in: modules/themes/themes.d.ts:94

Default icon for expanded/open folders.

##### folderNames?

> `optional` **folderNames?**: `Record`\<`string`, `string`\>

Defined in: modules/themes/themes.d.ts:100

Mapping of explicit folder names to icon names (e.g., 'node_modules': 'folder-node').

##### folderNamesExpanded?

> `optional` **folderNamesExpanded?**: `Record`\<`string`, `string`\>

Defined in: modules/themes/themes.d.ts:102

Mapping of explicit expanded folder names to icon names.

##### languageIds?

> `optional` **languageIds?**: `Record`\<`string`, `string`\>

Defined in: modules/themes/themes.d.ts:108

Mapping of programming language IDs to icon names (e.g., 'javascript': 'javascript').

##### rootFolder?

> `optional` **rootFolder?**: `string`

Defined in: modules/themes/themes.d.ts:96

Default icon for the root workspace folder.

##### rootFolderExpanded?

> `optional` **rootFolderExpanded?**: `string`

Defined in: modules/themes/themes.d.ts:98

Default icon for an expanded root workspace folder.

***

### MSCodeUIColors

Defined in: modules/themes/themes.d.ts:11

Structural interface matching the exact layout variables tracked across the 
document application interface (`theme.css`).

#### Properties

##### ms-accent

> **ms-accent**: `string`

Defined in: modules/themes/themes.d.ts:29

##### ms-activity-hover

> **ms-activity-hover**: `string`

Defined in: modules/themes/themes.d.ts:15

##### ms-bg-activity

> **ms-bg-activity**: `string`

Defined in: modules/themes/themes.d.ts:14

##### ms-bg-main

> **ms-bg-main**: `string`

Defined in: modules/themes/themes.d.ts:12

##### ms-bg-side

> **ms-bg-side**: `string`

Defined in: modules/themes/themes.d.ts:13

##### ms-border-dark

> **ms-border-dark**: `string`

Defined in: modules/themes/themes.d.ts:26

##### ms-border-light

> **ms-border-light**: `string`

Defined in: modules/themes/themes.d.ts:25

##### ms-code-bg

> **ms-code-bg**: `string`

Defined in: modules/themes/themes.d.ts:42

##### ms-code-fg

> **ms-code-fg**: `string`

Defined in: modules/themes/themes.d.ts:43

##### ms-icon-hover-bg

> **ms-icon-hover-bg**: `string`

Defined in: modules/themes/themes.d.ts:30

##### ms-input-bg

> **ms-input-bg**: `string`

Defined in: modules/themes/themes.d.ts:38

##### ms-input-border

> **ms-input-border**: `string`

Defined in: modules/themes/themes.d.ts:40

##### ms-input-fg

> **ms-input-fg**: `string`

Defined in: modules/themes/themes.d.ts:39

##### ms-input-focus-border

> **ms-input-focus-border**: `string`

Defined in: modules/themes/themes.d.ts:41

##### ms-menu-border

> **ms-menu-border**: `string`

Defined in: modules/themes/themes.d.ts:27

##### ms-menu-hover-bg

> **ms-menu-hover-bg**: `string`

Defined in: modules/themes/themes.d.ts:31

##### ms-separator

> **ms-separator**: `string`

Defined in: modules/themes/themes.d.ts:28

##### ms-settings-bg

> **ms-settings-bg**: `string`

Defined in: modules/themes/themes.d.ts:33

##### ms-settings-category-color

> **ms-settings-category-color**: `string`

Defined in: modules/themes/themes.d.ts:34

##### ms-settings-desc-color

> **ms-settings-desc-color**: `string`

Defined in: modules/themes/themes.d.ts:36

##### ms-settings-link-color

> **ms-settings-link-color**: `string`

Defined in: modules/themes/themes.d.ts:37

##### ms-settings-title-color

> **ms-settings-title-color**: `string`

Defined in: modules/themes/themes.d.ts:35

##### ms-shadow

> **ms-shadow**: `string`

Defined in: modules/themes/themes.d.ts:32

##### ms-tab-active-bg

> **ms-tab-active-bg**: `string`

Defined in: modules/themes/themes.d.ts:17

##### ms-tab-inactive-bg

> **ms-tab-inactive-bg**: `string`

Defined in: modules/themes/themes.d.ts:16

##### ms-text-activity

> **ms-text-activity**: `string`

Defined in: modules/themes/themes.d.ts:21

##### ms-text-bright

> **ms-text-bright**: `string`

Defined in: modules/themes/themes.d.ts:23

##### ms-text-faded

> **ms-text-faded**: `string`

Defined in: modules/themes/themes.d.ts:22

##### ms-text-main

> **ms-text-main**: `string`

Defined in: modules/themes/themes.d.ts:19

##### ms-text-side

> **ms-text-side**: `string`

Defined in: modules/themes/themes.d.ts:20

***

### ResolvedIcon

Defined in: modules/themes/themes.d.ts:126

Represents a resolved icon asset ready for UI rendering.

#### Properties

##### type

> **type**: `"image"` \| `"class"`

Defined in: modules/themes/themes.d.ts:128

The type of icon rendering ('class' for icon fonts, 'image' for direct SVG/PNG paths).

##### value

> **value**: `string`

Defined in: modules/themes/themes.d.ts:130

The actual CSS class name or image source URL.

***

### ThemeDefinition

Defined in: modules/themes/themes.d.ts:68

Complete Theme Definition Matrix.
Serves as the public contract interface consumed by system expansion module developer packages.

#### Properties

##### editorColors?

> `optional` **editorColors?**: `Record`\<`string`, `string`\>

Defined in: modules/themes/themes.d.ts:80

Optional specialized overrides mapping native parameters inside Monaco Editor Viewports.

##### id

> **id**: `string`

Defined in: modules/themes/themes.d.ts:70

Unique identifying token. Recommended format: "publisher-namespace.theme-name"

##### name

> **name**: `string`

Defined in: modules/themes/themes.d.ts:72

Public user-facing display label for selectors and option inputs.

##### tokenColors

> **tokenColors**: [`TokenColor`](#tokencolor)[]

Defined in: modules/themes/themes.d.ts:78

Monaco Editor syntax tokenizer tree.

##### type

> **type**: `"dark"` \| `"light"` \| `"high-contrast"`

Defined in: modules/themes/themes.d.ts:74

Primary systemic styling base architecture.

##### uiColors

> **uiColors**: `Partial`\<[`MSCodeUIColors`](#mscodeuicolors)\>

Defined in: modules/themes/themes.d.ts:76

Application UI layout maps.

***

### TokenColor

Defined in: modules/themes/themes.d.ts:50

Token compilation rule modeling standard syntax categorization parameters 
mirroring VS Code and TextMate grammars.

#### Properties

##### scope

> **scope**: `string` \| `string`[]

Defined in: modules/themes/themes.d.ts:52

Target text parsing descriptor string or sequence of matching context scopes.

##### settings

> **settings**: `object`

Defined in: modules/themes/themes.d.ts:54

Applied lexical parsing style attributes.

###### background?

> `optional` **background?**: `string`

Background box highlight tracking single token entities.

###### fontStyle?

> `optional` **fontStyle?**: `string`

Typographical style flags: "bold" | "italic" | "underline" | "bold italic" | ""

###### foreground?

> `optional` **foreground?**: `string`

Target Hex color identifier tracking token typography layouts.

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
