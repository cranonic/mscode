# Monaco → Mono Editor

Default code editor is now **Mono Editor** (`packages/mono-editor`): canvas-based, no Monaco runtime.

- Entry: `features/editor/CodeEditor.tsx`
- Package: `@mono/editor`
- Residual imports of `monaco-editor` / `@monaco-editor/react` resolve to `src/shims/*` no-ops until those call sites are deleted.

See `docs/MONO_EDITOR_PLAN.md`.
