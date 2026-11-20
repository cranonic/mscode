# Monaco language configuration — how Enter/indent rules work

## What you saw (`for:` in JS vs plain text)

Monaco does **not** hard-code “after `for` always indent”.  
It uses a **per-language** `LanguageConfiguration` registered on the language id.

- **plaintext / no config** → almost no smart Enter (or only trivial).
- **javascript / typescript** → rich `onEnterRules`, `brackets`, `autoClosingPairs`, `indentationRules`.

So `for:` + Enter can indent in JS because of that language’s rules, not because of a global editor switch.

## Core API (Monaco)

```ts
monaco.languages.setLanguageConfiguration('javascript', {
  brackets: [
    ['{', '}'], ['[', ']'], ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '"', close: '"' },
    // …
  ],
  surroundingPairs: [ /* … */ ],
  comments: { lineComment: '//', blockComment: ['/*', '*/'] },
  folding: { markers: { start: /…/, end: /…/ } },
  /** Indentation heuristics from context */
  indentationRules: {
    increaseIndentPattern: /…/,  // e.g. line ends with { or :
    decreaseIndentPattern: /…/,  // e.g. line is }
    indentNextLinePattern: /…/,  // indent *next* line only
    unIndentedLinePattern: /…/,
  },
  /** Enter-key specific (before/after text regex) */
  onEnterRules: [
    {
      beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
      afterText: /^\s*\*\/$/,
      action: { indentAction: monaco.languages.IndentAction.IndentOutdent, appendText: ' * ' },
    },
    {
      beforeText: /…for…/,
      action: { indentAction: monaco.languages.IndentAction.Indent },
    },
  ],
  wordPattern: /…/,
});
```

### `IndentAction` (Enter)

| Action | Behavior |
|--------|----------|
| `None` | Keep indent |
| `Indent` | +1 indent on new line |
| `IndentOutdent` | New line +1, and a following line at old indent (bracket split) |
| `Outdent` | −1 indent |

Rules match **beforeText** / **afterText** at the caret (regex on the line prefix/suffix).

## Where built-in rules live

Monaco ships contributions under something like:

- `vs/basic-languages/javascript/javascript.js` — tokenizer (Monarch)
- Language config often from `language-configuration.json` style data embedded in the same contribution, or VS Code’s `extensions/javascript/language-configuration.json`

VS Code layers **TextMate grammars + language-configuration.json** per extension. Monaco standalone embeds a subset for basic languages.

## Custom / extension API

| API | Role |
|-----|------|
| `setLanguageConfiguration(id, config)` | Replace/merge config for a language |
| `register({ id })` | Register language id |
| `setMonarchTokensProvider` / `setTokensProvider` | Syntax highlighting only (not Enter) |
| `registerCompletionItemProvider` | IntelliSense — separate |

`setLanguageConfiguration` is the **scalable** surface: app or language packs call it; the editor core only **evaluates** rules on Enter/type.

## Mono editor — target architecture (same level)

```
LanguageConfigurationRegistry
  .register(languageId, config)
  .get(languageId)

OnEnterService.evaluate(model, position) → { indentAction, appendText? }
IndentationRules.computeIndentForEnter(...)
```

Mono today: fixed bracket-pair + “after open brace” heuristics.  
Next: load per-language configs (JS/TS/JSON/Python…) via the same shape as Monaco’s `LanguageConfiguration`, so `for:`-style rules become data, not hard-coded.

