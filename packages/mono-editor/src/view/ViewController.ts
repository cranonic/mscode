import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type { CanvasRenderer, RenderMetrics } from '../render/CanvasRenderer';
import type { MonoEditorTheme } from '../api/types';

export class ViewController {
  scrollTop = 0;
  scrollLeft = 0;
  cssWidth = 0;
  cssHeight = 0;

  private model: TextModel;
  private selection: SelectionState;
  private renderer: CanvasRenderer;
  private getMetrics: () => RenderMetrics;
  private getTheme: () => MonoEditorTheme;
  private showLineNumbers: () => boolean;
  private overscan: number;

  constructor(
    model: TextModel,
    selection: SelectionState,
    renderer: CanvasRenderer,
    getMetrics: () => RenderMetrics,
    getTheme: () => MonoEditorTheme,
    showLineNumbers: () => boolean,
    overscan: number,
  ) {
    this.model = model;
    this.selection = selection;
    this.renderer = renderer;
    this.getMetrics = getMetrics;
    this.getTheme = getTheme;
    this.showLineNumbers = showLineNumbers;
    this.overscan = overscan;
  }

  setSize(width: number, height: number): void {
    this.cssWidth = Math.max(0, width);
    this.cssHeight = Math.max(0, height);
    this.renderer.resize(this.cssWidth, this.cssHeight);
    this.clampScroll();
    this.paint();
  }

  scrollBy(dx: number, dy: number): void {
    this.scrollLeft = Math.max(0, this.scrollLeft + dx);
    this.scrollTop = Math.max(0, this.scrollTop + dy);
    this.clampScroll();
    this.paint();
  }

  clampScrollPublic(): void {
    this.clampScroll();
  }

  ensureCaretVisible(): void {
    const m = this.getMetrics();
    const line = this.selection.active.lineNumber;
    const y = (line - 1) * m.lineHeight;
    if (y < this.scrollTop) this.scrollTop = y;
    if (y + m.lineHeight > this.scrollTop + this.cssHeight) {
      this.scrollTop = y + m.lineHeight - this.cssHeight;
    }
    this.clampScroll();
  }

  /** CSS position of caret relative to root (for textarea placement). */
  caretScreenPos(): { x: number; y: number; h: number } {
    const m = this.getMetrics();
    const line = this.selection.active.lineNumber;
    const col = this.selection.active.column;
    const content = this.model.getLineContent(line);
    const prefix = content.slice(0, Math.max(0, col - 1));
    // measure via charWidth approx
    const textX =
      (this.showLineNumbers() ? m.gutterWidth : 0) +
      m.paddingLeft +
      prefix.length * m.charWidth -
      this.scrollLeft;
    const y = m.paddingTop + (line - 1) * m.lineHeight - this.scrollTop;
    return { x: textX, y, h: m.lineHeight };
  }

  paint(): void {
    if (this.cssWidth <= 0 || this.cssHeight <= 0) return;
    this.renderer.paint({
      model: this.model,
      selection: this.selection,
      scrollTop: this.scrollTop,
      scrollLeft: this.scrollLeft,
      cssWidth: this.cssWidth,
      cssHeight: this.cssHeight,
      metrics: this.getMetrics(),
      theme: this.getTheme(),
      showLineNumbers: this.showLineNumbers(),
      overscan: this.overscan,
    });
  }

  private clampScroll(): void {
    const m = this.getMetrics();
    const contentH = this.model.getLineCount() * m.lineHeight + m.paddingTop;
    const maxTop = Math.max(0, contentH - this.cssHeight);
    this.scrollTop = Math.max(0, Math.min(this.scrollTop, maxTop));
    this.scrollLeft = Math.max(0, this.scrollLeft);
  }
}
