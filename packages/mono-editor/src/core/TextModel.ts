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

  applyEdit(edit: ModelEdit, record = true): void {
    const value = this.getValue();
    const replaced = value.slice(edit.startOffset, edit.endOffset);
    if (record) {
      this.editStack.push(edit.startOffset, edit.endOffset, replaced, edit.text);
    }
    const before = value.slice(0, edit.startOffset);
    const after = value.slice(edit.endOffset);
    // setValue bumps version — but avoid nested stack clear
    this.lines = (before + edit.text + after).length === 0
      ? ['']
      : (before + edit.text + after).split('\n');
    this.bump();
  }

  undo(): boolean {
    const entry = this.editStack.undo(this);
    return entry != null;
  }

  redo(): boolean {
    const entry = this.editStack.redo(this);
    return entry != null;
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
