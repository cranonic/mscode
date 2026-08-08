# stash

## Functions

### applyStash()

> **applyStash**(`latest?`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:167

Applies a stash to the working directory. If `latest` is false, opens a Quick Pick.

#### Parameters

##### latest?

`boolean`

#### Returns

`Promise`\<`void`\>

***

### dropAllStashes()

> **dropAllStashes**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:173

Clears all stored stashes permanently.

#### Returns

`Promise`\<`void`\>

***

### dropStash()

> **dropStash**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:171

Opens a Quick Pick to select and delete a specific stash.

#### Returns

`Promise`\<`void`\>

***

### popStash()

> **popStash**(`latest?`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:169

Applies a stash and immediately removes it from the stash list.

#### Parameters

##### latest?

`boolean`

#### Returns

`Promise`\<`void`\>

***

### stash()

> **stash**(`opts?`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:165

Saves local modifications to a new stash.

#### Parameters

##### opts?

[`StashOptions`](../../../index.md#stashoptions)

#### Returns

`Promise`\<`void`\>

***

### viewStash()

> **viewStash**(`index?`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:175

Opens a diff view in a new editor tab showing the files modified within a stash.

#### Parameters

##### index?

`number`

#### Returns

`Promise`\<`void`\>
