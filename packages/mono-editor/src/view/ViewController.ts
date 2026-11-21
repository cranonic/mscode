import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type {
  CanvasRenderer,
  FreeHandleVisual,
  RenderMetrics,
} from '../render/CanvasRenderer';
import type { MonoEditorTheme } from '../api/types';
import type { TokenizationSupport } from '../language/TokenizationSupport';
import {
  DEFAULT_STICKY_SCROLL,
  IndentScopeFinder,
  layoutStickyForScroll,
  type MonoStickyScrollOptions,
  type StickyRenderLine,
} from './StickyScroll';

export class ViewController {
  scrollTop = 0;
  scrollLeft = 0;
  /** Teardrop handles drawn when true (hidden while typing / scrolling) */
  handlesVisible = true;
  /** 0..1 teardrop opacity */
  handleAlpha = 1;
  /** Bottom active-line sticky (viewport-local) */
  lastBottomSticky: { lineNumber: number; caretColumn: number } | null = null;
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
  private tokenization: TokenizationSupport | null;
  private stickyOpts: Required<MonoStickyScrollOptions>;
  private scopeFinder: IndentScopeFinder;
  /** Last laid-out sticky rows (for hit-test / click-to-navigate). */
  lastSticky: StickyRenderLine[] = [];
  lastStickyHeight = 0;
  private paintRaf = 0;
  /** Optional find highlights supplier */
  private getFindDecorations: (() => {
    matches: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }[];
    currentIndex: number;
  }) | null = null;

  constructor(
    model: TextModel,
    selection: SelectionState,
    renderer: CanvasRenderer,
    getMetrics: () => RenderMetrics,
    getTheme: () => MonoEditorTheme,
    showLineNumbers: () => boolean,
    overscan: number,
    tokenization: TokenizationSupport | null = null,
    stickyScroll?: MonoStickyScrollOptions,
  ) {
    this.stickyOpts = { ...DEFAULT_STICKY_SCROLL, ...stickyScroll };
    this.scopeFinder = new IndentScopeFinder(model);
    this.model = model;
    this.selection = selection;
    this.renderer = renderer;
    this.getMetrics = getMetrics;
    this.getTheme = getTheme;
    this.showLineNumbers = showLineNumbers;
    this.overscan = overscan;
    this.tokenization = tokenization;
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

  setFindDecorationsProvider(
    fn: (() => {
      matches: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }[];
      currentIndex: number;
    }) | null,
  ): void {
    this.getFindDecorations = fn;
  }

  setStickyScroll(opts: MonoStickyScrollOptions): void {
    this.stickyOpts = { ...DEFAULT_STICKY_SCROLL, ...opts };
    this.scopeFinder.invalidate();
    this.schedulePaint();
  }

  invalidateScopes(): void {
    this.scopeFinder.invalidate();
  }

  getStickyScrollOptions(): Required<MonoStickyScrollOptions> {
    return this.stickyOpts;
  }

  ensureCaretVisible(): void {
    const m = this.getMetrics();
    const line = this.selection.active.lineNumber;
    const col = this.selection.active.column;
    const topY = m.paddingTop + (line - 1) * m.lineHeight;
    // Vertical
    if (topY < this.scrollTop + m.paddingTop) {
      this.scrollTop = Math.max(0, topY - m.paddingTop);
    }
    if (topY + m.lineHeight > this.scrollTop + this.cssHeight) {
      this.scrollTop = topY + m.lineHeight - this.cssHeight;
    }
    // Horizontal — keep caret inside content pane (never under gutter / past right edge)
    const contentLeft = this.contentLeft;
    const caretXDoc =
      contentLeft + m.paddingLeft + Math.max(0, col - 1) * m.charWidth;
    const margin = Math.max(m.charWidth * 2, 24);
    const viewLeft = contentLeft + margin;
    const viewRight = this.cssWidth - margin;
    const screenX = caretXDoc - this.scrollLeft;
    if (screenX < viewLeft) {
      this.scrollLeft = Math.max(0, caretXDoc - viewLeft);
    } else if (screenX > viewRight) {
      this.scrollLeft = Math.max(0, caretXDoc - viewRight);
    }
    this.clampScroll();
  }

  /** Max content width in CSS px (longest line), for horizontal scroll range */
  private maxContentWidthPx(): number {
    const m = this.getMetrics();
    let maxChars = 0;
    // Sample: caret line + nearby + full scan capped for perf
    const n = this.model.getLineCount();
    const caret = this.selection.active.lineNumber;
    const from = Math.max(1, caret - 30);
    const to = Math.min(n, caret + 30);
    for (let i = from; i <= to; i++) {
      maxChars = Math.max(maxChars, this.model.getLineContent(i).length);
    }
    // Also consider absolute longest if small file
    if (n <= 2000) {
      for (let i = 1; i <= n; i++) {
        maxChars = Math.max(maxChars, this.model.getLineContent(i).length);
      }
    } else {
      // light scan every k-th line
      for (let i = 1; i <= n; i += 8) {
        maxChars = Math.max(maxChars, this.model.getLineContent(i).length);
      }
    }
    return (
      this.contentLeft +
      m.paddingLeft +
      maxChars * m.charWidth +
      m.charWidth * 4
    );
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

    const metrics = this.getMetrics();
    let stickyLines: StickyRenderLine[] = [];
    if (this.stickyOpts.enabled) {
      this.scopeFinder.sync(this.model);
      const caretLine = this.selection.active.lineNumber;
      const caretCol = this.selection.active.column;
      const layout = layoutStickyForScroll(
        this.scopeFinder,
        renderTop,
        metrics,
        this.stickyOpts.maxLineCount,
        this.stickyOpts.scrollWithEditor,
        caretLine,
        caretCol,
        this.stickyOpts.activeLineSticky,
      );
      stickyLines = layout.lines;
      this.lastSticky = stickyLines;
      this.lastStickyHeight = layout.height;

      // Bottom sticky: stable hysteresis (no flicker while scrolling)
      if (this.stickyOpts.bottomActiveSticky) {
        const m = metrics;
        const docY = m.paddingTop + (caretLine - 1) * m.lineHeight;
        const viewBottom = renderTop + this.cssHeight;
        const viewTop = renderTop + this.lastStickyHeight;
        const lineBottom = docY + m.lineHeight;
        // Fully inside content pane (with small margin)
        const fullyVisible =
          docY >= viewTop + 1 && lineBottom <= viewBottom - 1;
        // Needs bottom pin: line crosses or sits past the bottom edge
        const pastBottom = lineBottom > viewBottom - 2;
        if (fullyVisible) {
          this.lastBottomSticky = null;
        } else if (pastBottom) {
          this.lastBottomSticky = {
            lineNumber: caretLine,
            caretColumn: caretCol,
          };
        } else if (
          this.lastBottomSticky &&
          this.lastBottomSticky.lineNumber === caretLine
        ) {
          // Keep showing same line until fullyVisible clears it (hysteresis)
          this.lastBottomSticky = {
            lineNumber: caretLine,
            caretColumn: caretCol,
          };
        } else {
          this.lastBottomSticky = null;
        }
      } else {
        this.lastBottomSticky = null;
      }
    } else {
      this.lastSticky = [];
      this.lastStickyHeight = 0;
      this.lastBottomSticky = null;
    }

    this.renderer.paint({
      model: this.model,
      selection: this.selection,
      scrollTop: renderTop,
      scrollLeft: renderLeft,
      cssWidth: this.cssWidth,
      cssHeight: this.cssHeight,
      metrics,
      theme: this.getTheme(),
      showLineNumbers: this.showLineNumbers(),
      overscan: this.overscan,
      getLineTokens: this.tokenization
        ? (ln) => this.tokenization!.getLineTokens(this.model, ln)
        : undefined,
      freeHandle: this.freeHandle,
      handlesVisible: this.handlesVisible,
      handleAlpha: this.handleAlpha,
      stickyLines,
      bottomSticky: this.lastBottomSticky,
      findMatches: this.getFindDecorations?.().matches ?? [],
      findCurrentIndex: this.getFindDecorations?.().currentIndex ?? -1,
    });
  }

  /**
   * Sticky overlay hit-test in root-local CSS coords.
   * Returns sticky index + lineNumber or null.
   */
  hitTestSticky(localX: number, localY: number): { index: number; lineNumber: number } | null {
    if (!this.lastSticky.length || localY < 0 || localY > this.lastStickyHeight + 2) return null;
    // Top-most sticky under point wins (outer first in paint order)
    for (let i = 0; i < this.lastSticky.length; i++) {
      const s = this.lastSticky[i]!;
      if (localY >= s.y && localY < s.y + this.getMetrics().lineHeight) {
        return { index: i, lineNumber: s.lineNumber };
      }
    }
    // Fallback: by slot index
    const m = this.getMetrics();
    const idx = Math.floor(localY / m.lineHeight);
    if (idx >= 0 && idx < this.lastSticky.length) {
      return { index: idx, lineNumber: this.lastSticky[idx]!.lineNumber };
    }
    return null;
  }

  /**
   * Bottom active-line sticky hit-test (bar drawn at the very bottom of the
   * viewport, one line tall). Returns the pinned line or null.
   */
  hitTestBottomSticky(localX: number, localY: number): { lineNumber: number } | null {
    const b = this.lastBottomSticky;
    if (!b || localX < 0 || localX > this.cssWidth) return null;
    const lh = this.getMetrics().lineHeight;
    if (localY < this.cssHeight - lh - 1 || localY > this.cssHeight) return null;
    return { lineNumber: b.lineNumber };
  }

  /**
   * Click on bottom sticky → jump to that line: scroll it into the middle of the
   * viewport (works whether the line is below OR above the viewport) and put the
   * caret at the clicked column.
   */
  revealBottomStickyLine(lineNumber: number, localX?: number): void {
    const m = this.getMetrics();
    const line = Math.max(1, Math.min(this.model.getLineCount(), lineNumber));
    const docY = m.paddingTop + (line - 1) * m.lineHeight;
    this.scrollTop = Math.max(0, docY - (this.cssHeight - m.lineHeight) / 2);
    this.clampScroll();

    let col = this.selection.active.column;
    if (localX != null) {
      const textX = localX - this.contentLeft - m.paddingLeft + this.scrollLeft;
      const content = this.model.getLineContent(line);
      col = Math.floor(textX / Math.max(1, m.charWidth)) + 1;
      col = Math.max(1, Math.min(content.length + 1, col));
    }
    this.selection.setCaret(line, col);
    // line is fully visible now → drop the pinned bar immediately
    this.lastBottomSticky = null;
    this.paint();
  }

  /**
   * VS Code / Acode: scroll so `lineNumber` sits exactly in sticky slot `index`
   * (the sticky header appears to stay put) and place caret on that line.
   */
  /**
   * Scroll so header stays in sticky slot `index`, caret at exact column from localX
   * (click on `function te|st()` → cursor between e and s).
   */
  revealStickyLine(lineNumber: number, index: number, localX?: number): void {
    const m = this.getMetrics();
    const line = Math.max(1, Math.min(this.model.getLineCount(), lineNumber));
    const docY = m.paddingTop + (line - 1) * m.lineHeight;
    this.scrollTop = Math.max(0, docY - index * m.lineHeight);
    this.clampScroll();

    let col = 1;
    if (localX != null) {
      const textX = localX - this.contentLeft - m.paddingLeft + this.scrollLeft;
      const content = this.model.getLineContent(line);
      col = Math.floor(textX / Math.max(1, m.charWidth)) + 1;
      col = Math.max(1, Math.min(content.length + 1, col));
    }
    this.selection.setCaret(line, col);
    this.paint();
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
    const maxLeft = Math.max(0, this.maxContentWidthPx() - this.cssWidth);
    this.scrollLeft = Math.max(0, Math.min(this.scrollLeft, maxLeft));
  }
}