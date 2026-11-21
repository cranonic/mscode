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
| Suggest widget UI | ✅ | codicon icons, 12.5px, 1px 10px padding, 3px icon gap, min-width 280px, radius 4px |
| Match highlight | ✅ | blue on typed prefix |
| Selected row highlight | ✅ | blue background |
| Detail on right | ✅ | faded |
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
