// types/modules/window/quickPick.d.ts

declare module '@mscode/api' {

  /**
   * Represents an item that can be selected from a Quick Pick palette.
   */
  export interface QuickPickItem {
    /** A unique identifier for the item. */
    id: string;
    
    /** The primary text displayed for the item. */
    label: string;
    
    /** A secondary description displayed underneath or next to the label. */
    description?: string;
    
    /** Additional detail displayed inline with the label. */
    inlineDetail?: string; 
    
    /** Text displayed at the far right of the item row. */
    suffix?: string;        
    
    /** Whether the item should be visually indented. */
    indent?: boolean;      
    
    /** Defines if this is a selectable item or a visual separator. */
    type?: 'item' | 'separator';
    
    /** Custom CSS class for the item's icon. */
    iconClass?: string;
    
    /** Codicon name to display on the left side (e.g., 'file', 'gear'). */
    leftIcon?: string;
    
    /** Codicon name to display on the right side. */
    rightIcon?: string;
    
    /** Keyboard shortcut hint to display (e.g., 'Ctrl+P'). */
    shortcut?: string;
    
    /** Visual focus styling. @default 'highlight' */
    focusStyle?: 'highlight' | 'normal';
    
    /** If true, selecting this item will NOT close the Quick Pick palette. */
    keepOpen?: boolean;
    
    /** If true, the item is displayed but cannot be selected. */
    readonly?: boolean;
    
    /** Callback fired when this specific item is selected. */
    onSelect?: () => void;
    
    /** Callback fired when this item is focused/highlighted via keyboard navigation. */
    onFocus?: () => void;
    
    /** Callback fired when the right icon is clicked. */
    onRightIconClick?: (e: any) => void;
    
    /** Optional custom data payload attached to the item. */
    data?: any;
  }

  export interface QuickPickOptions {
    /** Text to display in the input field as a hint. */
    placeHolder?: string;
  }

  export interface InputBoxOptions {
    /** Text to display in the input field as a hint. */
    placeHolder?: string;
  }

  export namespace window {
    
    /**
     * Shows a selection list to the user using the Command Palette UI.
     * * @param items An array of items, or a function that dynamically returns items based on the user's search query.
     * @param options Configuration options for the QuickPick.
     * @returns A promise that resolves to the selected item, or `undefined` if the user cancels.
     * * @example
     * const selected = await mscode.window.showQuickPick([
     * { id: '1', label: 'Create File', leftIcon: 'new-file' },
     * { id: '2', label: 'Delete File', leftIcon: 'trash' }
     * ], { placeHolder: 'Select an action...' });
     */
    export function showQuickPick(
      items: QuickPickItem[] | ((query: string) => QuickPickItem[]), 
      options?: QuickPickOptions
    ): Promise<QuickPickItem | undefined>;

    /**
     * Shows an input box to the user using the Command Palette UI.
     * * @param options Configuration options for the InputBox.
     * @returns A promise that resolves to the typed string, or `undefined` if the user cancels.
     * * @example
     * const name = await mscode.window.showInputBox({ placeHolder: 'Enter file name' });
     * if (name) console.log('User typed:', name);
     */
    export function showInputBox(options?: InputBoxOptions): Promise<string | undefined>;
  }
}