# Slice D — performance test checklist

## Automated (desktop)
```
cd packages/mono-editor
npx tsx tests/slice-d.test.mts
```
Expect: `All Slice D tests passed.`

## Manual — Android WebView (the real target)
Make a big file: paste a 5k–20k line JS/TS file (or repeat a 50-line snippet 400×).

1. **Open** the file → first screen appears immediately (tokenizer is lazy now).
2. **Type fast** in the middle of the file → no stutter, colors update as you type.
3. **Open a block comment** `/*` on a line near the top → lines below turn comment-colored;
   delete the `/*` → colors come back (state propagation).
4. **Scroll fast / fling** to the bottom and back → syntax colors correct everywhere, no flicker.
5. **Enter / Backspace** to add and remove lines near the top while the viewport is far below
   → line numbers/colors in view stay correct.
6. **Paste** a big block (thousands of lines) → works, then Ctrl+Z once removes it all
   (and the selection comes back if you pasted over one).
7. **Undo / Redo** chain after many edits → text identical to before.
8. **Find** (Ctrl+F) with a term, then type in the editor → matches keep updating.
9. **Horizontal scroll** on a file with one very long line → scroll range still correct;
   shorten that line → range shrinks.
10. Switch language (e.g. js → plaintext → js) → colors correct each time.
