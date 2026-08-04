// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
import { toMonacoRange } from './helpers';
export function registerDocumentLink(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerLinkProvider(state.languageId, {
      provideLinks: async (model) => {
        if (!state.initialized) return { links: [] };
        try {
          const result: any = await sendRequest(state, 'textDocument/documentLink', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return { links: [] };
          const links = result
            .filter((l: any) => l?.range)
            .map((l: any) => ({
              range: toMonacoRange(l.range),
              url: l.target ? fromLspUri(l.target) : undefined,
              tooltip: l.tooltip,
            }));
          return { links };
        } catch {
          return { links: [] };
        }
      },
    })
  );
}
