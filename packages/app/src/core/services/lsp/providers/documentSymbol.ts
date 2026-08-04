// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toMonacoRange, mapDocumentSymbol, mapSymbolKind } from './helpers';
export function registerDocumentSymbol(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDocumentSymbolProvider(state.languageId, {
      provideDocumentSymbols: async (model) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/documentSymbol', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return [];
          // Hierarchical DocumentSymbol[] or flat SymbolInformation[]
          return result.map((s: any) => {
            if (s.location) {
              // SymbolInformation shape
              const range = toMonacoRange(s.location.range);
              return {
                name: s.name || '?',
                detail: '',
                kind: mapSymbolKind(s.kind),
                tags: [],
                range,
                selectionRange: range,
              } as monaco.languages.DocumentSymbol;
            }
            return mapDocumentSymbol(s);
          });
        } catch {
          return [];
        }
      },
    })
  );
}
