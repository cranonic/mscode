// src/core/services/lsp/LspDocumentManager.ts

import * as monaco from 'monaco-editor';
import type { LspState } from './types';
import { sendNotify } from './LspTransport';
import { toLspUri, getDocUri } from './utils/uriHelpers';
import { isTsJsFamily } from './providers';

/** Delay before pushing a full-text didChange after the user stops typing. */
const DID_CHANGE_DEBOUNCE_MS = 300;

/**
 * Associates an in-memory Monaco TextModel instance with a concrete filesystem URI address.
 * Typically dispatched from tab lifecycle activations (`useLspSync`) when documents mount.
 */
export function registerModelUri(
  state: LspState,
  model: monaco.editor.ITextModel,
  realFileUri: string,
): void {
  const lspUri = toLspUri(realFileUri);
  state.modelUriMap.set(model.id, lspUri);
  console.log(`[LSP] Workspace URI association established: ${model.id} → ${lspUri}`);
}

/**
 * Detach content listener + clear pending debounce for a model.
 */
function detachContentListener(state: LspState, modelId: string): void {
  const timer = state.changeDebounceTimers.get(modelId);
  if (timer != null) {
    clearTimeout(timer);
    state.changeDebounceTimers.delete(modelId);
  }
  const sub = state.contentListeners.get(modelId);
  if (sub) {
    try { sub.dispose(); } catch { /* ignore */ }
    state.contentListeners.delete(modelId);
  }
}

/**
 * Push full document text as textDocument/didChange (Full sync).
 * Used both for live typing updates and tab-switch re-sync.
 */
export function sendFullDocumentChange(
  state: LspState,
  model: monaco.editor.ITextModel,
): void {
  if (!state.initialized) return;
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;

  const uri = getDocUri(model, state);
  if (!state.openedUris.has(uri)) return;

  sendNotify(state, 'textDocument/didChange', {
    textDocument: { uri, version: model.getVersionId() },
    contentChanges: [{ text: model.getValue() }],
  });
}

/**
 * Attach a debounced onDidChangeContent listener so diagnostics / inlay hints
 * refresh while typing. Safe to call multiple times — reuses existing subscription.
 */
export function attachContentListener(
  state: LspState,
  model: monaco.editor.ITextModel,
): void {
  if (state.contentListeners.has(model.id)) return;
  if (!isCompatibleLanguage(state, model.getLanguageId())) return;

  const sub = model.onDidChangeContent(() => {
    if (!state.initialized) return;

    const prev = state.changeDebounceTimers.get(model.id);
    if (prev != null) clearTimeout(prev);

    const handle = setTimeout(() => {
      state.changeDebounceTimers.delete(model.id);
      sendFullDocumentChange(state, model);
    }, DID_CHANGE_DEBOUNCE_MS);

    state.changeDebounceTimers.set(model.id, handle);
  });

  state.contentListeners.set(model.id, sub);
}

/**
 * Tears down document context maps upon tab deletion or model disposal.
 * Sends textDocument/didClose and removes the content listener.
 */
export function unregisterModelUri(
  state: LspState,
  model: monaco.editor.ITextModel,
): void {
  detachContentListener(state, model.id);

  const uri = state.modelUriMap.get(model.id);
  if (!uri) return;

  if (state.openedUris.has(uri)) {
    sendNotify(state, 'textDocument/didClose', { textDocument: { uri } });
    console.log(`[LSP] Dispatched explicit didClose signal for: ${uri}`);
  }

  state.openedUris.delete(uri);
  state.modelUriMap.delete(model.id);
}

/**
 * True when the model language is compatible with the connected server language.
 * TS/JS family members all share one typescript-language-server process.
 */
function isCompatibleLanguage(state: LspState, modelLang: string): boolean {
  if (modelLang === state.languageId) return true;
  if (isTsJsFamily(state.languageId) && isTsJsFamily(modelLang)) return true;
  return false;
}

/**
 * Signals language server when switching tabs or opening a fresh file.
 * Also installs the live typing → didChange bridge.
 */
export function notifyDocumentOpen(
  state: LspState,
  model: monaco.editor.ITextModel,
): void {
  if (!state.initialized) return;

  const modelLang = model.getLanguageId();
  if (!isCompatibleLanguage(state, modelLang)) return;

  const uri = getDocUri(model, state);

  // Always keep a live content listener while the doc is open on this server
  attachContentListener(state, model);

  // ── RE-SYNCHRONIZATION TIER ──
  if (state.openedUris.has(uri)) {
    sendFullDocumentChange(state, model);
    console.log(`[LSP] Document stream sync updated via didChange: ${uri}`);
    return;
  }

  // ── INITIAL ACCESS TIER ──
  sendNotify(state, 'textDocument/didOpen', {
    textDocument: {
      uri,
      languageId: modelLang,
      version: model.getVersionId(),
      text: model.getValue(),
    },
  });

  state.openedUris.add(uri);
  console.log(`[LSP] Document stream tracking initialized via didOpen: ${uri} (${modelLang})`);
}

/**
 * After handshake: open every compatible model and attach content listeners.
 */
export function syncOpenEditors(state: LspState): void {
  const models = monaco.editor.getModels();
  console.log(`[LSP] Initializing compilation sync across ${models.length} active models...`);

  for (const model of models) {
    if (!isCompatibleLanguage(state, model.getLanguageId())) continue;
    notifyDocumentOpen(state, model);
  }
}

/**
 * Dispose all content listeners + debounce timers (called from teardown / disconnect).
 */
export function clearAllContentListeners(state: LspState): void {
  for (const timer of state.changeDebounceTimers.values()) {
    clearTimeout(timer);
  }
  state.changeDebounceTimers.clear();

  for (const sub of state.contentListeners.values()) {
    try { sub.dispose(); } catch { /* ignore */ }
  }
  state.contentListeners.clear();
}
