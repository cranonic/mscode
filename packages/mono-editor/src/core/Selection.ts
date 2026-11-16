export interface MonoPosition {
  lineNumber: number;
  column: number;
}

export class SelectionState {
  anchor: MonoPosition = { lineNumber: 1, column: 1 };
  active: MonoPosition = { lineNumber: 1, column: 1 };

  get isEmpty(): boolean {
    return (
      this.anchor.lineNumber === this.active.lineNumber &&
      this.anchor.column === this.active.column
    );
  }

  setCaret(lineNumber: number, column: number): void {
    this.anchor = { lineNumber, column };
    this.active = { lineNumber, column };
  }

  moveActive(lineNumber: number, column: number, extend: boolean): void {
    this.active = { lineNumber, column };
    if (!extend) this.anchor = { lineNumber, column };
  }

  clone(): SelectionState {
    const s = new SelectionState();
    s.anchor = { ...this.anchor };
    s.active = { ...this.active };
    return s;
  }
}
