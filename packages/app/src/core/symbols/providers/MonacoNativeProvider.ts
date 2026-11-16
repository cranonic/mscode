// Monaco native symbol provider — no-op after Monaco removal.
// Deep monaco-editor/esm/* imports cannot resolve when monaco-editor is aliased to the shim.

import { SymbolSource } from '../types';
import type { SymbolProvider, DocumentSymbol } from '../types';

/**
 * Was: query Monaco StandaloneServices documentSymbol providers.
 * Now: always returns null so SymbolManager falls through to other providers / LSP.
 */
export const monacoNativeProvider: SymbolProvider = {
  id: 'monaco-builtin',
  source: SymbolSource.MONACO,
  priority: 80,
  provideSymbols: async (_model: any): Promise<DocumentSymbol[] | null> => null,
};
