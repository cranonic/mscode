import type { MonoTokenTheme, MonoTokenType } from '../language/tokenTypes';
import { DEFAULT_TOKEN_COLORS } from '../language/tokenTypes';
import type { MonoThemeRule } from './types';

/**
 * Map Monaco/TextMate scope strings → MonoTokenType.
 * Expandable: add scopes without touching the renderer.
 */
const SCOPE_TO_MONO: Array<{ match: RegExp | string; type: MonoTokenType }> = [
  { match: /^comment/, type: 'comment' },
  { match: /^string/, type: 'string' },
  { match: /^constant\.numeric|^constant\.language\.numeric/, type: 'number' },
  { match: /^constant\.character\.escape|^string\.regexp/, type: 'regexp' },
  { match: /^keyword\.control|^keyword\.operator\.new|^storage\.type|^storage\.modifier/, type: 'keyword' },
  { match: /^keyword/, type: 'keyword' },
  { match: /^entity\.name\.function|^support\.function/, type: 'function' },
  { match: /^entity\.name\.class|^entity\.name\.type|^support\.type|^support\.class/, type: 'class' },
  { match: /^entity\.name\.type|^meta\.type/, type: 'type' },
  { match: /^variable|^support\.variable/, type: 'variable' },
  { match: /^entity\.other\.attribute-name|^meta\.attribute/, type: 'attribute' },
  { match: /^entity\.name\.tag|^meta\.tag/, type: 'tag' },
  { match: /^support\.constant|^constant\.language|^constant\.other/, type: 'constant' },
  { match: /^meta\.preprocessor|^keyword\.control\.directive/, type: 'macro' },
  { match: /^invalid/, type: 'invalid' },
  { match: /^punctuation/, type: 'punctuation' },
  { match: /^keyword\.operator/, type: 'operator' },
  // Direct mono type names
  { match: 'plain', type: 'plain' },
  { match: 'comment', type: 'comment' },
  { match: 'string', type: 'string' },
  { match: 'keyword', type: 'keyword' },
  { match: 'number', type: 'number' },
  { match: 'regexp', type: 'regexp' },
  { match: 'operator', type: 'operator' },
  { match: 'punctuation', type: 'punctuation' },
  { match: 'variable', type: 'variable' },
  { match: 'function', type: 'function' },
  { match: 'type', type: 'type' },
  { match: 'class', type: 'class' },
  { match: 'property', type: 'property' },
  { match: 'tag', type: 'tag' },
  { match: 'attribute', type: 'attribute' },
  { match: 'constant', type: 'constant' },
  { match: 'macro', type: 'macro' },
  { match: 'invalid', type: 'invalid' },
];

function normalizeHex(c?: string): string | undefined {
  if (!c) return undefined;
  const s = c.trim();
  if (s.startsWith('#')) return s.length === 4
    ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
    : s.slice(0, 7);
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return s.startsWith('#') ? s : `#${s}`;
}

function scopeToType(scope: string): MonoTokenType | null {
  for (const { match, type } of SCOPE_TO_MONO) {
    if (typeof match === 'string') {
      if (scope === match || scope.startsWith(match + '.')) return type;
    } else if (match.test(scope)) {
      return type;
    }
  }
  return null;
}

/** Convert Monaco rules → MonoTokenTheme (first match wins per type). */
export function rulesToTokenColors(rules: MonoThemeRule[] | undefined): MonoTokenTheme {
  const out: MonoTokenTheme = { ...DEFAULT_TOKEN_COLORS };
  if (!rules?.length) return out;
  const filled = new Set<MonoTokenType>();
  for (const rule of rules) {
    const fg = normalizeHex(rule.foreground);
    if (!fg) continue;
    const type = scopeToType(rule.token);
    if (!type || filled.has(type)) continue;
    out[type] = fg;
    filled.add(type);
  }
  return out;
}

export function mergeTokenColors(
  base: MonoTokenTheme | undefined,
  extra: MonoTokenTheme | undefined,
): MonoTokenTheme {
  return { ...DEFAULT_TOKEN_COLORS, ...base, ...extra };
}
