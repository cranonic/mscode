# Mono IDE — Monaco → Mono wire plan

**Source of truth:** `packages/mono-editor/docs/check.md` (latest GitHub)  
**Goal:** App-এর সব Monaco surface একট একট করে Mono (`packages/mono-editor`) দিয়ে replace করা।  
**Audience:** next AI / developer — এখান থেকেই next task বাছাই করবে।

### Legend
| Mark | Meaning |
|------|---------|
| ✅ | Complete / usable |
| 🟡 | Partial / stub / wrong path still |
| ❌ | Not done |

### Status rule
- Feature **Mono package-এ** থাকলেও app **wire না** থাকলে wire row = ❌ বা 🟡।
- “Done” মানে: build green + real device/editor path-এ কাজ করে।

---

## PART 0 — Current baseline (already in Mono package)

### ✅ Done (engine core)
| Area | What’s in |
|------|-----------|
| Text model | get/setValue, offset↔position, insert/delete/applyEdit, versionId, languageId |
| Undo/Redo | stack + selection restore on undo of cut/del/replace |
| Cursor / selection | single caret, shift-select, Ctrl+A, double-tap word, long-press |
| Teardrops | start/end/cursor, drag, free-drag |
| Pointer / scroll | touch scroll, fling, axis lock |
| Sticky scroll | Acode-style indent scopes + push |
| Syntax color | provider registry, line tokens, theme.tokenColors |
| Find/Replace | widget engine (regex/case/word) |
| Context menu | Android icon menu, extensible items |
| Commands | CommandService, Registry, ContextKeyService, KeybindingService, addAction |
| Palette engine | PaletteService (UI lives in app) |
| React wrapper | basic `MonoEditor` component |

### 🟡 Partial
| Area | Gap |
|------|-----|
| tabSize option | option exists, indent still hardcoded `'  '` |
| readOnly | textarea only; keydown still edits |
| Theme | constructor theme ok; no runtime `setTheme` / app ThemeDefinition map |
| Find preserve-case | UI control, no logic |
| Breadcrumbs | app UI exists; data still Monaco-oriented |
| Diff editor | stub |
| Selection magnifier | old Monaco path |

### ❌ Not in Mono (high-level)
Multi-cursor, folding, word wrap, minimap, decorations/markers, suggest/hover/signature, LSP bridge, accessibility, unit tests, piece-table large-file mode, `getAlternativeVersionId`, incremental model rebuild.

---

## PART 1 — Bridge API (P0) — **unblocks almost all app hooks**

**Why first:** App hooks (`useEditorLifecycle`, `useEditorStateSync`, diagnostics, breadcrumbs, scrollbar, teardrops app-side, commandRegistry) still call **Monaco IStandaloneCodeEditor** shapes.

### 1.1 `IMonoEditor` surface parity (minimum)

| API | Status | Notes |
|-----|--------|-------|
| `getPosition` / `setPosition` | ✅ | |
| `getSelection` / `setSelection` | ✅ | map to SelectionState |
| `revealLine` / `revealPosition` / `revealRange` | ✅ | + InCenter variants |
| `getScrollTop` / `setScrollTop` / `getScrollLeft` / `setScrollLeft` | ✅ | + onDidScrollChange |
| `onDidChangeCursorPosition` | ✅ | |
| `onDidChangeCursorSelection` | ✅ | |
| `onDidScrollChange` | ✅ | |
| `onDidFocusEditorText` / `onDidBlurEditorText` | ✅ | |
| `hasTextFocus` | ✅ | |
| `getModel()` | ✅ | thin IMonoTextModel adapter |
| `executeEdits` | ✅ | |
| `deltaDecorations` | ❌ | can no-op until PART 4 |
| `setModelMarkers` / `getModelMarkers` | ❌ | until decorations |
| `updateOptions` | ✅ | font, lineNumbers, readOnly, tabSize, sticky… |
| `setTheme` / theme id map | 🟡 | Partial MonoEditorTheme + vs/vs-dark names |
| `getAction(id).run()` | ✅ | bridges CommandService.executeCommand |
| `addAction` | ✅ | package level |
| `layout` | ✅ | |
| `focus` / `dispose` | ✅ | |
| `getValue` / `setValue` / `onDidChangeModelContent` | ✅ | |

**Exit criteria:** App can hold `IMonoEditor` where it held Monaco editor; TypeScript compiles against a shared `ICodeEditor`-lite interface.

### 1.2 App shell wire

| Task | Status | File hints |
|------|--------|------------|
| `CodeEditor.tsx` creates Mono not Monaco | 🟡 | may still mix shims |
| Remove deep `monaco-editor/esm/...` imports | 🟡/❌ | prior UNLOADABLE_DEPENDENCY |
| Cursor/scroll restore on tab switch | ❌ | |
| Hot-exit / backup version id | ❌ | needs `getAlternativeVersionId` |
| `pendingNavigation` (go-to-line) | ❌ | |
| `commands.setActiveEditor` | ❌ | |
| ThemeDefinition → MonoEditorTheme | ❌ | stop hardcoded `#1e1e1e` |
| Outside-focus (sidebar search) no steal | ✅ | recent InputController fix |

**Exit criteria:** Open file → type → save path works without Monaco runtime.

---

## PART 2 — Daily editing commands (P1)

| Feature | Status | Wire / implement |
|---------|--------|------------------|
| Tab size from options | 🟡 | InputController use `tabSize` |
| readOnly guards all edit paths | 🟡 | |
| Auto-indent on Enter | ❌ | |
| Auto-close brackets/quotes | ❌ | |
| Indent/Outdent selection (Tab / Shift+Tab) | ❌ | |
| Toggle line / block comment | ❌ | language config |
| Word nav Ctrl+←/→, Ctrl+Backspace/Delete | ❌ | |
| Goal column | ❌ | |
| PageUp/PageDown, Ctrl+Home/End | ❌ | |
| Move/Duplicate/Delete line | ❌ | |
| Undo grouping (typing coalesced) | ❌ | EditStack |
| IME / composition | ❌ | Android critical |
| Horizontal caret follow (scrollLeft) | ❌ | bug list in check.md |

**Exit criteria:** Feels usable for normal coding without LSP.

---

## PART 3 — Performance (P2)

| Feature | Status |
|---------|--------|
| Incremental TextModel (no full `getValue` rebuild each key) | ❌ |
| Incremental tokenizer + line cache invalidate range | 🟡 | cache exists; full-line path |
| Large-file mode / piece table | ❌ |
| Scroll paint: no measureText jitter | ✅ | charWidth path |

**Exit criteria:** 5k+ line file types without multi-second stalls on low-end Android.

---

## PART 4 — Display & chrome (P3)

| Feature | Status | App wire |
|---------|--------|----------|
| Word wrap | ❌ | |
| Indent guides | ❌ | |
| Bracket matching highlight | ❌ | |
| Occurrence highlight | ❌ | |
| Folding (indent) + gutter chevron | ❌ | |
| Editor scrollbar (custom) | 🟡 | `EditorScrollbar` still Monaco |
| Minimap | ❌ | |
| Sticky scroll | ✅ | package |
| Line numbers / gutter | ✅ | |
| Teardrops under sticky z-order | ✅ | |

**Exit criteria:** Visual parity for “reading code” without AI features.

---

## PART 5 — Decorations, diagnostics, Problems (P4a)

| Feature | Status | App dependency |
|---------|--------|----------------|
| Decorations API (`deltaDecorations`) | ❌ | many hooks |
| Markers / squiggles | ❌ | `diagnosticsAPI`, `useDiagnosticPopup` |
| Gutter icons | ❌ | |
| Problems panel data source | ❌ | |

**Wire order:** Mono decorations model → adapter → diagnosticsAPI → popup → Problems view.

---

## PART 6 — IntelliSense / LSP (P4b)

| Feature | Status | Notes |
|---------|--------|-------|
| Completion / suggest widget | ❌ | |
| Hover | ❌ | |
| Signature help | ❌ | |
| Definition / references / rename | ❌ | |
| Format doc/selection/on-save | ❌ | `formattersAPI` |
| Document symbols → breadcrumbs/outline | 🟡 | `symbolManager` ready; needs model events |
| Inlay hints | ❌ | |
| Semantic tokens | ❌ | |

**Rule:** LSP providers must **not** import Monaco; only Mono model + decoration + widget APIs.

**Exit criteria:** At least completion + hover + format for one language (TS/JS).

---

## PART 7 — App feature migration checklist (Monaco → Mono)

Replace / rewire these (from check.md) one by one:

| Module | Status | Target |
|--------|--------|--------|
| `CodeEditor.tsx` | 🟡 | Mono create + lifecycle |
| `useEditorLifecycle` | ❌ | Mono events |
| `useEditorStateSync` | ❌ | position/scroll/content |
| `useContextMenuSetup` | 🟡 | Mono menu already; remove Monaco mouse targets |
| `useTeardrops*` | 🟡 | native Mono teardrops exist — prefer delete app Monaco teardrops |
| `useTouchScroll` | 🟡 | Mono pointer owns scroll |
| `useDiagnosticPopup` | ❌ | after markers |
| `useBreadcrumbs` | 🟡 | symbols + cursor events |
| `useStickyHighlight` | ❌ | optional; Mono sticky internal |
| `usePaletteProviders` | 🟡 | palette engine ✅; providers may call Monaco |
| `EditorScrollbar` | ❌ | scroll API |
| `DiffEditor` | ❌ | later PART 8 |
| `themeService.defineTheme` | ❌ | Mono setTheme |
| `snippetRegistry` | ❌ | |
| `formattersAPI` | ❌ | |
| `diagnosticsAPI` | ❌ | |
| `editorAPI.activeTextEditor` | ❌ | |
| `getActiveMonacoEditor` | ❌ | rename → getActiveEditor |

**App-side delete candidates after Mono owns them:** Monaco teardrop hooks, Monaco touch scroll, Monaco sticky highlight, Monaco-only shims under `src/shims/monaco-editor`.

---

## PART 8 — Advanced (P5)

| Feature | Status |
|---------|--------|
| Multi-cursor / Ctrl+D | ❌ |
| Column selection | ❌ |
| Diff editor real | ❌ |
| Minimap | ❌ |
| More language token providers | 🟡 | JS/TS/JSON/CSS/HTML/Python ✅ |
| Semantic highlighting | ❌ |
| a11y / screen reader | ❌ |
| Unit tests | ❌ |

---

## Recommended execution order (for next assignee)

```
Week-shaped slices (adjust to capacity):

[ ] Slice A — PART 1.1 Bridge API on IMonoEditor
[ ] Slice B — PART 1.2 CodeEditor.tsx + lifecycle/sync hooks compile & run
[ ] Slice C — PART 2 must-have edits (tabSize, readOnly, word nav, page keys, undo group)
[ ] Slice D — PART 3 incremental model (before big-file complaints return)
[ ] Slice E — PART 5 markers + diagnostics popup
[ ] Slice F — PART 6 completion + hover (one language)
[ ] Slice G — PART 4 folding + scrollbar + wrap
[ ] Slice H — PART 8 multi-cursor / diff as needed
```

### Definition of done per slice
1. Mono package builds (`tsc`).
2. App `packages/app` builds without Monaco unloadable paths for that slice.
3. Manual check on Android WebView for the slice scenario.
4. Update **this file** + `packages/mono-editor/docs/check.md` status marks.

---

## Quick “what works today” vs “what blocks users”

| User can already | User still blocked |
|------------------|--------------------|
| Open canvas editor, type, select, teardrops | Go-to-line / many palette actions that call Monaco |
| Sticky headers, find UI, context menu copy/cut | Diagnostics squiggles / Problems |
| Ctrl+Z/Y with selection restore | Suggest / hover / format |
| Touch fling scroll | Word wrap, folding, multi-cursor |
| Syntax colors (basic languages) | Theme live-switch from app settings |

---

## File map (start here)

| Path | Role |
|------|------|
| `packages/mono-editor/docs/check.md` | Feature audit (keep in sync) |
| `packages/mono-editor/src/api/MonoEditor.ts` | Facade — add bridge methods here |
| `packages/mono-editor/src/api/types.ts` | `IMonoEditor` contract |
| `packages/mono-editor/src/core/TextModel.ts` | Model + undo |
| `packages/mono-editor/src/view/ViewController.ts` | Scroll / reveal / sticky |
| `packages/mono-editor/src/input/*` | Keys, pointer, IME |
| `packages/mono-editor/src/commands/*` | Actions / context keys |
| `packages/app/src/features/editor/CodeEditor.tsx` | Main mount point |
| `packages/app/src/features/editor/hooks/*` | Per-feature Monaco consumers |

---

*Generated from latest GitHub `check.md` for Mono-for-Monaco migration tracking.*
