// src/features/settings/config/branchs/lsp/lspFactory.ts
//
// Factory for generating LSP settings entries.
// Every language gets the same base settings; extras merge under the same subCategory.

import type { IConfigurationSection } from '@/core/extensionAPI/registry/configurationRegistry';

export const generateLspLanguageSettings = (
  displayName: string,
  langId: string,
  serverName: string,
  extraSettings?: IConfigurationSection['properties'],
): IConfigurationSection['properties'] => ({

  [`lsp.${langId}.enabled`]: {
    title:               `Enable ${displayName} Language Features`,
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    tags:                ['lsp', langId],
    markdownDescription:
      `Enable language features (completion, hover, diagnostics, …) for **${displayName}** via \`${serverName}\`.`,
  },

  [`lsp.${langId}.completion`]: {
    title:               'Auto Completion',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription: `Show auto-completion suggestions while typing in ${displayName} files.`,
  },

  [`lsp.${langId}.hover`]: {
    title:               'Hover Documentation',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription: `Show type info and documentation when hovering over symbols in ${displayName}.`,
  },

  [`lsp.${langId}.linting`]: {
    title:               'Real-time Error Checking',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription: `Highlight errors and warnings as you type in ${displayName} files.`,
  },

  [`lsp.${langId}.references`]: {
    title:               'Find All References',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription:
      `Enable **Find All References** / **Peek References** (\`Shift+F12\`) for ${displayName}.`,
  },

  [`lsp.${langId}.documentHighlight`]: {
    title:               'Highlight Occurrences',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription:
      `Highlight all occurrences of the symbol under the cursor in the current ${displayName} file.`,
  },

  [`lsp.${langId}.documentSymbol`]: {
    title:               'Document Symbols / Outline',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription:
      `Enable **Go to Symbol in File** (\`Ctrl+Shift+O\`) and outline/sticky-scroll data for ${displayName}.`,
  },

  [`lsp.${langId}.codeActions`]: {
    title:               'Code Actions (Lightbulb)',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription:
      `Show the lightbulb **quick-fix** / refactor menu for ${displayName} diagnostics and selections.`,
  },

  [`lsp.${langId}.codeLens`]: {
    title:               'CodeLens',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        false,
    markdownDescription:
      `Show inline CodeLens above symbols (e.g. “2 references”) in ${displayName} files. May impact performance.`,
  },

  [`lsp.${langId}.foldingRange`]: {
    title:               'Semantic Folding',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription:
      `Use language-server folding ranges instead of indentation-only folding for ${displayName}.`,
  },

  [`lsp.${langId}.inlayHints`]: {
    title:               'Inlay Hints',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        false,
    markdownDescription:
      `Show inline parameter / type hints in ${displayName} (requires a capable server and monaco-editor ≥ 0.34).`,
  },

  [`lsp.${langId}.semanticHighlighting`]: {
    title:               'Semantic Highlighting',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        true,
    markdownDescription:
      `Use LSP semantic tokens for more accurate highlighting than TextMate alone. Also requires \`editor.semanticHighlighting.enabled\`.`,
  },

  [`lsp.${langId}.formatOnType`]: {
    title:               'Format on Type',
    type:                'boolean',
    subCategory:         displayName,
    defaultValue:        false,
    markdownDescription:
      `Automatically format when typing trigger characters (e.g. \`}\`, \`;\`) in ${displayName}, if the server supports it.`,
  },

  ...extraSettings,
});
