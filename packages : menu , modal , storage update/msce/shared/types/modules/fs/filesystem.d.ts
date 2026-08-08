// types/modules/fs/filesystem.d.ts

declare module '@mscode/api' {

  /**
   * Normalized directory snapshot metadata record.
   * Represents standard file or folder attributes returned during traversal passes.
   */
  export interface FileStat {
    /** The natural name of the node including extensions (e.g., 'index.tsx' or 'styles'). */
    name: string;
    /** Complete absolute canonical layout path target (e.g., '/sdcard/project/index.tsx'). */
    path: string;
    /** Flags whether the current node represents a container directory layout branch. */
    isDirectory: boolean;
  }

  export interface WriteOptions {
    /** Create intermediate directories if they do not exist. @default true */
    recursive?: boolean;
  }

  export interface CopyOptions {
    /** Overwrite the destination if it already exists. @default true */
    overwrite?: boolean;
  }

  /**
   * Primary Core File System API.
   * Gives extensions platform-agnostic access to read, write, and manipulate the workspace file system.
   */
  export interface FileSystemAPI {
    /**
     * Lists the entries inside a directory.
     * Returns an empty array (never throws) when the path does not exist.
     * * @example
     * const entries = await mscode.fs.readDir('/sdcard/project/src');
     * const tsFiles = entries.filter(e => !e.isDirectory && e.name.endsWith('.ts'));
     */
    readDir(path: string): Promise<FileStat[]>;

    /**
     * Reads a file's content.
     * Returns raw UTF-8 string for code files, and a Base64 encoded string for binary/image files.
     * * @example
     * const json = await mscode.fs.readFile('/sdcard/project/package.json');
     */
    readFile(path: string): Promise<string>;

    /**
     * Reads a file and parses it as JSON securely in one step.
     * Throws a descriptive error when the file is missing or malformed.
     */
    readJson<T = unknown>(path: string): Promise<T>;

    /**
     * Writes (or overwrites) a file. Parent directories are created automatically.
     * * @param path Absolute target file path.
     * @param content Raw string or Base64 (for binary files) to save.
     */
    writeFile(path: string, content: string, options?: WriteOptions): Promise<void>;

    /**
     * Serializes a JavaScript value to JSON and writes it to a file securely.
     */
    writeJson(path: string, value: unknown, indent?: number): Promise<void>;

    /**
     * Creates a directory (and any missing parent chains automatically).
     */
    mkdir(path: string): Promise<void>;

    /**
     * Renames or moves a file or directory.
     * * @example
     * await mscode.fs.rename('/sdcard/old.ts', '/sdcard/new.ts');
     */
    rename(oldPath: string, newPath: string): Promise<void>;

    /**
     * Recursively copies a file or directory.
     * Safely clones non-empty directories along with their child contents.
     */
    copy(fromPath: string, toPath: string, options?: CopyOptions): Promise<void>;

    /**
     * Recursively deletes a file or directory.
     * Silently succeeds when the path does not exist to avoid strict disruption.
     */
    delete(path: string): Promise<void>;

    /**
     * Checks whether a path currently exists (can be a file or a directory).
     * * @example
     * if (await mscode.fs.exists('/sdcard/project/.git')) {
     * // Git repository detected
     * }
     */
    exists(path: string): Promise<boolean>;

    /**
     * Returns basic metadata for a path without reading its full memory content.
     * Returns `null` when the targeted path does not exist.
     */
    stat(path: string): Promise<FileStat | null>;

    /**
     * Recursively lists ALL files under a directory (directories themselves are excluded).
     * Extremely useful for deep workspace searches or building syntax indexing trees.
     */
    walk(dirPath: string): Promise<string[]>;
  }

  // 🚀 FIX: Using a typed constant instead of a namespace to allow the 'delete' keyword!
  export const fs: FileSystemAPI;
}