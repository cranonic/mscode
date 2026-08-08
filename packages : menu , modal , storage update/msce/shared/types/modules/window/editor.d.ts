// types/modules/window/editor.d.ts

declare module '@mscode/api' {
  
  // ─── TYPES & INTERFACES ───────────────────────────────────────────────────

  export interface Position {
    /** The 1-based line value. */
    line: number;
    /** The 1-based character/column value. */
    character: number;
  }

  export interface Selection {
    /** The start position of the selection. */
    start: Position;
    /** The end position of the selection. */
    end: Position;
  }

  export interface TextDocument {
    /** The associated URI for this document (e.g., 'file:///src/main.js'). */
    readonly uri: string;
    /** The file name without the path (e.g., 'main.js'). */
    readonly fileName: string;
    /** The identifier of the language associated with this document (e.g., 'javascript'). */
    readonly languageId: string;
    
    /**
     * Retrieves the complete text content of this document.
     * @returns The text of this document as a string.
     */
    getText(): string;
  }

  export interface TextEditorOptions {
    /** The size in spaces a tab takes. */
    tabSize: number;
    /** Whether spaces should be used instead of tabs. */
    insertSpaces: boolean;
  }

  /**
   * A complex edit that will be applied in one transaction on a TextEditor.
   * This is passed to the callback of the `TextEditor.edit` method.
   */
  export interface TextEditorEdit {
    /**
     * Insert text at a specific location.
     * @param line The 1-based line number.
     * @param column The 1-based column number.
     * @param text The text to insert.
     */
    insert(line: number, column: number, text: string): void;

    /**
     * Replace a certain text region with a new value.
     * @param startLine The 1-based start line number.
     * @param startCol The 1-based start column number.
     * @param endLine The 1-based end line number.
     * @param endCol The 1-based end column number.
     * @param text The new text to insert.
     */
    replace(startLine: number, startCol: number, endLine: number, endCol: number, text: string): void;
  }

  /**
   * Represents an active text editor in Mono Studio.
   * Gives access to the document content, cursor selection, and safe editing methods.
   */
  export interface TextEditor {
    /** The document associated with this text editor. */
    readonly document: TextDocument;
    /** The primary selection on this text editor. */
    readonly selection: Selection | null;
    /** The current cursor position (1-based index). */
    readonly cursor: { line: number, column: number };
    /** Text editor layout and indentation options. */
    readonly options: TextEditorOptions;

    /**
     * Perform an edit on the document associated with this text editor.
     * The edits are safely pushed to the editor's undo/redo stack.
     * 
     * @param callback A function that receives an `editBuilder` to queue modifications.
     * @returns `true` if the edit was successfully applied, `false` otherwise.
     * 
     * @example
     * const editor = mscode.window.activeTextEditor;
     * editor.edit((editBuilder) => {
     *   // Insert a console.log at line 1, column 1
     *   editBuilder.insert(1, 1, "console.log('Hello');\n");
     * });
     */
    edit(callback: (editBuilder: TextEditorEdit) => void): boolean;

    /**
     * ⚠️ ADVANCED / ESCAPE HATCH: Returns the raw underlying Monaco Editor instance.
     * Modifying the editor directly may bypass internal MS Code event listeners and cause memory leaks.
     * Use this ONLY when you need to access advanced native Monaco APIs (like decorations or widgets).
     * 
     * @example
     * const editor = mscode.window.activeTextEditor;
     * const monacoInstance = editor._rawMonacoEditor;
     * if (monacoInstance) {
     *    monacoInstance.focus();
     * }
     */
    readonly _rawMonacoEditor: any;
  }

  // ─── WINDOW NAMESPACE ─────────────────────────────────────────────────────

  export namespace window {
    /**
     * The currently active text editor or `undefined` if no code editor is open/focused.
     * 
     * @description
     * This is a **Getter property**, not a function. You do not need to call it with `()`.
     * It dynamically fetches the latest state directly from the Mono Studio Engine.
     * 
     * @example
     * // 1. Read document text
     * const editor = mscode.window.activeTextEditor;
     * if (editor) {
     *   console.log("Current file: ", editor.document.fileName);
     *   console.log("File content: ", editor.document.getText());
     * }
     * 
     * @example
     * // 2. Modify document text safely
     * const editor = mscode.window.activeTextEditor;
     * editor?.edit(builder => {
     *   builder.insert(1, 1, "// Created by Mono Studio\n");
     * });
     */
    export const activeTextEditor: TextEditor | undefined;
  }
}