// src/features/settings/config/branchs/editor/parts/touchSettings.ts
import type { IConfigurationSection } from '@/core/extensionAPI/registry/configurationRegistry';

export const touchProperties: IConfigurationSection['properties'] = {
  'editor.teardrops.enabled': {
    title: 'Selection Handles (Teardrops)',
    type: 'boolean',
    subCategory: 'Touch',
    defaultValue: true,
    order: 1,
    tags: ['touch', 'teardrops'],
    description: 'Show Android-style selection handles (teardrops) for cursor and selection ranges on touch devices.',
  },

  'editor.teardrops.lens.enabled': {
    title: 'Selection Magnifier Lens',
    type: 'boolean',
    subCategory: 'Touch',
    defaultValue: false,
    order: 2,
    tags: ['touch', 'teardrops', 'lens'],
    description:
      'Show a rectangular magnifier near the finger while dragging selection handles — similar to the Android text selection loupe.',
  },

  'editor.teardrops.lens.scale': {
    title: 'Magnifier Scale',
    type: 'number',
    subCategory: 'Touch',
    defaultValue: 1.6,
    minimum: 1.2,
    maximum: 3,
    order: 3,
    tags: ['touch', 'teardrops', 'lens'],
    description: 'Zoom level of the selection magnifier lens.',
  },
};
