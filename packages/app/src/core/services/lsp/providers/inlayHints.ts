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

/** Per-language change emitters so we can refresh hints after didOpen / didChange. */
const changeEmitters = new Map<string, { fire: () => void; event: (l: () => void) => { dispose: () => void } }>();

function getOrCreateEmitter(langId: string) {
  let em = changeEmitters.get(langId);
  if (em) return em;

  const listeners = new Set<() => void>();
  em = {
    fire: () => {
      for (const l of [...listeners]) {
        try { l(); } catch { /* ignore */ }
      }
    },
    event: (listener: () => void) => {
      listeners.add(listener);
      return { dispose: () => { listeners.delete(listener); } };
    },
  };
  changeEmitters.set(langId, em);
  return em;
}

/**
 * Ask Monaco to re-query inlay hints for a language (call after didOpen / didChange).
 * Without this, some Monaco builds never request textDocument/inlayHint for TS.
 */
export function refreshInlayHints(langId?: string): void {
  if (langId) {
    changeEmitters.get(langId)?.fire();
    return;
  }
  for (const em of changeEmitters.values()) em.fire();
}

export function registerInlayHints(state: LspState): void {
  const register = (monaco.languages as any).registerInlayHintsProvider
    ?? (monaco.languages as any).registerInlayHintProvider;
  if (typeof register !== 'function') {
    console.warn('[LSP] Monaco InlayHintsProvider API not available');
    return;
  }

  const langId = state.languageId;
  const emitter = getOrCreateEmitter(langId);

  // Prefer LanguageSelector object — more reliable than bare string on some Monaco builds
  const selector: monaco.languages.LanguageSelector = { language: langId };

  const provider: monaco.languages.InlayHintsProvider = {
    displayName: `LSP InlayHints (${langId})`,

    // Critical: without this event Monaco often never re-queries after the first paint
    onDidChangeInlayHints: emitter.event as any,

    provideInlayHints: async (
      model: monaco.editor.ITextModel,
      range: monaco.Range,
      token: monaco.CancellationToken,
    ): Promise<monaco.languages.InlayHintList | null> => {
      console.log(
        `[LSP] provideInlayHints called lang=${langId} modelLang=${model.getLanguageId()} ` +
        `range=${range.startLineNumber}-${range.endLineNumber} init=${state.initialized}`,
      );

      if (!state.initialized) return null;
      if (token?.isCancellationRequested) return null;

      try {
        const uri = getDocUri(model, state);
        const result: any = await sendRequest(state, 'textDocument/inlayHint', {
          textDocument: { uri },
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
        console.log(`[LSP] inlayHint response: ${items.length} hint(s) for ${uri}`);

        if (!items.length) {
          return { hints: [], dispose: () => {} };
        }

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
      } catch (err: any) {
        const code = err?.lspError?.code ?? err?.code;
        if (code === -32601) {
          console.warn(`[LSP] textDocument/inlayHint not supported by ${langId} server`);
        } else {
          console.warn(`[LSP] inlayHint failed (${langId}):`, err?.message || err);
        }
        return null;
      }
    },
  };

  try {
    const disposable = register.call(monaco.languages, selector, provider);
    state.disposables.push(disposable);
    console.log(`[LSP] InlayHintsProvider registered for "${langId}" (selector=object)`);
  } catch (e1) {
    // Fallback: bare language id string (older Monaco)
    try {
      const disposable = register.call(monaco.languages, langId, provider);
      state.disposables.push(disposable);
      console.log(`[LSP] InlayHintsProvider registered for "${langId}" (selector=string)`);
    } catch (e2) {
      console.error(`[LSP] InlayHintsProvider registration FAILED for "${langId}":`, e1, e2);
    }
  }
}
