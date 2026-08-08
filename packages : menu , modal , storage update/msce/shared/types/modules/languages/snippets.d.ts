// types/modules/languages/snippets.d.ts

declare module '@mscode/api' {
  export namespace languages {

    /**
     * Blueprint for defining an individual code snippet.
     */
    export interface SnippetDefinition {
      /** The prefix or array of prefixes that trigger the snippet. */
      prefix: string | string[];
      /** The body of the snippet. Array of strings represents multiple lines. */
      body: string | string[];
      /** Optional description of the snippet shown in the autocomplete UI. */
      description?: string;
      /** Glob patterns matching file paths where this snippet should be ACTIVE. */
      include?: string[];
      /** Glob patterns matching file paths where this snippet should be HIDDEN. */
      exclude?: string[];
    }

    /**
     * Dictionary of snippet configurations.
     */
    export interface SnippetCollection {
      [snippetName: string]: SnippetDefinition;
    }

    /**
     * Registers a collection of code snippets for a specific language.
     * Integrates with the Monaco auto-complete engine natively.
     * * @param languageId The targeted language identifier (e.g. 'rust', 'html').
     * @param snippetData A dictionary object mapping snippet names to their definitions.
     * @returns A disposable object to clean up the snippets on deactivation.
     * * @example
     * const dispose = mscode.languages.registerSnippets('rust', {
     * 'println macro': {
     * prefix: 'println',
     * body: ['println!("$1");'],
     * description: 'Print to stdout'
     * }
     * });
     */
    export function registerSnippets(
      languageId: string, 
      snippetData: SnippetCollection
    ): Disposable;
  }
}