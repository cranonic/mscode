import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type {
  CanvasRenderer,
  FreeHandleVisual,
  RenderMetrics,
} from '../render/CanvasRenderer';
import type { MonoEditorTheme } from '../api/types';

export class ViewController {
  scrollTop = 0;
  scrollLeft = 0;
  cssWidth = 0;
  cssHeight = 0;
  freeHandle: FreeHandleVisual | null = null;

  private model: TextModel;
  private selection: SelectionState;
  private renderer: CanvasRenderer;
  private getMetrics: () => RenderMetrics;
  private getTheme: () => MonoEditorTheme;
  private showLineNumbers: () => boolean;
  private overscan: number;
  private paintRaf = 0;

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

  /** Effective gutter width (0 when line numbers are hidden). */
  get contentLeft(): number {
    return this.showLineNumbers() ? this.getMetrics().gutterWidth : 0;
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
    this.schedulePaint();
  }

  clampScrollPublic(): void {
    this.clampScroll();
  }

  ensureCaretVisible(): void {
    const m = this.getMetrics();
    const line = this.selection.active.lineNumber;
    const topY = m.paddingTop + (line - 1) * m.lineHeight;
    if (topY < this.scrollTop + m.paddingTop) {
      this.scrollTop = Math.max(0, topY - m.paddingTop);
    }
    if (topY + m.lineHeight > this.scrollTop + this.cssHeight) {
      this.scrollTop = topY + m.lineHeight - this.cssHeight;
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
    const textX =
      this.contentLeft +
      m.paddingLeft +
      prefix.length * m.charWidth -
      this.scrollLeft;
    const y = m.paddingTop + (line - 1) * m.lineHeight - this.scrollTop;
    return { x: textX, y, h: m.lineHeight };
  }

  /** Coalesces rapid pointermove/wheel updates into 1 paint per display frame. */
  schedulePaint(): void {
    if (this.paintRaf) return;
    this.paintRaf = requestAnimationFrame(() => {
      this.paintRaf = 0;
      this.paint();
    });
  }

  /** Immediate synchronous paint (used by resize, tap, and rAF loops). */
  paint(): void {
    if (this.paintRaf) {
      cancelAnimationFrame(this.paintRaf);
      this.paintRaf = 0;
    }
    if (this.cssWidth <= 0 || this.cssHeight <= 0) return;

    // Snap scroll to physical pixel grid for rendering (keeps float physics smooth, kills text shimmer)
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const renderTop = Math.round(this.scrollTop * dpr) / dpr;
    const renderLeft = Math.round(this.scrollLeft * dpr) / dpr;

    this.renderer.paint({
      model: this.model,
      selection: this.selection,
      scrollTop: renderTop,
      scrollLeft: renderLeft,
      cssWidth: this.cssWidth,
      cssHeight: this.cssHeight,
      metrics: this.getMetrics(),
      theme: this.getTheme(),
      showLineNumbers: this.showLineNumbers(),
      overscan: this.overscan,
      freeHandle: this.freeHandle,
    });
  }

  dispose(): void {
    if (this.paintRaf) {
      cancelAnimationFrame(this.paintRaf);
      this.paintRaf = 0;
    }
  }

  private clampScroll(): void {
    const m = this.getMetrics();
    const contentH = this.model.getLineCount() * m.lineHeight + m.paddingTop;
    const maxTop = Math.max(0, contentH - this.cssHeight);
    this.scrollTop = Math.max(0, Math.min(this.scrollTop, maxTop));
    this.scrollLeft = Math.max(0, this.scrollLeft);
  }
}