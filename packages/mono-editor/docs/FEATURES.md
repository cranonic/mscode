# Mono Editor — feature checklist

## Done
- Canvas virtualized paint, line numbers, caret, selection highlight
- Gutter clip: horizontal scroll never draws code over gutter
- Touch pan / wheel / Android-style fling scroll
- Tap → caret + sticky soft keyboard
- Long-press + drag selection; double-tap word select
- Canvas teardrops (draggable)
- **Syntax coloring (VS Code-style expandable API)**

## Syntax API
```ts
import {
  createMonoEditor,
  languages,
  createRegexTokensProvider,
  registerDefaultLanguages,
} from '@mono/editor';

// Built-in: plaintext, javascript/js/jsx, typescript/tsx, json, css, html, python
registerDefaultLanguages(); // also called inside createMonoEditor

// Custom language
languages.registerTokensProvider(
  createRegexTokensProvider({
    languageId: 'lua',
    keywords: ['function', 'local', 'end', 'if', 'then', 'else'],
    rules: [
      { pattern: /--.*/, type: 'comment' },
      { pattern: /"(?:\\.|[^"\\])*"/, type: 'string' },
      { pattern: /\d+/, type: 'number' },
    ],
  }),
);

// Full custom provider (multiline state, tree-sitter later, etc.)
languages.registerTokensProvider({
  languageId: 'my-lang',
  getInitialState: () => ({ inComment: false }),
  tokenizeLine(line, state) { /* return { tokens, endState } */ },
});

editor.setLanguageId('javascript');
```

## Structure
```
language/
  tokenTypes.ts          — MonoTokenType, DEFAULT_TOKEN_COLORS
  TokensProvider.ts      — languages.registerTokensProvider API
  TokenizationSupport.ts — line cache + state
  createRegexTokensProvider.ts — helper for apps
  registerDefaults.ts
  providers/*            — js/ts/json/css/html/python
```

## Sticky scroll (VS Code / Monaco compatible)
```ts
createMonoEditor(host, {
  stickyScroll: {
    enabled: true,
    maxLineCount: 5,
    defaultModel: 'indentationModel',
    scrollWithEditor: true, // push-away when source line meets sticky
  },
});
editor.setStickyScroll({ enabled: false });
```
Indentation model mirrors VS Code fallback (no LSP required).
Outline model hook reserved via same options field.

## Scroll smoothness
- rAF-coalesced paints during pointer move
- DPR pixel-snapped scrollTop/Left for render
- Monospace positions via charWidth (no measureText during scroll)
