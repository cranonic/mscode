// types/modules/git/git.d.ts

declare module '@mscode/api' {
  
/**
 * Represents the standard Git status classifications for tracked and untracked files
 * within the workspace subsystem.
 */
  export type GitFileStatus = 'modified' | 'untracked' | 'added' | 'deleted' | 'renamed' | 'conflicted';

  /** Represents a Git branch (Local or Remote) in the current workspace. */
  export interface GitBranch {
  /** Plain-text name designation of the branch tracking pointer. */
  name:      string;
  /** Sentinel flag confirming if the branch resides exclusively on the upstream server. */
  isRemote:  boolean;
  /** True if this is the active checked-out branch in the current HEAD reference. */
  isCurrent: boolean;
  /** Named tracking target identifier assigned to this branch on remote clusters. */
  upstream?: string;
  /** Count of localized commits waiting to be pushed upstream. */
  ahead:     number;
  /** Count of remote server commits waiting to be synchronized locally. */
  behind:    number;
  }

  /** Represents a Git commit record in the local history. */
  export interface GitCommit {
  /** Complete 40-character hexadecimal representation string of the commit hash. */
  hash:      string;
  /** Condensed short hash identifier representation (typically first 7 characters). */
  shortHash: string;
  /** Plain text explanation description written by the committer. */
  message:   string;
  /** Named metadata context identifying the commit owner. */
  author:    string;
  /** Fully formatted ISO timestamp marking the exact completion pass window. */
  date:      string;
  }

  /** Represents a file that has been modified, added, or deleted. */
  export interface GitChangedFile {
  /** Workspace relative canonical path to the file. */
  path:     string;
  /** Individual baseline filename including its file extension. */
  name:     string;
  /** Current active Git modification tree state mapping. */
  status:   GitFileStatus;
  /** Populated only during rename states to track historical layout targets. */
  oldPath?: string;
  }

  /** Represents the state of the active Git repository. */
  export interface GitRepository {
  /** Absolute hash token or internal routing signature key. */
  id:     string;
  /** Individual readable workspace naming context assigned to the target folder. */
  name:   string;
  /** Absolute operating system physical folder pathway routing target. */
  path:   string;
  /** Text pointer showing the current checking branch state on the layout. */
  branch: string;
  /** Outgoing local tracking node offset index metric. */
  ahead:  number;
  /** Incoming remote server revision synchronization lag evaluation matrix. */
  behind: number;
  }

  /** Represents a saved Git stash. */
  export interface GitStash {
  /** Sequential placement index locator evaluating the stack trace coordinate. */
  index: number;
  /** Plain descriptive label tracking user annotations or branch references on stash actions. */
  description: string;
  }

  export interface CommitOptions {
    /** Auto-stages all modified and deleted files before committing. */
    all?: boolean;
    /** Adds a Signed-off-by trailer to the commit message. */
    signoff?: boolean;
  }

  export interface StashOptions {
    /** Include untracked files in the stash. */
    includeUntracked?: boolean;
    /** Only stash currently staged files. */
    staged?: boolean;
  }

/** Specifies available rendering sorting criteria paradigms inside the Changes panel views. */
export type GitSortMode = 'discovery' | 'name' | 'path' | 'status';

  /**
   * Primary Core Git API.
   * Gives extensions programmatic access to the IDE's built-in Source Control capabilities.
   */
  export namespace git {
    
    // ─── STATE (Read-Only Properties) ───
    
    /** Returns true if the current workspace root is a valid Git repository. */
    export const isGitRepo: boolean;
    /** The name of the currently checked-out branch. */
    export const currentBranch: string;
    /** Array of all available local and remote branches. */
    export const branches: GitBranch[];
    /** A list of the most recent commits on the current branch. */
    export const recentCommits: GitCommit[];
    /** Array of files currently added to the staging area. */
    export const stagedFiles: GitChangedFile[];
    /** Array of modified or untracked files not yet staged. */
    export const unstagedFiles: GitChangedFile[];
    /** Array of repositories detected in the current workspace. */
    export const repositories: GitRepository[];
    /** Array of locally saved stashes. */
    export const stashes: GitStash[];
    /** Array of local tags. */
    export const tags: string[];
    /** Holds the last error message encountered by the Git engine, or null if healthy. */
    export const error: string | null;
    /** True if the repository is currently in the middle of a rebase operation. */
    export const isRebasing: boolean;
    /** True if the current branch has a tracking upstream remote branch. */
    export const hasUpstream: boolean;
    
    /** The current text present inside the Source Control commit input box. */
    export const commitMessage: string;
    /** Whether the repository list view is expanded in the UI. */
    export const showRepositories: boolean;
    /** Whether the changed files list is expanded in the UI. */
    export const showChanges: boolean;
    /** The active sorting mode for files in the Source Control panel. */
    export const sortMode: GitSortMode;

    // ─── REPOSITORY OPERATIONS ───
    export namespace repo {
      /** Initializes a new Git repository in the current workspace directory. */
      export function init(): Promise<void>;
      /** Opens the Quick Pick allowing users to clone a repository via URL or GitHub. */
      export function clone(): Promise<void>;
    }

    // ─── STATUS & FILE OPERATIONS ───
    export namespace status {
      /** Forces a complete refresh of the Git state (branches, commits, files). */
      export function refresh(): Promise<void>;
      /** Adds a specific file to the staging area. */
      export function stageFile(path: string): Promise<void>;
      /** Removes a specific file from the staging area. */
      export function unstageFile(path: string): Promise<void>;
      /** Stages all modified and untracked files. */
      export function stageAll(): Promise<void>;
      /** Unstages all currently staged files. */
      export function unstageAll(): Promise<void>;
      /** Discards (reverts) changes in a specific file. Prompts user if settings require it. */
      export function discardFile(path: string): Promise<void>;
      /** Discards ALL unstaged changes in the repository. Irreversible. */
      export function discardAll(): Promise<void>;
    }

    // ─── STASH OPERATIONS ───
    export namespace stash {
      /** Saves local modifications to a new stash. */
      export function stash(opts?: StashOptions): Promise<void>;
      /** Applies a stash to the working directory. If `latest` is false, opens a Quick Pick. */
      export function applyStash(latest?: boolean): Promise<void>;
      /** Applies a stash and immediately removes it from the stash list. */
      export function popStash(latest?: boolean): Promise<void>;
      /** Opens a Quick Pick to select and delete a specific stash. */
      export function dropStash(): Promise<void>;
      /** Clears all stored stashes permanently. */
      export function dropAllStashes(): Promise<void>;
      /** Opens a diff view in a new editor tab showing the files modified within a stash. */
      export function viewStash(index?: number): Promise<void>;
    }

    // ─── TAG OPERATIONS ───
    export namespace tag {
      /** Prompts the user to create a new Git tag locally. */
      export function create(): Promise<void>;
      /** Opens a Quick Pick to delete an existing local tag. */
      export function deleteTag(): Promise<void>;
      /** Pushes all local tags to the configured remote repository. */
      export function pushAll(): Promise<void>;
    }

    // ─── BRANCH OPERATIONS ───
    export namespace branch {
      /** Programmatically checks out an existing branch. */
      export function checkout(branchName: string): Promise<void>;
      /** Triggers the Input Box to create and switch to a new branch. */
      export function createBranch(): Promise<void>;
      /** Triggers the Quick Pick to select a base branch, then creates a new branch from it. */
      export function createBranchFrom(): Promise<void>;
      /** Opens the Quick Pick to select a branch and merges it into the current branch. */
      export function mergeBranch(): Promise<void>;
      /** Opens the Quick Pick to select a branch and rebases the current branch onto it. */
      export function rebaseBranch(): Promise<void>;
      /** Opens an Input Box to rename the currently active branch. */
      export function renameBranch(): Promise<void>;
      /** Safely deletes a local branch. */
      export function deleteBranch(): Promise<void>;
      /** Deletes a branch directly from the remote origin. */
      export function deleteRemoteBranch(): Promise<void>;
      /** Publishes the current local branch to a remote, or creates a new GitHub repo. */
      export function publishBranch(): Promise<void>;
    }

    // ─── COMMIT OPERATIONS ───
    export namespace commit {
      /** Records changes to the repository. Requires a commit message in the UI or staged files. */
      export function commit(opts?: CommitOptions): Promise<void>;
      /** Replaces the tip of the current branch by creating a new commit. */
      export function commitAmend(opts?: CommitOptions): Promise<void>;
      /** Commits the current staged changes and immediately pushes them. */
      export function commitAndPush(): Promise<void>;
      /** Commits the current staged changes and immediately syncs (pull then push). */
      export function commitAndSync(): Promise<void>;
      /** Performs a soft reset to the previous commit, preserving file changes in staging. */
      export function undoLastCommit(): Promise<void>;
      /** Aborts an in-progress rebase operation. */
      export function abortRebase(): Promise<void>;
    }

    // ─── REMOTE OPERATIONS ───
    export namespace remote {
      /** Synchronizes the current branch (pulls then pushes). Honors 'rebaseWhenSync' setting. */
      export function sync(): Promise<void>;
      /** Fetches changes from the default remote. */
      export function fetch(): Promise<void>;
      /** Explicitly fetches changes and prunes deleted remote branches. */
      export function fetchPrune(): Promise<void>;
      /** Fetches changes from all configured remotes. */
      export function fetchAll(): Promise<void>;
      /** Pulls changes from the default remote into the current branch. */
      export function pull(): Promise<void>;
      /** Pulls changes from the default remote and rebases the current branch. */
      export function pullRebase(): Promise<void>;
      /** Opens a Quick Pick to select a specific remote and branch to pull from. */
      export function pullFrom(): Promise<void>;
      /** Pushes the current branch to the default remote. */
      export function push(): Promise<void>;
      /** Opens a Quick Pick to select a specific remote and branch to push to. */
      export function pushTo(): Promise<void>;
      /** Opens UI to add a new Git remote (Supports dynamic GitHub repo fetching). */
      export function addRemote(): Promise<void>;
      /** Opens a Quick Pick to safely remove an existing remote. */
      export function removeRemote(): Promise<void>;
    }

    // ─── UI CONTROLS ───
    export namespace ui {
      /** Opens the master Branch Palette displaying branches, actions, and settings. */
      export function openBranchPalette(): Promise<void>;
      /** Programmatically sets the text in the Source Control commit input box. */
      export function setCommitMessage(msg: string): void;
      /** Toggles the visibility of the repositories section in the Source Control panel. */
      export function toggleRepositories(): void;
      /** Toggles the visibility of the changes section in the Source Control panel. */
      export function toggleChanges(): void;
      /** Changes how files are sorted in the Source Control view. */
      export function setSortMode(mode: GitSortMode): void;
    }

  }
}