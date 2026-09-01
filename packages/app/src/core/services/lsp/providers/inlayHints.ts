// textDocument/inlayHint → Monaco InlayHintsProvider
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toMonacoRange } from './helpers';

function mapInlayKind(kind: number | undefined): monaco.languages.InlayHintKind {
  // LSP: 1 = Type, 2 = Parameter
  if (kind === 2) return monaco.languages.InlayHintKind.Parameter;
  return monaco.languages.InlayHintKind.Type;
}

export function registerInlayHints(state: LspState): void {
  // Monaco may not expose InlayHintProvider on older builds — guard at runtime
  const register = (monaco.languages as any).registerInlayHintsProvider
    ?? (monaco.languages as any).registerInlayHintProvider;
  if (typeof register !== 'function') {
    console.warn('[LSP] Monaco InlayHintsProvider API not available');
    return;
  }

  state.disposables.push(
    register.call(monaco.languages, state.languageId, {
      displayName: `LSP InlayHints (${state.languageId})`,

      provideInlayHints: async (
        model: monaco.editor.ITextModel,
        range: monaco.Range,
        _token: monaco.CancellationToken,
      ): Promise<monaco.languages.InlayHintList | null> => {
        if (!state.initialized) return null;

        try {
          const result: any = await sendRequest(state, 'textDocument/inlayHint', {
            textDocument: { uri: getDocUri(model, state) },
            range: {
              start: {
                line: range.startLineNumber - 1,
                character: range.startColumn - 1,
              },
              end: {
                line: range.endLineNumber - 1,
                character: range.endColumn - 1,
              },
            },
          });

          const items = Array.isArray(result) ? result : [];
          if (!items.length) return { hints: [], dispose: () => {} };

          const hints: monaco.languages.InlayHint[] = items.map((h: any) => {
            const pos = h.position ?? { line: 0, character: 0 };
            const label = typeof h.label === 'string'
              ? h.label
              : Array.isArray(h.label)
                ? h.label.map((p: any) => (typeof p === 'string' ? p : p?.value ?? '')).join('')
                : String(h.label ?? '');

            const hint: monaco.languages.InlayHint = {
              label,
              position: {
                lineNumber: (pos.line ?? 0) + 1,
                column: (pos.character ?? 0) + 1,
              },
              kind: mapInlayKind(h.kind),
              paddingLeft: !!h.paddingLeft,
              paddingRight: !!h.paddingRight,
            };

            if (h.tooltip) {
              (hint as any).tooltip = typeof h.tooltip === 'string'
                ? h.tooltip
                : h.tooltip?.value ?? undefined;
            }

            if (Array.isArray(h.textEdits) && h.textEdits.length) {
              (hint as any).textEdits = h.textEdits.map((e: any) => ({
                range: toMonacoRange(e.range),
                text: e.newText ?? '',
              }));
            }

            return hint;
          });

          return { hints, dispose: () => {} };
        } catch {
          return null;
        }
      },
    }),
  );
}
