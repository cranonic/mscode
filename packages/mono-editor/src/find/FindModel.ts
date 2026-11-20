import type { TextModel } from '../core/TextModel';
import type { FindMatch, FindOptions } from './types';

/**
 * Pure search over TextModel — Monaco FindModel equivalent (simplified).
 */
export function findMatches(
  model: TextModel,
  searchString: string,
  options: FindOptions,
): FindMatch[] {
  if (!searchString) return [];

  const text = model.getValue();
  const matches: FindMatch[] = [];

  try {
    const re = buildRegExp(searchString, options);
    if (!re) return [];

    let m: RegExpExecArray | null;
    // Avoid infinite loop on empty matches
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (m[0].length === 0) {
        re.lastIndex = start + 1;
        continue;
      }
      const s = model.getPositionAt(start);
      const e = model.getPositionAt(end);
      matches.push({
        startLineNumber: s.lineNumber,
        startColumn: s.column,
        endLineNumber: e.lineNumber,
        endColumn: e.column,
      });
      if (matches.length > 20000) break; // safety
    }
  } catch {
    return [];
  }

  return matches;
}

function buildRegExp(searchString: string, options: FindOptions): RegExp | null {
  let source: string;
  if (options.regex) {
    source = searchString;
  } else {
    source = escapeRegExp(searchString);
  }
  if (options.wholeWord) {
    source = `\\b(?:${source})\\b`;
  }
  const flags = options.matchCase ? 'g' : 'gi';
  try {
    return new RegExp(source, flags);
  } catch {
    return null;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function replaceMatch(
  model: TextModel,
  match: FindMatch,
  replaceString: string,
  searchString: string,
  options: FindOptions,
): void {
  const start = model.getOffsetAt(match.startLineNumber, match.startColumn);
  const end = model.getOffsetAt(match.endLineNumber, match.endColumn);
  let replacement = replaceString;
  if (options.regex) {
    try {
      const re = buildRegExp(searchString, { ...options, regex: true });
      if (re) {
        const slice = model.getValue().slice(start, end);
        replacement = slice.replace(re, replaceString);
      }
    } catch {
      /* use literal */
    }
  }
  model.delete(start, end);
  model.insert(start, replacement);
}
