// textDocument/rename + textDocument/prepareRename → Monaco RenameProvider
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { toLspPosition, workspaceEditToMonaco } from './helpers';

export function registerRename(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerRenameProvider(state.languageId, {
      provideRenameEdits: async (model, position, newName, token) => {
        if (!state.initialized) return null;
        if (token?.isCancellationRequested) return null;

        try {
          const result: any = await sendRequest(state, 'textDocument/rename', {
            textDocument: { uri: getDocUri(model, state) },
            position: toLspPosition(position),
            newName,
          });
          if (!result) return null;
          return workspaceEditToMonaco(result);
        } catch (err: any) {
          console.warn(`[LSP] rename failed (${state.languageId}):`, err?.message || err);
          return {
            edits: [],
            rejectReason: err?.message || 'Rename failed',
          };
        }
      },

      resolveRenameLocation: async (model, position, token) => {
        if (!state.initialized) return null;
        if (token?.isCancellationRequested) return null;

        try {
          const result: any = await sendRequest(state, 'textDocument/prepareRename', {
            textDocument: { uri: getDocUri(model, state) },
            position: toLspPosition(position),
          });
          if (!result) return null;

          // prepareRename can return Range | { range, placeholder } | { defaultBehavior }
          if (result.defaultBehavior) {
            return {
              range: model.getWordAtPosition(position)
                ? new monaco.Range(
                    position.lineNumber,
                    model.getWordAtPosition(position)!.startColumn,
                    position.lineNumber,
                    model.getWordAtPosition(position)!.endColumn,
                  )
                : new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
              text: model.getWordAtPosition(position)?.word ?? '',
            };
          }

          const range = result.range ?? result;
          const text =
            result.placeholder ??
            model.getValueInRange({
              startLineNumber: (range.start?.line ?? 0) + 1,
              startColumn: (range.start?.character ?? 0) + 1,
              endLineNumber: (range.end?.line ?? 0) + 1,
              endColumn: (range.end?.character ?? 0) + 1,
            });

          return {
            range: {
              startLineNumber: (range.start?.line ?? 0) + 1,
              startColumn: (range.start?.character ?? 0) + 1,
              endLineNumber: (range.end?.line ?? 0) + 1,
              endColumn: (range.end?.character ?? 0) + 1,
            },
            text: String(text ?? ''),
          };
        } catch (err: any) {
          // prepareRename not supported → Monaco falls back to word range
          const code = err?.lspError?.code ?? err?.code;
          if (code === -32601) return null;
          console.warn(`[LSP] prepareRename failed (${state.languageId}):`, err?.message || err);
          return null;
        }
      },
    }),
  );

  console.log(`[LSP] RenameProvider registered for "${state.languageId}"`);
}
