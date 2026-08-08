// types/modules/languages/symbols.d.ts

declare module '@mscode/api' {
  
  /**
   * Kinds of document symbols. Represents the structural classification of a code token.
   * Aligns with Monaco Editor's and VS Code's internal language server specifications.
   */
  export enum SymbolKind {
    File = 0,
    Module = 1,
    Namespace = 2,
    Package = 3,
    Class = 4,
    Method = 5,
    Property = 6,
    Field = 7,
    Constructor = 8,
    Enum = 9,
    Interface = 10,
    Function = 11,
    Variable = 12,
    Constant = 13,
    String = 14,
    Number = 15,
    Boolean = 16,
    Array = 17,
    Object = 18,
    Key = 19,
    Null = 20,
    EnumMember = 21,
    Struct = 22,
    Event = 23,
    Operator = 24,
    TypeParameter = 25
  }

  /**
   * Represents programming constructs like variables, functions, methods, or classes within a document.
   * This structural hierarchy directly populates features like the Outline View and Breadcrumb rails.
   */
  export interface DocumentSymbol {
    /** The name of this symbol, e.g., 'calculateTotal' or 'UserClass'. */
    name: string;
    
    /** Additional contextual details for this symbol, such as a function signature or return type. */
    detail?: string;
    
    /** The structural taxonomy kind of this symbol (e.g., Class, Function, Interface). */
    kind: SymbolKind;
    
    /** Sub-symbols or nested children contained hierarchically within this node block. */
    children?: DocumentSymbol[];
  }

  /**
   * Structural interface blueprint that third-party extension engines must conform to
   * in order to inject custom syntax extraction logic into the global processing pipeline.
   */
  export interface SymbolProvider {
    /**
     * Parses document content and returns a collection of validated code symbols.
     * 
     * @param text The complete raw string value content of the targeted active editor document.
     * @param languageId The programming language token scope string identifier (e.g., 'javascript', 'rust').
     * @param model Pointers referencing the active, native Monaco text model engine framework instance.
     * @returns An array of structured document symbols, or a Promise resolving to one.
     */
    provideSymbols(
      text: string, 
      languageId: string, 
      model: any
    ): DocumentSymbol[] | Promise<DocumentSymbol[]>;
  }

  export namespace languages {
    
    /**
     * Registers a custom AST/Regex symbol provider engine linked into the global SymbolManager router tree.
     * Enables custom extensions to feed data elements into the code structure and Outline panel viewports.
     * 
     * @param languageId Target selector scope string (e.g., 'javascript', 'python', or '*' for global fallbacks).
     * @param provider An operational strategy implementation container conforming to the `SymbolProvider` layout.
     * @returns A disposable object to safely flush memory tracking grids upon extension deactivation loops.
     * 
     * @example
     * const jsProvider = mscode.languages.registerSymbolProvider('javascript', {
     *   provideSymbols: async (text, languageId) => {
     *     // Process string parsing loops or AST nodes
     *     return [
     *       {
     *         name: "UserManager",
     *         detail: "class",
     *         kind: mscode.SymbolKind.Class,
     *         children: [
     *           { name: "getUserData", detail: "(id: string) => Promise", kind: mscode.SymbolKind.Method }
     *         ]
     *       }
     *     ];
     *   }
     * });
     * 
     * // On deactivation routines:
     * jsProvider.dispose();
     */
    export function registerSymbolProvider(
      languageId: string, 
      provider: SymbolProvider
    ): Disposable;

  }
}