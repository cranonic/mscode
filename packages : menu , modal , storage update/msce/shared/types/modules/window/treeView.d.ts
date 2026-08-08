// types/modules/window/treeView.d.ts

declare module '@mscode/api' {

  /**
   * Represents an individual node within a custom Tree View.
   */
  export interface TreeItem {
    /** Unique identifier for the item. */
    id: string;
    
    /** Primary text displayed for the node. */
    label: string;
    
    /** Dimmed text displayed after the label. */
    description?: string;
    
    /** Icon name (matches your IconRegistry) to display alongside the item. */
    icon?: string;
    
    /** Small text badge (e.g., '3', 'M') displayed at the end of the row. */
    badge?: string;
    
    /** CSS color for the badge (e.g., '#ff0000', 'var(--ms-error)'). */
    badgeColor?: string;
    
    /** Tooltip displayed when the user hovers over the item. */
    tooltip?: string;
    
    /** Dictates whether this node has children and its initial visual state. */
    collapsibleState: 'none' | 'collapsed' | 'expanded';
    
    /** Context value used for registering right-click context menus later. */
    contextValue?: string;
  }

  /**
   * Dynamic data-source abstraction layer feeding nested labels, icons, badges, 
   * and async child streams to the UI.
   */
  export interface TreeDataProvider {
    /** * Called to get root items (if element is undefined) or children of a specific item. 
     * @param element The parent item, or undefined if requesting the root elements.
     * @returns A promise resolving to an array of TreeItems.
     */
    getChildren(element?: TreeItem): Promise<TreeItem[]>;

    /** * Optional: Triggered when the user clicks on a tree item.
     * @param item The item that was clicked.
     */
    onItemClick?: (item: TreeItem) => void;
  }

  /**
   * Metadata configuration settings supplied by extensions during custom Tree initialization.
   */
  export interface TreeViewOptions {
    /** The data provider that supplies the tree data. */
    treeDataProvider: TreeDataProvider;
    
    /** Natural text caption rendered visible to users inside the sidebar header. */
    title?: string;
  }

  /**
   * Handle contract returned to extensions when instantiating a custom tree interface.
   * Exposes standard lifecycle modifiers allowing plugins to dynamically control states.
   */
  export interface TreeView {
    /** The unique channel identifier matching this structural panel slot. */
    readonly id: string;

    /** Title text rendered dynamically inside the sidebar container panel wrapper. */
    title: string;

    /** Safe destructor sequence removing this tree container context immediately from the core system state. */
    dispose(): void;
  }

  export namespace window {
    
    /**
     * Allocates and hooks a stateful, data-agnostic tree container view into the application framework.
     * Leverages the `GenericTreeView` visual component upstream by binding the target data provider.
     * * @param viewId The unique structural registration target path across the layout mapping coordinates.
     * @param options Core tracking attributes configuration holding providers and descriptors.
     * @returns An instantiated state handle conforming to the strict structural `TreeView` contract.
     * * @example
     * const myDatabaseTree = mscode.window.createTreeView('mySqlExplorerView', {
     * title: 'SQL Database Explorer',
     * treeDataProvider: {
     * getChildren: async (element) => {
     * if (!element) return [{ id: 'cluster-1', label: 'Production', collapsibleState: 'expanded' }];
     * return [{ id: 'table-users', label: 'Users', collapsibleState: 'none', icon: 'file' }];
     * },
     * onItemClick: (item) => mscode.window.showInformationMessage(`Clicked: ${item.label}`)
     * }
     * });
     */
    export function createTreeView(viewId: string, options: TreeViewOptions): TreeView;
    
  }
}