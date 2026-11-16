// src/features/settings/config/branchs/lsp/parts/jstsSettings.ts
import { generateLspLanguageSettings } from '../lspFactory';

// When the "TypeScript and JavaScript" extension is installed it registers
// typescript-language-server for js/ts. Core lsp.* toggles still apply;
// rich preferences live in the extension's settings.json (typescript.*).

export const jsLspProperties = generateLspLanguageSettings(
  'JavaScript', 'javascript', 'typescript-language-server',
  {
    'lsp.javascript.implicitAny': {
      title:               'Report Implicit Any',
      type:                'boolean',
      subCategory:         'JavaScript',
      defaultValue:        false,
      markdownDescription:
        'Flag variables that are implicitly typed as `any` (useful when migrating toward TypeScript).',
    },
    'lsp.javascript.unusedLocals': {
      title:               'Report Unused Variables',
      type:                'boolean',
      subCategory:         'JavaScript',
      defaultValue:        false,
      markdownDescription: 'Warn about declared variables that are never used.',
    },
    'lsp.javascript.strictNullChecks': {
      title:               'Strict Null Checks',
      type:                'boolean',
      subCategory:         'JavaScript',
      defaultValue:        false,
      markdownDescription: 'Treat `null` and `undefined` as distinct types.',
    },
  },
);

export const tsLspProperties = generateLspLanguageSettings(
  'TypeScript', 'typescript', 'typescript-language-server',
  {
    'lsp.typescript.strictMode': {
      title:               'Strict Mode',
      type:                'boolean',
      subCategory:         'TypeScript',
      defaultValue:        true,
      markdownDescription:
        'Enable all strict type-checking options (`strictNullChecks`, `noImplicitAny`, etc.).',
    },
    'lsp.typescript.unusedLocals': {
      title:               'Report Unused Variables',
      type:                'boolean',
      subCategory:         'TypeScript',
      defaultValue:        true,
      markdownDescription: 'Warn about declared variables that are never used.',
    },
    'lsp.typescript.unusedParameters': {
      title:               'Report Unused Parameters',
      type:                'boolean',
      subCategory:         'TypeScript',
      defaultValue:        false,
      markdownDescription: 'Warn about function parameters that are never used.',
    },
  },
);
