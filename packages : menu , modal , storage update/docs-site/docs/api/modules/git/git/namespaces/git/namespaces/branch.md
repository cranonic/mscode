# branch

## Functions

### checkout()

> **checkout**(`branchName`): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:191

Programmatically checks out an existing branch.

#### Parameters

##### branchName

`string`

#### Returns

`Promise`\<`void`\>

***

### createBranch()

> **createBranch**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:193

Triggers the Input Box to create and switch to a new branch.

#### Returns

`Promise`\<`void`\>

***

### createBranchFrom()

> **createBranchFrom**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:195

Triggers the Quick Pick to select a base branch, then creates a new branch from it.

#### Returns

`Promise`\<`void`\>

***

### deleteBranch()

> **deleteBranch**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:203

Safely deletes a local branch.

#### Returns

`Promise`\<`void`\>

***

### deleteRemoteBranch()

> **deleteRemoteBranch**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:205

Deletes a branch directly from the remote origin.

#### Returns

`Promise`\<`void`\>

***

### mergeBranch()

> **mergeBranch**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:197

Opens the Quick Pick to select a branch and merges it into the current branch.

#### Returns

`Promise`\<`void`\>

***

### publishBranch()

> **publishBranch**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:207

Publishes the current local branch to a remote, or creates a new GitHub repo.

#### Returns

`Promise`\<`void`\>

***

### rebaseBranch()

> **rebaseBranch**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:199

Opens the Quick Pick to select a branch and rebases the current branch onto it.

#### Returns

`Promise`\<`void`\>

***

### renameBranch()

> **renameBranch**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:201

Opens an Input Box to rename the currently active branch.

#### Returns

`Promise`\<`void`\>
