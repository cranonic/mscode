/**
 * Language features surface — erasableSyntaxOnly safe.
 * No enum / namespace / parameter properties.
 */

export interface IRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface CompletionItemLabel {
  label: string;
  description?: string;
}

export interface CompletionItem {
  label: string | CompletionItemLabel;
  kind?: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
  filterText?: string;
  range?: IRange;
  preselect?: boolean;
  textEdit?: { range: IRange; text: string };
}

export const CompletionItemKind = {
  Text: 0,
  Method: 1,
  Function: 2,
  Constructor: 3,
  Field: 4,
  Variable: 5,
  Class: 6,
  Interface: 7,
  Module: 8,
  Property: 9,
  Unit: 10,
  Value: 11,
  Enum: 12,
  Keyword: 13,
  Snippet: 14,
  Color: 15,
  File: 16,
  Reference: 17,
  Folder: 18,
  EnumMember: 19,
  Constant: 20,
  Struct: 21,
  Event: 22,
  Operator: 23,
  TypeParameter: 24,
} as const;

export type CompletionItemKind = (typeof CompletionItemKind)[keyof typeof CompletionItemKind];

export interface CompletionList {
  suggestions: CompletionItem[];
  incomplete?: boolean;
}

export interface CompletionContext {
  triggerKind: number;
  triggerCharacter?: string;
}

export interface HoverContentsItem {
  value: string;
}

export interface Hover {
  contents: string | string[] | HoverContentsItem | HoverContentsItem[];
  range?: IRange;
}

export interface FoldingRange {
  start: number;
  end: number;
  kind?: string;
}

export interface CancellationToken {
  isCancellationRequested: boolean;
}

export type ModelLike = {
  getValue(): string;
  getLineContent(line: number): string;
  getLineCount?(): number;
  getLanguageId?(): string;
};

export interface CompletionProvider {
  triggerCharacters?: string[];
  provideCompletionItems(
    model: ModelLike,
    position: { lineNumber: number; column: number },
    context?: CompletionContext,
    token?: CancellationToken,
  ): CompletionList | CompletionItem[] | null | undefined | Promise<CompletionList | CompletionItem[] | null | undefined>;
}

export interface HoverProvider {
  provideHover(
    model: ModelLike,
    position: { lineNumber: number; column: number },
    token?: CancellationToken,
  ): Hover | null | undefined | Promise<Hover | null | undefined>;
}

export interface FoldingRangeProvider {
  provideFoldingRanges(
    model: ModelLike,
    context?: unknown,
    token?: CancellationToken,
  ): FoldingRange[] | null | undefined | Promise<FoldingRange[] | null | undefined>;
}

/** Simple word-based completion provider (fallback). */
export function createWordBasedCompletionProvider(): CompletionProvider {
  return {
    provideCompletionItems(model, position) {
      const line = model.getLineContent(position.lineNumber) || '';
      const before = line.slice(0, Math.max(0, position.column - 1));
      const m = before.match(/[A-Za-z_][A-Za-z0-9_]*$/);
      if (!m) return { suggestions: [] };
      const prefix = m[0];
      const text = model.getValue();
      const words = new Set<string>();
      const re = /[A-Za-z_][A-Za-z0-9_]{2,}/g;
      let match: RegExpExecArray | null;
      while ((match = re.exec(text))) {
        if (match[0] !== prefix && match[0].startsWith(prefix)) words.add(match[0]);
        if (words.size > 40) break;
      }
      const suggestions: CompletionItem[] = Array.from(words).map((w) => ({
        label: w,
        kind: CompletionItemKind.Text,
        insertText: w,
      }));
      return { suggestions };
    },
  };
}

class LanguageFeaturesRegistry {
  private completion = new Map<string, CompletionProvider[]>();
  private hover = new Map<string, HoverProvider[]>();
  private folding = new Map<string, FoldingRangeProvider[]>();

  registerCompletionItemProvider(languageId: string, provider: CompletionProvider): { dispose(): void } {
    const list = this.completion.get(languageId) ?? [];
    list.push(provider);
    this.completion.set(languageId, list);
    return {
      dispose: () => {
        const cur = this.completion.get(languageId) ?? [];
        this.completion.set(languageId, cur.filter((p) => p !== provider));
      },
    };
  }

  registerHoverProvider(languageId: string, provider: HoverProvider): { dispose(): void } {
    const list = this.hover.get(languageId) ?? [];
    list.push(provider);
    this.hover.set(languageId, list);
    return {
      dispose: () => {
        const cur = this.hover.get(languageId) ?? [];
        this.hover.set(languageId, cur.filter((p) => p !== provider));
      },
    };
  }

  registerFoldingRangeProvider(languageId: string, provider: FoldingRangeProvider): { dispose(): void } {
    const list = this.folding.get(languageId) ?? [];
    list.push(provider);
    this.folding.set(languageId, list);
    return {
      dispose: () => {
        const cur = this.folding.get(languageId) ?? [];
        this.folding.set(languageId, cur.filter((p) => p !== provider));
      },
    };
  }

  getCompletionProviders(languageId: string): CompletionProvider[] {
    return this.completion.get(languageId) ?? [];
  }

  getHoverProviders(languageId: string): HoverProvider[] {
    return this.hover.get(languageId) ?? [];
  }

  getFoldingProviders(languageId: string): FoldingRangeProvider[] {
    return this.folding.get(languageId) ?? [];
  }
}

export const languageFeatures = new LanguageFeaturesRegistry();
