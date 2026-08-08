# statusBar

Controls the universal application status bar positioned at the bottom of the workbench.
Allows extensions to inject telemetry data, current states, and quick actions.

## Functions

### registerItem()

> **registerItem**(`options`): [`StatusBarItemController`](../../../../../modules/window/statusBar.md#statusbaritemcontroller)

Defined in: modules/window/statusBar.d.ts:95

Registers a new item into the Mono Studio Status Bar.

#### Parameters

##### options

[`StatusBarItemOptions`](../../../../../modules/window/statusBar.md#statusbaritemoptions)

The declarative configuration of the status bar item.

#### Returns

[`StatusBarItemController`](../../../../../modules/window/statusBar.md#statusbaritemcontroller)

A controller object to update properties dynamically or safely dispose of the item.

#### Example

```ts
const linterStatus = mscode.window.statusBar.registerItem({
  id: 'linter',
  alignment: 'right',
  label: 'Linter: Ready',
  icon: 'check',
  when: "activeTabType == 'code'"
});

// Update state dynamically later:
linterStatus.update({ label: 'Linter: Error', color: 'var(--ms-error)', icon: 'warning' });
```
