// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { completionKind } from './helpers';
export function registerCompletion(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerCompletionItemProvider(state.languageId, {
      triggerCharacters: ['.', ':', '/', '#', '@', '<', '>'],

      provideCompletionItems: async (model, position, context) => {
        if (!state.initialized) return { suggestions: [] };

        try {
          // JIT sync: push current content before asking for completions
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          // Map Monaco trigger kind → LSP trigger kind
          let triggerKind = 1; // Invoked
          if (context.triggerKind === monaco.languages.CompletionTriggerKind.TriggerCharacter)
            triggerKind = 2;
          else if (context.triggerKind === monaco.languages.CompletionTriggerKind.TriggerForIncompleteCompletions)
            triggerKind = 3;

          const result: any = await sendRequest(state, 'textDocument/completion', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
            context:      { triggerKind, triggerCharacter: context.triggerCharacter },
          });

          const items = Array.isArray(result) ? result : result?.items ?? [];
          if (!items.length) return { suggestions: [], incomplete: false };

          return {
            incomplete:  result?.isIncomplete === true,
            suggestions: items.map((item: any) => {
              // Prefer the range from textEdit; fall back to the current word boundary
              let range: monaco.IRange | undefined;
              const te = item.textEdit;
              if (te) {
                const r = te.range ?? te.replace;
                if (r) {
                  range = {
                    startLineNumber: r.start.line + 1, startColumn: r.start.character + 1,
                    endLineNumber:   r.end.line   + 1, endColumn:   r.end.character   + 1,
                  };
                }
              }
              if (!range) {
                const w = model.getWordUntilPosition(position);
                range = {
                  startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                  startColumn:     w.startColumn,       endColumn:     w.endColumn,
                };
              }

              return {
                label:         item.label.trim(),
                kind:          completionKind(item.kind),
                detail:        item.detail ?? '',
                documentation: typeof item.documentation === 'string'
                  ? item.documentation
                  : item.documentation?.value ?? '',
                insertText:    item.textEdit?.newText ?? item.insertText ?? item.label,
                range,
                // Only set InsertAsSnippet when the server explicitly requests it
                insertTextRules: item.insertTextFormat === 2
                  ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                  : undefined,
              };
            }),
          };
        } catch {
          return { suggestions: [] };
        }
      },
    })
  );
}
