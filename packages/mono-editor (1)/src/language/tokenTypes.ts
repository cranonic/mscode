/**
 * VS Code / TextMate-inspired token roles.
 * Apps can map extra scopes via custom providers that still emit these types,
 * or use 'plain' + theme overrides.
 */
export type MonoTokenType =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'number'
  | 'regexp'
  | 'operator'
  | 'punctuation'
  | 'variable'
  | 'function'
  | 'type'
  | 'class'
  | 'property'
  | 'tag'
  | 'attribute'
  | 'constant'
  | 'macro'
  | 'invalid';

/** 1-based columns, end exclusive-ish: paints [startColumn, endColumn) */
export interface MonoToken {
  startColumn: number;
  endColumn: number;
  type: MonoTokenType;
}

export type MonoTokenTheme = Partial<Record<MonoTokenType, string>>;

/** Dark+ inspired defaults (VS Code) */
export const DEFAULT_TOKEN_COLORS: Record<MonoTokenType, string> = {
  plain: '#d4d4d4',
  comment: '#6a9955',
  string: '#ce9178',
  keyword: '#569cd6',
  number: '#b5cea8',
  regexp: '#d16969',
  operator: '#d4d4d4',
  punctuation: '#d4d4d4',
  variable: '#9cdcfe',
  function: '#dcdcaa',
  type: '#4ec9b0',
  class: '#4ec9b0',
  property: '#9cdcfe',
  tag: '#569cd6',
  attribute: '#9cdcfe',
  constant: '#4fc1ff',
  macro: '#c586c0',
  invalid: '#f44747',
};
