# languages

## Interfaces

### CancellationToken

Defined in: modules/languages/formatter.d.ts:13

#### Properties

##### isCancellationRequested

> `readonly` **isCancellationRequested**: `boolean`

Defined in: modules/languages/formatter.d.ts:14

##### onCancellationRequested

> `readonly` **onCancellationRequested**: (`listener`) => [`Disposable`](../index.md#disposable)

Defined in: modules/languages/formatter.d.ts:15

###### Parameters

###### listener

(`e`) => `any`

###### Returns

[`Disposable`](../index.md#disposable)

***

### DocumentFormattingEditProvider

Defined in: modules/languages/formatter.d.ts:29

The document formatting provider interface defines the contract between extensions and
the formatting-feature.

#### Methods

##### provideDocumentFormattingEdits()

> **provideDocumentFormattingEdits**(`model`, `options`, `token`): [`TextEdit`](#textedit)[] \| `Promise`\<[`TextEdit`](#textedit)[]\>

Defined in: modules/languages/formatter.d.ts:37

Provide formatting edits for a whole document.
*

###### Parameters

###### model

`any`

The document in which the command was invoked.

###### options

[`FormattingOptions`](#formattingoptions)

Options controlling formatting.

###### token

[`CancellationToken`](#cancellationtoken)

A cancellation token.

###### Returns

[`TextEdit`](#textedit)[] \| `Promise`\<[`TextEdit`](#textedit)[]\>

An array of text edits describing the formatting changes.

***

### FormattingOptions

Defined in: modules/languages/formatter.d.ts:6

#### Properties

##### insertSpaces

> **insertSpaces**: `boolean`

Defined in: modules/languages/formatter.d.ts:10

Prefer spaces over tabs.

##### tabSize

> **tabSize**: `number`

Defined in: modules/languages/formatter.d.ts:8

Size of a tab in spaces.

***

### SnippetCollection

Defined in: modules/languages/snippets.d.ts:25

Dictionary of snippet configurations.

#### Indexable

> \[`snippetName`: `string`\]: [`SnippetDefinition`](#snippetdefinition)

***

### SnippetDefinition

Defined in: modules/languages/snippets.d.ts:9

Blueprint for defining an individual code snippet.

#### Properties

##### body

> **body**: `string` \| `string`[]

Defined in: modules/languages/snippets.d.ts:13

The body of the snippet. Array of strings represents multiple lines.

##### description?

> `optional` **description?**: `string`

Defined in: modules/languages/snippets.d.ts:15

Optional description of the snippet shown in the autocomplete UI.

##### exclude?

> `optional` **exclude?**: `string`[]

Defined in: modules/languages/snippets.d.ts:19

Glob patterns matching file paths where this snippet should be HIDDEN.

##### include?

> `optional` **include?**: `string`[]

Defined in: modules/languages/snippets.d.ts:17

Glob patterns matching file paths where this snippet should be ACTIVE.

##### prefix

> **prefix**: `string` \| `string`[]

Defined in: modules/languages/snippets.d.ts:11

The prefix or array of prefixes that trigger the snippet.

***

### TextEdit

Defined in: modules/languages/formatter.d.ts:18

#### Properties

##### range

> **range**: `any`

Defined in: modules/languages/formatter.d.ts:20

The range of the text document to be manipulated.

##### text

> **text**: `string`

Defined in: modules/languages/formatter.d.ts:22

The string to be inserted. For delete operations use an empty string.

## Functions

### createDiagnosticCollection()

> **createDiagnosticCollection**(`name`): [`DiagnosticCollection`](../../../modules/languages/diagnostics.md#diagnosticcollection)

Defined in: modules/languages/diagnostics.d.ts:102

Creates a dedicated container for diagnostic markers. 
Useful for linking custom external linters, builders, or toolchains.
*

#### Parameters

##### name

`string`

The human-readable name of the collection.

#### Returns

[`DiagnosticCollection`](../../../modules/languages/diagnostics.md#diagnosticcollection)

An object managing the collection lifetime and markers state.
*

#### Example

```ts
// 1. create collection
const myLinter = mscode.languages.createDiagnosticCollection('my-awesome-linter');
* // 2. scan code & set error
myLinter.set('file:///sdcard/project/main.js', [
{
severity: mscode.DiagnosticSeverity.Error, 
message: "Missing semicolon!",
startLineNumber: 10,
startColumn: 5,
endLineNumber: 10,
endColumn: 6
}
]);
```

***

### getDiagnostics()

> **getDiagnostics**(`uri?`): [`Diagnostic`](../../../modules/languages/diagnostics.md#diagnostic)[]

Defined in: modules/languages/diagnostics.d.ts:80

Retrieves all currently active diagnostics (problems) in the editor workspace.
*

#### Parameters

##### uri?

`string`

Optional target file URI to filter diagnostics.

#### Returns

[`Diagnostic`](../../../modules/languages/diagnostics.md#diagnostic)[]

Array of diagnostic markers matching the criteria.

***

### onDidChangeDiagnostics()

> **onDidChangeDiagnostics**(`handler`): [`Disposable`](../index.md#disposable)

Defined in: modules/languages/diagnostics.d.ts:113

Fired globally when file markers or diagnostics are added, changed, or completely cleared.
*

#### Parameters

##### handler

(`diagnostics`) => `void`

Callback invoked when a system diagnostics sync occurs.

#### Returns

[`Disposable`](../index.md#disposable)

A disposable instance object to detach the event listener hook securely.
*

#### Example

```ts
mscode.languages.onDidChangeDiagnostics((allProblems) => {
console.log(`Total problems in project: ${allProblems.length}`);
});
```

***

### registerDocumentFormattingEditProvider()

> **registerDocumentFormattingEditProvider**(`languageId`, `provider`): [`Disposable`](../index.md#disposable)

Defined in: modules/languages/formatter.d.ts:50

Registers a code formatter for a specific language.
*

#### Parameters

##### languageId

`string`

The language identifier (e.g., 'javascript', 'cpp').

##### provider

[`DocumentFormattingEditProvider`](#documentformattingeditprovider)

The formatting provider implementation.

#### Returns

[`Disposable`](../index.md#disposable)

A disposable object that unregisters the provider when disposed.

***

### registerSnippets()

> **registerSnippets**(`languageId`, `snippetData`): [`Disposable`](../index.md#disposable)

Defined in: modules/languages/snippets.d.ts:44

Registers a collection of code snippets for a specific language.
Integrates with the Monaco auto-complete engine natively.
*

#### Parameters

##### languageId

`string`

The targeted language identifier (e.g. 'rust', 'html').

##### snippetData

[`SnippetCollection`](#snippetcollection)

A dictionary object mapping snippet names to their definitions.

#### Returns

[`Disposable`](../index.md#disposable)

A disposable object to clean up the snippets on deactivation.
*

#### Example

```ts
const dispose = mscode.languages.registerSnippets('rust', {
'println macro': {
prefix: 'println',
body: ['println!("$1");'],
description: 'Print to stdout'
}
});
```

***

### registerSymbolProvider()

> **registerSymbolProvider**(`languageId`, `provider`): [`Disposable`](../index.md#disposable)

Defined in: modules/languages/symbols.d.ts:106

Registers a custom AST/Regex symbol provider engine linked into the global SymbolManager router tree.
Enables custom extensions to feed data elements into the code structure and Outline panel viewports.

#### Parameters

##### languageId

`string`

Target selector scope string (e.g., 'javascript', 'python', or '*' for global fallbacks).

##### provider

[`SymbolProvider`](../../../modules/languages/symbols.md#symbolprovider)

An operational strategy implementation container conforming to the `SymbolProvider` layout.

#### Returns

[`Disposable`](../index.md#disposable)

A disposable object to safely flush memory tracking grids upon extension deactivation loops.

#### Example

```ts
const jsProvider = mscode.languages.registerSymbolProvider('javascript', {
  provideSymbols: async (text, languageId) => {
    // Process string parsing loops or AST nodes
    return [
      {
        name: "UserManager",
        detail: "class",
        kind: mscode.SymbolKind.Class,
        children: [
          { name: "getUserData", detail: "(id: string) => Promise", kind: mscode.SymbolKind.Method }
        ]
      }
    ];
  }
});

// On deactivation routines:
jsProvider.dispose();
```
