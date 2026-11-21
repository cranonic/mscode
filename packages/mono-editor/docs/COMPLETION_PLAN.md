# Mono Completion / Suggest — Monaco parity plan

## Monaco model (summary)
- `languages.registerCompletionItemProvider(languageId, provider)`
- Provider: `provideCompletionItems(model, position, context, token)`
- `CompletionItem`: label, kind, detail, documentation, insertText, sortText, filterText, range, preselect, textEdit
- Trigger: Ctrl+Space, trigger characters, or auto on typing
- If no provider (or incomplete), word-based suggestions from document words (toggleable)
- Widget: icon (codicon by kind) | label (match highlighted) | detail (right, faded)
- Filtering: client-side by current word prefix; highlight matches

## Status

| Feature | Status | Notes |
|---------|--------|-------|
| `registerCompletionItemProvider` | ✅ | `languageFeatures.registerCompletionItemProvider` |
| `provideCompletionItems` signature | ✅ | model, position, context, token |
| CompletionItem fields | ✅ | label, kind, detail, insertText, sortText, filterText, range, preselect |
| Ctrl+Space trigger | ✅ | keybinding |
| Trigger characters | 🟡 | collected, soft retrigger |
| Word-based fallback (document words) | ✅ | `createWordBasedCompletionProvider`, toggle via `completionOptions.wordBasedSuggestions` |
| Keyword demo provider | ✅ | temporary, remove when real providers exist |
| Suggest widget UI | ✅ | VS Code look: 22px rows, 16px codicon + 4px gap, editor font/size, 1px border, 3px radius, `0 0 8px 2px` shadow, thin scrollbar, Dark+/Light+ colours (`editorSuggestWidget.*`, `symbolIcon.*`, `list.*` keys honoured) |
| Widget width | ✅ | content-sized (`max-content`, min 220px, max 460px / host − 8) — no longer stretched to full width |
| Label alignment | ✅ | label text starts exactly under the word being completed |
| Hide on cursor change | ✅ | tap, teardrop drag, selection, arrow keys, `setPosition` → list closes (`SuggestController.syncCursor`) |
| Hide when caret line scrolls out | ✅ | line fully off-screen (or under sticky header / bottom bar) → list hidden; line visible again → list back with the same selection (`isLineInView`) |
| Right-hand type | ✅ | every row shows `detail` or the kind name (keyword / method / function …); same colour as the label (white on the selected row) |
| Vertical placement | ✅ | below the caret line, flips above (above the line top, never over the caret line); list height shrinks to the free space |
| Match highlight | ✅ | bold, VS Code blue; separate colour on the selected row (Light+: `#BBE7FF`) |
| Selected row highlight | ✅ | `#04395E` (Dark+) / `#0060C0` (Light+) |
| Detail on right | ✅ | see "Right-hand type" |
| Filter on type | 🟡 | prefix passed, widget filters visually |
| Sort by sortText / score | ❌ | |
| Resolve item (docs) | ❌ | |
| Snippet insert | ❌ | |
| AdditionalTextEdits | ❌ | |
| Commit characters | ❌ | |
| Incomplete list re-fetch | ❌ | |
| Multi-cursor aware | ❌ | |

## How to register a provider (Monaco-compatible)

```ts
import { languageFeatures, CompletionItemKind } from 'mono-editor/language/features';

languageFeatures.registerCompletionItemProvider('javascript', {
  triggerCharacters: ['.'],
  provideCompletionItems(model, position, context) {
    return {
      suggestions: [
        { label: 'console', kind: CompletionItemKind.Method, detail: 'method', insertText: 'console' },
      ],
    };
  },
});
```

## Toggle word-based

```ts
import { completionOptions } from 'mono-editor/language/features';
completionOptions.wordBasedSuggestions = false; // disable local word suggest
```

## Codicons
Symbol icons live in `src/icons/symbolIcons.ts` (subset of vscode-codicons).
More can be added with `registerExtraIcon(id, svg)`.

## Theming the widget
The widget follows the editor font and the active theme (dark / light by editor background).
Add VS Code keys to a theme's `colors` to override the defaults: `editorSuggestWidget.background / border /
foreground / selectedBackground / selectedForeground / highlightForeground / focusHighlightForeground`,
`list.hoverBackground`, `widget.shadow`, `symbolIcon.<kind>Foreground` (e.g. `symbolIcon.methodForeground`).
