# termis

## Variables

### activeView

> `const` **activeView**: [`TermisView`](../index.md#termisview)

Defined in: modules/termis/termis.d.ts:20

Returns the currently active section ('terminal', 'output', or 'problems').

***

### isVisible

> `const` **isVisible**: `boolean`

Defined in: modules/termis/termis.d.ts:15

Returns `true` if the Termis panel is currently visible and open.

## Functions

### closePanel()

> **closePanel**(): `void`

Defined in: modules/termis/termis.d.ts:34

Hides the Termis panel from the layout.

#### Returns

`void`

***

### onDidChangeTermisActiveView()

> **onDidChangeTermisActiveView**(`handler`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/termis/termis.d.ts:72

Fired when the active view inside the Termis panel changes.

#### Parameters

##### handler

(`view`) => `void`

Callback receiving the new active view ('terminal' | 'output' | 'problems').

#### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to unregister the listener.
*

#### Example

```ts
mscode.termis.onDidChangeTermisActiveView((newView) => {
if (newView === 'problems') {
mscode.window.showInformationMessage("Checking for code errors...");
}
});
```

***

### onDidCloseTermisPanel()

> **onDidCloseTermisPanel**(`handler`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/termis/termis.d.ts:59

Fired when the Termis panel is closed or hidden.

#### Parameters

##### handler

() => `void`

Callback executed on close.

#### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to unregister the listener.

***

### onDidOpenTermisPanel()

> **onDidOpenTermisPanel**(`handler`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/termis/termis.d.ts:52

Fired when the Termis panel is opened or becomes visible.

#### Parameters

##### handler

() => `void`

Callback executed on open.

#### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to unregister the listener.

***

### openPanel()

> **openPanel**(`view?`): `void`

Defined in: modules/termis/termis.d.ts:29

Opens the Termis panel in the IDE.
*

#### Parameters

##### view?

[`TermisView`](../index.md#termisview)

Optional target view to display. If omitted, it opens to the last active view.
*

#### Returns

`void`

#### Example

```ts
// Open directly to the problems tab
mscode.termis.openPanel('problems');
```

***

### setActiveView()

> **setActiveView**(`view`): `void`

Defined in: modules/termis/termis.d.ts:43

Switches the active view inside the Termis panel.
Automatically opens the panel if it is currently closed.
*

#### Parameters

##### view

[`TermisView`](../index.md#termisview)

The target view identifier.
*

#### Returns

`void`

#### Example

```ts
mscode.termis.setActiveView('output');
```
