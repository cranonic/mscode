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
