# Mono Editor (`@mono/editor`)

Canvas-rendered code editor for **Mono Studio** and other apps.

- **Not Monaco** — no Monaco dependency.
- **Smooth** — paints only the visible viewport on `<canvas>`.
- **API module** — `createMonoEditor(host, options)` works without the IDE shell.

## Install (monorepo)

```ts
import { createMonoEditor } from '@mono/editor';
```

## Quick start

```ts
const host = document.getElementById('editor')!;
const editor = createMonoEditor(host, {
  value: 'function hello() {\n  return 1;\n}\n',
  language: 'javascript',
  fontSize: 14,
  lineNumbers: 'on',
});

editor.onDidChangeModelContent(() => {
  console.log(editor.getValue());
});
```

## Status

Phase 0: model, canvas paint, basic input, scroll.
See `docs/MONO_EDITOR_PLAN.md`.
