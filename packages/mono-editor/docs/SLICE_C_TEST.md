# Slice C / editing — test checklist

## 1. Bracket Enter (default ON)
Type `{|}`  or  `function () {|}`  (caret between brackets), press **Enter**:

```
{
  |    ← caret here (one tabSize indent)
}
```

Toggle off:
```ts
editor.updateOptions({ bracketEnterIndent: false });
```

## 2. Word jump across lines
- Caret at **column 1** → **Ctrl+Left** → previous line **end**
- Caret at **line end** → **Ctrl+Right** → next line **start**

## 3. Shift+Tab
Select lines or place caret after indent → **Shift+Tab**  
Caret + teardrop should **move left** with the text (not stay in old place).

## 4. Arrow Up/Down “goal column” (what this means)

**Setup**
```
line1: hello world this is long
line2: hi
line3: hello world this is long
```

1. On line1 put caret under the letter **w** of `world` (middle of line).
2. Press **ArrowDown** once → on short line `hi` caret goes to **end** of `hi` (cannot stay mid-air).
3. Press **ArrowDown** again → on line3 caret returns under **w** (same column as step 1).

That remembered column is the **goal column**.  
If it always jumps to the far left, goal column is broken (this build fixes that).

## 5. Tab / indent
- **Tab** → inserts `tabSize` spaces; teardrop follows
- Multi-line select + Tab / Shift+Tab → indent/outdent block

## 6. Undo = content + selection together (one step)
1. Double-tap a word (`abc`) → type `x` (replaces it).
2. **Ctrl+Z once** → `abc` is back **and selected** (not caret-only; no second undo needed).
3. Same for: paste over selection, Find → Replace, multi-line Tab / Shift+Tab (whole block = 1 undo).
Redo → `x` again, caret after it.

## 7. Bottom active-line sticky
Place caret on a line, scroll so it sits below the viewport → the line is pinned at the bottom.
**Tap the pinned bar** → editor scrolls so that line is in the middle, caret lands at the tapped column, bar disappears.
(Also works when the caret line is above the viewport and the bar is still pinned.)

## 8. Selection menu placement
- Select many lines starting at the very top of the viewport → menu appears **below the start teardrop** (no need for 4 free lines above).
- Select, then scroll: menu **hides while scrolling**, comes back when finger is up **and** fling has stopped.
- Selection scrolled above the viewport → menu pinned to the **top edge**; scrolled below → pinned to the **bottom edge**. Never leaves the viewport.
