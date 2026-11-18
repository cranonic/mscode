import { createRegexTokensProvider } from '../createRegexTokensProvider';
import type { MonoTokensProvider } from '../TokensProvider';

const KW = [
  'False','None','True','and','as','assert','async','await','break','class','continue',
  'def','del','elif','else','except','finally','for','from','global','if','import',
  'in','is','lambda','nonlocal','not','or','pass','raise','return','try','while',
  'with','yield','match','case',
];

export function createPythonTokensProvider(): MonoTokensProvider {
  return createRegexTokensProvider({
    languageId: 'python',
    keywords: KW,
    rules: [
      { pattern: /#.*/ , type: 'comment' },
      { pattern: /"""[\s\S]*?"""/, type: 'string' },
      { pattern: /'''[\s\S]*?'''/, type: 'string' },
      { pattern: /"(?:\\.|[^"\\])*"/, type: 'string' },
      { pattern: /'(?:\\.|[^'\\])*'/, type: 'string' },
      { pattern: /f"(?:\\.|[^"\\])*"/, type: 'string' },
      { pattern: /f'(?:\\.|[^'\\])*'/, type: 'string' },
      { pattern: /0[xX][0-9a-fA-F]+/, type: 'number' },
      { pattern: /(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/, type: 'number' },
      { pattern: /==|!=|<=|>=|\/\/|\*\*|[\+\-\*\/%<>=]/, type: 'operator' },
    ],
  });
}
