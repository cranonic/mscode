# commands

## Functions

### executeCommand()

> **executeCommand**\<`T`\>(`id`, ...`args`): `Promise`\<`T`\>

Defined in: modules/commands/commands.d.ts:83

Executes a registered command programmatically.
This can execute extension-provided commands OR native Monaco Editor actions 
(e.g., 'editor.action.formatDocument').
*

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### id

`string`

The unique identifier of the command to execute.

##### args

...`any`[]

Optional arguments to pass to the command handler.

#### Returns

`Promise`\<`T`\>

A promise that resolves with the returning value of the command handler.
*

#### Example

```ts
// Execute a native editor action
await mscode.commands.executeCommand('editor.action.clipboardCopyAction');
* // Execute another extension's command and get the result
const result = await mscode.commands.executeCommand<string>('git.getCurrentBranch');
```

***

### registerCommand()

#### Call Signature

> **registerCommand**(`id`, `handler`, `meta?`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/commands/commands.d.ts:47

Registers a command that can be invoked via the Command Palette, Menus, or programmatically.
*

##### Parameters

###### id

`string`

The unique identifier for the command.

###### handler

(...`args`) => `any`

The function to execute when the command is triggered.

###### meta?

`Omit`\<[`CommandMetadata`](../index.md#commandmetadata), `"id"`\>

Optional UI metadata (title, category) for the Command Palette.

##### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to unregister the command upon deactivation.
*

##### Example

```ts
// Register a hidden/internal command
mscode.commands.registerCommand('myExt.internalAction', (data) => process(data));
* // Register a visible command with UI metadata
const disposable = mscode.commands.registerCommand('myExt.sayHello', () => {
mscode.window.showInformationMessage('Hello World!');
}, {
title: 'Say Hello',
category: 'My Extension',
icon: 'sparkle'
});
```

#### Call Signature

> **registerCommand**(`command`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/commands/commands.d.ts:66

Registers a command using a unified configuration object.
*

##### Parameters

###### command

[`CommandMetadata`](../index.md#commandmetadata) & `object`

An object combining the metadata and the execution handler.

##### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to unregister the command upon deactivation.
*

##### Example

```ts
mscode.commands.registerCommand({
id: 'myExt.build',
title: 'Build Project',
category: 'Compiler',
icon: 'tools',
execute: (target) => runBuild(target)
});
```
