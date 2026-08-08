# color

## Functions

### getActiveThemeId()

> **getActiveThemeId**(): `string`

Defined in: modules/themes/themes.d.ts:173

Returns the unique ID of the currently active color theme.

#### Returns

`string`

The active theme ID (e.g., 'mscode-dark').

***

### getAll()

> **getAll**(): `object`[]

Defined in: modules/themes/themes.d.ts:180

Retrieves a list of all registered color themes (both built-in and extension-contributed).

#### Returns

`object`[]

Array of full theme definition structures.

***

### onDidChangeColorTheme()

> **onDidChangeColorTheme**(`callback`): [`Disposable`](../../../../../../core/globals/index.md#disposable)

Defined in: modules/themes/themes.d.ts:203

Fires whenever the active color theme changes (via API or user settings).

#### Parameters

##### callback

(`themeId`) => `void`

Function that receives the new active theme ID.

#### Returns

[`Disposable`](../../../../../../core/globals/index.md#disposable)

A disposable object to unregister the listener.

#### Example

```ts
import { themes } from '@mscode/api';

themes.color.onDidChangeColorTheme((newThemeId) => {
  console.log("Color theme changed to:", newThemeId);
});
```

***

### register()

> **register**(`def`): [`Disposable`](../../../../../../core/globals/index.md#disposable)

Defined in: modules/themes/themes.d.ts:157

Registers a pre-defined TypeScript/JavaScript color theme object.

#### Parameters

##### def

[`ThemeDefinition`](../../../index.md#themedefinition)

The theme definition object.

#### Returns

[`Disposable`](../../../../../../core/globals/index.md#disposable)

A disposable object to unregister the theme on deactivation.

#### Example

```ts
import { themes } from '@mscode/api';

const oceanTheme = {
  id: 'my-studio.ocean-blue',
  name: 'Ocean Blue',
  type: 'dark',
  uiColors: { 'ms-bg-main': '#0f172a' },
  tokenColors: []
};
const disposable = themes.color.register(oceanTheme);
```

***

### registerFromJson()

> **registerFromJson**(`json`): [`Disposable`](../../../../../../core/globals/index.md#disposable)

Defined in: modules/themes/themes.d.ts:166

Registers a theme from a raw JSON string or object.
Ideal for fetching themes dynamically from a remote database/API or file system.

#### Parameters

##### json

`string` \| `object`

A valid theme JSON string or object.

#### Returns

[`Disposable`](../../../../../../core/globals/index.md#disposable)

A disposable object to unregister the theme.

***

### setTheme()

> **setTheme**(`id`): `void`

Defined in: modules/themes/themes.d.ts:188

Programmatically switches the editor to a registered color theme.
This will instantly update the DOM CSS variables and the Monaco Editor syntax colors.

#### Parameters

##### id

`string`

The unique ID of the theme to apply.

#### Returns

`void`
