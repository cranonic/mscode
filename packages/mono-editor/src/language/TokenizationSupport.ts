import type { TextModel } from '../core/TextModel';
import type { MonoToken } from './tokenTypes';
import { languages } from './TokensProvider';

interface LineCache {
  versionId: number;
  languageId: string;
  /** end state AFTER this line (index 0 = state before line 1) */
  states: unknown[];
  /** tokens per line (1-based index unused; use line-1) */
  tokens: MonoToken[][];
  /** content fingerprint to skip work when only caret moved */
  lineHashes: string[];
}

/**
 * Caches per-line tokens + multiline state.
 * Invalidates from the first dirty line on model change.
 */
export class TokenizationSupport {
  private cache: LineCache | null = null;

  invalidate(): void {
    this.cache = null;
  }

  getLineTokens(model: TextModel, lineNumber: number): MonoToken[] {
    this.ensure(model, lineNumber);
    return this.cache!.tokens[lineNumber - 1] ?? [];
  }

  private ensure(model: TextModel, upToLine: number): void {
    const versionId = model.getVersionId();
    const languageId = model.getLanguageId();
    const provider = languages.getTokensProvider(languageId);
    const lineCount = model.getLineCount();
    const target = Math.min(Math.max(1, upToLine), lineCount);

    if (!provider) {
      this.cache = {
        versionId,
        languageId,
        states: new Array(lineCount + 1).fill(null),
        tokens: Array.from({ length: lineCount }, () => []),
        lineHashes: Array.from({ length: lineCount }, (_, i) => model.getLineContent(i + 1)),
      };
      return;
    }

    if (
      !this.cache ||
      this.cache.versionId !== versionId ||
      this.cache.languageId !== languageId ||
      this.cache.tokens.length !== lineCount
    ) {
      // full rebuild from line 1 (edits are usually small; can optimize later)
      const states: unknown[] = new Array(lineCount + 1);
      states[0] = provider.getInitialState();
      const tokens: MonoToken[][] = new Array(lineCount);
      const hashes: string[] = new Array(lineCount);
      let state = states[0];
      for (let i = 0; i < lineCount; i++) {
        const text = model.getLineContent(i + 1);
        hashes[i] = text;
        const res = provider.tokenizeLine(text, state);
        tokens[i] = res.tokens;
        state = res.endState;
        states[i + 1] = state;
      }
      this.cache = { versionId, languageId, states, tokens, lineHashes: hashes };
      return;
    }

    // cache warm: ensure lines up to target are present (already full rebuild above)
    void target;
  }
}
