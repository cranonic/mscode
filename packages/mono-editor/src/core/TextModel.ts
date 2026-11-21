import { EditStack } from './EditStack';

export type ModelEdit = {
  startOffset: number;
  endOffset: number;
  text: string;
};

export class TextModel {
  private lines: string[] = [''];
  private versionId = 1;
  private languageId = 'plaintext';
  private listeners = new Set<(versionId: number) => void>();
  readonly editStack = new EditStack();
  /** Optional: snapshot selection before each recorded edit */
  private selCapture: (() => {
    aLine: number; aCol: number; bLine: number; bCol: number;
  } | null) | null = null;

  constructor(value = '', languageId = 'plaintext') {
    this.setValue(value);
    this.languageId = languageId;
  }

  getVersionId(): number {
    return this.versionId;
  }

  getLanguageId(): string {
    return this.languageId;
  }

  setLanguageId(id: string): void {
    this.languageId = id;
  }

  getLineCount(): number {
    return this.lines.length;
  }

  getLineContent(lineNumber: number): string {
    return this.lines[lineNumber - 1] ?? '';
  }

  getValue(): string {
    return this.lines.join('\n');
  }

  setValue(value: string, clearHistory = true): void {
    this.lines = value.length === 0 ? [''] : value.split('\n');
    if (clearHistory) this.editStack.clear();
    this.bump();
  }

  getOffsetAt(lineNumber: number, column: number): number {
    let offset = 0;
    const maxLine = Math.min(lineNumber - 1, this.lines.length);
    for (let i = 0; i < maxLine; i++) {
      offset += this.lines[i].length + 1;
    }
    const line = this.lines[lineNumber - 1] ?? '';
    return offset + Math.max(0, Math.min(column - 1, line.length));
  }

  getPositionAt(offset: number): { lineNumber: number; column: number } {
    let remaining = Math.max(0, offset);
    for (let i = 0; i < this.lines.length; i++) {
      const len = this.lines[i].length;
      if (remaining <= len) {
        return { lineNumber: i + 1, column: remaining + 1 };
      }
      remaining -= len + 1;
      if (remaining < 0) {
        return { lineNumber: i + 1, column: len + 1 };
      }
    }
    const last = this.lines.length;
    return {
      lineNumber: last,
      column: (this.lines[last - 1]?.length ?? 0) + 1,
    };
  }

  applyEdit(
    edit: ModelEdit,
    record = true,
    afterSelOverride?: {
      aLine: number;
      aCol: number;
      bLine: number;
      bCol: number;
    },
  ): void {
    const value = this.getValue();
    const replaced = value.slice(edit.startOffset, edit.endOffset);
    const beforeSel = record ? this.selCapture?.() ?? undefined : undefined;
    const before = value.slice(0, edit.startOffset);
    const after = value.slice(edit.endOffset);
    this.lines = (before + edit.text + after).length === 0
      ? ['']
      : (before + edit.text + after).split('\n');
    this.bump();
    if (record) {
      const endPos = this.getPositionAt(edit.startOffset + edit.text.length);
      const afterSel = afterSelOverride ?? {
        aLine: endPos.lineNumber,
        aCol: endPos.column,
        bLine: endPos.lineNumber,
        bCol: endPos.column,
      };
      this.editStack.push(
        edit.startOffset,
        edit.endOffset,
        replaced,
        edit.text,
        beforeSel ?? undefined,
        afterSel,
      );
    }
  }

  setSelectionCapture(
    fn: (() => {
      aLine: number;
      aCol: number;
      bLine: number;
      bCol: number;
    } | null) | null,
  ): void {
    this.selCapture = fn;
  }

  /** Undo and return stack entry (for selection restore). */
  undoEntry() {
    return this.editStack.undo(this);
  }

  redoEntry() {
    return this.editStack.redo(this);
  }

  undo(): boolean {
    return this.undoEntry() != null;
  }

  redo(): boolean {
    return this.redoEntry() != null;
  }

  /**
   * Replace [start, end) with `text` as ONE undo step.
   * (delete + insert would push two stack entries → undo needs two presses
   * and the first press restores only the caret, not the selection.)
   */
  replaceRange(
    startOffset: number,
    endOffset: number,
    text: string,
    afterSel?: { aLine: number; aCol: number; bLine: number; bCol: number },
  ): void {
    if (endOffset <= startOffset && text === '') return;
    this.applyEdit({ startOffset, endOffset, text }, true, afterSel);
  }

  insert(offset: number, text: string): void {
    this.applyEdit({ startOffset: offset, endOffset: offset, text });
  }

  delete(startOffset: number, endOffset: number): void {
    if (endOffset <= startOffset) return;
    this.applyEdit({ startOffset, endOffset, text: '' });
  }

  onDidChange(listener: (versionId: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private bump(): void {
    this.versionId++;
    for (const l of this.listeners) l(this.versionId);
  }
}
