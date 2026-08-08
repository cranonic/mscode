# commit

## Functions

### abortRebase()

> **abortRebase**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:223

Aborts an in-progress rebase operation.

#### Returns

`Promise`\<`void`\>

***

### commit()

> **commit**(`opts?`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:213

Records changes to the repository. Requires a commit message in the UI or staged files.

#### Parameters

##### opts?

[`CommitOptions`](../../../index.md#commitoptions)

#### Returns

`Promise`\<`void`\>

***

### commitAmend()

> **commitAmend**(`opts?`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:215

Replaces the tip of the current branch by creating a new commit.

#### Parameters

##### opts?

[`CommitOptions`](../../../index.md#commitoptions)

#### Returns

`Promise`\<`void`\>

***

### commitAndPush()

> **commitAndPush**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:217

Commits the current staged changes and immediately pushes them.

#### Returns

`Promise`\<`void`\>

***

### commitAndSync()

> **commitAndSync**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:219

Commits the current staged changes and immediately syncs (pull then push).

#### Returns

`Promise`\<`void`\>

***

### undoLastCommit()

> **undoLastCommit**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:221

Performs a soft reset to the previous commit, preserving file changes in staging.

#### Returns

`Promise`\<`void`\>
