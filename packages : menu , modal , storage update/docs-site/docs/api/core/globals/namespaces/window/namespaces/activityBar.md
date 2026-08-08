# activityBar

Controls the primary side container (Activity Bar) in Mono Studio.
Use this to contribute main navigation icons for your extension.

## Functions

### onDidChangeItems()

> **onDidChangeItems**(`handler`): `object`

Defined in: modules/window/activityBar.d.ts:75

Event fired when the list of Activity Bar items changes 
(e.g., when an item is dynamically added or removed).

#### Parameters

##### handler

(`items`) => `void`

Callback receiving the updated array of items.

#### Returns

`object`

A disposable to unsubscribe from the event.

##### dispose

> **dispose**: () => `void`

###### Returns

`void`

***

### registerItem()

> **registerItem**(`options`): `object`

Defined in: modules/window/activityBar.d.ts:66

Registers a new item/icon to the Activity Bar.
Items registered here typically represent primary views (like Explorer, Search, or Git).

#### Parameters

##### options

[`ActivityBarItemOptions`](../../../../../modules/window/activityBar.md#activitybaritemoptions)

Configuration for the activity bar item.

#### Returns

`object`

A disposable object to remove the item from the Activity Bar on deactivation.

##### dispose

> **dispose**: () => `void`

###### Returns

`void`

#### Example

```ts
const myView = mscode.window.activityBar.registerItem({
  id: 'my-plugin',
  label: 'Plugin Manager',
  icon: 'package',
  openSidebarContent: true
});
```
