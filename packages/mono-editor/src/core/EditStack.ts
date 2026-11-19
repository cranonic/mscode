import type { ModelEdit, TextModel } from './TextModel';

export type StackEntry = {
  /** Edit that undoes the change (restore previous text) */
  inverse: ModelEdit;
  /** Edit that redoes the change */
  forward: ModelEdit;
  /** Selection before the change (for undo) */
  beforeSel?: { aLine: number; aCol: number; bLine: number; bCol: number };
  /** Selection after the change (for redo) */
  afterSel?: { aLine: number; aCol: number; bLine: number; bCol: number };
};

/**
 * Monaco-like undo/redo stack over TextModel.applyEdit.
 */
export class EditStack {
  private undoStack: StackEntry[] = [];
  private redoStack: StackEntry[] = [];
  private maxSize: number;
  /** When true, applyEdit from undo/redo must not push again */
  private applying = false;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Record a user edit. `replaced` is the text that was at [start,end) before.
   */
  push(
    startOffset: number,
    endOffset: number,
    replaced: string,
    inserted: string,
    beforeSel?: StackEntry['beforeSel'],
    afterSel?: StackEntry['afterSel'],
  ): void {
    if (this.applying) return;
    if (startOffset === endOffset && inserted === '') return;
    this.undoStack.push({
      inverse: {
        startOffset,
        endOffset: startOffset + inserted.length,
        text: replaced,
      },
      forward: {
        startOffset,
        endOffset: startOffset + replaced.length,
        text: inserted,
      },
      beforeSel,
      afterSel,
    });
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(model: TextModel): StackEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.applying = true;
    try {
      model.applyEdit(entry.inverse, false);
      this.redoStack.push(entry);
    } finally {
      this.applying = false;
    }
    return entry;
  }

  redo(model: TextModel): StackEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.applying = true;
    try {
      model.applyEdit(entry.forward, false);
      this.undoStack.push(entry);
    } finally {
      this.applying = false;
    }
    return entry;
  }
}
