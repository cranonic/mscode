# Completion widget — test checklist (Android WebView)

Setup: any file with a few words, put the caret after `co` on a line near the middle, open the list
(Ctrl+Space / your trigger).

1. **Width** — list is only as wide as its content (≈ 220–300px), NOT the full editor width.
2. **Alignment** — the first letter of each label starts exactly under the `c` of `co`.
3. **Right side** — every row shows a type (keyword / method / function / class / variable …),
   same colour as the item name on its left; the selected row is white on both sides.
4. **Matched letters** — `co` is bold blue in every label (on the selected row too, also in the light theme).
5. **Cursor change closes** — tap somewhere else / drag the teardrop / ← → keys / jump to another line → list disappears.
6. **Scroll away** — with the list open, scroll until the line you opened it on is fully gone (top or bottom)
   → list hides. Scroll back until the line is visible → list comes back, same selected row.
   (A line hidden behind the sticky header or the bottom active-line bar counts as gone.)
7. **Follow** — while the line is visible and you scroll a little, the list moves with the line.
8. **Flip** — open it on a line near the bottom of the screen → list opens ABOVE the line and never covers it.
9. **Accept** — tap a row / Enter / Tab → word replaced, list closed, arrow keys work normally afterwards;
   one Ctrl+Z restores `co`.
10. **Theme** — switch dark ↔ light: list colours follow the editor (Dark+ / Light+ look).
