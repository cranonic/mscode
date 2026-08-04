// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
export function registerDefinition(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDefinitionProvider(state.languageId, {
      provideDefinition: async (model, position) => {
        if (!state.initialized) return null;

        try {
          const result: any = await sendRequest(state, 'textDocument/definition', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
          });

          if (!result) return null;

          const locations = Array.isArray(result) ? result : [result];
          return locations.map((loc: any) => ({
            uri:   monaco.Uri.parse(fromLspUri(loc.uri)),
            range: {
              startLineNumber: (loc.range?.start?.line      ?? 0) + 1,
              startColumn:     (loc.range?.start?.character ?? 0) + 1,
              endLineNumber:   (loc.range?.end?.line        ?? 0) + 1,
              endColumn:       (loc.range?.end?.character   ?? 0) + 1,
            },
          }));
        } catch {
          return null;
        }
      },
    })
  );
}
