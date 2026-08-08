# search

## Functions

### clearResults()

> **clearResults**(): `void`

Defined in: modules/search/search.d.ts:113

Wipes all current search results from the UI and clears the cache.

#### Returns

`void`

***

### findInFiles()

> **findInFiles**(`opts`): `Promise`\<[`SearchFileResult`](../index.md#searchfileresult)[]\>

Defined in: modules/search/search.d.ts:92

Executes a full-text search across the workspace and instantly displays the results 
in the IDE's Search Panel sidebar.
*

#### Parameters

##### opts

[`FindOptions`](../index.md#findoptions)

Configuration options dictating the search constraints.

#### Returns

`Promise`\<[`SearchFileResult`](../index.md#searchfileresult)[]\>

A promise resolving to an array of populated file result objects.
*

#### Example

```ts
const results = await mscode.search.findInFiles({
query: 'TODO:',
matchCase: true,
includes: ['*.ts']
});
mscode.window.showInformationMessage(`Found ${results.length} files with TODOs.`);
```

***

### getResults()

> **getResults**(): [`SearchFileResult`](../index.md#searchfileresult)[]

Defined in: modules/search/search.d.ts:108

Retrieves the current list of search results actively displayed in the Search Panel.
Does not trigger a new disk scan.

#### Returns

[`SearchFileResult`](../index.md#searchfileresult)[]

***

### getResultsForFile()

> **getResultsForFile**(`filePath`): [`SearchFileResult`](../index.md#searchfileresult) \| `undefined`

Defined in: modules/search/search.d.ts:140

Retrieves the active search results specific to a targeted file path.
*

#### Parameters

##### filePath

`string`

The absolute path to the file.

#### Returns

[`SearchFileResult`](../index.md#searchfileresult) \| `undefined`

The matching object containing the snippets, or undefined if no matches exist.

***

### getTotalMatchCount()

> **getTotalMatchCount**(): `number`

Defined in: modules/search/search.d.ts:133

Calculates the absolute total number of individual text matches across all currently cached file results.
Useful for updating custom sidebar badges.

#### Returns

`number`

***

### replaceInFiles()

> **replaceInFiles**(`opts`): `Promise`\<`void`\>

Defined in: modules/search/search.d.ts:102

Executes a text replacement operation modifying the physical file system.
Automatically updates the Search Panel UI to reflect dismissed matches.
*

#### Parameters

##### opts

[`ReplaceOptions`](../index.md#replaceoptions)

Options specifying the replacement text and target scopes.
*

#### Returns

`Promise`\<`void`\>

#### Example

```ts
// Replace ALL occurrences across the entire workspace
await mscode.search.replaceInFiles({ replacement: 'newFunctionName' });
```

***

### search()

> **search**(`opts`): `Promise`\<[`SearchFileResult`](../index.md#searchfileresult)[]\>

Defined in: modules/search/search.d.ts:127

Runs a low-level, silent background search using the native OS engine.
**The Search Panel UI is NOT updated.** Perfect for internal extension logic 
like "Find All References", Rename Refactoring, or Dependency Analysis.
*

#### Parameters

##### opts

[`SilentSearchOptions`](../index.md#silentsearchoptions)

Complete constraints including an optional custom base path.

#### Returns

`Promise`\<[`SearchFileResult`](../index.md#searchfileresult)[]\>

Array of matching file results.
*

#### Example

```ts
const refs = await mscode.search.search({
query: 'function init()',
basePath: '/sdcard/Projects/Alternative'
});
```
