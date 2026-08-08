// types/modules/commands/commands.d.ts

declare module '@mscode/api' {

  /**
   * Metadata defining how a command appears in the IDE's UI (e.g., Command Palette, Menus).
   */
  export interface CommandMetadata {
    /** The unique identifier of the command (e.g., 'myExtension.sayHello'). */
    id: string;
    
    /** * The human-readable title of the command. 
     * **Note:** If omitted, the command will NOT appear in the Command Palette.
     */
    title?: string;
    
    /** Grouping category shown in the Command Palette (e.g., 'File', 'Git'). */
    category?: string;
    
    /** Codicon name to display alongside the command in menus. */
    icon?: string;
    
    /** Keyboard shortcut hint (e.g., 'Ctrl+Shift+B'). Used purely for visual display. */
    shortcut?: string;
  }

  export namespace commands {
    
    /**
     * Registers a command that can be invoked via the Command Palette, Menus, or programmatically.
     * * @param id The unique identifier for the command.
     * @param handler The function to execute when the command is triggered.
     * @param meta Optional UI metadata (title, category) for the Command Palette.
     * @returns A disposable object to unregister the command upon deactivation.
     * * @example
     * // Register a hidden/internal command
     * mscode.commands.registerCommand('myExt.internalAction', (data) => process(data));
     * * // Register a visible command with UI metadata
     * const disposable = mscode.commands.registerCommand('myExt.sayHello', () => {
     * mscode.window.showInformationMessage('Hello World!');
     * }, {
     * title: 'Say Hello',
     * category: 'My Extension',
     * icon: 'sparkle'
     * });
     */
    export function registerCommand(
      id: string, 
      handler: (...args: any[]) => any, 
      meta?: Omit<CommandMetadata, 'id'>
    ): Disposable;

    /**
     * Registers a command using a unified configuration object.
     * * @param command An object combining the metadata and the execution handler.
     * @returns A disposable object to unregister the command upon deactivation.
     * * @example
     * mscode.commands.registerCommand({
     * id: 'myExt.build',
     * title: 'Build Project',
     * category: 'Compiler',
     * icon: 'tools',
     * execute: (target) => runBuild(target)
     * });
     */
    export function registerCommand(
      command: CommandMetadata & { execute: (...args: any[]) => any }
    ): Disposable;

    /**
     * Executes a registered command programmatically.
     * This can execute extension-provided commands OR native Monaco Editor actions 
     * (e.g., 'editor.action.formatDocument').
     * * @param id The unique identifier of the command to execute.
     * @param args Optional arguments to pass to the command handler.
     * @returns A promise that resolves with the returning value of the command handler.
     * * @example
     * // Execute a native editor action
     * await mscode.commands.executeCommand('editor.action.clipboardCopyAction');
     * * // Execute another extension's command and get the result
     * const result = await mscode.commands.executeCommand<string>('git.getCurrentBranch');
     */
    export function executeCommand<T = any>(id: string, ...args: any[]): Promise<T>;

  }
}