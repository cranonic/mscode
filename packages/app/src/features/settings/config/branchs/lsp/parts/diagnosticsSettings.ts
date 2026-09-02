// src/features/settings/config/branchs/lsp/parts/diagnosticsSettings.ts
// Core MSCode LSP UI — not extension-scoped.
import type { IConfigurationSection } from '@/core/extensionAPI/registry/configurationRegistry';

export const diagnosticsLspProperties: IConfigurationSection['properties'] = {
  'lsp.diagnostics.displayStyle': {
    title: 'In-Editor Diagnostic Style',
    type: 'select',
    subCategory: 'Diagnostics',
    defaultValue: 'popup',
    order: 1,
    enum: ['popup', 'shadow', 'off'],
    enumItemLabels: [
      'Show popup (default)',
      'Show as shadow text',
      'Off',
    ],
    markdownDescription:
      'How diagnostics appear **inside the editor** when the cursor rests on a problem.\n\n' +
      '- **Show popup** — floating panel with severity, message, and code\n' +
      '- **Show as shadow text** — reddish faded message on the line (Error Lens style)\n' +
      '- **Off** — no in-editor popup or shadow text\n\n' +
      'Status bar problem counts and the **Problems** panel still show diagnostics. ' +
      'To disable diagnostics entirely, use the language LSP validate settings.',
  },
};
