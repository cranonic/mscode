# Completion, Hover, Folding — Monaco API map → Mono

## Monaco APIs → Mono

| Monaco | Mono |
|--------|------|
| `monaco.languages.registerCompletionItemProvider` | `languageFeatures.registerCompletionItemProvider` |
| `monaco.languages.registerHoverProvider` | `languageFeatures.registerHoverProvider` |
| `monaco.languages.registerFoldingRangeProvider` | `languageFeatures.registerFoldingRangeProvider` |
| `editor.trigger(...,'editor.action.triggerSuggest')` | `editor.triggerSuggest()` / Ctrl+Space |
| Hover | `editor.showHover()` / `HoverController` |
| Folding | `editor.getFoldingModel()` / `toggleFold(line)` |

### Provider example
```ts
import { languageFeatures, CompletionItemKind } from '@mono/editor';

languageFeatures.registerCompletionItemProvider('typescript', {
  triggerCharacters: ['.'],
  provideCompletionItems: async (model, position) => {
    return { suggestions: [{ label: 'foo', kind: CompletionItemKind.Variable, insertText: 'foo' }] };
  },
});
```

### UI customization
```ts
editor.setSuggestWidgetOptions({ maxHeight: 320, className: 'my-suggest' });
editor.setHoverWidgetOptions({ maxWidth: 400 });
```

## Status
| Item | Status |
|------|--------|
| Completion registry + word provider | done |
| Suggest widget | done |
| Ctrl+Space | done |
| Hover registry + widget | done |
| Folding model + indent | done |
| Folding gutter / hide lines paint | partial (Slice G) |
| Snippet tabstops | not yet |
| Markdown hover | plain text v1 |
