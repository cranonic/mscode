# menus

## Functions

### registerItem()

> **registerItem**(`menuPath`, `item`): `object`

Defined in: modules/menus/menus.d.ts:108

Registers a single dynamic menu item into a named menu path (Panel ID).

**Advanced Progressive/Deep Merge Override System:**
- If multiple extensions register an item to the SAME `menuPath` and `id`, they do NOT overwrite each other blindly. Instead, they merge!
- **Implicit Children Rule:** If you pass an `onClick` directly to a parent without any children, the system automatically wraps it into a virtual child.
- **Auto-Flattening (The Magic Rule):** If an Option ID contains EXACTLY ONE child, it "flattens" out and acts as a direct Action Button. If it has MORE THAN ONE child, the parent morphs into a Sub-Menu (Dropdown) automatically.

#### Parameters

##### menuPath

`string`

Target Panel ID (e.g., 'editor/title', 'editor/context', 'sidebar/files/file-tree/actions').

##### item

[`MenuItem`](../index.md#menuitem)

Defines the action, icon, submenu (children), ordering, and structural flatness.

#### Returns

`object`

A disposable object to remove the item on extension deactivation.

##### dispose

> **dispose**: () => `void`

###### Returns

`void`

#### Examples

```ts
// SCENARIO 1: The Proper Way
// Result: Shows a direct 'Play' icon because Auto-Flattening kicks in for single children.
import { menus, commands } from '@mscode/api';

const disposable = menus.registerItem('editor/title', {
  id: 'coderunner.run-btn',
  label: 'Run Code',
  icon: 'play',
  children: [{
    id: 'coderunner.run-action',
    label: 'Run with Code Runner',
    order: 10, 
    onClick: () => commands.executeCommand('coderunner.run')
  }]
});
```

```ts
// SCENARIO 2: Extending an Existing Button (Deep Merge Magic)
// Result: The single 'Play' button instantly transforms into a Dropdown Menu containing TWO options!
import { menus, commands } from '@mscode/api';

menus.registerItem('editor/title', {
  id: 'coderunner.run-btn',
  children: [{
    id: 'other-ext.run-in-terminal',
    label: 'Run in Terminal',
    order: 20,
    onClick: () => commands.executeCommand('other.terminalRun')
  }]
});
```

***

### registerItems()

> **registerItems**(`menuPath`, `items`): `object`

Defined in: modules/menus/menus.d.ts:118

Registers multiple dynamic menu items or complete blocks (with separators) 
into a named menu path at once.

#### Parameters

##### menuPath

`string`

Target Panel ID (e.g., 'editor/title', 'editor/context').

##### items

[`MenuItem`](../index.md#menuitem)[]

Array of MenuItem objects including separators.

#### Returns

`object`

A batch disposable to clean up all injected items on extension deactivate.

##### dispose

> **dispose**: () => `void`

###### Returns

`void`
