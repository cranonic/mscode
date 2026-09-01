// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toLspRange } from './helpers';
export function registerInlayHints(state: LspState): void {
  // API exists in monaco-editor ≥ 0.34
  const reg = (monaco.languages as any).registerInlayHintsProvider;
  if (typeof reg !== 'function') {
    console.warn('[LSP] registerInlayHintsProvider missing — upgrade monaco-editor');
    return;
  }

  state.disposables.push(
    reg(state.languageId, {
      provideInlayHints: async (model: monaco.editor.ITextModel, range: monaco.IRange) => {
        if (!state.initialized) return { hints: [], dispose: () => {} };
        try {
          const result: any = await sendRequest(state, 'textDocument/inlayHint', {
            textDocument: { uri: getDocUri(model, state) },
            range: toLspRange(range),
          });
          if (!Array.isArray(result)) return { hints: [], dispose: () => {} };
          const hints = result.map((h: any) => ({
            label: typeof h.label === 'string'
              ? h.label
              : (h.label || []).map((p: any) => (typeof p === 'string' ? p : p.value)).join(''),
            position: {
              lineNumber: (h.position?.line ?? 0) + 1,
              column:     (h.position?.character ?? 0) + 1,
            },
            kind: h.kind, // 1=Type, 2=Parameter
            tooltip: typeof h.tooltip === 'string' ? h.tooltip : h.tooltip?.value,
            paddingLeft: h.paddingLeft,
            paddingRight: h.paddingRight,
          }));
          return { hints, dispose: () => {} };
        } catch {
          return { hints: [], dispose: () => {} };
        }
      },
    })
  );
}
