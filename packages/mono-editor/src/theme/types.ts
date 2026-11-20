import type { MonoTokenTheme } from '../language/tokenTypes';
import type { MonoEditorTheme } from '../api/types';

/** Monaco-compatible base themes */
export type MonoThemeBase = 'vs' | 'vs-dark' | 'hc-black';

/**
 * Monaco `IStandaloneThemeData`-like payload.
 * Expandable: new color keys / rules without breaking editors.
 */
export interface MonoStandaloneThemeData {
  base: MonoThemeBase;
  inherit?: boolean;
  /** VS Code / Monaco color tokens (editor.background, …) */
  colors?: Record<string, string>;
  /**
   * Direct canvas token palette (preferred).
   * If omitted, derived from `rules` / defaults.
   */
  tokenColors?: MonoTokenTheme;
  /**
   * Monaco/TextMate-style rules (token scope → color).
   * Used to derive MonoTokenTheme when tokenColors absent.
   */
  rules?: MonoThemeRule[];
}

export interface MonoThemeRule {
  /** Scope or mono token name (e.g. "comment", "keyword.control") */
  token: string;
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

export interface MonoColorTheme {
  id: string;
  label: string;
  type: 'dark' | 'light' | 'high-contrast';
  data: MonoStandaloneThemeData;
}

export type MonoThemeChangeListener = (theme: MonoColorTheme) => void;

/** Resolved colors the canvas editor consumes */
export interface ResolvedMonoEditorTheme extends MonoEditorTheme {
  tokenColors: MonoTokenTheme;
  /** Raw VS Code color map for future widgets (suggest, hover, …) */
  colors: Record<string, string>;
  themeId: string;
}
