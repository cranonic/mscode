// types/modules/window/fileDecorations.d.ts

declare module '@mscode/api' {
  
  /**
   * Metadata configuration schema representing visual decorations applied onto Tree Nodes.
   * Used extensively by File Trees and Explorer Custom Views to append status metrics
   * (e.g., Git Modifications 'M', New Untracked files 'U', Linting/Syntax Errors '!', or warnings).
   */
  export interface FileDecoration {
    /** 
     * Short text badge displayed trailing or adjacent to the node label.
     * @example 'M' for Modified, 'U' for Untracked, '!' for Compilation Errors.
     */
    badge: string;

    /** 
     * CSS-compliant color declaration token or design system CSS variable.
     * Applied dynamically onto the node item's string label and badge foreground.
     * @example 'var(--ms-git-modified-color)' or '#f1c40f'
     */
    color: string;

    /** Optional descriptive text string popped up whenever the cursor hovers atop the node row. */
    tooltip?: string;

    /** 
     * Hierarchical propagation control toggle.
     * If flagged `true`, parent directories/containers wrapping this target node will bubble up 
     * and inherit ambient dot markers or partial tint overlays inside the Tree layout.
     */
    propagate?: boolean;
  }

  export namespace window {
    
    /**
     * API for managing file and folder decorations in the Explorer and Custom Tree Views.
     */
    export namespace fileDecorations {
      
      /**
       * Set a decoration badge on a file or folder path.
       *
       * @example
       * mscode.window.fileDecorations.set('/src/App.tsx', {
       *   badge:    'M',
       *   color:    '#e2c08d',   // yellow — modified
       *   tooltip:  'Modified',
       *   propagate: true,       // parent folders will show a dot
       * });
       */
      export function set(path: string, decoration: FileDecoration): void;

      /**
       * Set decorations for many paths at once.
       * Ideal after a full `git status` scan.
       *
       * @example
       * mscode.window.fileDecorations.setBulk({
       *   '/src/App.tsx':    { badge: 'M', color: '#e2c08d', tooltip: 'Modified',  propagate: true },
       *   '/src/NewFile.ts': { badge: 'U', color: '#73c991', tooltip: 'Untracked', propagate: true },
       *   '/src/Deleted.ts': { badge: 'D', color: '#f44747', tooltip: 'Deleted',   propagate: true },
       * });
       */
      export function setBulk(entries: Record<string, FileDecoration>): void;

      /**
       * Remove the decoration from a single path.
       */
      export function clear(path: string): void;

      /**
       * Remove all decorations (e.g. when user closes a git extension).
       */
      export function clearAll(): void;

      /**
       * Read the current decoration for a path.
       * Useful for internal checks or verifying existing states before overwriting.
       */
      export function get(path: string): FileDecoration | null;
      
    }
  }
}