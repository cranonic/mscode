import { createRegexTokensProvider } from '../createRegexTokensProvider';
import type { MonoTokensProvider } from '../TokensProvider';

export function createJsonTokensProvider(): MonoTokensProvider {
  return createRegexTokensProvider({
    languageId: 'json',
    keywords: ['true', 'false', 'null'],
    keywordType: 'constant',
    rules: [
      { pattern: /"(?:\\.|[^"\\])*"(?=\s*:)/, type: 'property' },
      { pattern: /"(?:\\.|[^"\\])*"/, type: 'string' },
      { pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/, type: 'number' },
      { pattern: /[{}\[\]:,]/, type: 'punctuation' },
    ],
  });
}
