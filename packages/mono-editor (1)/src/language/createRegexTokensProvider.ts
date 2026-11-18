import type { MonoToken, MonoTokenType } from './tokenTypes';
import type { MonoTokensProvider } from './TokensProvider';

export interface RegexRule {
  /** JS regex; use sticky /y or we'll advance manually with lastIndex */
  pattern: RegExp;
  type: MonoTokenType;
  /** if true, rule can open multiline and sets state */
  nextState?: unknown;
  /** only active when state equals this (default: any / 0) */
  whenState?: unknown;
}

export interface RegexProviderOptions {
  languageId: string;
  rules: RegexRule[];
  /** keywords matched as whole words after other rules miss */
  keywords?: string[];
  keywordType?: MonoTokenType;
  initialState?: unknown;
}

/**
 * Helper for host apps to register simple languages without writing a full tokenizer.
 * Rules are tried in order at each position; first match wins.
 */
export function createRegexTokensProvider(opts: RegexProviderOptions): MonoTokensProvider {
  const keywordSet = new Set(opts.keywords ?? []);
  const keywordType = opts.keywordType ?? 'keyword';
  const initial = opts.initialState ?? 0;

  // ensure each pattern has global flag for lastIndex control
  const rules = opts.rules.map((r) => ({
    ...r,
    pattern: new RegExp(
      r.pattern.source,
      r.pattern.flags.includes('g') ? r.pattern.flags : r.pattern.flags + 'g',
    ),
  }));

  return {
    languageId: opts.languageId,
    getInitialState: () => initial,
    tokenizeLine(line: string, state: unknown) {
      const tokens: MonoToken[] = [];
      let i = 0;
      let cur = state ?? initial;
      const len = line.length;

      while (i < len) {
        // whitespace → plain skip
        if (/\s/.test(line[i]!)) {
          i++;
          continue;
        }

        let matched = false;
        for (const rule of rules) {
          if (rule.whenState !== undefined && rule.whenState !== cur) continue;
          rule.pattern.lastIndex = i;
          const m = rule.pattern.exec(line);
          if (!m || m.index !== i) continue;
          const start = i;
          const end = i + m[0].length;
          tokens.push({
            startColumn: start + 1,
            endColumn: end + 1,
            type: rule.type,
          });
          i = end;
          if (rule.nextState !== undefined) cur = rule.nextState;
          matched = true;
          break;
        }
        if (matched) continue;

        // identifier / keyword
        if (/[A-Za-z_$]/.test(line[i]!)) {
          let j = i + 1;
          while (j < len && /[A-Za-z0-9_$]/.test(line[j]!)) j++;
          const word = line.slice(i, j);
          tokens.push({
            startColumn: i + 1,
            endColumn: j + 1,
            type: keywordSet.has(word) ? keywordType : 'variable',
          });
          i = j;
          continue;
        }

        // single punctuation
        tokens.push({
          startColumn: i + 1,
          endColumn: i + 2,
          type: 'punctuation',
        });
        i++;
      }

      return { tokens, endState: cur };
    },
  };
}
