// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toMonacoRange, toLspPosition } from './helpers';
export function registerDocumentHighlight(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDocumentHighlightProvider(state.languageId, {
      provideDocumentHighlights: async (model, position) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/documentHighlight', {
            textDocument: { uri: getDocUri(model, state) },
            position:     toLspPosition(position),
          });
          if (!Array.isArray(result)) return [];
          const K = monaco.languages.DocumentHighlightKind;
          const kindMap: Record<number, monaco.languages.DocumentHighlightKind> = {
            1: K.Text, 2: K.Read, 3: K.Write,
          };
          return result.map((h: any) => ({
            range: toMonacoRange(h.range),
            kind:  kindMap[h.kind ?? 1] ?? K.Text,
          }));
        } catch {
          return [];
        }
      },
    })
  );
}
