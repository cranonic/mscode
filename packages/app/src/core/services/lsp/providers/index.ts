// src/core/services/lsp/providers/index.ts
//
// Registers Monaco language providers against the active LSP connection.
// For the TypeScript family (ts / tsx / js / jsx) one typescript-language-server
// process serves all four language IDs, so we register providers for every
// member of the family.

import type { LspState } from '../types';
import type { LspOptions } from '../types';

import { registerCompletion }        from './completion';
import { registerDefinition }        from './definition';
import { registerDocumentSymbol }    from './documentSymbol';
import { registerDocumentHighlight } from './documentHighlight';
import { registerDocumentLink }      from './documentLink';
import { registerCodeAction }        from './codeAction';
import { registerCodeLens }          from './codeLens';
import { registerFoldingRange }      from './foldingRange';
import { registerDocumentFormatting } from './formatting';
import { registerColorProvider }     from './color';

/** Languages that share a single typescript-language-server process. */
export const TS_JS_FAMILY = [
  'typescript',
  'typescriptreact',
  'javascript',
  'javascriptreact',
] as const;

export function isTsJsFamily(langId: string): boolean {
  return (TS_JS_FAMILY as readonly string[]).includes(langId);
}

/**
 * Register all Monaco providers.
 * When the connected language is any member of the TS/JS family, providers are
 * registered for every family member so switching tabs (js ↔ ts ↔ tsx) keeps
 * completions, symbols, hover, etc. working without a reconnect.
 */
export function registerProviders(state: LspState, options: LspOptions = {}): void {
  const primary = state.languageId;
  const langs = isTsJsFamily(primary)
    ? [...TS_JS_FAMILY]
    : [primary];

  // Each registerXxx reads state.languageId at call-time for the Monaco API
  // language argument. Temporarily switch it so every family member gets a
  // provider; restore the primary id afterwards (used by diagnostics routing).
  for (const lang of langs) {
    state.languageId = lang;

    if (options.completion !== false)        registerCompletion(state);
    if (options.references !== false || options.definition !== false) {
      registerDefinition(state);
    }
    if (options.documentSymbol !== false)    registerDocumentSymbol(state);
    if (options.documentHighlight !== false) registerDocumentHighlight(state);
    registerDocumentLink(state);
    if (options.codeActions !== false)       registerCodeAction(state);
    if (options.codeLens)                    registerCodeLens(state);
    if (options.foldingRange !== false)      registerFoldingRange(state);
    registerDocumentFormatting(state);
    if (options.colorProvider !== false)     registerColorProvider(state);
  }

  state.languageId = primary;
}

/** Dispose every Monaco provider registered for this connection. */
export function teardownProviders(state: LspState): void {
  for (const d of state.disposables) {
    try { d.dispose(); } catch { /* ignore */ }
  }
  state.disposables = [];
}
