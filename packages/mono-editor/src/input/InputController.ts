import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';

export class InputController {
  readonly textarea: HTMLTextAreaElement;
  private model: TextModel;
  private selection: SelectionState;
  private onChange: () => void;
  private disposed = false;
  private wantFocus = false;
  private refocusTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    host: HTMLElement,
    model: TextModel,
    selection: SelectionState,
    onChange: () => void,
  ) {
    this.model = model;
    this.selection = selection;
    this.onChange = onChange;

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

    ta.addEventListener('keydown', this.onKeyDown);
    ta.addEventListener('input', this.onInput);
    ta.addEventListener('blur', this.onBlur);
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
    try { ta.focus({ preventScroll: true }); } catch { ta.focus(); }
  }

  private onBlur = (): void => {
    if (this.wantFocus && !this.disposed) {
      if (this.refocusTimer) clearTimeout(this.refocusTimer);
      this.refocusTimer = setTimeout(() => this.applyFocus(), 16);
    }
  };

  private onInput = (): void => {
    const data = this.textarea.value;
    this.textarea.value = '';
    if (!data) return;
    this.replaceSelection(data);
  };

  private replaceSelection(text: string): void {
    const { model, selection } = this;
    if (!selection.isEmpty) {
      const a = selection.anchor;
      const b = selection.active;
      const aOff = model.getOffsetAt(a.lineNumber, a.column);
      const bOff = model.getOffsetAt(b.lineNumber, b.column);
      const start = Math.min(aOff, bOff);
      const end = Math.max(aOff, bOff);
      model.delete(start, end);
      model.insert(start, text);
      const pos = model.getPositionAt(start + text.length);
      selection.setCaret(pos.lineNumber, pos.column);
    } else {
      const offset = model.getOffsetAt(selection.active.lineNumber, selection.active.column);
      model.insert(offset, text);
      const pos = model.getPositionAt(offset + text.length);
      selection.setCaret(pos.lineNumber, pos.column);
    }
    this.onChange();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const { model, selection } = this;
    const { lineNumber, column } = selection.active;
    const lineCount = model.getLineCount();
    const lineText = model.getLineContent(lineNumber);
    const extend = e.shiftKey;

    const move = (ln: number, col: number) => {
      const clampedLine = Math.max(1, Math.min(lineCount, ln));
      const maxCol = model.getLineContent(clampedLine).length + 1;
      const c = Math.max(1, Math.min(maxCol, col));
      selection.moveActive(clampedLine, c, extend);
      this.onChange();
    };

    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      selection.anchor = { lineNumber: 1, column: 1 };
      const last = model.getLineCount();
      const lastCol = model.getLineContent(last).length + 1;
      selection.active = { lineNumber: last, column: lastCol };
      this.onChange();
      return;
    }

    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        if (column > 1) move(lineNumber, column - 1);
        else if (lineNumber > 1) {
          const prev = model.getLineContent(lineNumber - 1);
          move(lineNumber - 1, prev.length + 1);
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (column <= lineText.length) move(lineNumber, column + 1);
        else if (lineNumber < lineCount) move(lineNumber + 1, 1);
        break;
      }
      case 'ArrowUp': { e.preventDefault(); move(lineNumber - 1, column); break; }
      case 'ArrowDown': { e.preventDefault(); move(lineNumber + 1, column); break; }
      case 'Home': { e.preventDefault(); move(lineNumber, 1); break; }
      case 'End': { e.preventDefault(); move(lineNumber, lineText.length + 1); break; }
      case 'Backspace': {
        e.preventDefault();
        if (!selection.isEmpty) { this.replaceSelection(''); return; }
        const offset = model.getOffsetAt(lineNumber, column);
        if (offset > 0) {
          model.delete(offset - 1, offset);
          const pos = model.getPositionAt(offset - 1);
          selection.setCaret(pos.lineNumber, pos.column);
          this.onChange();
        }
        break;
      }
      case 'Delete': {
        e.preventDefault();
        if (!selection.isEmpty) { this.replaceSelection(''); return; }
        const offset = model.getOffsetAt(lineNumber, column);
        if (offset < model.getValue().length) {
          model.delete(offset, offset + 1);
          this.onChange();
        }
        break;
      }
      case 'Enter': { e.preventDefault(); this.replaceSelection('\n'); break; }
      case 'Tab': { e.preventDefault(); this.replaceSelection('  '); break; }
      default: break;
    }
  };
}
