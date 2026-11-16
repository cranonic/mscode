// textDocument/definition → Monaco DefinitionProvider
// Supports both Location and LocationLink (JDT LS / modern servers).
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri, fromLspUri, toLspUri } from '../utils/uriHelpers';
import { toLspPosition } from './helpers';

function toMonacoLocation(loc: any): monaco.languages.Location | null {
  // LocationLink: targetUri + targetSelectionRange / targetRange
  // Location:     uri + range
  const uriStr = loc?.targetUri ?? loc?.uri;
  const range =
    loc?.targetSelectionRange ?? loc?.targetRange ?? loc?.range;
  if (!uriStr || !range) return null;

  let parsed: monaco.Uri;
  try {
    parsed = monaco.Uri.parse(fromLspUri(uriStr));
  } catch {
    try {
      parsed = monaco.Uri.parse(toLspUri(uriStr));
    } catch {
      return null;
    }
  }

  return {
    uri: parsed,
    range: {
      startLineNumber: (range.start?.line ?? 0) + 1,
      startColumn: (range.start?.character ?? 0) + 1,
      endLineNumber: (range.end?.line ?? 0) + 1,
      endColumn: (range.end?.character ?? 0) + 1,
    },
  };
}

export function registerDefinition(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDefinitionProvider(state.languageId, {
      provideDefinition: async (model, position, token) => {
        if (!state.initialized) return null;
        if (token?.isCancellationRequested) return null;

        try {
          const docUri = getDocUri(model, state);
          console.log(
            `[LSP] definition request lang=${state.languageId} uri=${docUri} ` +
              `pos=${position.lineNumber}:${position.column}`,
          );

          const result: any = await sendRequest(state, 'textDocument/definition', {
            textDocument: { uri: docUri },
            position: toLspPosition(position),
          });

          if (!result) {
            console.log('[LSP] definition: empty result');
            return null;
          }

          const locations = Array.isArray(result) ? result : [result];
          const mapped = locations
            .map(toMonacoLocation)
            .filter((x): x is monaco.languages.Location => x != null);

          console.log(`[LSP] definition: ${mapped.length} location(s)`);
          return mapped.length ? mapped : null;
        } catch (err: any) {
          console.warn(
            `[LSP] definition failed (${state.languageId}):`,
            err?.message || err,
          );
          return null;
        }
      },
    }),
  );
}
