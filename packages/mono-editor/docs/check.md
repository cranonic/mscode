code ghete dekhlam. Kichu file duplicate version e chhilo, ami shob jaygay **latest version** (find, sticky scroll, commands wala) dhorechi.

Legend: ✅ hoyeche, 🟡 aangshik, ❌ baki

---

## 1. Text Model / Edit engine
| Feature | Status | Note |
|---|---|---|
| Line-based model, getValue/setValue | ✅ | |
| Offset ↔ Position | ✅ | |
| insert / delete / applyEdit | ✅ | |
| Undo/Redo stack (200 limit, selection restore) | ✅ | Monaco-style |
| Version id, language id | ✅ | |
| `getAlternativeVersionId` (dirty tracking) | ❌ | `useAutoSaveAndBackup` eta chay |
| Incremental edit (shudhu changed line update) | ✅ | Slice D: line-splice, `getValue()` cached/lazy |
| Undo grouping (typing ek group, pause e break) | ❌ | Ekhon proti char alada undo |
| CRLF / EOL handling | ❌ | `split('\n')` e `\r` theke jay |
| Multiple models / model URI | ❌ | Ekhon editor-per-model |
| Decorations / markers API | ❌ | Squiggle, highlight, gutter icon er base |

## 2. Cursor & Selection
| Feature | Status |
|---|---|
| Single caret, selection (anchor/active) | ✅ |
| Shift+Arrow, Ctrl+A | ✅ |
| Double-tap word select, long-press select | ✅ |
| Teardrop handles (drag, free-drag, sticky-line hysteresis) | ✅ |
| Goal column (up/down e column dhore rakha) | ❌ |
| Word navigation (Ctrl+←/→, Ctrl+Backspace/Delete) | ❌ |
| PageUp/PageDown, Ctrl+Home/End | ❌ |
| Triple-tap / line select | ❌ |
| Multi-cursor (Alt+Click, Ctrl+D add next match) | ❌ |
| Column (box) selection | ❌ |
| Expand/shrink selection (selectionRange) | ❌ |
| Cursor style (block/underline), blinking, smooth caret | ❌ |
| `cursorSurroundingLines` | ❌ |

## 3. Keyboard editing commands
| Feature | Status |
|---|---|
| Enter, Backspace, Delete, Tab, Arrows, Home/End | ✅ |
| Copy / Cut / Paste (Ctrl + menu) | ✅ |
| Tab size option use kora | 🟡 (`'  '` hardcoded, `tabSize` option ignore hoy) |
| Auto-indent on Enter | ❌ |
| Auto-closing brackets/quotes, overtype, auto-surround | ❌ |
| Indent / Outdent (Tab/Shift+Tab selection e) | ❌ |
| Toggle line/block comment | ❌ |
| Move line up/down, Duplicate line, Delete line | ❌ |
| Join lines, Sort lines, Transpose | ❌ |
| Trim trailing whitespace on save | ❌ |
| Insert spaces / detect indentation | ❌ |
| Paste with format, drag & drop text | ❌ |
| Linked editing (HTML tag pair rename) | ❌ |
| IME / composition handling | ❌ (Android keyboard er jonno important) |
| Chord keybindings (Ctrl+K Ctrl+…) | ❌ (app er `keybindingManager` e ache, Mono te nei) |

## 4. Rendering / Display
| Feature | Status |
|---|---|
| Canvas virtualized paint, overscan | ✅ |
| Line numbers + gutter clip | ✅ |
| Current line highlight | ✅ |
| Selection highlight | ✅ |
| Find match highlight | ✅ |
| Sticky scroll (indent model, push animation, click-navigate) | ✅ |
| DPR snap, rAF-coalesced paint | ✅ |
| Word wrap (`wordWrap`, `wrappingIndent`) | ❌ |
| Indent guides | ❌ |
| Bracket match highlight, bracket pair colorization, bracket guides | ❌ |
| Render whitespace / control chars | ❌ |
| Rulers | ❌ |
| Line numbers relative/interval | ❌ (shudhu on/off) |
| Minimap | ❌ |
| Overview ruler | ❌ |
| Glyph margin | ❌ |
| Selection occurrence highlight (same word) | ❌ |
| Font ligatures, letter spacing, font weight | ❌ |
| Diagnostics squiggles / Error Lens text | ❌ |
| Unicode highlight | ❌ |
| Padding top/bottom option | ❌ |

## 5. Scrolling
| Feature | Status |
|---|---|
| Touch pan, axis lock, fling physics | ✅ |
| Mouse wheel | ✅ |
| Caret follow (vertical) | ✅ |
| Caret follow **horizontal** | ❌ (lomba line e type korle caret screen er bairey jay) |
| scrollLeft max clamp | ❌ (ekhon infinite right scroll hoy) |
| Scrollbar (thumb/track UI) | ❌ (`EditorScrollbar.tsx` Monaco API chay, Mono er jonno rewrite lagbe) |
| scrollBeyondLastLine | ❌ |
| Smooth scrolling, fastScroll | ❌ |

## 6. Syntax highlighting / Tokenization
| Feature | Status |
|---|---|
| Tokens provider API (`languages.registerTokensProvider`) | ✅ |
| Regex helper (`createRegexTokensProvider`) | ✅ |
| JS/TS/JSX/TSX, JSON, CSS, HTML, Python, Plaintext | ✅ (basic) |
| Function name / class / type coloring | 🟡 (identifier shob `variable` hoye jay) |
| Template string `${}` nested, multiline | 🟡 |
| Java, C/C++, Rust, Go, Kotlin, Markdown, YAML, Shell, SQL, XML, PHP, etc. | ❌ |
| Embedded languages (HTML er `<script>`/`<style>`) | ❌ |
| Incremental tokenization | ✅ (Slice D: shudhu changed line + state change hole porer line, viewport lazy) |
| TextMate grammar / tree-sitter support | ❌ |
| Semantic tokens (LSP) | ❌ |
| Theme theke token color (`tokenColors` scope map) | ❌ (app er `mscode-dark.ts` er scope-based theme Mono te map hoyni) |
| Language configuration (comments, brackets, indent rules) | ❌ |

## 7. Language features (LSP / Intelligence)
Ekhon `core/services/lsp/providers/*` shob **Monaco shim e register hoy, shim no-op** → ekhon kono kaj kore na.

| Feature | Status |
|---|---|
| Completion + suggest widget | ❌ |
| Completion item resolve (docs) | ❌ |
| Snippets (user + extension) | ❌ (`snippetRegistry` Monaco provider chay) |
| Emmet expand | 🟡 (`htmlEmmet.ts` logic ready, widget nei) |
| Hover widget | ❌ |
| Signature help / parameter hints | ❌ |
| Go to definition / peek | ❌ |
| Find references | ❌ |
| Rename symbol | ❌ |
| Document highlight (occurrences) | ❌ |
| Document symbols / outline | 🟡 (`symbolManager` ready, regex parsers ache; hook Monaco model chay) |
| Code actions / lightbulb | ❌ |
| Code lens | ❌ |
| Inlay hints | ❌ |
| Format document / selection / on type / on paste / on save | ❌ |
| Folding ranges (LSP) | ❌ |
| Document links, color picker/decorators | ❌ |
| Diagnostics (markers, Problems panel, popup/shadow) | ❌ (`useDiagnosticPopup`, `diagnosticsAPI` Monaco API) |
| Ghost text / inline completion | ❌ |

## 8. Widgets / UI inside editor
| Feature | Status |
|---|---|
| Find / Replace widget (regex, case, word, replace all, F3) | ✅ |
| Preserve-case toggle | 🟡 (button ache, logic nei) |
| Find in selection, seed from selection setting | ❌ / 🟡 |
| Android-style context menu (extensible) | ✅ |
| Command palette **engine** (`PaletteService`, providers) | ✅ (UI app e) |
| Go to Line widget | ❌ (app palette `:` Monaco API e ache) |
| Suggest widget | ❌ |
| Hover widget | ❌ |
| Peek view | ❌ |
| Color picker | ❌ |
| Breadcrumbs | 🟡 (UI ache, `useBreadcrumbs` Monaco chay) |
| Diff editor (side-by-side / inline) | ❌ (ekhon stub) |
| Selection magnifier (loupe) | 🟡 (`SelectionMagnifier.tsx` purano Monaco version) |

## 9. Folding
| Feature | Status |
|---|---|
| Fold / unfold (indent based) | ❌ |
| Fold by LSP / language rules, imports, regions | ❌ |
| Fold all / unfold all, gutter chevron | ❌ |
| Fold state persist | ❌ |

## 10. Commands / Keybindings / Context
| Feature | Status |
|---|---|
| CommandService, CommandsRegistry | ✅ |
| `editor.addAction` | ✅ |
| ContextKeyService (when clause) | ✅ |
| KeybindingService | ✅ |
| `getAction(id).run()` (app `commandRegistry` eta chay) | ❌ |
| App `contextKeyService` ↔ Mono context bridge | ❌ |
| User keybindings override Mono te | ❌ |

## 11. Options / Theme / Settings
| Feature | Status |
|---|---|
| Constructor options (font, lineNumbers, lineHeight, sticky) | ✅ |
| `updateOptions()` runtime | ❌ (setting change e editor recreate/ignore) |
| `setTheme()` runtime | ❌ |
| App theme (`ThemeDefinition`) → MonoEditorTheme mapping | ❌ (`CodeEditor.tsx` e hardcoded `#1e1e1e`) |
| `editor.*` settings wire (~80ta setting UI te ache, Mono use kore 2ta) | ❌ |
| `readOnly` | 🟡 (shudhu textarea.readOnly, keydown e backspace/enter ekhono edit kore, bug) |

## 12. Mobile / Touch (Monaco er cheyeo beshi)
| Feature | Status |
|---|---|
| Teardrops, fling, long-press, haptics | ✅ |
| Press feedback on icons | ✅ |
| Sticky keyboard refocus | ✅ |
| Pinch-zoom font | ❌ |
| Quick keyboard bar (Ctrl/Alt modifier) bridge | ❌ (`useQuickKeyboardStore` Mono te hook nei) |
| Soft keyboard resize / caret above keyboard | ❌ |

## 13. App ↔ Mono integration (**sobcheye boro blocker**)
`IMonoEditor` interface e shudhu `getValue/setValue/focus/layout/onDidChange…` ache. Class e onek method ache kintu interface e **declare kora nei**, tai app theke call kora jay na (`addAction`, `revealFind`, `executeCommand`, `getPaletteService`).

Ekhono ei Monaco-dependent hook gulo kaj korche na:

`useLspSync`, `useEditorSave`, `useAutoSaveAndBackup`, `useViewStateSync`, `useEditorLifecycle`, `useContextMenuSetup`, `useTeardrops*`, `useTouchScroll`, `useDiagnosticPopup`, `useBreadcrumbs`, `useStickyHighlight`, `usePaletteProviders`, `EditorScrollbar`, `DiffEditor`, `themeService` (defineTheme), `snippetRegistry`, `formattersAPI`, `diagnosticsAPI`, `editorAPI.activeTextEditor`, `getActiveMonacoEditor`.

Missing Mono API jeta ei hook gulo chay: `getPosition/setPosition`, `getSelection/setSelection`, `revealLine/revealPosition`, `getScrollTop/setScrollTop`, `getModel()`, `onDidChangeCursorPosition/Selection`, `onDidScrollChange`, `executeEdits`, `deltaDecorations`, `setModelMarkers`, `updateOptions`, `getAction`, `hasTextFocus`, `onDidFocus/Blur`.

Ar `CodeEditor.tsx` e: cursor/scroll restore, hot-exit backup, `pendingNavigation` (go-to-line), `commands.setActiveEditor` kichui nei.

## 14. Performance / Quality / Accessibility
| Item | Status |
|---|---|
| Piece-table / chunked buffer (boro file) | ❌ |
| Incremental tokenizer + scope cache | 🟡 (tokenizer ✅; indent scope cache ekhono full invalidate) |
| Large file mode | ❌ |
| Screen reader / a11y | ❌ |
| Unit tests | 🟡 (`tests/slice-d.test.mts` — model + tokenizer fuzz) |

---

## Amar suggested order
1. **P0, Bridge API**: `IMonoEditor` e position/selection/reveal/scroll/events/`updateOptions`/`setTheme`/`getAction`/`addAction` add. Tahole purano hook gulo ek ek kore chalu hobe. Sathe bug fix: `readOnly` guard, `tabSize` use, horizontal caret follow, scrollLeft clamp, theme wire.
2. **P1, Daily editing**: auto-indent, auto-close brackets, comment toggle, indent/outdent, word nav, line ops, goal column, PageUp/Down.
3. **P2, Perf**: incremental TextModel + tokenizer. Eta na korle boro file e lag asbe, ar canvas er main point-i harabe.
4. **P3, Display**: word wrap, scrollbar, bracket match, indent guides, folding (indent), occurrence highlight.
5. **P4, Intelligence**: decorations/markers API → diagnostics squiggle → suggest widget + completion → hover → signature → definition/rename/format (LSP bridge ke Monaco theke alada kore).
6. **P5**: multi-cursor, minimap, diff editor, more languages, semantic tokens.