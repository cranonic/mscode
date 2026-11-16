// Color Provider – textDocument/documentColor
// Monaco API name varies by version; resolve at runtime to avoid TS2551.
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toMonacoRange, toLspRange } from './helpers';

type ColorProviderFn = (
  languageId: string,
  provider: monaco.languages.DocumentColorProvider,
) => monaco.IDisposable;

function resolveColorRegistrar(): ColorProviderFn | null {
  const langs = monaco.languages as typeof monaco.languages & {
    registerDocumentColorProvider?: ColorProviderFn;
    registerColorProvider?: ColorProviderFn;
  };
  if (typeof langs.registerDocumentColorProvider === 'function') {
    return langs.registerDocumentColorProvider.bind(langs);
  }
  if (typeof langs.registerColorProvider === 'function') {
    return langs.registerColorProvider.bind(langs);
  }
  return null;
}

/**
 * Registers an LSP-backed document colour provider when the installed
 * monaco-editor build exposes the API. CSS/HTML built-in swatches are
 * separate and do not depend on this.
 */
export function registerColorProvider(state: LspState): void {
  const register = resolveColorRegistrar();
  if (!register) {
    console.warn(
      '[LSP] Document color provider API missing in this monaco-editor build — skipping',
    );
    return;
  }

  state.disposables.push(
    register(state.languageId, {
      provideDocumentColors: async (
        model: monaco.editor.ITextModel,
      ): Promise<monaco.languages.IColorInformation[]> => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/documentColor', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return [];
          return result.map((c: any) => ({
            color: {
              red:   c.color?.red   ?? 0,
              green: c.color?.green ?? 0,
              blue:  c.color?.blue  ?? 0,
              alpha: c.color?.alpha ?? 1,
            },
            range: toMonacoRange(c.range),
          }));
        } catch {
          return [];
        }
      },

      provideColorPresentations: async (
        model: monaco.editor.ITextModel,
        colorInfo: monaco.languages.IColorInformation,
      ): Promise<monaco.languages.IColorPresentation[]> => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/colorPresentation', {
            textDocument: { uri: getDocUri(model, state) },
            color: colorInfo.color,
            range: toLspRange(colorInfo.range),
          });
          if (!Array.isArray(result)) return [];
          return result.map((p: any) => ({
            label: p.label,
            textEdit: p.textEdit
              ? { range: toMonacoRange(p.textEdit.range), text: p.textEdit.newText }
              : undefined,
            additionalTextEdits: Array.isArray(p.additionalTextEdits)
              ? p.additionalTextEdits.map((e: any) => ({
                  range: toMonacoRange(e.range),
                  text: e.newText ?? '',
                }))
              : undefined,
          }));
        } catch {
          return [];
        }
      },
    }),
  );
}
