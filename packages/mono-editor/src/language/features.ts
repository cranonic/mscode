/**
 * Monaco-compatible language feature contracts (completion, hover, folding).
 * Providers register per languageId; editor queries them — no Monaco import.
 */

import type { IPosition } from '../api/types';
import type { TextModel } from '../core/TextModel';

export type CancellationToken = { isCancellationRequested: boolean };

export interface ITextModelLike {
  getValue(): string;
  getLineContent(lineNumber: number): string;
  getLineCount(): number;
  getOffsetAt(lineNumber: number, column: number): number;
  getPositionAt(offset: number): { lineNumber: number; column: number };
  getLanguageId(): string;
}

// ── Completion ────────────────────────────────────────────────

/** Monaco CompletionItemKind */
export enum CompletionItemKind {
  Method = 0,
  Function = 1,
  Constructor = 2,
  Field = 3,
  Variable = 4,
  Class = 5,
  Struct = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Event = 10,
  Operator = 11,
  Unit = 12,
  Value = 13,
  Constant = 14,
  Enum = 15,
  EnumMember = 16,
  Keyword = 17,
  Text = 18,
  Color = 19,
  File = 20,
  Reference = 21,
  Customcolor = 22,
  Folder = 23,
  TypeParameter = 24,
  User = 25,
  Issue = 26,
  Snippet = 27,
}

export interface CompletionItem {
  label: string | { label: string; detail?: string; description?: string };
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string | { value: string };
  insertText?: string;
  /** Snippet-style insert (simple $0 support) */
  insertTextRules?: number;
  range?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  filterText?: string;
  sortText?: string;
  preselect?: boolean;
  command?: { id: string; title?: string; arguments?: unknown[] };
}

export interface CompletionList {
  suggestions: CompletionItem[];
  incomplete?: boolean;
}

export interface CompletionContext {
  triggerKind: number; // 0 Invoke, 1 TriggerCharacter, 2 TriggerForIncomplete
  triggerCharacter?: string;
}

export interface CompletionItemProvider {
  triggerCharacters?: string[];
  provideCompletionItems(
    model: ITextModelLike,
    position: IPosition,
    context: CompletionContext,
    token: CancellationToken,
  ): CompletionList | Promise<CompletionList | null> | null;
  resolveCompletionItem?(
    item: CompletionItem,
    token: CancellationToken,
  ): CompletionItem | Promise<CompletionItem>;
}

// ── Hover ─────────────────────────────────────────────────────

export interface Hover {
  contents: Array<string | { value: string }>;
  range?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

export interface HoverProvider {
  provideHover(
    model: ITextModelLike,
    position: IPosition,
    token: CancellationToken,
  ): Hover | Promise<Hover | null> | null;
}

// ── Folding ───────────────────────────────────────────────────

export interface FoldingRange {
  start: number; // 1-based start line
  end: number;   // 1-based end line (inclusive)
  kind?: 'comment' | 'imports' | 'region';
}

export interface FoldingRangeProvider {
  provideFoldingRanges(
    model: ITextModelLike,
    context: { triggerKind?: number },
    token: CancellationToken,
  ): FoldingRange[] | Promise<FoldingRange[]>;
}

// ── Registry ──────────────────────────────────────────────────

type Disposable = { dispose(): void };

class LanguageFeatureRegistry {
  private completions = new Map<string, CompletionItemProvider[]>();
  private hovers = new Map<string, HoverProvider[]>();
  private foldings = new Map<string, FoldingRangeProvider[]>();

  registerCompletionItemProvider(
    languageId: string,
    provider: CompletionItemProvider,
  ): Disposable {
    const list = this.completions.get(languageId) ?? [];
    list.push(provider);
    this.completions.set(languageId, list);
    return {
      dispose: () => {
        const arr = this.completions.get(languageId) ?? [];
        this.completions.set(
          languageId,
          arr.filter((p) => p !== provider),
        );
      },
    };
  }

  registerHoverProvider(languageId: string, provider: HoverProvider): Disposable {
    const list = this.hovers.get(languageId) ?? [];
    list.push(provider);
    this.hovers.set(languageId, list);
    return {
      dispose: () => {
        const arr = this.hovers.get(languageId) ?? [];
        this.hovers.set(
          languageId,
          arr.filter((p) => p !== provider),
        );
      },
    };
  }

  registerFoldingRangeProvider(
    languageId: string,
    provider: FoldingRangeProvider,
  ): Disposable {
    const list = this.foldings.get(languageId) ?? [];
    list.push(provider);
    this.foldings.set(languageId, list);
    return {
      dispose: () => {
        const arr = this.foldings.get(languageId) ?? [];
        this.foldings.set(
          languageId,
          arr.filter((p) => p !== provider),
        );
      },
    };
  }

  getCompletionProviders(languageId: string): CompletionItemProvider[] {
    return [
      ...(this.completions.get(languageId) ?? []),
      ...(this.completions.get('*') ?? []),
    ];
  }

  getHoverProviders(languageId: string): HoverProvider[] {
    return [
      ...(this.hovers.get(languageId) ?? []),
      ...(this.hovers.get('*') ?? []),
    ];
  }

  getFoldingProviders(languageId: string): FoldingRangeProvider[] {
    return [
      ...(this.foldings.get(languageId) ?? []),
      ...(this.foldings.get('*') ?? []),
    ];
  }
}

export const languageFeatures = new LanguageFeatureRegistry();

/** Built-in: word list from current document (always available). */
export function createWordBasedCompletionProvider(): CompletionItemProvider {
  return {
    provideCompletionItems(model, position) {
      const line = model.getLineContent(position.lineNumber);
      const before = line.slice(0, position.column - 1);
      const m = before.match(/[A-Za-z_$][\w$]*$/);
      const prefix = m ? m[0] : '';
      const startColumn = position.column - prefix.length;
      const words = new Set<string>();
      const text = model.getValue();
      for (const w of text.match(/[A-Za-z_$][\w$]{2,}/g) ?? []) {
        if (prefix && !w.toLowerCase().startsWith(prefix.toLowerCase())) continue;
        if (w === prefix) continue;
        words.add(w);
      }
      const range = {
        startLineNumber: position.lineNumber,
        startColumn,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };
      const suggestions: CompletionItem[] = [...words]
        .sort()
        .slice(0, 50)
        .map((w) => ({
          label: w,
          kind: CompletionItemKind.Text,
          insertText: w,
          range,
        }));
      return { suggestions };
    },
  };
}
