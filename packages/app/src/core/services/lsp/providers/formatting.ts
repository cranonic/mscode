// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
export function registerDocumentFormatting(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDocumentFormattingEditProvider(state.languageId, {
      provideDocumentFormattingEdits: async (model, options) => {
        if (!state.initialized) return [];

        try {
          // Push latest content so the server formats what the user actually sees
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          const result: any = await sendRequest(state, 'textDocument/formatting', {
            textDocument: { uri: getDocUri(model, state) },
            options: {
              tabSize:      options.tabSize,
              insertSpaces: options.insertSpaces,
            },
          });

          if (!Array.isArray(result) || result.length === 0) return [];

          return result.map((edit: any) => ({
            range: {
              startLineNumber: (edit.range?.start?.line      ?? 0) + 1,
              startColumn:     (edit.range?.start?.character ?? 0) + 1,
              endLineNumber:   (edit.range?.end?.line        ?? 0) + 1,
              endColumn:       (edit.range?.end?.character   ?? 0) + 1,
            },
            text: edit.newText ?? '',
          }));
        } catch (e) {
          console.warn('[LSP] formatting failed:', e);
          return [];
        }
      },
    })
  );

  // Optional: format selection / range
  state.disposables.push(
    monaco.languages.registerDocumentRangeFormattingEditProvider(state.languageId, {
      provideDocumentRangeFormattingEdits: async (model, range, options) => {
        if (!state.initialized) return [];

        try {
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          const result: any = await sendRequest(state, 'textDocument/rangeFormatting', {
            textDocument: { uri: getDocUri(model, state) },
            range: {
              start: { line: range.startLineNumber - 1, character: range.startColumn - 1 },
              end:   { line: range.endLineNumber   - 1, character: range.endColumn   - 1 },
            },
            options: {
              tabSize:      options.tabSize,
              insertSpaces: options.insertSpaces,
            },
          });

          if (!Array.isArray(result) || result.length === 0) return [];

          return result.map((edit: any) => ({
            range: {
              startLineNumber: (edit.range?.start?.line      ?? 0) + 1,
              startColumn:     (edit.range?.start?.character ?? 0) + 1,
              endLineNumber:   (edit.range?.end?.line        ?? 0) + 1,
              endColumn:       (edit.range?.end?.character   ?? 0) + 1,
            },
            text: edit.newText ?? '',
          }));
        } catch {
          return [];
        }
      },
    })
  );
}
