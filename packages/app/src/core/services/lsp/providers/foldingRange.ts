// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
export function registerFoldingRange(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerFoldingRangeProvider(state.languageId, {
      provideFoldingRanges: async (model) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/foldingRange', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return [];
          const K = monaco.languages.FoldingRangeKind;
          return result.map((f: any) => ({
            start: f.startLine + 1,
            end:   f.endLine + 1,
            kind:  f.kind === 'comment' ? K.Comment
              : f.kind === 'imports' ? K.Imports
              : f.kind === 'region'  ? K.Region
              : undefined,
          }));
        } catch {
          return [];
        }
      },
    })
  );
}
