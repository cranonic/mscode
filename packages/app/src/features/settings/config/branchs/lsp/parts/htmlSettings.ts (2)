// src/features/settings/config/branchs/lsp/parts/htmlSettings.ts
import { generateLspLanguageSettings } from '../lspFactory';

export const htmlLspProperties = generateLspLanguageSettings(
  'HTML', 'html', 'Monaco Built-in',
  {
    'lsp.html.tagMatching': {
      title:               'Tag Matching Highlight',
      type:                'boolean',
      subCategory:         'HTML',
      defaultValue:        true,
      markdownDescription:
        'Highlight the matching opening/closing HTML tag when the cursor is on a tag.',
    },
    'lsp.html.autoCloseTag': {
      title:               'Auto Close Tags',
      type:                'boolean',
      subCategory:         'HTML',
      defaultValue:        true,
      markdownDescription: 'Automatically insert the closing tag when you type `</`.',
    },
    // Monaco built-in already paints colour swatches for CSS values inside HTML.
    // This toggles that behaviour; no extra LSP Color Provider required for HTML.
    'lsp.html.colorDecorators': {
      title:               'Color Decorators',
      type:                'boolean',
      subCategory:         'HTML',
      defaultValue:        true,
      markdownDescription:
        'Show inline colour swatches next to CSS colour values in HTML. Uses Monaco built-in colour detection (not an external LSP).',
    },
  },
);
