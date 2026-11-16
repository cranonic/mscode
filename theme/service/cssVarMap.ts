// src/core/theme/service/cssVarMap.ts
// Maps MSCodeUIColors keys → CSS custom properties on :root
import type { MSCodeUIColors } from '@/core/theme/types';

export const CSS_VAR_MAP: Record<keyof MSCodeUIColors, string> = {
  'ms-bg-main':                 '--ms-bg-main',
  'ms-bg-side':                 '--ms-bg-side',
  'ms-bg-activity':             '--ms-bg-activity',
  'ms-activity-hover':          '--ms-activity-hover',
  'ms-tab-inactive-bg':         '--ms-tab-inactive-bg',
  'ms-tab-active-bg':           '--ms-tab-active-bg',
  'ms-text-main':               '--ms-text-main',
  'ms-text-side':               '--ms-text-side',
  'ms-text-activity':           '--ms-text-activity',
  'ms-text-faded':              '--ms-text-faded',
  'ms-text-bright':             '--ms-text-bright',
  'ms-border-light':            '--ms-border-light',
  'ms-border-dark':             '--ms-border-dark',
  'ms-menu-border':             '--ms-menu-border',
  'ms-separator':               '--ms-separator',
  'ms-accent':                  '--ms-accent',
  'ms-icon-hover-bg':           '--ms-icon-hover-bg',
  'ms-menu-hover-bg':           '--ms-menu-hover-bg',
  'ms-shadow':                  '--ms-shadow',
  'ms-settings-bg':             '--ms-settings-bg',
  'ms-settings-category-color': '--ms-settings-category-color',
  'ms-settings-title-color':    '--ms-settings-title-color',
  'ms-settings-desc-color':     '--ms-settings-desc-color',
  'ms-settings-link-color':     '--ms-settings-link-color',
  'ms-input-bg':                '--ms-input-bg',
  'ms-input-fg':                '--ms-input-fg',
  'ms-input-border':            '--ms-input-border',
  'ms-input-focus-border':      '--ms-input-focus-border',
  'ms-code-bg':                 '--ms-code-bg',
  'ms-code-fg':                 '--ms-code-fg',
  'ms-statusbar-bg':            '--ms-statusbar-bg',
  'ms-statusbar-text':          '--ms-statusbar-text',
};

/**
 * Apply uiColors to documentElement. Fills statusbar from side/text when omitted.
 */
export function applyUiColorsToDom(uiColors: Partial<MSCodeUIColors>): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const merged: Partial<MSCodeUIColors> = { ...uiColors };

  if (!merged['ms-statusbar-bg'] && merged['ms-bg-side']) {
    merged['ms-statusbar-bg'] = merged['ms-bg-side'];
  }
  if (!merged['ms-statusbar-text'] && merged['ms-text-main']) {
    merged['ms-statusbar-text'] = merged['ms-text-main'];
  }

  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP) as [keyof MSCodeUIColors, string][]) {
    const val = merged[key];
    if (val != null && val !== '') {
      root.style.setProperty(cssVar, val);
    }
  }
}
