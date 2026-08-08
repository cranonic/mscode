// types/modules/languages/formatter.d.ts

declare module '@mscode/api' {
  export namespace languages {

    export interface FormattingOptions {
      /** Size of a tab in spaces. */
      tabSize: number;
      /** Prefer spaces over tabs. */
      insertSpaces: boolean;
    }

    export interface CancellationToken {
      readonly isCancellationRequested: boolean;
      readonly onCancellationRequested: (listener: (e: any) => any) => Disposable;
    }

    export interface TextEdit {
      /** The range of the text document to be manipulated. */
      range: any; // Note: Uses standard document range object
      /** The string to be inserted. For delete operations use an empty string. */
      text: string;
    }

    /**
     * The document formatting provider interface defines the contract between extensions and
     * the formatting-feature.
     */
    export interface DocumentFormattingEditProvider {
      /**
       * Provide formatting edits for a whole document.
       * * @param model The document in which the command was invoked.
       * @param options Options controlling formatting.
       * @param token A cancellation token.
       * @returns An array of text edits describing the formatting changes.
       */
      provideDocumentFormattingEdits(
        model: any, 
        options: FormattingOptions, 
        token: CancellationToken
      ): TextEdit[] | Promise<TextEdit[]>;
    }
    
    /**
     * Registers a code formatter for a specific language.
     * * @param languageId The language identifier (e.g., 'javascript', 'cpp').
     * @param provider The formatting provider implementation.
     * @returns A disposable object that unregisters the provider when disposed.
     */
    export function registerDocumentFormattingEditProvider(
      languageId: string, 
      provider: DocumentFormattingEditProvider
    ): Disposable;
  }
}