// types/modules/workspace/workspace.d.ts

declare module '@mscode/api' {

  export interface WorkspaceFolder {
    /** The name of the workspace folder. */
    readonly name: string | null;
    /** The absolute file system path of the workspace folder. */
    readonly path: string | null;
  }

  export namespace workspace {
    
    /**
     * The name of the current workspace/folder.
     * Returns `undefined` if no workspace is currently active.
     * * @example
     * if (mscode.workspace.name) {
     * console.log("Working inside: ", mscode.workspace.name);
     * }
     */
    export const name: string | undefined;

    /**
     * The absolute file system path of the currently open workspace.
     * Returns `undefined` if no workspace is currently active.
     * * @example
     * const rootPath = mscode.workspace.workspacePath;
     * if (rootPath) {
     * const packageJson = `${rootPath}/package.json`;
     * }
     */
    export const workspacePath: string | undefined;

    /**
     * Programmatically loads and opens a new workspace folder in the IDE.
     * This will re-initialize the file explorer and set the new context.
     * * @param name The display name of the workspace.
     * @param path The absolute system path to the directory.
     * * @example
     * // Automatically open a cloned repository
     * mscode.workspace.openWorkspace('MyNewApp', '/sdcard/Projects/MyNewApp');
     */
    export function openWorkspace(name: string, path: string): void;

    /**
     * An event that is emitted when a workspace folder is opened or changed.
     * * @param handler A callback function that receives the new workspace data.
     * @returns A disposable to unregister the event listener.
     * * @example
     * const dispose = mscode.workspace.onDidChangeWorkspace((folder) => {
     * if (folder.path) {
     * mscode.window.showInformationMessage(`Workspace switched to ${folder.name}`);
     * }
     * });
     */
    export function onDidChangeWorkspace(handler: (folder: WorkspaceFolder) => void): Disposable;

  }
}