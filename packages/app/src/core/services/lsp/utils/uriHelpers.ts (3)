// src/core/services/lsp/utils/uriHelpers.ts
//
// Normalize file URIs between Monaco model URIs, on-disk Android paths,
// and the form expected by language servers (file:///sdcard/...).

import type * as monaco from 'monaco-editor';
import type { LspState } from '../types';

/**
 * Canonicalize a path or URI into a stable file:// URI that language servers
 * on Android understand. Maps /storage/emulated/0 → /sdcard.
 */
export function toLspUri(input: string): string {
  if (!input) return 'file:///sdcard';

  let u = input.trim();

  // Already a file URI
  if (u.startsWith('file://')) {
    u = u.replace(/^file:\/\/\/storage\/emulated\/0/i, 'file:///sdcard');
    return u;
  }

  // Absolute path
  if (u.startsWith('/')) {
    u = u.replace(/^\/storage\/emulated\/0/i, '/sdcard');
    return `file://${u}`;
  }

  // Relative / bare path
  return `file:///sdcard/${u.replace(/^\.\//, '')}`;
}

/**
 * Convert an LSP file:// URI back to a form Monaco / the rest of the app uses.
 * Prefer the original storage path when present; otherwise keep /sdcard.
 */
export function fromLspUri(lspUri: string): string {
  if (!lspUri) return '';
  // Keep as file:// so monaco.Uri.parse works; only normalize the path segment
  return lspUri.replace(/^file:\/\/\/sdcard/i, 'file:///storage/emulated/0');
}

/**
 * Resolve the document URI that should be sent to the language server for a
 * given Monaco model. Prefer the explicit mapping registered via
 * registerModelUri(); fall back to the model's own URI.
 */
export function getDocUri(
  model: monaco.editor.ITextModel,
  state: LspState,
): string {
  const mapped = state.modelUriMap.get(model.id);
  if (mapped) return mapped;

  const mu = model.uri.toString();
  if (mu && !mu.startsWith('inmemory:')) {
    return toLspUri(mu);
  }

  // Last resort: synthetic path from model id
  return toLspUri(`/sdcard/untitled-${model.id}`);
}
