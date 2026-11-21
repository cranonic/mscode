/**
 * Language features surface (completion, hover) — erasableSyntaxOnly safe.
 * No enum / namespace / parameter properties.
 */

export interface CompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
  filterText?: string;
  range?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
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

export interface Hover {
  contents: string | string[];
  range?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

export interface CompletionProvider {
  triggerCharacters?: string[];
  provideCompletionItems(
    model: { getValue(): string; getLineContent(line: number): string },
    position: { lineNumber: number; column: number },
  ): CompletionList | CompletionItem[] | null | undefined | Promise<CompletionList | CompletionItem[] | null | undefined>;
}

export interface HoverProvider {
  provideHover(
    model: { getValue(): string; getLineContent(line: number): string },
    position: { lineNumber: number; column: number },
  ): Hover | null | undefined | Promise<Hover | null | undefined>;
}

class LanguageFeaturesRegistry {
  private completion = new Map<string, CompletionProvider[]>();
  private hover = new Map<string, HoverProvider[]>();

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

  getCompletionProviders(languageId: string): CompletionProvider[] {
    return this.completion.get(languageId) ?? [];
  }

  getHoverProviders(languageId: string): HoverProvider[] {
    return this.hover.get(languageId) ?? [];
  }
}

export const languageFeatures = new LanguageFeaturesRegistry();
