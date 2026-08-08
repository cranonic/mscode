// On-Type Formatting – textDocument/onTypeFormatting
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toMonacoRange, toLspPosition } from './helpers';

export function registerOnTypeFormatting(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerOnTypeFormattingEditProvider(state.languageId, {
      autoFormatTriggerCharacters: ['}', ';', '\n'],
      provideOnTypeFormattingEdits: async (model, position, ch, options) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/onTypeFormatting', {
            textDocument: { uri: getDocUri(model, state) },
            position: toLspPosition(position),
            ch,
            options: {
              tabSize: options.tabSize,
              insertSpaces: options.insertSpaces,
            },
          });
          if (!Array.isArray(result)) return [];
          return result.map((e: any) => ({
            range: toMonacoRange(e.range),
            text: e.newText ?? '',
          }));
        } catch {
          return [];
        }
      },
    }),
  );
}
