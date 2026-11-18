import { createRegexTokensProvider } from '../createRegexTokensProvider';
import type { MonoTokensProvider } from '../TokensProvider';

export function createHtmlTokensProvider(): MonoTokensProvider {
  return createRegexTokensProvider({
    languageId: 'html',
    rules: [
      { pattern: /<!--[\s\S]*?-->/, type: 'comment' },
      { pattern: /<\/?[a-zA-Z][\w:-]*/, type: 'tag' },
      { pattern: /[a-zA-Z_:][\w:.-]*(?=\s*=)/, type: 'attribute' },
      { pattern: /"(?:\\.|[^"\\])*"/, type: 'string' },
      { pattern: /'(?:\\.|[^'\\])*'/, type: 'string' },
      { pattern: /[<>\/]/, type: 'punctuation' },
    ],
  });
}
