import type { MonoToken } from './tokenTypes';

/**
 * Expandable tokenization API (Monaco/VS Code style).
 *
 * Implement for any language and register via `languages.registerTokensProvider`.
 * `state` carries multiline context (block comments, template strings, etc.).
 */
export interface MonoTokensProvider {
  /** Language id, e.g. 'javascript', 'python' */
  languageId: string;
  getInitialState(): unknown;
  /**
   * Tokenize one line.
   * @param line full line text (no trailing \\n)
   * @param state end-state from previous line
   */
  tokenizeLine(
    line: string,
    state: unknown,
  ): { tokens: MonoToken[]; endState: unknown };
}

type ProviderMap = Map<string, MonoTokensProvider>;

const providers: ProviderMap = new Map();

export const languages = {
  registerTokensProvider(provider: MonoTokensProvider): { dispose: () => void } {
    const id = provider.languageId;
    providers.set(id, provider);
    return {
      dispose: () => {
        if (providers.get(id) === provider) providers.delete(id);
      },
    };
  },

  getTokensProvider(languageId: string): MonoTokensProvider | undefined {
    return providers.get(languageId);
  },

  getRegisteredLanguageIds(): string[] {
    return [...providers.keys()];
  },

  /** Replace all providers (tests / host reset). */
  clearTokensProviders(): void {
    providers.clear();
  },
};
