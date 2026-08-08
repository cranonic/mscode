// types/modules/window/activityBar.d.ts

declare module '@mscode/api' {
  import * as React from 'react';

  // ─── TYPES & INTERFACES ───────────────────────────────────────────────────

  /** Configuration for creating a new Activity Bar item */
  export interface ActivityBarItemOptions {
    /** Unique panel / action ID. Will be namespaced with the extension ID automatically. */
    id: string;
    /** Tooltip + default sidebar heading */
    label: string;
    /** Icon name passed to `<Icon>` */
    icon: string;
    /** Where the icon sits. @default 'top' */
    position?: 'top' | 'bottom';
    /** Priority for sorting. Lower number = higher up. @default 100 */
    priority?: number;
    
    /** 
     * If true, clicking this item toggles a sidebar panel. 
     * You must define the sidebar using `mscode.window.sidebar.registerSidebarPanel`.
     * @default false 
     */
    openSidebarContent?: boolean;
    
    /** The React component rendered inside the sidebar panel (legacy fallback). */
    content?: React.ComponentType<any>;
    
    /** Called every time the icon is clicked */
    onClick?: () => void;
    
    /** 
     * Condition clause evaluated dynamically to determine if the item should be visible.
     * @example "isWorkspaceOpen"
     */
    when?: string | boolean; 
  }

  // ─── ACTIVITY BAR NAMESPACE ───────────────────────────────────────────────

  export namespace window {
    
    /**
     * Controls the primary side container (Activity Bar) in Mono Studio.
     * Use this to contribute main navigation icons for your extension.
     */
    export namespace activityBar {
      
      /**
       * Registers a new item/icon to the Activity Bar.
       * Items registered here typically represent primary views (like Explorer, Search, or Git).
       * 
       * @param options - Configuration for the activity bar item.
       * @returns A disposable object to remove the item from the Activity Bar on deactivation.
       * 
       * @example
       * const myView = mscode.window.activityBar.registerItem({
       *   id: 'my-plugin',
       *   label: 'Plugin Manager',
       *   icon: 'package',
       *   openSidebarContent: true
       * });
       */
      export function registerItem(options: ActivityBarItemOptions): { dispose: () => void };

      /**
       * Event fired when the list of Activity Bar items changes 
       * (e.g., when an item is dynamically added or removed).
       * 
       * @param handler Callback receiving the updated array of items.
       * @returns A disposable to unsubscribe from the event.
       */
      export function onDidChangeItems(handler: (items: any[]) => void): { dispose: () => void };
    }
  }
}