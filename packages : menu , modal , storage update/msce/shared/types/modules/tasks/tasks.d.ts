// types/modules/tasks/tasks.d.ts

declare module '@mscode/api' {

  /**
   * Represents an actively running background task or shell process.
   */
  export interface TaskExecution {
    /** The raw shell command string that is currently executing. */
    readonly command: string;
    
    /** 
     * A promise that resolves when the background process finishes. 
     * It provides the final numerical exit code (0 usually means success). 
     */
    readonly result: Promise<{ exitCode: number }>;
    
    /** 
     * Forcefully terminates the running task process and stops all data streams. 
     */
    terminate(): void;
  }

  /**
   * Optional configuration parameters for background task execution.
   */
  export interface TaskOptions {
    /** 
     * The Current Working Directory (CWD) where the command should run.
     * Defaults to the active workspace root if omitted.
     */
    cwd?: string;
    
    /** 
     * The name of the Output Channel in the Termis panel where logs will be mirrored.
     * If omitted, a default channel named after the extension will be created.
     */
    outputChannel?: string;
  }

  export namespace tasks {
    
    /**
     * Executes a shell command in the background and pipes its stdout/stderr 
     * to a named Output Channel (visible in the Termis > Output panel).
     * The task will also be tracked in the active Tasks Panel UI.
     * * @param command The shell command to execute (e.g., 'npm run build').
     * @param options Execution constraints (cwd and channel mappings).
     * @returns A TaskExecution object to monitor or terminate the process.
     * * @example
     * const execution = mscode.tasks.runInBackground('npm install', {
     * outputChannel: 'NPM Installer'
     * });
     * * // Wait for completion
     * const { exitCode } = await execution.result;
     * if (exitCode === 0) {
     * mscode.window.showInformationMessage("Install complete!");
     * }
     */
    export function runInBackground(command: string, options?: TaskOptions): TaskExecution;

    /**
     * Executes a raw shell command with a direct data callback. 
     * This provides low-level control for extensions that need to parse terminal output 
     * chunk-by-chunk without necessarily displaying it to the user.
     * * @param cmd The raw shell command string.
     * @param cwd The absolute working directory path.
     * @param onData Callback fired every time the shell flushes stdout data chunks.
     * @param channel Optional channel name. Pass `false` for a completely silent, invisible background task.
     * @returns A TaskExecution object to monitor or terminate the process.
     * * @example
     * // Run a silent command to check system Python version
     * mscode.tasks.execute('python --version', mscode.workspace.workspacePath, (data) => {
     * console.log("Detected Python:", data);
     * }, false);
     */
    export function execute(
      cmd: string, 
      cwd: string, 
      onData: (data: string) => void, 
      channel?: string | false
    ): TaskExecution;

  }
}