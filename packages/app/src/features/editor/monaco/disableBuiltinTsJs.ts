// src/features/editor/monaco/disableBuiltinTsJs.ts
//
// Phase 4 — silence Monaco's built-in TypeScript language service.
// Completions / diagnostics / hover for JS/TS come from the external
// terminal language-server plugin (typescript-language-server etc.).

const OFF = {
  noSemanticValidation: true,
  noSyntaxValidation: true,
  noSuggestionDiagnostics: true,
  diagnosticCodesToIgnore: [] as number[],
};

/** Call once at monaco boot (and safe to call again). */
export function silenceBuiltinTsJs(monacoApi: typeof import('monaco-editor')): void {
  try {
    const ts = (monacoApi.languages as any)?.typescript;
    if (!ts) return;

    ts.typescriptDefaults?.setDiagnosticsOptions?.(OFF);
    ts.javascriptDefaults?.setDiagnosticsOptions?.(OFF);

    // Stop eager model sync into a worker we are not loading
    ts.typescriptDefaults?.setEagerModelSync?.(false);
    ts.javascriptDefaults?.setEagerModelSync?.(false);

    // Idle out any accidental worker ASAP (ms)
    try {
      ts.typescriptDefaults?.setMaximumWorkerIdleTime?.(0);
      ts.javascriptDefaults?.setMaximumWorkerIdleTime?.(0);
    } catch {
      /* older monaco */
    }

    // Extra: compiler options that avoid heavy work if something still probes worker
    const light = {
      noLib: true,
      allowNonTsExtensions: true,
      target: ts.ScriptTarget?.ESNext ?? 99,
    };
    try {
      const curT = ts.typescriptDefaults?.getCompilerOptions?.() ?? {};
      ts.typescriptDefaults?.setCompilerOptions?.({ ...curT, ...light });
      const curJ = ts.javascriptDefaults?.getCompilerOptions?.() ?? {};
      ts.javascriptDefaults?.setCompilerOptions?.({ ...curJ, ...light });
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.warn('[Phase4] silenceBuiltinTsJs failed', e);
  }
}

const TS_FAMILY = new Set([
  'typescript',
  'javascript',
  'typescriptreact',
  'javascriptreact',
]);

export function isTsJsFamily(langId: string): boolean {
  return TS_FAMILY.has(langId);
}

/** Per-tab: keep Monaco TS diagnostics off (external plugin owns the language). */
export function ensureTsJsDiagnosticsOff(
  monacoApi: typeof import('monaco-editor'),
  langId: string,
): void {
  if (!isTsJsFamily(langId)) return;
  silenceBuiltinTsJs(monacoApi);
}
