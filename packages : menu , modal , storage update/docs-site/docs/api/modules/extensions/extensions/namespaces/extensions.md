# extensions

## Functions

### all()

> **all**(): [`ExtensionInfo`](../index.md#extensioninfo)[]

Defined in: modules/extensions/extensions.d.ts:41

Retrieves an array of all extensions currently installed in the IDE environment.
This includes both built-in extensions and those downloaded from the marketplace.
*

#### Returns

[`ExtensionInfo`](../index.md#extensioninfo)[]

An array of extension metadata objects.
*

#### Example

```ts
const installedExts = extensions.all();
console.log(`There are ${installedExts.length} extensions installed.`);
```

***

### getExtension()

> **getExtension**(`extensionId`): [`ExtensionInfo`](../index.md#extensioninfo) \| `undefined`

Defined in: modules/extensions/extensions.d.ts:53

Retrieves an extension by its unique identifier.
*

#### Parameters

##### extensionId

`string`

The full ID of the target extension (e.g., `mscode.git`).

#### Returns

[`ExtensionInfo`](../index.md#extensioninfo) \| `undefined`

The extension metadata, or `undefined` if it is not installed.
*

#### Example

```ts
const gitExt = extensions.getExtension('mscode.git');
if (!gitExt?.isActive) {
window.showWarningMessage("Git extension is currently sleeping!");
}
```

***

### installExtension()

> **installExtension**(`extensionId`): `Promise`\<`boolean`\>

Defined in: modules/extensions/extensions.d.ts:65

Programmatically installs an extension directly from the Cloud Marketplace.
Useful for building "Extension Packs" that download multiple dependencies automatically.
*

#### Parameters

##### extensionId

`string`

The unique ID of the extension to download and install.

#### Returns

`Promise`\<`boolean`\>

A promise that resolves to `true` if the installation succeeded, or `false` on failure.
*

#### Example

```ts
window.showInformationMessage("Installing Python backend...");
const success = await extensions.installExtension('ms.python');
if (success) window.showInformationMessage("Python installed!");
```

***

### onDidChange()

> **onDidChange**(`handler`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/extensions/extensions.d.ts:89

An event that fires when an extension is installed, uninstalled, enabled, or disabled.
Allows your extension to react dynamically to changes in the IDE ecosystem.
*

#### Parameters

##### handler

() => `void`

A callback function triggered upon any extension state mutation.

#### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to unregister the listener.
*

#### Example

```ts
extensions.onDidChange(() => {
const target = extensions.getExtension('my.dependency');
if (target) {
console.log("Dependency was just installed!");
}
});
```

***

### showMarketplace()

> **showMarketplace**(`searchQuery?`): `void`

Defined in: modules/extensions/extensions.d.ts:74

Opens the internal Extensions Sidebar View (Marketplace) and optionally applies a search filter.
*

#### Parameters

##### searchQuery?

`string`

Optional text to inject into the marketplace search bar.
*

#### Returns

`void`

#### Example

```ts
// Redirect user to find themes
extensions.showMarketplace('@category:themes dark');
```
