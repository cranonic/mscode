import { createRegexTokensProvider } from '../createRegexTokensProvider';
import type { MonoTokensProvider } from '../TokensProvider';

const KW = [
  'break','case','catch','class','const','continue','debugger','default','delete',
  'do','else','export','extends','false','finally','for','function','if','import',
  'in','instanceof','let','new','null','return','super','switch','this','throw',
  'true','try','typeof','undefined','var','void','while','with','yield','async',
  'await','of','from','as','type','interface','enum','implements','private',
  'public','protected','readonly','static','namespace','module','declare','abstract',
  'package','satisfies','infer','keyof','readonly','asserts','is',
];

/** State: 0 normal, 1 block comment */
export function createJavaScriptTokensProvider(
  languageId: string = 'javascript',
): MonoTokensProvider {
  return createRegexTokensProvider({
    languageId,
    keywords: KW,
    initialState: 0,
    rules: [
      // block comment continue
      { pattern: /^[\s\S]*?\*\//, type: 'comment', whenState: 1, nextState: 0 },
      { pattern: /^[\s\S]+/, type: 'comment', whenState: 1, nextState: 1 },
      // line comment
      { pattern: /\/\/.*/, type: 'comment' },
      // block comment start
      { pattern: /\/\*[\s\S]*?\*\//, type: 'comment' },
      { pattern: /\/\*[\s\S]*/, type: 'comment', nextState: 1 },
      // strings
      { pattern: /"(?:\\.|[^"\\])*"/, type: 'string' },
      { pattern: /'(?:\\.|[^'\\])*'/, type: 'string' },
      { pattern: /`(?:\\.|[^`\\])*`/, type: 'string' },
      // unterminated string to EOL
      { pattern: /"(?:\\.|[^"\\])*$/, type: 'string' },
      { pattern: /'(?:\\.|[^'\\])*$/, type: 'string' },
      { pattern: /`(?:\\.|[^`\\])*$/, type: 'string' },
      // regexp (simple)
      { pattern: /\/(?![\/\*])(?:\\.|[^\/\\\n])+\/[gimsuy]*/, type: 'regexp' },
      // numbers
      { pattern: /0[xX][0-9a-fA-F]+n?/, type: 'number' },
      { pattern: /0[bB][01]+n?/, type: 'number' },
      { pattern: /(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?n?/, type: 'number' },
      // operators
      { pattern: /=>|===|!==|==|!=|<=|>=|\+\+|--|&&|\|\||[+\-*/%&|^~<>!?]=?/, type: 'operator' },
    ],
  });
}

export function createTypeScriptTokensProvider(): MonoTokensProvider {
  return createJavaScriptTokensProvider('typescript');
}
