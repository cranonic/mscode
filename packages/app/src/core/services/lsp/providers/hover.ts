// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
export function registerHover(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerHoverProvider(state.languageId, {
      provideHover: async (model, position) => {
        if (!state.initialized) return null;

        try {
          const result: any = await sendRequest(state, 'textDocument/hover', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
          });

          if (!result?.contents) return null;

          const contents = Array.isArray(result.contents)
            ? result.contents
            : [result.contents];

          return {
            contents: contents.map((c: any) => ({
              value: typeof c === 'string' ? c : c.value ?? '',
            })),
          };
        } catch {
          return null;
        }
      },
    })
  );
}
