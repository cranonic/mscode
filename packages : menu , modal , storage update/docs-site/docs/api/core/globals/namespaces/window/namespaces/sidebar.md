# sidebar

Full control over the IDE sidebar — layout state, panel focus,
custom section registration, dynamic action injection, and event tracking.

## Variables

### activePanel

> `const` **activePanel**: `string`

Defined in: modules/window/sidebar.d.ts:126

The id of the currently active panel (e.g. 'files', 'git', 'search').

***

### menuId

> `const` **menuId**: `object`

Defined in: modules/window/sidebar.d.ts:108

Helpers to compute stable action group Menu IDs without magic strings.

#### Type Declaration

##### header

> **header**: (`activityBarId`) => `string`

###### Parameters

###### activityBarId

`string`

###### Returns

`string`

##### section

> **section**: (`activityBarId`, `sectionId`) => `string`

###### Parameters

###### activityBarId

`string`

###### sectionId

`string`

###### Returns

`string`

***

### state

> `const` **state**: [`SidebarState`](../../../../../modules/window/sidebar.md#sidebarstate)

Defined in: modules/window/sidebar.d.ts:129

Current sidebar layout state: 'expanded' | 'collapsed' | 'hidden'.

## Functions

### addAction()

> **addAction**(`targetMenuId`, `action`): [`Disposable`](../../../index.md#disposable)

Defined in: modules/window/sidebar.d.ts:118

Inject a single action into an existing section's action bar — or the panel header.
*

#### Parameters

##### targetMenuId

`string`

Use `sidebar.menuId.*` helpers to get the right ID.

##### action

[`MenuItem`](../../../../../modules/menus/menus/index.md#menuitem)

A `MenuItem`.

#### Returns

[`Disposable`](../../../index.md#disposable)

***

### addSection()

> **addSection**(`activityBarId`, `sectionDef`): [`Disposable`](../../../index.md#disposable)

Defined in: modules/window/sidebar.d.ts:89

Dynamically inject a collapsible section into an existing panel.
*

#### Parameters

##### activityBarId

`string`

Target panel id (e.g. 'files', 'git')

##### sectionDef

[`SidebarSectionDef`](../../../../../modules/window/sidebar.md#sidebarsectiondef)

Section configuration

#### Returns

[`Disposable`](../../../index.md#disposable)

A disposable to remove the section cleanly.

***

### focusPanel()

> **focusPanel**(`panelId`): `void`

Defined in: modules/window/sidebar.d.ts:135

Focus a specific panel — opens the sidebar if it was hidden.

#### Parameters

##### panelId

`string`

#### Returns

`void`

***

### onDidChangeActivePanel()

> **onDidChangeActivePanel**(`handler`): [`Disposable`](../../../index.md#disposable)

Defined in: modules/window/sidebar.d.ts:143

Fires whenever the user switches to a different panel.

#### Parameters

##### handler

(`panelId`) => `void`

#### Returns

[`Disposable`](../../../index.md#disposable)

***

### onDidChangeState()

> **onDidChangeState**(`handler`): [`Disposable`](../../../index.md#disposable)

Defined in: modules/window/sidebar.d.ts:140

Fires whenever the sidebar layout state changes.

#### Parameters

##### handler

(`state`) => `void`

#### Returns

[`Disposable`](../../../index.md#disposable)

***

### onDidChangeWidth()

> **onDidChangeWidth**(`handler`): [`Disposable`](../../../index.md#disposable)

Defined in: modules/window/sidebar.d.ts:146

Fires when the user drags the sidebar resize handle.

#### Parameters

##### handler

(`width`) => `void`

#### Returns

[`Disposable`](../../../index.md#disposable)

***

### registerPanel()

> **registerPanel**(`panelDef`): [`Disposable`](../../../index.md#disposable)

Defined in: modules/window/sidebar.d.ts:81

Register a complete sidebar panel tied to an ActivityBar icon.
*

#### Parameters

##### panelDef

[`SidebarPanelDef`](../../../../../modules/window/sidebar.md#sidebarpaneldef)

Panel configuration.

#### Returns

[`Disposable`](../../../index.md#disposable)

A disposable object to unregister the panel cleanly.

***

### removeAction()

> **removeAction**(`targetMenuId`, `actionId`): `void`

Defined in: modules/window/sidebar.d.ts:121

Remove a previously injected action by its id.

#### Parameters

##### targetMenuId

`string`

##### actionId

`string`

#### Returns

`void`

***

### removeSection()

> **removeSection**(`activityBarId`, `sectionId`): `void`

Defined in: modules/window/sidebar.d.ts:92

Remove a section from a panel.

#### Parameters

##### activityBarId

`string`

##### sectionId

`string`

#### Returns

`void`

***

### setSectionVisibility()

> **setSectionVisibility**(`activityBarId`, `sectionId`, `visible`): `void`

Defined in: modules/window/sidebar.d.ts:103

Show or hide a section without removing it from the registry.

#### Parameters

##### activityBarId

`string`

##### sectionId

`string`

##### visible

`boolean`

#### Returns

`void`

***

### setState()

> **setState**(`newState`): `void`

Defined in: modules/window/sidebar.d.ts:132

Programmatically set the sidebar layout state.

#### Parameters

##### newState

[`SidebarState`](../../../../../modules/window/sidebar.md#sidebarstate)

#### Returns

`void`

***

### updateSection()

> **updateSection**(`activityBarId`, `sectionId`, `patch`): `void`

Defined in: modules/window/sidebar.d.ts:98

Patch any properties of an existing section without replacing it entirely.
Common uses: swap the content component, change title, update actions.

#### Parameters

##### activityBarId

`string`

##### sectionId

`string`

##### patch

`Partial`\<[`SidebarSectionDef`](../../../../../modules/window/sidebar.md#sidebarsectiondef)\>

#### Returns

`void`
