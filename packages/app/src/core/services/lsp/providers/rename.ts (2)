// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
export function registerRename(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerRenameProvider(state.languageId, {
      // Optional: validate the symbol under the cursor before showing the input
      resolveRenameLocation: async (model, position) => {
        if (!state.initialized) return null;
        try {
          const result: any = await sendRequest(state, 'textDocument/prepareRename', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
          });

          if (!result) return null;

          // Server may return Range or { range, placeholder }
          const r = result.range ?? result;
          if (r?.start == null) return null;

          return {
            range: {
              startLineNumber: r.start.line + 1,
              startColumn:     r.start.character + 1,
              endLineNumber:   r.end.line + 1,
              endColumn:       r.end.character + 1,
            },
            text: result.placeholder
              ?? model.getValueInRange({
                   startLineNumber: r.start.line + 1,
                   startColumn:     r.start.character + 1,
                   endLineNumber:   r.end.line + 1,
                   endColumn:       r.end.character + 1,
                 }),
          };
        } catch {
          // prepareRename not supported — Monaco falls back to word-at-position
          return null;
        }
      },

      provideRenameEdits: async (model, position, newName) => {
        if (!state.initialized) {
          return { edits: [], rejectReason: 'LSP not ready' };
        }

        try {
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          const result: any = await sendRequest(state, 'textDocument/rename', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
            newName,
          });

          if (!result) {
            return { edits: [], rejectReason: 'No rename edits returned' };
          }

          // WorkspaceEdit → Monaco WorkspaceEdit
          const edits: monaco.languages.IWorkspaceTextEdit[] = [];

          // documentChanges form (preferred)
          if (Array.isArray(result.documentChanges)) {
            for (const change of result.documentChanges) {
              if (!change?.edits || !change?.textDocument?.uri) continue;
              const resource = monaco.Uri.parse(fromLspUri(change.textDocument.uri));
              for (const e of change.edits) {
                edits.push({
                  resource,
                  versionId: undefined,
                  textEdit: {
                    range: {
                      startLineNumber: (e.range?.start?.line      ?? 0) + 1,
                      startColumn:     (e.range?.start?.character ?? 0) + 1,
                      endLineNumber:   (e.range?.end?.line        ?? 0) + 1,
                      endColumn:       (e.range?.end?.character   ?? 0) + 1,
                    },
                    text: e.newText ?? '',
                  },
                });
              }
            }
          }
          // changes form: { [uri]: TextEdit[] }
          else if (result.changes && typeof result.changes === 'object') {
            for (const [uri, textEdits] of Object.entries(result.changes as Record<string, any[]>)) {
              const resource = monaco.Uri.parse(fromLspUri(uri));
              for (const e of textEdits) {
                edits.push({
                  resource,
                  versionId: undefined,
                  textEdit: {
                    range: {
                      startLineNumber: (e.range?.start?.line      ?? 0) + 1,
                      startColumn:     (e.range?.start?.character ?? 0) + 1,
                      endLineNumber:   (e.range?.end?.line        ?? 0) + 1,
                      endColumn:       (e.range?.end?.character   ?? 0) + 1,
                    },
                    text: e.newText ?? '',
                  },
                });
              }
            }
          }

          if (edits.length === 0) {
            return { edits: [], rejectReason: 'Nothing to rename' };
          }

          return { edits };
        } catch (e: any) {
          return { edits: [], rejectReason: e?.message ?? 'Rename failed' };
        }
      },
    })
  );
}
