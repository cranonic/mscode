// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
import { toMonacoRange, toLspPosition } from './helpers';
export function registerSelectionRange(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerSelectionRangeProvider(state.languageId, {
      provideSelectionRanges: async (model, positions) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/selectionRange', {
            textDocument: { uri: getDocUri(model, state) },
            positions: positions.map(toLspPosition),
          });
          if (!Array.isArray(result)) return [];
          // Each entry is a linked list: { range, parent? }
          const mapChain = (node: any): monaco.languages.SelectionRange[] => {
            const out: monaco.languages.SelectionRange[] = [];
            let cur = node;
            while (cur?.range) {
              out.push({ range: toMonacoRange(cur.range) });
              cur = cur.parent;
            }
            return out;
          };
          return result.map(mapChain);
        } catch {
          return [];
        }
      },
    })
  );
}
