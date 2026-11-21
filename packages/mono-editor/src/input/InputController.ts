import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type { KeybindingService } from '../keybindings/KeybindingService';

export interface InputControllerOptions {
  tabSize?: number;
  readOnly?: boolean;
  /** Lines per PageUp/PageDown (default 40, clamped to viewport by editor later) */
  pageSize?: number;
  /**
   * VS Code-style: Enter between {|} [|] (|) splits to
   * {\n  |\n}
   * Default true.
   */
  bracketEnterIndent?: boolean;
}

function isWordChar(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch);
}

/**
 * Find next/prev word boundary column (1-based) on a line.
 * direction: -1 left, +1 right
 */
function wordBoundary(line: string, column: number, direction: -1 | 1): number {
  // column is 1-based caret index (between chars)
  let i = column - 1; // 0-based index into string for "at caret"
  if (direction > 0) {
    if (i >= line.length) return line.length + 1;
    // skip current class then rest of non-class or vice versa
    if (i < line.length && isWordChar(line[i]!)) {
      while (i < line.length && isWordChar(line[i]!)) i++;
    } else {
      while (i < line.length && !isWordChar(line[i]!) && line[i] !== ' ' && line[i] !== '\t') i++;
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++;
      while (i < line.length && isWordChar(line[i]!)) i++;
    }
    return i + 1;
  }
  // left
  if (i <= 0) return 1;
  i--;
  while (i > 0 && (line[i] === ' ' || line[i] === '\t')) i--;
  if (i >= 0 && isWordChar(line[i]!)) {
    while (i > 0 && isWordChar(line[i - 1]!)) i--;
    return i + 1;
  }
  while (i > 0 && !isWordChar(line[i - 1]!) && line[i - 1] !== ' ' && line[i - 1] !== '\t') i--;
  return i + 1;
}

function leadingWs(line: string): string {
  const m = line.match(/^[ \t]*/);
  return m ? m[0]! : '';
}

export class InputController {
  readonly textarea: HTMLTextAreaElement;
  private model: TextModel;
  private selection: SelectionState;
  private onChange: () => void;
  private host: HTMLElement;
  private keybindings: KeybindingService | null = null;
  private disposed = false;
  private wantFocus = false;
  private refocusTimer: ReturnType<typeof setTimeout> | null = null;
  private tabSize = 2;
  private readOnly = false;
  private pageSize = 40;
  private bracketEnterIndent = true;
  /** Goal column for vertical movement (Monaco-style) */
  private goalColumn: number | null = null;

  constructor(
    host: HTMLElement,
    model: TextModel,
    selection: SelectionState,
    onChange: () => void,
    options?: InputControllerOptions,
  ) {
    this.model = model;
    this.selection = selection;
    this.onChange = onChange;
    this.host = host;
    if (options?.tabSize != null) this.tabSize = Math.max(1, options.tabSize);
    if (options?.readOnly != null) this.readOnly = options.readOnly;
    if (options?.pageSize != null) this.pageSize = Math.max(1, options.pageSize);
    if (options?.bracketEnterIndent != null) this.bracketEnterIndent = options.bracketEnterIndent;

    const ta = document.createElement('textarea');
    ta.setAttribute('aria-label', 'Mono Editor input');
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('spellcheck', 'false');
    ta.setAttribute('inputmode', 'text');
    ta.setAttribute('enterkeyhint', 'enter');
    ta.rows = 1;
    Object.assign(ta.style, {
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '1px',
      height: '24px',
      margin: '0',
      padding: '0',
      border: '0',
      outline: 'none',
      resize: 'none',
      overflow: 'hidden',
      opacity: '0',
      zIndex: '20',
      background: 'transparent',
      color: 'transparent',
      caretColor: 'transparent',
      pointerEvents: 'none',
      transform: 'translateZ(0)',
    } as any);
    host.appendChild(ta);
    this.textarea = ta;
    if (this.readOnly) ta.readOnly = true;

    ta.addEventListener('keydown', this.onKeyDown);
    ta.addEventListener('input', this.onInput);
    ta.addEventListener('blur', this.onBlur);
  }

  setTabSize(n: number): void {
    this.tabSize = Math.max(1, n | 0);
  }

  setReadOnly(v: boolean): void {
    this.readOnly = v;
    this.textarea.readOnly = v;
  }

  setPageSize(n: number): void {
    this.pageSize = Math.max(1, n | 0);
  }

  setBracketEnterIndent(v: boolean): void {
    this.bracketEnterIndent = v;
  }

  moveTo(x: number, y: number, h: number): void {
    const ta = this.textarea;
    ta.style.left = `${Math.max(0, Math.floor(x))}px`;
    ta.style.top = `${Math.max(0, Math.floor(y))}px`;
    ta.style.height = `${Math.max(20, Math.floor(h))}px`;
  }

  focus(): void {
    this.wantFocus = true;
    this.applyFocus();
    requestAnimationFrame(() => this.applyFocus());
    if (this.refocusTimer) clearTimeout(this.refocusTimer);
    this.refocusTimer = setTimeout(() => this.applyFocus(), 30);
  }

  blur(): void {
    this.wantFocus = false;
    this.textarea.blur();
  }

  setKeybindingService(kb: KeybindingService | null): void {
    this.keybindings = kb;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.wantFocus = false;
    if (this.refocusTimer) clearTimeout(this.refocusTimer);
    this.textarea.removeEventListener('keydown', this.onKeyDown);
    this.textarea.removeEventListener('input', this.onInput);
    this.textarea.removeEventListener('blur', this.onBlur);
    this.textarea.remove();
  }

  private applyFocus(): void {
    if (!this.wantFocus || this.disposed) return;
    const ta = this.textarea;
    if (document.activeElement === ta) return;
    try {
      ta.focus({ preventScroll: true });
    } catch {
      ta.focus();
    }
  }

  private onBlur = (e: FocusEvent): void => {
    if (!this.wantFocus || this.disposed) return;
    const next = e.relatedTarget as Node | null;
    if (next && !this.host.contains(next)) {
      this.wantFocus = false;
      return;
    }
    if (this.refocusTimer) clearTimeout(this.refocusTimer);
    this.refocusTimer = setTimeout(() => {
      if (!this.wantFocus || this.disposed) return;
      const active = document.activeElement;
      if (
        active &&
        active !== this.textarea &&
        active !== document.body &&
        active !== document.documentElement &&
        !this.host.contains(active)
      ) {
        this.wantFocus = false;
        return;
      }
      if (
        !active ||
        active === document.body ||
        active === document.documentElement ||
        active === this.textarea
      ) {
        this.applyFocus();
      }
    }, 0);
  };

  private onInput = (): void => {
    if (this.readOnly) {
      this.textarea.value = '';
      return;
    }
    const data = this.textarea.value;
    this.textarea.value = '';
    if (!data) return;
    this.replaceSelection(data);
  };

  private replaceSelection(text: string): void {
    if (this.readOnly) return;
    const { model, selection } = this;
    if (!selection.isEmpty) {
      const a = selection.anchor;
      const b = selection.active;
      const aOff = model.getOffsetAt(a.lineNumber, a.column);
      const bOff = model.getOffsetAt(b.lineNumber, b.column);
      const start = Math.min(aOff, bOff);
      const end = Math.max(aOff, bOff);
      // ONE undo step: undo restores the old text AND the old selection together
      model.replaceRange(start, end, text);
      const pos = model.getPositionAt(start + text.length);
      selection.setCaret(pos.lineNumber, pos.column);
    } else {
      const off = model.getOffsetAt(selection.active.lineNumber, selection.active.column);
      model.insert(off, text);
      const pos = model.getPositionAt(off + text.length);
      selection.setCaret(pos.lineNumber, pos.column);
    }
    this.goalColumn = null;
    this.onChange();
  }

  private indentSelection(): void {
    if (this.readOnly) return;
    const pad = ' '.repeat(this.tabSize);
    const { model, selection } = this;
    const a = selection.anchor;
    const b = selection.active;
    const startLine = Math.min(a.lineNumber, b.lineNumber);
    const endLine = Math.max(a.lineNumber, b.lineNumber);
    if (selection.isEmpty) {
      this.replaceSelection(pad);
      return;
    }
    // Whole block = ONE undo step
    const from = model.getOffsetAt(startLine, 1);
    const to = model.getOffsetAt(endLine, model.getLineContent(endLine).length + 1);
    const lines: string[] = [];
    for (let ln = startLine; ln <= endLine; ln++) lines.push(pad + model.getLineContent(ln));
    const nextA = { lineNumber: a.lineNumber, column: a.column + this.tabSize };
    const nextB = { lineNumber: b.lineNumber, column: b.column + this.tabSize };
    model.replaceRange(from, to, lines.join('\n'), {
      aLine: nextA.lineNumber,
      aCol: nextA.column,
      bLine: nextB.lineNumber,
      bCol: nextB.column,
    });
    selection.anchor = nextA;
    selection.active = nextB;
    this.onChange();
  }

  private outdentSelection(): void {
    if (this.readOnly) return;
    const { model, selection } = this;
    const a = { ...selection.anchor };
    const b = { ...selection.active };
    const startLine = Math.min(a.lineNumber, b.lineNumber);
    const endLine = Math.max(a.lineNumber, b.lineNumber);
    const removedAt: Record<number, number> = {};
    const lines: string[] = [];
    let any = false;
    for (let ln = startLine; ln <= endLine; ln++) {
      const content = model.getLineContent(ln);
      let remove = 0;
      if (content.startsWith('\t')) remove = 1;
      else {
        while (remove < this.tabSize && remove < content.length && content[remove] === ' ') {
          remove++;
        }
      }
      if (remove > 0) {
        removedAt[ln] = remove;
        any = true;
      }
      lines.push(content.slice(remove));
    }
    const adj = (pos: { lineNumber: number; column: number }) => {
      const r = removedAt[pos.lineNumber] ?? 0;
      return {
        lineNumber: pos.lineNumber,
        column: Math.max(1, pos.column - r),
      };
    };
    const nextA = adj(a);
    const nextB = adj(b);
    if (any) {
      // Whole block = ONE undo step
      const from = model.getOffsetAt(startLine, 1);
      const to = model.getOffsetAt(endLine, model.getLineContent(endLine).length + 1);
      model.replaceRange(from, to, lines.join('\n'), {
        aLine: nextA.lineNumber,
        aCol: nextA.column,
        bLine: nextB.lineNumber,
        bCol: nextB.column,
      });
    }
    selection.anchor = nextA;
    selection.active = nextB;
    this.goalColumn = null;
    this.onChange();
  }


  private handleEnterKey(): void {
    const { model, selection } = this;
    const lineNumber = selection.active.lineNumber;
    const column = selection.active.column;
    const lineText = model.getLineContent(lineNumber);
    const indent = leadingWs(lineText);
    const chBefore = column > 1 ? lineText[column - 2]! : '';
    const chAfter = column <= lineText.length ? lineText[column - 1]! : '';
    const pairs: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
    const isOpen = (c: string) => c === '{' || c === '[' || c === '(';

    if (this.bracketEnterIndent && selection.isEmpty) {
      // {|} [|] (|)
      if (isOpen(chBefore) && chAfter === pairs[chBefore]) {
        const inner = indent + ' '.repeat(this.tabSize);
        const off = model.getOffsetAt(lineNumber, column);
        const insert = '\n' + inner + '\n' + indent;
        // caret goes on the inner line; tell the stack so redo lands there too
        const caretLine = lineNumber + 1;
        const caretCol = inner.length + 1;
        model.replaceRange(off, off, insert, {
          aLine: caretLine,
          aCol: caretCol,
          bLine: caretLine,
          bCol: caretCol,
        });
        selection.setCaret(caretLine, caretCol);
        this.goalColumn = null;
        this.onChange();
        return;
      }
      // right after open only: {| or [|
      if (isOpen(chBefore)) {
        const inner = indent + ' '.repeat(this.tabSize);
        this.replaceSelection('\n' + inner);
        return;
      }
    }
    // default / }| / {}| / .|
    this.replaceSelection('\n' + indent);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.disposed) return;
    if (this.keybindings?.dispatch(e)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const { model, selection } = this;
    const lineCount = model.getLineCount();
    const { lineNumber, column } = selection.active;
    const lineText = model.getLineContent(lineNumber);
    const extend = e.shiftKey;
    const ctrl = e.ctrlKey || e.metaKey;

    const move = (ln: number, col: number, keepGoal = false) => {
      const clampedLine = Math.max(1, Math.min(lineCount, ln));
      const maxCol = model.getLineContent(clampedLine).length + 1;
      let c = keepGoal && this.goalColumn != null ? this.goalColumn : col;
      // Clamp to line end for THIS line only — goalColumn stays for next longer line
      c = Math.max(1, Math.min(maxCol, c));
      selection.moveActive(clampedLine, c, extend);
      this.onChange();
    };

    // Ctrl+A handled by keybinding service usually; keep fallback
    if (ctrl && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      selection.anchor = { lineNumber: 1, column: 1 };
      const last = model.getLineCount();
      selection.active = {
        lineNumber: last,
        column: model.getLineContent(last).length + 1,
      };
      this.goalColumn = null;
      this.onChange();
      return;
    }

    // Ctrl+Home / Ctrl+End
    if (ctrl && e.key === 'Home') {
      e.preventDefault();
      this.goalColumn = null;
      move(1, 1);
      return;
    }
    if (ctrl && e.key === 'End') {
      e.preventDefault();
      this.goalColumn = null;
      const last = lineCount;
      move(last, model.getLineContent(last).length + 1);
      return;
    }

    // Word navigation (cross line at edges — VS Code behavior)
    if (ctrl && e.key === 'ArrowLeft') {
      e.preventDefault();
      this.goalColumn = null;
      if (column <= 1) {
        if (lineNumber > 1) {
          const prev = model.getLineContent(lineNumber - 1);
          move(lineNumber - 1, prev.length + 1);
        }
      } else {
        move(lineNumber, wordBoundary(lineText, column, -1));
      }
      return;
    }
    if (ctrl && e.key === 'ArrowRight') {
      e.preventDefault();
      this.goalColumn = null;
      // Already at EOL → next line
      if (column >= lineText.length + 1) {
        if (lineNumber < lineCount) move(lineNumber + 1, 1);
        return;
      }
      const next = wordBoundary(lineText, column, 1);
      // Word boundary landed on EOL and we're done with this line's words → stay EOL
      // Second press (column already EOL) handled above
      move(lineNumber, next);
      return;
    }

    // Ctrl+Backspace / Ctrl+Delete word
    if (ctrl && e.key === 'Backspace') {
      e.preventDefault();
      if (this.readOnly) return;
      if (!selection.isEmpty) {
        this.replaceSelection('');
        return;
      }
      const dest = wordBoundary(lineText, column, -1);
      const start = model.getOffsetAt(lineNumber, dest);
      const end = model.getOffsetAt(lineNumber, column);
      if (end > start) {
        model.delete(start, end);
        selection.setCaret(lineNumber, dest);
        this.onChange();
      } else if (column === 1 && lineNumber > 1) {
        // join with previous line
        const prev = model.getLineContent(lineNumber - 1);
        const off = model.getOffsetAt(lineNumber, 1);
        model.delete(off - 1, off);
        selection.setCaret(lineNumber - 1, prev.length + 1);
        this.onChange();
      }
      return;
    }
    if (ctrl && e.key === 'Delete') {
      e.preventDefault();
      if (this.readOnly) return;
      if (!selection.isEmpty) {
        this.replaceSelection('');
        return;
      }
      const dest = wordBoundary(lineText, column, 1);
      const start = model.getOffsetAt(lineNumber, column);
      const end = model.getOffsetAt(lineNumber, dest);
      if (end > start) {
        model.delete(start, end);
        this.onChange();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        this.goalColumn = null;
        if (column > 1) move(lineNumber, column - 1);
        else if (lineNumber > 1) {
          const prev = model.getLineContent(lineNumber - 1);
          move(lineNumber - 1, prev.length + 1);
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        this.goalColumn = null;
        if (column <= lineText.length) move(lineNumber, column + 1);
        else if (lineNumber < lineCount) move(lineNumber + 1, 1);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        // Remember visual goal once per vertical sequence
        if (this.goalColumn == null) this.goalColumn = selection.active.column;
        move(lineNumber - 1, this.goalColumn, true);
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        if (this.goalColumn == null) this.goalColumn = selection.active.column;
        move(lineNumber + 1, this.goalColumn, true);
        break;
      }
      case 'PageUp': {
        e.preventDefault();
        if (this.goalColumn == null) this.goalColumn = column;
        move(lineNumber - this.pageSize, column, true);
        break;
      }
      case 'PageDown': {
        e.preventDefault();
        if (this.goalColumn == null) this.goalColumn = column;
        move(lineNumber + this.pageSize, column, true);
        break;
      }
      case 'Home': {
        e.preventDefault();
        this.goalColumn = null;
        // Soft home: first non-ws, then 1
        const ws = leadingWs(lineText).length;
        if (column > ws + 1) move(lineNumber, ws + 1);
        else move(lineNumber, 1);
        break;
      }
      case 'End': {
        e.preventDefault();
        this.goalColumn = null;
        move(lineNumber, lineText.length + 1);
        break;
      }
      case 'Backspace': {
        e.preventDefault();
        if (this.readOnly) return;
        if (!selection.isEmpty) {
          this.replaceSelection('');
          return;
        }
        const offset = model.getOffsetAt(lineNumber, column);
        if (offset > 0) {
          model.delete(offset - 1, offset);
          const pos = model.getPositionAt(offset - 1);
          selection.setCaret(pos.lineNumber, pos.column);
          this.goalColumn = null;
          this.onChange();
        }
        break;
      }
      case 'Delete': {
        e.preventDefault();
        if (this.readOnly) return;
        if (!selection.isEmpty) {
          this.replaceSelection('');
          return;
        }
        const offset = model.getOffsetAt(lineNumber, column);
        if (offset < model.getValue().length) {
          model.delete(offset, offset + 1);
          this.goalColumn = null;
          this.onChange();
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (this.readOnly) return;
        this.handleEnterKey();
        break;
      }
      case 'Tab': {
        e.preventDefault();
        if (this.readOnly) return;
        if (e.shiftKey) this.outdentSelection();
        else this.indentSelection();
        break;
      }
      default:
        break;
    }
  };
}
