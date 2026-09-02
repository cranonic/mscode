// src/core/theme/editorCssVars.ts
//
// Mirrors live `editor.fontFamily` / size / weight onto document CSS variables
// so UI chrome (diagnostic popup, extension widgets) and third-party editor
// extensions can share the same typeface as Monaco.
//
// CSS variables (on :root):
//   --ms-editor-font-family
//   --ms-editor-font-size
//   --ms-editor-font-weight

/** Canonical CSS custom-property names for editor typography */
export const EDITOR_CSS_VARS = {
  fontFamily: '--ms-editor-font-family',
  fontSize: '--ms-editor-font-size',
  fontWeight: '--ms-editor-font-weight',
} as const;

/** Fallback stack when setting is empty (matches monacoOptions defaults) */
export const DEFAULT_EDITOR_FONT_FAMILY =
  "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace";

const DEFAULT_FONT_SIZE = '13px';
const DEFAULT_FONT_WEIGHT = 'normal';

/**
 * Turn a user `editor.fontFamily` value into a safe CSS `font-family` list.
 * - Already-quoted or multi-family strings are left mostly intact
 * - Bare names like `Fira Code` become `'Fira Code', monospace`
 */
export function toCssFontFamily(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return DEFAULT_EDITOR_FONT_FAMILY;
  const s = raw.trim();
  // User already provided a stack (commas) or quoted name
  if (s.includes(',') || s.includes("'") || s.includes('"')) return s;
  // Single unquoted family with spaces → quote + monospace fallback
  if (/\s/.test(s)) return `'${s.replace(/'/g, '')}', monospace`;
  return `${s}, monospace`;
}

export function toCssFontSize(raw: unknown): string {
  if (typeof raw === 'number' && Number.isFinite(raw)) return `${raw}px`;
  if (typeof raw === 'string' && raw.trim()) {
    const t = raw.trim();
    if (/^\d+(\.\d+)?px$/.test(t)) return t;
    if (/^\d+(\.\d+)?$/.test(t)) return `${t}px`;
    return t;
  }
  return DEFAULT_FONT_SIZE;
}

export function toCssFontWeight(raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') return DEFAULT_FONT_WEIGHT;
  return String(raw);
}

/**
 * Write editor typography settings onto `:root` (documentElement).
 * Safe to call often — only touches the three editor vars.
 */
export function applyEditorCssVars(settings: Record<string, unknown> | null | undefined): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const s = settings || {};

  root.style.setProperty(
    EDITOR_CSS_VARS.fontFamily,
    toCssFontFamily(s['editor.fontFamily']),
  );
  root.style.setProperty(
    EDITOR_CSS_VARS.fontSize,
    toCssFontSize(s['editor.fontSize']),
  );
  root.style.setProperty(
    EDITOR_CSS_VARS.fontWeight,
    toCssFontWeight(s['editor.fontWeight']),
  );
}

/**
 * Subscribe to settings store and keep CSS vars in sync.
 * Call once at app bootstrap (after settings store exists).
 */
export function bindEditorCssVarsToSettings(
  getSettings: () => Record<string, unknown>,
  subscribe: (listener: () => void) => () => void,
): () => void {
  const sync = () => applyEditorCssVars(getSettings());
  sync();
  return subscribe(sync);
}
