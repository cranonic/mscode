// types/modules/window/terminal.d.ts

declare module '@mscode/api' {

  export interface TerminalExitStatus {
    /** The exit code of the terminal process. */
    readonly code: number;
  }

  export interface TerminalOptions {
    /** The visual display label mapping header title. */
    name?: string;
    /** The target absolute working directory file path workspace root directory. */
    cwd?: string;
    /** Overriding path specification targeting alternative binary shells (e.g., 'bash', 'sh'). */
    shell?: string;
    /** Dictates whether layout viewports instantly focus-shift elements into place. @default true */
    show?: boolean;
  }

  /**
   * Represents a discrete, configurable terminal workspace execution layer instance.
   */
  export interface Terminal {
    /** The unique identifier assigned to this terminal session. */
    readonly id: string;
    
    /** The human-readable display name of the terminal tab. */
    readonly name: string;
    
    /**
     * Retrieves the system process identifier (PID) asynchronously.
     * @returns Resolves to the process ID, or -1 if unallocated.
     */
    readonly processId: Promise<number>;
    
    /**
     * The current exit status metadata if the process has terminated.
     * @returns Object containing the exit code, or undefined if still active.
     */
    readonly exitStatus: TerminalExitStatus | undefined;
    
    /** The configuration properties utilized to initialize this terminal session. */
    readonly creationOptions: Readonly<{ name: string; cwd: string; shell: string }>;

    /**
     * Focuses and brings the terminal panel instance into view in the layout.
     * @param preserveFocus - Optional configuration parameter to retain code editor focus.
     */
    show(preserveFocus?: boolean): void;
    
    /** Hides the terminal panel if it is currently focused, switching view hierarchies. */
    hide(): void;
    
    /**
     * Evaluates and transmits a string command payload to the underlying shell process instance.
     * Features built-in sequential buffering delays to gracefully support lazy booting processes.
     * * @param text - The raw text command string payload.
     * @param addNewLine - Appends a carriage return (`\r`) execution line-break delimiter when true. Defaults to true.
     */
    sendText(text: string, addNewLine?: boolean): void;
    
    /** Requests the underlying stream engine to clear terminal screen buffers. */
    clear(): void;
    
    /** Terminates the stream, triggers standard OS signaling cleanup traps, and releases store allocation. */
    dispose(): void;
  }

  export namespace window {
    
    /** Array of all existing terminals registered in the environment. */
    export const terminals: Terminal[];
    
    /** The currently focused active terminal element. */
    export const activeTerminal: Terminal | undefined;

    /**
     * Spawns a discrete, configurable terminal workspace execution layer instance window.
     * * @param options Pass a simple title string layout name or configuration properties directly.
     * @returns The public descriptor interface structure handles matching instance hooks.
     * * @example
     * const term = mscode.window.createTerminal({ name: "Build Server", shell: "bash" });
     * term.show();
     * term.sendText("npm run build");
     */
    export function createTerminal(options?: string | TerminalOptions): Terminal;

    /** Fires an event callback handler whenever a new terminal tab container gets created. */
    export function onDidOpenTerminal(handler: (terminal: Terminal) => void): Disposable;
    
    /** Fires an event callback handler tracing historical instance context structures right as closures execute. */
    export function onDidCloseTerminal(handler: (terminal: { id: string; exitCode?: number }) => void): Disposable;
    
    /** Fires an event callback notification updating execution parameters when an index changes panel viewport assignments. */
    export function onDidChangeActiveTerminal(handler: (terminal: Terminal | undefined) => void): Disposable;
  }
}