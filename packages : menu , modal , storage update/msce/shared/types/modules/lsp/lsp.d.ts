// types/modules/lsp/lsp.d.ts

declare module '@mscode/api' {

  /**
   * Configuration required to provision, install, and boot a native Language Server 
   * securely on the user's local device (via background Termux/Alpine containers).
   */
  export interface LspServerConfig {
    /**
     * Shell command to check if the server binary is already installed.
     * The system uses this to skip installation. Must exit with code 0 if present.
     * * @example 'rust-analyzer --version'
     */
    checkCmd: string;

    /**
     * System packages required to install the server if `checkCmd` fails.
     * These will be downloaded automatically via the native package manager (`apk add`).
     * * @example ['rust-analyzer', 'cargo']
     */
    packages: string[];

    /**
     * Optional setup commands to run after system packages are installed.
     * Useful for language-specific package managers.
     * * @example ['npm install -g pyright']
     */
    postInstall?: string[];

    /**
     * The command to boot the LSP server. 
     * The system will bind this process's standard input/output (stdio) to the Monaco Editor.
     * * @example 'rust-analyzer'
     */
    serverCmd: string;
  }

  export namespace lsp {
    
    /**
     * Registers and provisions a native Language Server Protocol (LSP) backend.
     * MS Code will automatically download dependencies, boot the process in the background, 
     * and bind it to the editor when the specified languages are opened.
     * * @param languages Array of Monaco language IDs this server handles (e.g., ['rust', 'c']).
     * @param config The shell execution and installation metadata.
     * @returns A disposable object to gracefully terminate and unregister the server.
     * * @example
     * ```typescript
     * const rustLsp = mscode.lsp.registerServer(['rust'], {
     * checkCmd: 'rust-analyzer --version',
     * packages: ['rust-analyzer'],
     * serverCmd: 'rust-analyzer'
     * });
     * * // In your deactivate function:
     * // rustLsp.dispose();
     * ```
     */
    export function registerServer(languages: string[], config: LspServerConfig): Disposable;

    /**
     * Manually unregisters a previously configured language server.
     * Disconnects active WebSocket bindings and terminates the background process.
     * * @param languages Array of Monaco language IDs to detach.
     */
    export function unregisterServer(languages: string[]): void;

  }
}