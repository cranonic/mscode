// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
import { asLocationArray, toMonacoRange, toLspPosition } from './helpers';
export function registerReferences(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerReferenceProvider(state.languageId, {
      provideReferences: async (model, position, context) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/references', {
            textDocument: { uri: getDocUri(model, state) },
            position:     toLspPosition(position),
            context:      { includeDeclaration: context.includeDeclaration !== false },
          });
          return asLocationArray(result).map((loc: any) => ({
            uri:   monaco.Uri.parse(fromLspUri(loc.uri)),
            range: toMonacoRange(loc.range),
          }));
        } catch {
          return [];
        }
      },
    })
  );
}
