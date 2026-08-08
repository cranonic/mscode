# tasks

## Functions

### execute()

> **execute**(`cmd`, `cwd`, `onData`, `channel?`): [`TaskExecution`](../index.md#taskexecution)

Defined in: modules/tasks/tasks.d.ts:77

Executes a raw shell command with a direct data callback. 
This provides low-level control for extensions that need to parse terminal output 
chunk-by-chunk without necessarily displaying it to the user.
*

#### Parameters

##### cmd

`string`

The raw shell command string.

##### cwd

`string`

The absolute working directory path.

##### onData

(`data`) => `void`

Callback fired every time the shell flushes stdout data chunks.

##### channel?

`string` \| `false`

Optional channel name. Pass `false` for a completely silent, invisible background task.

#### Returns

[`TaskExecution`](../index.md#taskexecution)

A TaskExecution object to monitor or terminate the process.
*

#### Example

```ts
// Run a silent command to check system Python version
mscode.tasks.execute('python --version', mscode.workspace.workspacePath, (data) => {
console.log("Detected Python:", data);
}, false);
```

***

### runInBackground()

> **runInBackground**(`command`, `options?`): [`TaskExecution`](../index.md#taskexecution)

Defined in: modules/tasks/tasks.d.ts:60

Executes a shell command in the background and pipes its stdout/stderr 
to a named Output Channel (visible in the Termis > Output panel).
The task will also be tracked in the active Tasks Panel UI.
*

#### Parameters

##### command

`string`

The shell command to execute (e.g., 'npm run build').

##### options?

[`TaskOptions`](../index.md#taskoptions)

Execution constraints (cwd and channel mappings).

#### Returns

[`TaskExecution`](../index.md#taskexecution)

A TaskExecution object to monitor or terminate the process.
*

#### Example

```ts
const execution = mscode.tasks.runInBackground('npm install', {
outputChannel: 'NPM Installer'
});
* // Wait for completion
const { exitCode } = await execution.result;
if (exitCode === 0) {
mscode.window.showInformationMessage("Install complete!");
}
```
