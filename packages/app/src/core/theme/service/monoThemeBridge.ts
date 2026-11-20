/**
 * Bridges app ThemeDefinition → mono-editor global ThemeService.
 * When IDE color theme changes, every mounted MonoEditor re-paints via onDidChangeColorTheme.
 */
import type { ThemeDefinition } from '../types';

// Workspace package export (adjust alias if your app uses a different path)
import {
  monoThemeService,
  registerBuiltinThemes,
} from '@mono/editor';

export function applyThemeToMonoEditor(def: ThemeDefinition): void {
  try {
    registerBuiltinThemes();
    monoThemeService.defineFromVSCodeTheme(def.id, {
      name: def.name,
      type: def.type,
      editorColors: def.editorColors,
      tokenColors: def.tokenColors,
    });
    monoThemeService.setTheme(def.id);
  } catch (e) {
    console.warn('[ThemeService] mono editor theme sync failed', e);
  }
}
