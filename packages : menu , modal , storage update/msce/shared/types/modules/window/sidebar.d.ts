// types/modules/window/sidebar.d.ts

declare module '@mscode/api' {
  import * as React from 'react';

  // ─── TYPES & INTERFACES ───────────────────────────────────────────────────

  export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

  export interface SidebarSectionContext {
    height: number | 'auto';
    expanded: boolean;
  }

  export type SidebarSectionContent =
    | React.ReactNode
    | React.ComponentType<any>
    | ((ctx: SidebarSectionContext) => React.ReactNode);

  export interface SidebarSectionDef {
    id: string;
    /** Empty string '' → static block (no collapsible) */
    title: string | React.ReactNode;   
    content: SidebarSectionContent;
    hidden?: boolean;

    // ── Layout ──
    /** @default true */
    defaultExpanded?: boolean;   
    /** flex:1 — only one section per panel */
    fillHeight?: boolean;   
    /** px or 'auto', @default 150 */
    defaultHeight?: number | 'auto';  
    /** Max limit when height is 'auto' */
    maxHeight?: number;           
    minHeight?: number;

    // ── Scroll & Sticky ──
    /** @default false */
    scrollX?: boolean;           
    sticky?: boolean;
    stickyTop?: number;
    stickyZIndex?: number;

    // ── Actions ──
    /** Menu items injected into the section header. */
    actions?: MenuItem[];
    /** @default 3 */
    maxOverflow?: number;       
  }

  export interface SidebarPanelHeader {
    title: string;
    actions?: MenuItem[];
    maxOverflow?: number;
  }

  export interface SidebarPanelDef {
    activityBarId: string;
    header?: SidebarPanelHeader;
    sections: SidebarSectionDef[];
  }

  // ─── SIDEBAR NAMESPACE ────────────────────────────────────────────────────

  export namespace window {
    
    /**
     * Full control over the IDE sidebar — layout state, panel focus,
     * custom section registration, dynamic action injection, and event tracking.
     */
    export namespace sidebar {

      // ── 1. PANEL & SECTION STRUCTURE ──

      /**
       * Register a complete sidebar panel tied to an ActivityBar icon.
       * * @param panelDef Panel configuration.
       * @returns A disposable object to unregister the panel cleanly.
       */
      export function registerPanel(panelDef: SidebarPanelDef): Disposable;

      /**
       * Dynamically inject a collapsible section into an existing panel.
       * * @param activityBarId Target panel id (e.g. 'files', 'git')
       * @param sectionDef Section configuration
       * @returns A disposable to remove the section cleanly.
       */
      export function addSection(activityBarId: string, sectionDef: SidebarSectionDef): Disposable;

      /** Remove a section from a panel. */
      export function removeSection(activityBarId: string, sectionId: string): void;

      /**
       * Patch any properties of an existing section without replacing it entirely.
       * Common uses: swap the content component, change title, update actions.
       */
      export function updateSection(activityBarId: string, sectionId: string, patch: Partial<SidebarSectionDef>): void;

      /**
       * Show or hide a section without removing it from the registry.
       */
      export function setSectionVisibility(activityBarId: string, sectionId: string, visible: boolean): void;

      // ── 2. ACTION INJECTION ──

      /** Helpers to compute stable action group Menu IDs without magic strings. */
      export const menuId: {
        header: (activityBarId: string) => string;
        section: (activityBarId: string, sectionId: string) => string;
      };

      /**
       * Inject a single action into an existing section's action bar — or the panel header.
       * * @param targetMenuId Use `sidebar.menuId.*` helpers to get the right ID.
       * @param action A `MenuItem`.
       */
      export function addAction(targetMenuId: string, action: MenuItem): Disposable;

      /** Remove a previously injected action by its id. */
      export function removeAction(targetMenuId: string, actionId: string): void;

      // ── 3. VISIBILITY & FOCUS ──

      /** The id of the currently active panel (e.g. 'files', 'git', 'search'). */
      export const activePanel: string;

      /** Current sidebar layout state: 'expanded' | 'collapsed' | 'hidden'. */
      export const state: SidebarState;

      /** Programmatically set the sidebar layout state. */
      export function setState(newState: SidebarState): void;

      /** Focus a specific panel — opens the sidebar if it was hidden. */
      export function focusPanel(panelId: string): void;

      // ── 4. EVENTS ──

      /** Fires whenever the sidebar layout state changes. */
      export function onDidChangeState(handler: (state: SidebarState) => void): Disposable;

      /** Fires whenever the user switches to a different panel. */
      export function onDidChangeActivePanel(handler: (panelId: string) => void): Disposable;

      /** Fires when the user drags the sidebar resize handle. */
      export function onDidChangeWidth(handler: (width: number) => void): Disposable;
    }
  }
}