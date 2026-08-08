# git

Primary Core Git API.
Gives extensions programmatic access to the IDE's built-in Source Control capabilities.

## Namespaces

- [branch](namespaces/branch.md)
- [commit](namespaces/commit.md)
- [remote](namespaces/remote.md)
- [repo](namespaces/repo.md)
- [stash](namespaces/stash.md)
- [status](namespaces/status.md)
- [tag](namespaces/tag.md)
- [ui](namespaces/ui.md)

## Variables

### branches

> `const` **branches**: [`GitBranch`](../../index.md#gitbranch)[]

Defined in: modules/git/git.d.ts:107

Array of all available local and remote branches.

***

### commitMessage

> `const` **commitMessage**: `string`

Defined in: modules/git/git.d.ts:128

The current text present inside the Source Control commit input box.

***

### currentBranch

> `const` **currentBranch**: `string`

Defined in: modules/git/git.d.ts:105

The name of the currently checked-out branch.

***

### error

> `const` **error**: `string` \| `null`

Defined in: modules/git/git.d.ts:121

Holds the last error message encountered by the Git engine, or null if healthy.

***

### hasUpstream

> `const` **hasUpstream**: `boolean`

Defined in: modules/git/git.d.ts:125

True if the current branch has a tracking upstream remote branch.

***

### isGitRepo

> `const` **isGitRepo**: `boolean`

Defined in: modules/git/git.d.ts:103

Returns true if the current workspace root is a valid Git repository.

***

### isRebasing

> `const` **isRebasing**: `boolean`

Defined in: modules/git/git.d.ts:123

True if the repository is currently in the middle of a rebase operation.

***

### recentCommits

> `const` **recentCommits**: [`GitCommit`](../../index.md#gitcommit)[]

Defined in: modules/git/git.d.ts:109

A list of the most recent commits on the current branch.

***

### repositories

> `const` **repositories**: [`GitRepository`](../../index.md#gitrepository)[]

Defined in: modules/git/git.d.ts:115

Array of repositories detected in the current workspace.

***

### showChanges

> `const` **showChanges**: `boolean`

Defined in: modules/git/git.d.ts:132

Whether the changed files list is expanded in the UI.

***

### showRepositories

> `const` **showRepositories**: `boolean`

Defined in: modules/git/git.d.ts:130

Whether the repository list view is expanded in the UI.

***

### sortMode

> `const` **sortMode**: [`GitSortMode`](../../index.md#gitsortmode)

Defined in: modules/git/git.d.ts:134

The active sorting mode for files in the Source Control panel.

***

### stagedFiles

> `const` **stagedFiles**: [`GitChangedFile`](../../index.md#gitchangedfile)[]

Defined in: modules/git/git.d.ts:111

Array of files currently added to the staging area.

***

### stashes

> `const` **stashes**: [`GitStash`](../../index.md#gitstash)[]

Defined in: modules/git/git.d.ts:117

Array of locally saved stashes.

***

### tags

> `const` **tags**: `string`[]

Defined in: modules/git/git.d.ts:119

Array of local tags.

***

### unstagedFiles

> `const` **unstagedFiles**: [`GitChangedFile`](../../index.md#gitchangedfile)[]

Defined in: modules/git/git.d.ts:113

Array of modified or untracked files not yet staged.
