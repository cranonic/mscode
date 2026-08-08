// types/modules/search/search.d.ts

declare module '@mscode/api' {

  /**
   * Represents an individual text match found within a file.
   */
  export interface SearchMatch {
    /** Unique identifier for this specific match occurrence. */
    id: string;
    /** The 1-based line number where the match occurred. */
    line: number;
    /** The 1-based column number where the match begins. */
    column: number;
    /** A small text snippet of the line containing the match (used for UI preview). */
    preview: string;
    /** The zero-based index of the match within the preview string. */
    matchStart: number;
    /** The character length of the matched text. */
    matchLength: number;
  }

  /**
   * Represents a file that contains one or more search matches.
   */
  export interface SearchFileResult {
    /** Absolute canonical path to the file. */
    filePath: string;
    /** The base name of the file (e.g., 'index.ts'). */
    fileName: string;
    /** The parent directory path of the file. */
    dirPath: string;
    /** Array of all matches discovered within this specific file. */
    matches: SearchMatch[];
    /** UI State: Whether the file's match list is expanded in the sidebar. */
    expanded: boolean;
  }

  /**
   * Constraints and filters applied when executing a search query.
   */
  export interface FindOptions {
    /** The literal text or regular expression to search for. */
    query: string;
    /** Whether the search should strictly match casing (e.g., 'A' != 'a'). */
    matchCase?: boolean;
    /** Whether the search should only match full, isolated words. */
    wholeWord?: boolean;
    /** Evaluates the query string as a Regular Expression if true. */
    useRegex?: boolean;
    /** Array of glob patterns defining files to exclusively search inside (e.g., `['*.ts', 'src/**']`). */
    includes?: string[];
    /** Array of glob patterns defining files or directories to skip (e.g., `['node_modules', '*.min.js']`). */
    excludes?: string[];
  }

  /**
   * Parameters required to perform a text replacement operation.
   */
  export interface ReplaceOptions {
    /** The text string that will replace the matched queries. */
    replacement: string;
    /** Optional target file. If omitted, applies the replacement across ALL files currently in the results. */
    filePath?: string;
    /** Optional target match ID. If omitted, applies the replacement to ALL matches inside the targeted file. */
    matchId?: string;
  }

  /**
   * Extended options for silent, programmatic background searches.
   */
  export interface SilentSearchOptions extends FindOptions {
    /** Optional override for the root directory to search within. Defaults to the active workspace. */
    basePath?: string;
  }

  export namespace search {
    
    /**
     * Executes a full-text search across the workspace and instantly displays the results 
     * in the IDE's Search Panel sidebar.
     * * @param opts Configuration options dictating the search constraints.
     * @returns A promise resolving to an array of populated file result objects.
     * * @example
     * const results = await mscode.search.findInFiles({
     * query: 'TODO:',
     * matchCase: true,
     * includes: ['*.ts']
     * });
     * mscode.window.showInformationMessage(`Found ${results.length} files with TODOs.`);
     */
    export function findInFiles(opts: FindOptions): Promise<SearchFileResult[]>;

    /**
     * Executes a text replacement operation modifying the physical file system.
     * Automatically updates the Search Panel UI to reflect dismissed matches.
     * * @param opts Options specifying the replacement text and target scopes.
     * * @example
     * // Replace ALL occurrences across the entire workspace
     * await mscode.search.replaceInFiles({ replacement: 'newFunctionName' });
     */
    export function replaceInFiles(opts: ReplaceOptions): Promise<void>;

    /**
     * Retrieves the current list of search results actively displayed in the Search Panel.
     * Does not trigger a new disk scan.
     */
    export function getResults(): SearchFileResult[];

    /**
     * Wipes all current search results from the UI and clears the cache.
     */
    export function clearResults(): void;

    /**
     * Runs a low-level, silent background search using the native OS engine.
     * **The Search Panel UI is NOT updated.** Perfect for internal extension logic 
     * like "Find All References", Rename Refactoring, or Dependency Analysis.
     * * @param opts Complete constraints including an optional custom base path.
     * @returns Array of matching file results.
     * * @example
     * const refs = await mscode.search.search({
     * query: 'function init()',
     * basePath: '/sdcard/Projects/Alternative'
     * });
     */
    export function search(opts: SilentSearchOptions): Promise<SearchFileResult[]>;

    /**
     * Calculates the absolute total number of individual text matches across all currently cached file results.
     * Useful for updating custom sidebar badges.
     */
    export function getTotalMatchCount(): number;

    /**
     * Retrieves the active search results specific to a targeted file path.
     * * @param filePath The absolute path to the file.
     * @returns The matching object containing the snippets, or undefined if no matches exist.
     */
    export function getResultsForFile(filePath: string): SearchFileResult | undefined;

  }
}