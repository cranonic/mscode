// types/modules/languages/diagnostics.d.ts

declare module '@mscode/api' {

  /**
   * Represents the severity level of a diagnostic (error, warning, info, etc.).
   * Directly maps to Monaco Editor's internal MarkerSeverity.
   */
  export enum DiagnosticSeverity {
    Hint = 1,
    Info = 2,
    Warning = 4,
    Error = 8
  }

  /**
   * Represents a single diagnostic (problem, error, warning) within a source file.
   */
  export interface Diagnostic {
    /** The severity level of this diagnostic. */
    severity: DiagnosticSeverity;
    
    /** The human-readable message to display in the UI and hover tooltips. */
    message: string;
    
    /** The 1-based start line number of the issue. */
    startLineNumber: number;
    
    /** The 1-based start column of the issue. */
    startColumn: number;
    
    /** The 1-based end line number of the issue. */
    endLineNumber: number;
    
    /** The 1-based end column of the issue. */
    endColumn: number;
    
    /** Optional identifier of the tool producing this diagnostic (e.g. 'eslint', 'tsc'). */
    source?: string;
    
    /** Optional error or rule code (e.g. 'no-unused-vars' or 'TS1005'). */
    code?: string | { value: string; target: string };
  }

  /**
   * A diagnostic collection is a container that manages a set of diagnostics.
   * Collections isolate errors from different tools (e.g., ESLint vs TypeScript compiler)
   * so they can be updated or cleared independently without interfering with each other.
   */
  export interface DiagnosticCollection {
    /** The display name of the collection. */
    readonly name: string;
    
    /**
     * Publishes an array of diagnostics for a specific file resource path.
     * This instantly triggers native editor squiggles and updates the Problems Panel.
     * * @param uri The absolute target document URI string.
     * @param diagnostics The array of diagnostics to display.
     */
    set(uri: string, diagnostics: Diagnostic[]): void;
    
    /**
     * Wipes all active diagnostic markers published by this specific collection instance.
     */
    clear(): void;
    
    /**
     * Disposes the collection container and cleans up all of its registered markers from memory.
     */
    dispose(): void;
  }

  export namespace languages {

    /**
     * Retrieves all currently active diagnostics (problems) in the editor workspace.
     * * @param uri Optional target file URI to filter diagnostics.
     * @returns Array of diagnostic markers matching the criteria.
     */
    export function getDiagnostics(uri?: string): Diagnostic[];

    /**
     * Creates a dedicated container for diagnostic markers. 
     * Useful for linking custom external linters, builders, or toolchains.
     * * @param name The human-readable name of the collection.
     * @returns An object managing the collection lifetime and markers state.
     * * @example
     * // 1. create collection
     * const myLinter = mscode.languages.createDiagnosticCollection('my-awesome-linter');
     * * // 2. scan code & set error
     * myLinter.set('file:///sdcard/project/main.js', [
     * {
     * severity: mscode.DiagnosticSeverity.Error, 
     * message: "Missing semicolon!",
     * startLineNumber: 10,
     * startColumn: 5,
     * endLineNumber: 10,
     * endColumn: 6
     * }
     * ]);
     */
    export function createDiagnosticCollection(name: string): DiagnosticCollection;

    /**
     * Fired globally when file markers or diagnostics are added, changed, or completely cleared.
     * * @param handler Callback invoked when a system diagnostics sync occurs.
     * @returns A disposable instance object to detach the event listener hook securely.
     * * @example
     * mscode.languages.onDidChangeDiagnostics((allProblems) => {
     * console.log(`Total problems in project: ${allProblems.length}`);
     * });
     */
    export function onDidChangeDiagnostics(handler: (diagnostics: Diagnostic[]) => void): Disposable;

  }
}