# Slice E — Markers + Diagnostics test

## Setup
After replacing `packages/mono-editor/`, open any file in the editor.

## 1. Manual markers (console or temporary code)
In browser console (or a small test button):

```js
const ed = window.__monoEditor; // or grab from your CodeEditor ref
ed.setModelMarkers('test', [
  {
    severity: 8, // Error
    message: 'Unexpected token',
    startLineNumber: 2,
    startColumn: 1,
    endLineNumber: 2,
    endColumn: 10,
  },
  {
    severity: 4, // Warning
    message: 'Unused variable',
    startLineNumber: 5,
    startColumn: 3,
    endLineNumber: 5,
    endColumn: 15,
  },
]);
```

Expect:
- Red squiggle under the range on line 2
- Yellow squiggle under the range on line 5

## 2. Hover
Move the caret (click or arrow) onto a squiggle.
After ~400 ms a small tooltip should appear with “Error: …” or “Warning: …”.

Move the caret away → tooltip disappears.

## 3. Event
```js
const d = ed.onDidChangeMarkers((markers) => {
  console.log('markers changed', markers.length, markers);
});
ed.setModelMarkers('test', []); // should log 0
d.dispose();
```

## 4. deltaDecorations
```js
const ids = ed.deltaDecorations([], [
  {
    range: { startLineNumber: 3, startColumn: 1, endLineNumber: 3, endColumn: 8 },
    options: { monoUnderline: 'solid', monoUnderlineColor: '#3794ff' },
  },
]);
// blue solid underline appears
ed.deltaDecorations(ids, []); // disappears
```

## 5. Theme colors
Switch to Light / AMOLED / Solarized.
Squiggle colors should stay readable (hard-coded severity colors for now; theme-aware colors are a later polish).

## 6. Regression
- Typing, scroll, sticky, teardrop timing still work
- Ctrl+Z selection restore still works
- Theme change still updates the editor

## App wire (next)
- `diagnosticsAPI` should call `editor.setModelMarkers` instead of Monaco
- `useDiagnosticPopup` can listen to `onDidChangeMarkers` or just use the built-in hover
- Problems panel reads from the same marker store
