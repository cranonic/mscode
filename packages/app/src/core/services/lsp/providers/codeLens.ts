// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toMonacoRange } from './helpers';
export function registerCodeLens(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerCodeLensProvider(state.languageId, {
      provideCodeLenses: async (model) => {
        if (!state.initialized) return { lenses: [], dispose: () => {} };
        try {
          const result: any = await sendRequest(state, 'textDocument/codeLens', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return { lenses: [], dispose: () => {} };
          const lenses = result
            .filter((l: any) => l?.range)
            .map((l: any) => ({
              range: toMonacoRange(l.range),
              id: l.data ? JSON.stringify(l.data) : undefined,
              command: l.command
                ? {
                    id: l.command.command,
                    title: l.command.title || '',
                    arguments: l.command.arguments,
                  }
                : undefined,
            }));
          return { lenses, dispose: () => {} };
        } catch {
          return { lenses: [], dispose: () => {} };
        }
      },
      resolveCodeLens: async (_model, codeLens) => {
        if (!state.initialized || !codeLens.id) return codeLens;
        try {
          const data = JSON.parse(codeLens.id);
          const result: any = await sendRequest(state, 'codeLens/resolve', {
            range: {
              start: {
                line: codeLens.range.startLineNumber - 1,
                character: codeLens.range.startColumn - 1,
              },
              end: {
                line: codeLens.range.endLineNumber - 1,
                character: codeLens.range.endColumn - 1,
              },
            },
            data,
          });
          if (result?.command) {
            codeLens.command = {
              id: result.command.command,
              title: result.command.title || '',
              arguments: result.command.arguments,
            };
          }
        } catch { /* keep unresolved */ }
        return codeLens;
      },
    })
  );
}
