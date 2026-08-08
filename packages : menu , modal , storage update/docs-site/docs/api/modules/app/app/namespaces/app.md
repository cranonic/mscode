# app

The App namespace contains APIs specific to the application's native environment,
such as handling hardware buttons and application lifecycle events.

## Functions

### exitApp()

> **exitApp**(): `void`

Defined in: modules/app/app.d.ts:40

Triggers the application exit confirmation sequence.
Internally executes the global `workbench.action.quit` command.
* *

#### Returns

`void`

#### Example

```ts
// Add a custom "Quit" button inside your extension
myExitButton.onClick(() => {
mscode.app.exitApp();
});
```

***

### onBackButton()

> **onBackButton**(`callback`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/app/app.d.ts:29

Registers a callback for the device's hardware back button (e.g., on Android).
* The callback function should return `true` if it handles the back button press 
(meaning it prevents the app from closing or going back globally). 
If it returns `false`, the event bubbles down to the next handler or exits the app.
* *

#### Parameters

##### callback

() => `boolean` \| `Promise`\<`boolean`\>

A function that returns a boolean or a Promise resolving to a boolean.

#### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to unregister the callback.
* *

#### Example

```ts
const backSub = mscode.app.onBackButton(() => {
if (myCustomPopupIsOpen) {
closePopup();
return true; // We handled it! Don't exit the app.
}
return false; // Let it pass to the next handler/exit.
});
* // Clean up when no longer needed
// backSub.dispose();
```
