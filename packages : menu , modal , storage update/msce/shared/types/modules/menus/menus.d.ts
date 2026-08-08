// types/modules/menus/menus.d.ts

declare module '@mscode/api' {

  /**
   * Represents a dynamically resolvable node in the hierarchical context menu tree.
   * Supports nested submenus, toggles, keyboard shortcuts, and conditional visibility.
   */
  export interface MenuItem {
    /** Unique identifier for the menu item or the option anchor. */
    id: string;
    
    /** Designates if this node is a clickable item or a visual separator. */
    type?: 'item' | 'separator';
    
    /** Display text for the menu option. */
    label?: string;
    
    /** Codicon identifier or React node for the icon. */
    icon?: string | any;
    
    /** Displays a checkmark next to the item if true. */
    checked?: boolean;
    
    /** Greys out the item and prevents interaction if true. */
    disabled?: boolean;
    
    /** Visual hint for the keyboard shortcut (e.g., 'Ctrl+S'). */
    shortcut?: string;
    
    /** Additional sub-text displayed below or next to the label. */
    description?: string;
    
    /** Context key expression (e.g., 'editorFocus && isMac') determining visibility. */
    when?: string | boolean;
    
    /** If true, the parent menu only shows if it contains active, visible child options. */
    showOnlyWhenSubOptionAvailable?: boolean;
    
    /** 
     * Nested array of sub-menu items. 
     * **Auto-Flattening:** If an item has exactly ONE child, it flattens into a direct action button.
     */
    children?: MenuItem[];
    
    /** Execution callback triggered when the item is clicked. */
    onClick?: (data?: any) => void;
    
    /** Custom payload data passed back into the onClick handler. */
    data?: any;
    
    /** Sorting weight determining the display order (lower numbers appear first). */
    order?: number; 
    
    /** Arrays of view IDs where this specific menu item should be restricted to render. */
    views?: any[]; 
    
    /** Forces the item to render flat in toolbars instead of nesting inside a dropdown. */
    flat?: boolean | number; 
  }

  export namespace menus {
    
    /**
     * Registers a single dynamic menu item into a named menu path (Panel ID).
     * 
     * **Advanced Progressive/Deep Merge Override System:**
     * - If multiple extensions register an item to the SAME `menuPath` and `id`, they do NOT overwrite each other blindly. Instead, they merge!
     * - **Implicit Children Rule:** If you pass an `onClick` directly to a parent without any children, the system automatically wraps it into a virtual child.
     * - **Auto-Flattening (The Magic Rule):** If an Option ID contains EXACTLY ONE child, it "flattens" out and acts as a direct Action Button. If it has MORE THAN ONE child, the parent morphs into a Sub-Menu (Dropdown) automatically.
     * 
     * @param menuPath Target Panel ID (e.g., 'editor/title', 'editor/context', 'sidebar/files/file-tree/actions').
     * @param item Defines the action, icon, submenu (children), ordering, and structural flatness.
     * @returns A disposable object to remove the item on extension deactivation.
     * 
     * @example
     * // SCENARIO 1: The Proper Way
     * // Result: Shows a direct 'Play' icon because Auto-Flattening kicks in for single children.
     * import { menus, commands } from '@mscode/api';
     * 
     * const disposable = menus.registerItem('editor/title', {
     *   id: 'coderunner.run-btn',
     *   label: 'Run Code',
     *   icon: 'play',
     *   children: [{
     *     id: 'coderunner.run-action',
     *     label: 'Run with Code Runner',
     *     order: 10, 
     *     onClick: () => commands.executeCommand('coderunner.run')
     *   }]
     * });
     * 
     * @example
     * // SCENARIO 2: Extending an Existing Button (Deep Merge Magic)
     * // Result: The single 'Play' button instantly transforms into a Dropdown Menu containing TWO options!
     * import { menus, commands } from '@mscode/api';
     * 
     * menus.registerItem('editor/title', {
     *   id: 'coderunner.run-btn',
     *   children: [{
     *     id: 'other-ext.run-in-terminal',
     *     label: 'Run in Terminal',
     *     order: 20,
     *     onClick: () => commands.executeCommand('other.terminalRun')
     *   }]
     * });
     */
    export function registerItem(menuPath: string, item: MenuItem): { dispose: () => void };

    /**
     * Registers multiple dynamic menu items or complete blocks (with separators) 
     * into a named menu path at once.
     * 
     * @param menuPath Target Panel ID (e.g., 'editor/title', 'editor/context').
     * @param items Array of MenuItem objects including separators.
     * @returns A batch disposable to clean up all injected items on extension deactivate.
     */
    export function registerItems(menuPath: string, items: MenuItem[]): { dispose: () => void };

  }
}