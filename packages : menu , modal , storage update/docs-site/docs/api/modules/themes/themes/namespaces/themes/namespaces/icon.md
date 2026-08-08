# icon

## Functions

### getActiveThemeId()

> **getActiveThemeId**(): `string`

Defined in: modules/themes/themes.d.ts:243

Retrieves the universally unique identifier of the currently active icon theme.

#### Returns

`string`

The active theme ID (e.g., 'mscode-icons').

***

### getAll()

> **getAll**(): [`IconThemeDefinition`](../../../index.md#iconthemedefinition)[]

Defined in: modules/themes/themes.d.ts:248

Retrieves a list of all currently registered and available icon themes.

#### Returns

[`IconThemeDefinition`](../../../index.md#iconthemedefinition)[]

***

### getFileIcon()

> **getFileIcon**(`fileName`, `isDirectory`, `isOpen?`): [`ResolvedIcon`](../../../index.md#resolvedicon)

Defined in: modules/themes/themes.d.ts:276

Resolves the visual icon asset for a specific file or folder based on the currently active theme.
Extremely useful for rendering correct icons in custom Tree Views or Quick Picks.

#### Parameters

##### fileName

`string`

The raw base filename (e.g., 'package.json', 'src').

##### isDirectory

`boolean`

Flag specifying if the current node is a folder.

##### isOpen?

`boolean`

Optional flag for folders to get their expanded icon state.

#### Returns

[`ResolvedIcon`](../../../index.md#resolvedicon)

A payload specifying whether to render a CSS class or an `<img>` tag.

#### Example

```ts
import { themes } from '@mscode/api';

const icon = themes.icon.getFileIcon('package.json', false);
if (icon.type === 'image') {
  return `<img src="${icon.value}" width="16" />`;
} else {
  return `<i class="${icon.value}"></i>`;
}
```

***

### getLanguageIcon()

> **getLanguageIcon**(`langId`): [`ResolvedIcon`](../../../index.md#resolvedicon)

Defined in: modules/themes/themes.d.ts:284

Resolves the icon associated with a specific programming language identifier.

#### Parameters

##### langId

`string`

Target language tracking key (e.g., 'typescript', 'python').

#### Returns

[`ResolvedIcon`](../../../index.md#resolvedicon)

The resolved icon asset configuration.

***

### onDidChangeIconTheme()

> **onDidChangeIconTheme**(`callback`): [`Disposable`](../../../../../../core/globals/index.md#disposable)

Defined in: modules/themes/themes.d.ts:299

Fires whenever the active icon theme changes (either programmatically or via user settings).

#### Parameters

##### callback

(`themeId`) => `void`

Function receiving the newly applied theme ID.

#### Returns

[`Disposable`](../../../../../../core/globals/index.md#disposable)

A disposable object to detach the listener.

#### Example

```ts
import { themes } from '@mscode/api';

themes.icon.onDidChangeIconTheme((themeId) => {
  console.log(`The IDE is now using ${themeId}`);
});
```

***

### register()

> **register**(`def`): [`Disposable`](../../../../../../core/globals/index.md#disposable)

Defined in: modules/themes/themes.d.ts:227

Registers a new Type-Safe JavaScript/TypeScript icon theme into the IDE environment.
Instantly makes the theme available in the user's `workbench.iconTheme` settings.

#### Parameters

##### def

[`IconThemeDefinition`](../../../index.md#iconthemedefinition)

The structured icon theme definition.

#### Returns

[`Disposable`](../../../../../../core/globals/index.md#disposable)

A disposable object to safely unregister the theme upon extension deactivation.

#### Example

```ts
import { themes } from '@mscode/api';

const dispose = themes.icon.register({
  id: 'my-custom-icons',
  name: 'Awesome Custom Icons',
  themeMap: {
    fileExtensions: { 'tsx': 'react-ts', 'rs': 'rust' },
    folderNames: { 'src': 'folder-src' }
  }
});
```

***

### registerFromJson()

> **registerFromJson**(`json`): [`Disposable`](../../../../../../core/globals/index.md#disposable)

Defined in: modules/themes/themes.d.ts:236

Registers an icon theme parsed from a raw JSON string or object payload.
Useful for porting existing VS Code icon theme JSON files directly.

#### Parameters

##### json

`string` \| `object`

The JSON string or parsed object representing the theme definition.

#### Returns

[`Disposable`](../../../../../../core/globals/index.md#disposable)

A disposable object to unregister the theme.

***

### setTheme()

> **setTheme**(`id`): `void`

Defined in: modules/themes/themes.d.ts:255

Programmatically forces the IDE to switch to a specific registered icon theme.

#### Parameters

##### id

`string`

The unique identifier of the theme to apply.

#### Returns

`void`
