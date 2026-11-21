import type { ModelChange, TextModel } from '../core/TextModel';
import type { MonoToken } from './tokenTypes';
import { languages, type MonoTokensProvider } from './TokensProvider';

/** "not computed yet" marker for end-states (distinct from any real state value) */
const UNSET = Symbol('unset');

/** Above this many inserted lines we just drop the cache (splice spread limits, and a rebuild is lazy anyway) */
const MAX_INCREMENTAL_LINES = 4096;

interface LineCache {
  versionId: number;
  languageId: string;
  provider: MonoTokensProvider;
  /**
   * states[i] = tokenizer state BEFORE line i+1 (= end state of line i).
   * UNSET until that line has been tokenized.
   */
  states: unknown[];
  /** tokens per line; null = this line needs (re)tokenizing */
  tokens: (MonoToken[] | null)[];
  /** First 0-based line index that may be stale. Infinity = everything is up to date. */
  dirty: number;
  /** How many entries of `tokens` are null (lets us stop early without scanning) */
  nulls: number;
}

function sameState(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Per-line token cache with multiline state (block comments, template strings…).
 *
 *  - Lazy: only lines up to the one being asked for are tokenized (opening a
 *    20k-line file tokenizes the first screen, not the whole file).
 *  - Incremental: an edit marks just the touched lines dirty. Re-tokenizing then
 *    runs forward from there and STOPS as soon as a line ends in the same state
 *    it had before — everything after it is untouched. (Opening `/*` changes the
 *    state, so tokenizing correctly continues until the comment closes.)
 */
export class TokenizationSupport {
  private cache: LineCache | null = null;

  /** Drop everything (language change, provider change, unknown edit). */
  invalidate(): void {
    this.cache = null;
  }

  /**
   * Feed a model edit. Cheap: splices the cache arrays and marks the first
   * touched line dirty; no tokenizing happens here.
   */
  applyChange(change: ModelChange | undefined, versionId: number): void {
    const c = this.cache;
    if (!c) return;
    // Cache was (re)built after this edit already → it includes the change.
    if (c.versionId >= versionId) return;
    // Skipped a version → we can't trust the arrays; rebuild lazily.
    if (c.versionId !== versionId - 1) {
      this.cache = null;
      return;
    }
    if (
      !change ||
      change.full ||
      change.newLineCount > MAX_INCREMENTAL_LINES ||
      change.oldLineCount > MAX_INCREMENTAL_LINES
    ) {
      this.cache = null;
      return;
    }
    const s = change.startLine - 1;
    const removed = c.tokens.splice(
      s,
      change.oldLineCount,
      ...new Array<MonoToken[] | null>(change.newLineCount).fill(null),
    );
    for (const r of removed) if (r === null) c.nulls--;
    c.nulls += change.newLineCount;
    // states[k] = end state of line k → lines s..s+old-1 own states[s+1..s+old]
    c.states.splice(
      s + 1,
      change.oldLineCount,
      ...new Array<unknown>(change.newLineCount).fill(UNSET),
    );
    if (c.dirty > s) c.dirty = s;
    c.versionId = versionId;
  }

  getLineTokens(model: TextModel, lineNumber: number): MonoToken[] {
    const provider = languages.getTokensProvider(model.getLanguageId());
    if (!provider) return [];
    const c = this.ensureCache(model, provider);
    this.pump(model, c, lineNumber);
    return c.tokens[lineNumber - 1] ?? [];
  }

  private ensureCache(model: TextModel, provider: MonoTokensProvider): LineCache {
    const c = this.cache;
    const lineCount = model.getLineCount();
    if (
      c &&
      c.versionId === model.getVersionId() &&
      c.languageId === model.getLanguageId() &&
      c.provider === provider &&
      c.tokens.length === lineCount
    ) {
      return c;
    }
    // Cold start, or we missed a change → rebuild lazily (nothing is tokenized yet)
    const states: unknown[] = new Array(lineCount + 1).fill(UNSET);
    states[0] = provider.getInitialState();
    const fresh: LineCache = {
      versionId: model.getVersionId(),
      languageId: model.getLanguageId(),
      provider,
      states,
      tokens: new Array<MonoToken[] | null>(lineCount).fill(null),
      dirty: 0,
      nulls: lineCount,
    };
    this.cache = fresh;
    return fresh;
  }

  /**
   * Tokenize forward from the first stale line until `upToLine` is covered.
   *
   * Invariant: every NON-null tokens[j] was produced with the input state that
   * is currently stored in states[j]. A line whose input changes is nulled the
   * moment the previous line's end state changes, so "non-null" always means
   * "valid" — even when an earlier pump stopped at the viewport edge.
   */
  private pump(model: TextModel, c: LineCache, upToLine: number): void {
    const n = c.tokens.length;
    const limit = Math.min(Math.max(1, upToLine), n);
    while (c.dirty < limit) {
      const i = c.dirty;
      const res = c.provider.tokenizeLine(model.getLineContent(i + 1), c.states[i]);
      const oldEnd = c.states[i + 1];
      if (c.tokens[i] === null) c.nulls--;
      c.tokens[i] = res.tokens;
      c.states[i + 1] = res.endState;

      if (i + 1 >= n) {
        c.dirty = Infinity;
        break;
      }
      // End state changed (or never known) → the next line saw a different input.
      if (c.tokens[i + 1] !== null && (oldEnd === UNSET || !sameState(oldEnd, res.endState))) {
        c.tokens[i + 1] = null;
        c.nulls++;
      }
      // Next dirty line: the one we just nulled, or the next explicitly edited one.
      c.dirty =
        c.tokens[i + 1] === null ? i + 1 : c.nulls === 0 ? Infinity : this.nextNull(c, i + 1);
    }
  }

  private nextNull(c: LineCache, from: number): number {
    const t = c.tokens;
    for (let j = from; j < t.length; j++) if (t[j] === null) return j;
    return Infinity;
  }
}
