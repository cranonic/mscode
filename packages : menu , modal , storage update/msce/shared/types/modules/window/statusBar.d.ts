// types/modules/window/statusBar.d.ts

declare module '@mscode/api' {
  import * as React from 'react';

  // ─── TYPES & INTERFACES ───────────────────────────────────────────────────

  export type StatusBarAlignment = 'left' | 'right';

  /**
   * Configuration object for registering a new Status Bar item.
   * This declarative pattern allows the IDE to evaluate visibility conditions
   * and layout constraints before rendering.
   */
  export interface StatusBarItemOptions {
    /** The universally unique identifier for this item (e.g., 'myExt.linter'). */
    id: string;
    /** The alignment position in the status bar. Defaults to 'left'. */
    alignment?: StatusBarAlignment;
    /** Layout priority. Higher numbers are placed closer to the outer edges. Defaults to 0. */
    priority?: number;

    /** The natural descriptive text displayed in the status bar. */
    label?: string;
    /** Codicon alphanumeric name string mapping the indicator icon next to text. */
    icon?: string;
    /** Hover tooltip text shown to the user. */
    tooltip?: string;
    /** Custom hexadecimal or CSS variable color applied to text/icons (e.g., 'var(--ms-error)'). */
    color?: string;
    /** If true, applies an infinite spin animation to the icon. */
    spin?: boolean;
    /** If true, the item is registered but unmounted from the DOM layout. */
    hidden?: boolean;
    
    /** 
     * Condition clause evaluated dynamically to determine if the item should be visible.
     * @example "activeTabType == 'code' && isWorkspaceOpen"
     */
    when?: string;

    /** Callback executed when the user clicks the status bar item. */
    onClick?: (e: React.MouseEvent) => void;

    /** Optional CSS class names for custom layout tracking. */
    className?: string;
    /** Optional inline CSS styles passed down to the root block. */
    style?: React.CSSProperties;
  }

  /**
   * Controller interface returned upon successfully registering a status bar item.
   * Allows dynamic, real-time patching of the item's properties.
   */
  export interface StatusBarItemController {
    /**
     * Dynamically patches specific properties of the status bar item.
     * @param patch An object containing only the properties you wish to update.
     * @example statusItem.update({ label: 'Parsing...', spin: true });
     */
    update(patch: Partial<Omit<StatusBarItemOptions, 'id'>>): void;
    
    /** Completely removes the item from the registry and frees up memory allocations. */
    dispose(): void;
  }

  // ─── STATUS BAR NAMESPACE ──────────────────────────────────────────────────

  export namespace window {
    
    /**
     * Controls the universal application status bar positioned at the bottom of the workbench.
     * Allows extensions to inject telemetry data, current states, and quick actions.
     */
    export namespace statusBar {
      
      /**
       * Registers a new item into the Mono Studio Status Bar.
       * 
       * @param options The declarative configuration of the status bar item.
       * @returns A controller object to update properties dynamically or safely dispose of the item.
       * 
       * @example
       * const linterStatus = mscode.window.statusBar.registerItem({
       *   id: 'linter',
       *   alignment: 'right',
       *   label: 'Linter: Ready',
       *   icon: 'check',
       *   when: "activeTabType == 'code'"
       * });
       * 
       * // Update state dynamically later:
       * linterStatus.update({ label: 'Linter: Error', color: 'var(--ms-error)', icon: 'warning' });
       */
      export function registerItem(options: StatusBarItemOptions): StatusBarItemController;
    }
  }
}