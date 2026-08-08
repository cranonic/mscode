# lsp

## Functions

### registerServer()

> **registerServer**(`languages`, `config`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/lsp/lsp.d.ts:59

Registers and provisions a native Language Server Protocol (LSP) backend.
MS Code will automatically download dependencies, boot the process in the background, 
and bind it to the editor when the specified languages are opened.
*

#### Parameters

##### languages

`string`[]

Array of Monaco language IDs this server handles (e.g., ['rust', 'c']).

##### config

[`LspServerConfig`](../index.md#lspserverconfig)

The shell execution and installation metadata.

#### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to gracefully terminate and unregister the server.
*

#### Example

```typescript
const rustLsp = mscode.lsp.registerServer(['rust'], {
checkCmd: 'rust-analyzer --version',
packages: ['rust-analyzer'],
serverCmd: 'rust-analyzer'
});
* // In your deactivate function:
// rustLsp.dispose();
```

***

### unregisterServer()

> **unregisterServer**(`languages`): `void`

Defined in: modules/lsp/lsp.d.ts:66

Manually unregisters a previously configured language server.
Disconnects active WebSocket bindings and terminates the background process.
*

#### Parameters

##### languages

`string`[]

Array of Monaco language IDs to detach.

#### Returns

`void`
