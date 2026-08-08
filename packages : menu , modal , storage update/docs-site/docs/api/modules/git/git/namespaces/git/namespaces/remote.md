# remote

## Functions

### addRemote()

> **addRemote**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:247

Opens UI to add a new Git remote (Supports dynamic GitHub repo fetching).

#### Returns

`Promise`\<`void`\>

***

### fetch()

> **fetch**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:231

Fetches changes from the default remote.

#### Returns

`Promise`\<`void`\>

***

### fetchAll()

> **fetchAll**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:235

Fetches changes from all configured remotes.

#### Returns

`Promise`\<`void`\>

***

### fetchPrune()

> **fetchPrune**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:233

Explicitly fetches changes and prunes deleted remote branches.

#### Returns

`Promise`\<`void`\>

***

### pull()

> **pull**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:237

Pulls changes from the default remote into the current branch.

#### Returns

`Promise`\<`void`\>

***

### pullFrom()

> **pullFrom**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:241

Opens a Quick Pick to select a specific remote and branch to pull from.

#### Returns

`Promise`\<`void`\>

***

### pullRebase()

> **pullRebase**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:239

Pulls changes from the default remote and rebases the current branch.

#### Returns

`Promise`\<`void`\>

***

### push()

> **push**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:243

Pushes the current branch to the default remote.

#### Returns

`Promise`\<`void`\>

***

### pushTo()

> **pushTo**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:245

Opens a Quick Pick to select a specific remote and branch to push to.

#### Returns

`Promise`\<`void`\>

***

### removeRemote()

> **removeRemote**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:249

Opens a Quick Pick to safely remove an existing remote.

#### Returns

`Promise`\<`void`\>

***

### sync()

> **sync**(): `Promise`\<`void`\>

Defined in: modules/git/git.d.ts:229

Synchronizes the current branch (pulls then pushes). Honors 'rebaseWhenSync' setting.

#### Returns

`Promise`\<`void`\>
