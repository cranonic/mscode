// src/core/services/lsp/utils/uriHelpers.ts
//
// Normalize file URIs between Monaco model URIs, on-disk Android paths,
// and the form expected by language servers (file:///sdcard/...).
//
// Critical: path segments MUST be percent-encoded (spaces → %20).
// JDT LS / Java URI.create() rejects unencoded spaces:
//   Illegal character in path: file:///sdcard/Ay/Typescript Test

import type * as monaco from 'monaco-editor';
import type { LspState } from '../types';

/**
 * Encode an absolute filesystem path as a valid file:// URI.
 * Each path segment is encodeURIComponent'd so spaces and non-ASCII are legal.
 */
function pathToFileUri(absPath: string): string {
  let path = absPath.replace(/\\/g, '/');
  if (!path.startsWith('/')) path = `/${path}`;

  // /storage/emulated/0 → /sdcard (same volume, shorter for servers)
  path = path.replace(/^\/storage\/emulated\/0/i, '/sdcard');

  const encoded = path
    .split('/')
    .map((seg) => (seg === '' ? '' : encodeURIComponent(seg)))
    .join('/');

  // encoded is like /sdcard/Ay/Typescript%20Test → file:///sdcard/...
  return `file://${encoded}`;
}

/**
 * Strip file:// scheme and return a decoded filesystem path (starts with /).
 */
function fileUriToPath(uri: string): string {
  let rest = uri.replace(/^file:\/\//i, '');
  // file:///sdcard/... → rest = /sdcard/...  (three slashes → leading / kept)
  // file://localhost/sdcard → rare; treat as path
  if (!rest.startsWith('/')) rest = `/${rest}`;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}

/**
 * Canonicalize a path or URI into a stable file:// URI that language servers
 * on Android understand. Maps /storage/emulated/0 → /sdcard.
 * Always percent-encodes path segments (required by JDT LS / java.net.URI).
 */
export function toLspUri(input: string): string {
  if (!input) return 'file:///sdcard';

  const u = input.trim();

  if (u.startsWith('file://') || u.startsWith('FILE://')) {
    return pathToFileUri(fileUriToPath(u));
  }

  if (u.startsWith('/')) {
    return pathToFileUri(u);
  }

  // Relative / bare path
  return pathToFileUri(`/sdcard/${u.replace(/^\.\//, '')}`);
}

/**
 * Convert an LSP file:// URI back to a form Monaco / the rest of the app uses.
 * Prefer the original storage path when present; otherwise keep /sdcard.
 * Output remains a file:// URI with encoding preserved via toLspUri rules.
 */
export function fromLspUri(lspUri: string): string {
  if (!lspUri) return '';
  const path = fileUriToPath(lspUri).replace(/^\/sdcard/i, '/storage/emulated/0');
  return pathToFileUri(path);
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
  if (mapped) {
    // Re-canonicalize in case an older unencoded URI was cached
    return toLspUri(mapped);
  }

  const mu = model.uri.toString();
  if (mu && !mu.startsWith('inmemory:')) {
    return toLspUri(mu);
  }

  // Last resort: synthetic path from model id
  return toLspUri(`/sdcard/untitled-${model.id}`);
}
