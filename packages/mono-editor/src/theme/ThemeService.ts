import type { MonoEditorTheme } from '../api/types';
import { DEFAULT_THEME } from '../api/types';
import { DEFAULT_TOKEN_COLORS } from '../language/tokenTypes';
import { mergeTokenColors, rulesToTokenColors } from './mapTokens';
import type {
  MonoColorTheme,
  MonoStandaloneThemeData,
  MonoThemeChangeListener,
  ResolvedMonoEditorTheme,
} from './types';

/**
 * Monaco-level theme registry for mono-editor.
 *
 * API mirror:
 *   monaco.editor.defineTheme(id, data)
 *   monaco.editor.setTheme(id)
 *   onDidChangeColorTheme
 *
 * Scalable: extensions / app call defineTheme at runtime; all mounted
 * MonoEditor instances subscribe and re-paint.
 */
export class MonoThemeService {
  private themes = new Map<string, MonoColorTheme>();
  private activeId = 'mscode-dark';
  private listeners = new Set<MonoThemeChangeListener>();

  defineTheme(
    id: string,
    data: MonoStandaloneThemeData,
    meta?: { label?: string; type?: MonoColorTheme['type'] },
  ): void {
    const type =
      meta?.type ??
      (data.base === 'vs' ? 'light' : data.base === 'hc-black' ? 'high-contrast' : 'dark');
    this.themes.set(id, {
      id,
      label: meta?.label ?? id,
      type,
      data: {
        inherit: true,
        ...data,
        colors: { ...(data.colors ?? {}) },
        tokenColors: data.tokenColors
          ? { ...DEFAULT_TOKEN_COLORS, ...data.tokenColors }
          : rulesToTokenColors(data.rules),
        rules: data.rules ? [...data.rules] : undefined,
      },
    });
  }

  /**
   * Accept app `ThemeDefinition`-shaped objects without importing app types.
   */
  defineFromVSCodeTheme(
    id: string,
    def: {
      name?: string;
      type?: 'dark' | 'light' | 'high-contrast';
      editorColors?: Record<string, string>;
      tokenColors?: Array<{
        scope: string | string[];
        settings: { foreground?: string; background?: string; fontStyle?: string };
      }>;
    },
  ): void {
    const rules =
      def.tokenColors?.flatMap((tc) => {
        const scopes = Array.isArray(tc.scope) ? tc.scope : [tc.scope];
        return scopes.map((token) => ({
          token,
          foreground: tc.settings.foreground,
          background: tc.settings.background,
          fontStyle: tc.settings.fontStyle,
        }));
      }) ?? [];

    const base =
      def.type === 'light' ? 'vs' : def.type === 'high-contrast' ? 'hc-black' : 'vs-dark';

    this.defineTheme(
      id,
      {
        base,
        inherit: true,
        colors: { ...(def.editorColors ?? {}) },
        rules,
        tokenColors: rulesToTokenColors(rules),
      },
      { label: def.name ?? id, type: def.type ?? 'dark' },
    );
  }

  setTheme(id: string): void {
    if (!this.themes.has(id)) {
      console.warn(`[MonoThemeService] Unknown theme "${id}", keeping "${this.activeId}"`);
      return;
    }
    this.activeId = id;
    const theme = this.themes.get(id)!;
    for (const l of this.listeners) {
      try {
        l(theme);
      } catch {
        /* */
      }
    }
  }

  getTheme(id?: string): MonoColorTheme | undefined {
    return this.themes.get(id ?? this.activeId);
  }

  getColorTheme(): MonoColorTheme {
    return (
      this.themes.get(this.activeId) ?? {
        id: this.activeId,
        label: this.activeId,
        type: 'dark',
        data: { base: 'vs-dark', colors: {}, tokenColors: { ...DEFAULT_TOKEN_COLORS } },
      }
    );
  }

  getActiveThemeId(): string {
    return this.activeId;
  }

  listThemes(): { id: string; label: string; type: MonoColorTheme['type'] }[] {
    return [...this.themes.values()].map((t) => ({
      id: t.id,
      label: t.label,
      type: t.type,
    }));
  }

  onDidChangeColorTheme(listener: MonoThemeChangeListener): { dispose: () => void } {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /** Resolve to canvas MonoEditorTheme + tokenColors + raw colors */
  resolve(id?: string): ResolvedMonoEditorTheme {
    const theme = this.getTheme(id) ?? this.getColorTheme();
    const c = theme.data.colors ?? {};
    const tokenColors = mergeTokenColors(
      theme.data.tokenColors,
      undefined,
    );
    return {
      themeId: theme.id,
      background: c['editor.background'] ?? DEFAULT_THEME.background,
      foreground: c['editor.foreground'] ?? DEFAULT_THEME.foreground,
      gutterBackground:
        c['editorGutter.background'] ??
        c['editor.background'] ??
        DEFAULT_THEME.gutterBackground,
      gutterForeground:
        c['editorLineNumber.foreground'] ?? DEFAULT_THEME.gutterForeground,
      caret: c['editorCursor.foreground'] ?? DEFAULT_THEME.caret,
      selection: c['editor.selectionBackground'] ?? DEFAULT_THEME.selection,
      lineHighlight:
        c['editor.lineHighlightBackground'] ?? DEFAULT_THEME.lineHighlight,
      tokenColors,
      colors: { ...c },
    };
  }

  toPartialEditorTheme(id?: string): Partial<MonoEditorTheme> {
    const r = this.resolve(id);
    return {
      background: r.background,
      foreground: r.foreground,
      gutterBackground: r.gutterBackground,
      gutterForeground: r.gutterForeground,
      caret: r.caret,
      selection: r.selection,
      lineHighlight: r.lineHighlight,
      tokenColors: r.tokenColors,
    };
  }
}

/** Process-wide singleton (Monaco has one global editor theme too). */
export const monoThemeService = new MonoThemeService();
