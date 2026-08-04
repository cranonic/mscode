// src/core/services/lsp/providers/index.ts
//
// Registers / tears down all Monaco ↔ LSP feature providers for one language session.

import * as monaco from 'monaco-editor';
import type { LspState, LspOptions } from '../types';

import { registerCompletion } from './completion';
import { registerHover } from './hover';
import { registerSignatureHelp } from './signatureHelp';
import { registerDefinition } from './definition';
import { registerDocumentFormatting } from './formatting';
import { registerRename } from './rename';
import { registerReferences } from './references';
import { registerDocumentHighlight } from './documentHighlight';
import { registerDocumentSymbol } from './documentSymbol';
import { registerCodeAction } from './codeAction';
import { registerFoldingRange } from './foldingRange';
import { registerCodeLens } from './codeLens';
import { registerDocumentLink } from './documentLink';
import { registerSelectionRange } from './selectionRange';
import { registerColorProvider } from './color';
import { registerOnTypeFormatting } from './onTypeFormatting';
import { registerSemanticTokens } from './semanticTokens';
import { registerInlayHints } from './inlayHints';
import { bindModelTracking } from './modelTracking';

/**
 * Register Monaco language providers based on `options` flags.
 * Always registers definition, formatting, rename when connected.
 */
export function registerProviders(state: LspState, options: LspOptions): void {
  if (options.completion    !== false) registerCompletion(state);
  if (options.hover         !== false) registerHover(state);
  if (options.signatureHelp !== false) registerSignatureHelp(state);

  registerDefinition(state);
  registerDocumentFormatting(state);
  registerRename(state);

  if (options.references        !== false) registerReferences(state);
  if (options.documentHighlight !== false) registerDocumentHighlight(state);
  if (options.documentSymbol    !== false) registerDocumentSymbol(state);
  if (options.codeActions       !== false) registerCodeAction(state);
  if (options.foldingRange      !== false) registerFoldingRange(state);
  if (options.codeLens          !== false) registerCodeLens(state);
  if (options.documentLink      !== false) registerDocumentLink(state);
  if (options.selectionRange    !== false) registerSelectionRange(state);
  if (options.colorProvider     !== false) registerColorProvider(state);
  if (options.onTypeFormatting  !== false) registerOnTypeFormatting(state);
  if (options.semanticTokens    !== false) registerSemanticTokens(state);
  if (options.inlayHints        !== false) registerInlayHints(state);

  bindModelTracking(state);
}

/**
 * Dispose every provider registered for this session and clear markers.
 */
export function teardownProviders(state: LspState): void {
  for (const d of state.disposables) {
    try { d.dispose(); } catch { /* ignore */ }
  }
  state.disposables = [];

  for (const model of monaco.editor.getModels()) {
    monaco.editor.setModelMarkers(model, 'lsp', []);
  }
}
