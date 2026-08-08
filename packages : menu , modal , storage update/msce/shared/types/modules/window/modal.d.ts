// types/modules/window/modal.d.ts

declare module '@mscode/api' {
  
  /**
   * Options blueprint required to spin up a global workflow message prompt.
   */
  export interface ModalOptions {
    /** Title header text shown on the confirmation window framework. */
    title: string;
    
    /** Contextual body content or descriptive message context. */
    message: string;
    
    /** Optional icon descriptor from the core glyph registry. */
    iconName?: string;
    
    /**
     * Action triggers rendered dynamically inside the dialog action frame.
     * @example ['Yes', 'No', 'Cancel']
     */
    buttons?: string[];
  }

  export namespace window {
    /**
     * Displays a modal dialog and returns a promise that resolves when the user interacts with it.
     * * @param options Configuration for the modal (title, message, buttons, etc.).
     * @returns A promise resolving to the string value of the clicked button or `null` if dismissed.
     * * @example
     * const response = await window.showModalDialog({
     * title: "Delete File",
     * message: "Are you sure you want to permanently delete this file?",
     * iconName: "warning",
     * buttons: ["Delete", "Cancel"]
     * });
     * * if (response === "Delete") {
     * // Execute delete logic
     * }
     */
    export function showModalDialog(options: ModalOptions): Promise<string | null>;
  }
}