# Mono Editor — feature checklist

## Done
- Canvas virtualized paint, line numbers, caret, selection highlight
- Gutter clip: horizontal scroll never draws code over gutter
- Touch pan scroll, wheel scroll
- Tap → caret + sticky soft keyboard (refocus on transient blur)
- Long-press + drag selection
- Keyboard arrows / shift-select / Ctrl+A / Enter / Tab / Backspace / Delete
- Canvas teardrops (cursor + selection start/end), draggable handles

## Structure
```
api/MonoEditor.ts
core/TextModel.ts, Selection.ts
view/ViewController.ts
render/CanvasRenderer.ts   ← gutter clip + teardrop paint
input/InputController.ts   ← sticky keyboard
input/PointerController.ts ← scroll / select / teardrop drag
```
