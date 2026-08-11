// src/core/extensionAPI/modules/lspModule.ts

import { lspProcessManager } from '@/features/lsp/LspProcessManager';

export interface LspServerConfig {
  /** Array of package names to install via the system package manager (e.g., 'pkg i'). */
  packages: string[];
  /** Optional shell commands to run after packages are installed (e.g., 'pip install'). */
  postInstall?: string[];
  /** Shell command to check if the server is already installed. Must return exit code 0. */
  checkCmd: string;
  /** The shell command that boots the LSP server process using standard I/O. */
  serverCmd: string;
  /** Optional: map workspace settings → feature / initialization options (used by useLspSync). */
  resolveOptions?: (settings: Record<string, unknown>) => Record<string, unknown>;
}

export const createLspModule = (_extId: string) => ({

    /**
     * Registers a language server for one or more language IDs.
     * Process start is done by useLspSync when a matching document is focused
     * (or by lsp.startServer if an extension boots eagerly).
     */
    registerServer: (languages: string[], config: LspServerConfig) => {
      languages.forEach(lang => {
        lspProcessManager.registerDynamicConfig(lang, config);
      });

      return {
        dispose: () => {
          languages.forEach(lang => {
            lspProcessManager.stopServer(lang);
            lspProcessManager.removeDynamicConfig(lang);
          });
        }
      };
    },

    /**
     * Unregisters and stops servers for the given language IDs.
     */
    unregisterServer: (languages: string[]): void => {
      languages.forEach(lang => {
        lspProcessManager.stopServer(lang);
        lspProcessManager.removeDynamicConfig(lang);
      });
    },

    /**
     * Install (if needed) and spawn the language server.
     * Normally useLspSync calls this; extensions may call it for eager boot.
     */
    startServer: (language: string): Promise<number | null> => {
      return lspProcessManager.startServer(language);
    },

    /**
     * Stop one language server, or all if `language` is omitted.
     */
    stopServer: (language?: string): void => {
      lspProcessManager.stopServer(language);
    },
});

export type LspModule = ReturnType<typeof createLspModule>;
