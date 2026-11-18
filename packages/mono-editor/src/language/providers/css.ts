import { createRegexTokensProvider } from '../createRegexTokensProvider';
import type { MonoTokensProvider } from '../TokensProvider';

export function createCssTokensProvider(): MonoTokensProvider {
  return createRegexTokensProvider({
    languageId: 'css',
    keywords: [
      'important','from','to','through','only','not','and','or',
    ],
    initialState: 0,
    rules: [
      { pattern: /^[\s\S]*?\*\//, type: 'comment', whenState: 1, nextState: 0 },
      { pattern: /^[\s\S]+/, type: 'comment', whenState: 1, nextState: 1 },
      { pattern: /\/\*[\s\S]*?\*\//, type: 'comment' },
      { pattern: /\/\*[\s\S]*/, type: 'comment', nextState: 1 },
      { pattern: /"(?:\\.|[^"\\])*"/, type: 'string' },
      { pattern: /'(?:\\.|[^'\\])*'/, type: 'string' },
      { pattern: /#[0-9a-fA-F]{3,8}\b/, type: 'number' },
      { pattern: /-?(?:\d+\.?\d*|\.\d+)(?:%|px|em|rem|vh|vw|deg|ms|s)?/, type: 'number' },
      { pattern: /@[a-zA-Z-]+/, type: 'keyword' },
      { pattern: /::?[a-zA-Z-]+/, type: 'type' },
      { pattern: /[.#]?[a-zA-Z_-][\w-]*/, type: 'tag' },
      { pattern: /[{}:;,\(\)\[\]]/, type: 'punctuation' },
    ],
  });
}
