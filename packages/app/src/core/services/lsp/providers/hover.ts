// textDocument/hover → Monaco HoverProvider (MDN docs for HTML tags/attrs)
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toLspPosition } from './helpers';

function toMarkdown(contents: any): monaco.IMarkdownString[] {
  if (!contents) return [];

  const parts = Array.isArray(contents) ? contents : [contents];
  const out: monaco.IMarkdownString[] = [];

  for (const c of parts) {
    if (!c) continue;
    if (typeof c === 'string') {
      if (c.trim()) out.push({ value: c });
      continue;
    }
    // MarkupContent { kind, value }
    if (typeof c.value === 'string') {
      out.push({ value: c.value, isTrusted: true });
      continue;
    }
    // MarkedString { language, value }
    if (typeof c.language === 'string' && typeof c.value === 'string') {
      out.push({ value: '```' + c.language + '\n' + c.value + '\n```' });
    }
  }
  return out;
}

export function registerHover(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerHoverProvider(state.languageId, {
      provideHover: async (model, position, token) => {
        if (!state.initialized) return null;
        if (token?.isCancellationRequested) return null;

        try {
          const result: any = await sendRequest(state, 'textDocument/hover', {
            textDocument: { uri: getDocUri(model, state) },
            position: toLspPosition(position),
          });

          if (!result?.contents) return null;

          const contents = toMarkdown(result.contents);
          if (!contents.length) return null;

          let range: monaco.IRange | undefined;
          if (result.range) {
            range = {
              startLineNumber: (result.range.start?.line ?? 0) + 1,
              startColumn: (result.range.start?.character ?? 0) + 1,
              endLineNumber: (result.range.end?.line ?? 0) + 1,
              endColumn: (result.range.end?.character ?? 0) + 1,
            };
          }

          return { contents, range };
        } catch (err: any) {
          console.warn(
            `[LSP] hover failed (${state.languageId}):`,
            err?.message || err,
          );
          return null;
        }
      },
    }),
  );
}
