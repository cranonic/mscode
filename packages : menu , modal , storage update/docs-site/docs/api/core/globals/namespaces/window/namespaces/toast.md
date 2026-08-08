# toast

The Toast API provides a way to display non-intrusive, auto-dismissible 
notifications to the user. Toasts are perfect for quick status updates 
(e.g., "File Saved", "Compilation Successful").

## Functions

### dismiss()

> **dismiss**(`id`): `void`

Defined in: modules/window/toast.d.ts:69

Dismisses a specific toast by its unique ID.

#### Parameters

##### id

`string`

The unique identifier of the toast to dismiss.

#### Returns

`void`

***

### error()

> **error**(`message`, `options?`): [`ToastController`](../index.md#toastcontroller)

Defined in: modules/window/toast.d.ts:36

Shows an error toast (usually with a red accent and warning icon).

#### Parameters

##### message

`string`

The primary message to display.

##### options?

[`ToastOptions`](../index.md#toastoptions)

Additional configuration for the toast.

#### Returns

[`ToastController`](../index.md#toastcontroller)

A controller object to programmatically dismiss the toast.

***

### info()

> **info**(`message`, `options?`): [`ToastController`](../index.md#toastcontroller)

Defined in: modules/window/toast.d.ts:52

Shows an info toast (alias for `show`).

#### Parameters

##### message

`string`

The primary message to display.

##### options?

[`ToastOptions`](../index.md#toastoptions)

Additional configuration for the toast.

#### Returns

[`ToastController`](../index.md#toastcontroller)

A controller object to programmatically dismiss the toast.

***

### loading()

> **loading**(`message`, `options?`): [`ToastController`](../index.md#toastcontroller)

Defined in: modules/window/toast.d.ts:63

Shows a loading toast. 
Note: By default, loading toasts have a duration of `0` (permanent) 
so they won't disappear until you manually call `.dismiss()`.

#### Parameters

##### message

`string`

The primary message to display.

##### options?

[`ToastOptions`](../index.md#toastoptions)

Additional configuration for the toast.

#### Returns

[`ToastController`](../index.md#toastcontroller)

A controller object to programmatically dismiss the toast.

***

### show()

> **show**(`message`, `options?`): [`ToastController`](../index.md#toastcontroller)

Defined in: modules/window/toast.d.ts:20

Shows a standard information toast.

#### Parameters

##### message

`string`

The primary message to display.

##### options?

[`ToastOptions`](../index.md#toastoptions)

Additional configuration for the toast.

#### Returns

[`ToastController`](../index.md#toastcontroller)

A controller object to programmatically dismiss the toast.

***

### success()

> **success**(`message`, `options?`): [`ToastController`](../index.md#toastcontroller)

Defined in: modules/window/toast.d.ts:28

Shows a success toast (usually with a green accent and checkmark icon).

#### Parameters

##### message

`string`

The primary message to display.

##### options?

[`ToastOptions`](../index.md#toastoptions)

Additional configuration for the toast.

#### Returns

[`ToastController`](../index.md#toastcontroller)

A controller object to programmatically dismiss the toast.

***

### warning()

> **warning**(`message`, `options?`): [`ToastController`](../index.md#toastcontroller)

Defined in: modules/window/toast.d.ts:44

Shows a warning toast (usually with a yellow/orange accent).

#### Parameters

##### message

`string`

The primary message to display.

##### options?

[`ToastOptions`](../index.md#toastoptions)

Additional configuration for the toast.

#### Returns

[`ToastController`](../index.md#toastcontroller)

A controller object to programmatically dismiss the toast.
