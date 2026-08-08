// types/modules/workspace/recent.d.ts

declare module '@mscode/api' {

  /** Represents a previously opened workspace project. */
  export interface RecentWorkspace {
    /** The display name of the workspace project. */
    name: string;
    /** The absolute file system path of the workspace. */
    path: string;
    /** Timestamp of when it was last opened (in milliseconds). */
    lastOpened: number;
  }

  /** Represents a folder that the user has explicitly bookmarked. */
  export interface BookmarkFolder {
    /** The display name of the bookmarked folder. */
    name: string;
    /** The absolute file system path of the bookmark. */
    path: string;
  }

  export namespace workspace {
    
    /**
     * Retrieves the list of all recently opened workspaces.
     * The list is automatically sorted from most recent to oldest.
     * * @example
     * const recents = mscode.workspace.recentWorkspaces;
     * if (recents.length > 0) {
     * console.log(`Last worked on: ${recents[0].name}`);
     * }
     */
    export const recentWorkspaces: RecentWorkspace[];

    /**
     * Retrieves the list of all user-saved bookmarked folders.
     */
    export const bookmarks: BookmarkFolder[];

    /**
     * Adds a new project or workspace to the recent history tracking.
     * If the path already exists, it is bumped to the top of the list.
     * * @param name The display name of the project.
     * @param path The absolute file system path.
     */
    export function addRecentWorkspace(name: string, path: string): Promise<void>;

    /**
     * Wipes the entire recent workspace history array from disk storage.
     */
    export function clearRecentWorkspaces(): Promise<void>;

    /**
     * Adds a directory path to the user's saved bookmarks.
     * Bookmarks typically appear pinned in the explorer or dashboard.
     * * @param name The display name of the bookmarked folder.
     * @param path The absolute system path to bookmark.
     */
    export function addBookmark(name: string, path: string): Promise<void>;

    /**
     * Removes a directory path from the user's saved bookmarks.
     * * @param path The exact file system path to remove.
     */
    export function removeBookmark(path: string): Promise<void>;

  }
}