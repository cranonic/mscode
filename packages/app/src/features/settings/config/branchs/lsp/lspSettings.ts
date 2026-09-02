// src/features/settings/config/branchs/lsp/lspSettings.ts
import type { IConfigurationSection } from '@/core/extensionAPI/registry/configurationRegistry';
import { diagnosticsLspProperties } from './parts/diagnosticsSettings';
import { htmlLspProperties } from './parts/htmlSettings';
import { jsLspProperties, tsLspProperties } from './parts/jstsSettings';
import { cssLspProperties, jsonLspProperties } from './parts/cssJsonSettings';

export const lspSection: IConfigurationSection = {
  id:    'lsp',
  title: 'Language Features',
  order: 15,
  properties: {
    // Core diagnostic UI (popup / shadow / off) — not extension-scoped
    ...diagnosticsLspProperties,
    // Monaco built-in language services (no external server)
    ...jsLspProperties,
    ...tsLspProperties,
    ...htmlLspProperties,
    ...cssLspProperties,
    ...jsonLspProperties,
  },
};
