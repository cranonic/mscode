# themeService.ts — mono editor sync

In `_applyDefinition`, after Monaco `setTheme` (or replace Monaco block when Monaco is removed):

```ts
import { applyThemeToMonoEditor } from './monoThemeBridge';

// … existing UI CSS vars …

// Monaco (legacy, optional)
// monaco.editor.defineTheme(...)
// monaco.editor.setTheme(def.id)

// Mono editor (canvas) — required
applyThemeToMonoEditor(def);
```

Also on `registerTheme` when applying pending theme, mono path runs via `_applyDefinition`.
