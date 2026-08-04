// Model change tracking – debounced textDocument/didChange + didOpen on new models
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendNotify } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { notifyDocumentOpen } from '../LspDocumentManager';
import { debounce } from './helpers';

/**
 * Watches Monaco models for the active language:
 *  - debounced `textDocument/didChange` on content edits
 *  - `textDocument/didOpen` when a new matching model is created after init
 */
export function bindModelTracking(state: LspState): void {
  const bindModel = (model: monaco.editor.ITextModel): void => {
    if (model.getLanguageId() !== state.languageId) return;

    // Each model gets its own debounce instance to avoid cross-file delays
    const sendDidChange = debounce(() => {
      if (!state.initialized) return;
      sendNotify(state, 'textDocument/didChange', {
        textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
        contentChanges: [{ text: model.getValue() }],
      });
    }, 400);

    state.disposables.push(
      model.onDidChangeContent(() => {
        if (!state.initialized) return;
        sendDidChange();
      }),
    );
  };

  // Bind existing models
  monaco.editor.getModels().forEach(bindModel);

  // Bind models created after this point (e.g. user opens a new file)
  state.disposables.push(
    monaco.editor.onDidCreateModel(model => {
      bindModel(model);
      if (state.initialized && model.getLanguageId() === state.languageId) {
        notifyDocumentOpen(state, model);
      }
    }),
  );
}
