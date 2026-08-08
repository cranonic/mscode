# notification

## Functions

### dismissNotification()

> **dismissNotification**(`id`): `void`

Defined in: modules/window/notification.d.ts:48

Dismisses a specific notification by its ID.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### showConfirmation()

> **showConfirmation**(`title`, `message`, `actions`): `string`

Defined in: modules/window/notification.d.ts:45

Shows a confirmation dialogue with custom action buttons.

#### Parameters

##### title

`string`

##### message

`string`

##### actions

[`NotificationAction`](../../../../../modules/window/notification.md#notificationaction)[]

#### Returns

`string`

***

### showErrorMessage()

> **showErrorMessage**(`message`, `fullMessage?`): `string`

Defined in: modules/window/notification.d.ts:39

Shows an error message notification.

#### Parameters

##### message

`string`

##### fullMessage?

`string`

#### Returns

`string`

***

### showInformationMessage()

#### Call Signature

> **showInformationMessage**(`message`, ...`items`): `string`

Defined in: modules/window/notification.d.ts:35

Shows an information message notification.

##### Parameters

###### message

`string`

###### items

...`string`[]

##### Returns

`string`

#### Call Signature

> **showInformationMessage**(`message`, ...`items`): `string`

Defined in: modules/window/notification.d.ts:36

Shows an information message notification.

##### Parameters

###### message

`string`

###### items

...[`NotificationAction`](../../../../../modules/window/notification.md#notificationaction)[]

##### Returns

`string`

***

### withProgress()

> **withProgress**(`title`, `message`): [`ProgressNotification`](../../../../../modules/window/notification.md#progressnotification)

Defined in: modules/window/notification.d.ts:42

Shows a progress notification that can be updated or completed.

#### Parameters

##### title

`string`

##### message

`string`

#### Returns

[`ProgressNotification`](../../../../../modules/window/notification.md#progressnotification)
