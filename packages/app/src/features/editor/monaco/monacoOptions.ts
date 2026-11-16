// Monaco options removed — Mono Editor uses its own options.
export const MONACO_OPTIONS = {} as const;

/** Legacy helper used by DiffEditor — returns a plain options bag. */
export function buildMonacoOptions(_settings?: Record<string, any>): Record<string, any> {
  return {
    ...MONACO_OPTIONS,
    automaticLayout: true,
    readOnly: false,
    minimap: { enabled: false },
    fontSize: Number(_settings?.['editor.fontSize'] ?? 14),
    lineNumbers: _settings?.['editor.lineNumbers'] === 'off' ? 'off' : 'on',
  };
}
