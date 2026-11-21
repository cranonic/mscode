import { languageFeatures, CompletionItemKind, type CompletionItem } from '@mono/editor';

export function mapLspKind(kind?: number): CompletionItemKind {
  const table: Record<number, CompletionItemKind> = {
    1: CompletionItemKind.Text, 2: CompletionItemKind.Method, 3: CompletionItemKind.Function,
    6: CompletionItemKind.Variable, 7: CompletionItemKind.Class, 14: CompletionItemKind.Keyword,
    15: CompletionItemKind.Snippet,
  };
  return table[kind ?? 1] ?? CompletionItemKind.Text;
}

export function registerMonoCompletion(
  languageId: string,
  provide: (args: { line: number; character: number; triggerCharacter?: string }) => Promise<CompletionItem[]>,
): { dispose(): void } {
  return languageFeatures.registerCompletionItemProvider(languageId, {
    triggerCharacters: ['.', ':', '/', '<', '"', "'"],
    provideCompletionItems: async (_model, position, context) => ({
      suggestions: await provide({
        line: position.lineNumber - 1,
        character: position.column - 1,
        triggerCharacter: context.triggerCharacter,
      }),
    }),
  });
}
