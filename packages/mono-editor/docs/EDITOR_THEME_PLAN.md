# Mono editor — theme system plan

## Built-in themes (5)
| id | Label |
|----|--------|
| `mscode-dark` | MS Code Dark |
| `mscode-light` | MS Code Light |
| `mscode-amoled` | MS Code AMOLED |
| `solarized-dark` | Solarized Dark |
| `solarized-light` | Solarized Light |

## Architecture (Monaco-level)

```
monoThemeService.defineTheme(id, data)     ≈ monaco.editor.defineTheme
monoThemeService.setTheme(id)              ≈ monaco.editor.setTheme
monoThemeService.onDidChangeColorTheme     ≈ onDidChangeColorTheme
monoThemeService.defineFromVSCodeTheme     ≈ app ThemeDefinition → mono
MonoEditor.setTheme(id | Partial<theme>)   ≈ editor.updateOptions / setTheme
```

Each `MonoEditor` instance **subscribes** to `onDidChangeColorTheme` and re-paints.

## What was implemented
- [x] `MonoStandaloneThemeData` (colors + tokenColors + rules)
- [x] `MonoThemeService` singleton
- [x] Scope → MonoTokenType mapping
- [x] 5 built-in themes registered
- [x] MonoEditor auto-sync on theme change
- [x] `setTheme('mscode-dark' | …)` by id
- [x] App bridge `applyThemeToMonoEditor` + themeService patch

## Still to do (expand later)
- [ ] Find/widget/menu colors from `colors` map
- [ ] Sticky/teardrop contrast tokens
- [ ] HC (high contrast) dedicated theme
- [ ] User-imported theme JSON file picker
- [ ] Semantic token colors
- [ ] Per-editor theme override (not only global)
- [ ] Settings UI lists mono themes if separate from workbench (usually same list)

## App wire
1. Replace `packages/mono-editor`
2. Add `monoThemeBridge.ts`
3. In `themeService._applyDefinition`, call `applyThemeToMonoEditor(def)` after UI vars
4. Ensure package export `@mscode/mono-editor` (or relative path) resolves
