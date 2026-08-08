# fileDecorations

API for managing file and folder decorations in the Explorer and Custom Tree Views.

## Functions

### clear()

> **clear**(`path`): `void`

Defined in: modules/window/fileDecorations.d.ts:71

Remove the decoration from a single path.

#### Parameters

##### path

`string`

#### Returns

`void`

***

### clearAll()

> **clearAll**(): `void`

Defined in: modules/window/fileDecorations.d.ts:76

Remove all decorations (e.g. when user closes a git extension).

#### Returns

`void`

***

### get()

> **get**(`path`): [`FileDecoration`](../../../../../modules/window/fileDecorations.md#filedecoration) \| `null`

Defined in: modules/window/fileDecorations.d.ts:82

Read the current decoration for a path.
Useful for internal checks or verifying existing states before overwriting.

#### Parameters

##### path

`string`

#### Returns

[`FileDecoration`](../../../../../modules/window/fileDecorations.md#filedecoration) \| `null`

***

### set()

> **set**(`path`, `decoration`): `void`

Defined in: modules/window/fileDecorations.d.ts:53

Set a decoration badge on a file or folder path.

#### Parameters

##### path

`string`

##### decoration

[`FileDecoration`](../../../../../modules/window/fileDecorations.md#filedecoration)

#### Returns

`void`

#### Example

```ts
mscode.window.fileDecorations.set('/src/App.tsx', {
  badge:    'M',
  color:    '#e2c08d',   // yellow — modified
  tooltip:  'Modified',
  propagate: true,       // parent folders will show a dot
});
```

***

### setBulk()

> **setBulk**(`entries`): `void`

Defined in: modules/window/fileDecorations.d.ts:66

Set decorations for many paths at once.
Ideal after a full `git status` scan.

#### Parameters

##### entries

`Record`\<`string`, [`FileDecoration`](../../../../../modules/window/fileDecorations.md#filedecoration)\>

#### Returns

`void`

#### Example

```ts
mscode.window.fileDecorations.setBulk({
  '/src/App.tsx':    { badge: 'M', color: '#e2c08d', tooltip: 'Modified',  propagate: true },
  '/src/NewFile.ts': { badge: 'U', color: '#73c991', tooltip: 'Untracked', propagate: true },
  '/src/Deleted.ts': { badge: 'D', color: '#f44747', tooltip: 'Deleted',   propagate: true },
});
```
