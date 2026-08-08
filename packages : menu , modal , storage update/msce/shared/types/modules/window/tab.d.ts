// types/modules/window/tab.d.ts

declare module '@mscode/api' {

  export interface TabDiffData {
    originalContent: string;
    modifiedContent: string | null;
    readOnly: boolean;
    filePath: string;
  }

  export type TabType = 'code' | 'extension' | 'page' | 'settings' | 'image' | 'welcome' | 'termis' | 'keybindings' | 'diff' | 'custom' | string;

  /**
   * Defines the schema for a workspace tab.
   */
  export interface Tab {
    /** Unique identifier for the tab (usually the file path). */
    id: string;
    /** The fundamental type/category of the tab. */
    type: TabType;
    /** The display name of the tab. */
    title: string;
    /** The underlying file path, if applicable. */
    filePath?: string;
    /** Codicon name to display next to the tab title. */
    icon?: string;
    /** Whether to show the editor's quick action bar. */
    showQuickBar?: boolean; 
    /** Whether to show the bottom status bar for this tab. */
    showStatusBar?: boolean;
    /** Whether to show the breadcrumb navigation. */
    showBreadcrumb?: boolean;
    /** Configuration for diff views (Split Editor). */
    diffData?: TabDiffData;
  }

  /** Configuration required to open a new tab. */
  export interface TabOptions extends Partial<Tab> {
    id: string;
    title: string;
    type: TabType;
  }

  export namespace window {
    
    /** Retrieves a list of all currently open tabs. */
    export const tabs: Tab[];

    /** Retrieves the currently active (focused) tab. */
    export const activeTab: Tab | undefined;

    /**
     * Opens a new tab or switches focus to it if it is already open.
     * * @param tabOptions Configuration for the tab. Must include 'id', 'title', and 'type'.
     * * @example
     * mscode.window.openTab({ 
     * id: '/src/main.js', 
     * title: 'main.js', 
     * type: 'code', 
     * filePath: '/src/main.js' 
     * });
     */
    export function openTab(tabOptions: TabOptions): void;

    /**
     * Closes a specific tab by its unique identifier.
     * * @param tabId The unique ID of the tab to be closed.
     */
    export function closeTab(tabId: string): void;

    /** Closes all currently open tabs at once. */
    export function closeAllTabs(): void;

    /**
     * Programmatically switches focus to a specific tab.
     * * @param tabId The unique ID of the tab to focus.
     */
    export function focusTab(tabId: string): void;
    
    /**
     * Registers a custom React component to render for a specific tab type.
     * @param type The unique identifier for this tab type.
     * @param component The React component.
     */
    export function registerCustomTab(type: string, component: any): { dispose: () => void };

    // ── EVENT LISTENERS ──

    /** Fired immediately after a new tab is opened. */
    export function onDidOpenTab(handler: (tab: Tab) => void): Disposable;

    /** Fired when a tab is closed. */
    export function onDidCloseTab(handler: (tabId: string) => void): Disposable;

    /** Fired when the user switches between tabs or when the active tab changes. */
    export function onDidChangeActiveTab(handler: (tab: Tab | undefined) => void): Disposable;
  }
}