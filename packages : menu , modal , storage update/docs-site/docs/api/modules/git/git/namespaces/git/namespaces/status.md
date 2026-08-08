# status

## Functions

### discardAll()

> **discardAll**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:159

Discards ALL unstaged changes in the repository. Irreversible.

#### Returns

`Promise`\<`void`\>

***

### discardFile()

> **discardFile**(`path`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:157

Discards (reverts) changes in a specific file. Prompts user if settings require it.

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`void`\>

***

### refresh()

> **refresh**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:147

Forces a complete refresh of the Git state (branches, commits, files).

#### Returns

`Promise`\<`void`\>

***

### stageAll()

> **stageAll**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:153

Stages all modified and untracked files.

#### Returns

`Promise`\<`void`\>

***

### stageFile()

> **stageFile**(`path`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:149

Adds a specific file to the staging area.

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`void`\>

***

### unstageAll()

> **unstageAll**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:155

Unstages all currently staged files.

#### Returns

`Promise`\<`void`\>

***

### unstageFile()

> **unstageFile**(`path`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:151

Removes a specific file from the staging area.

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`void`\>
