import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type { MonoEditorTheme } from '../api/types';
import type { MonoToken } from '../language/tokenTypes';
import { DEFAULT_TOKEN_COLORS } from '../language/tokenTypes';
import type { StickyRenderLine } from '../view/StickyScroll';

export interface RenderMetrics {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  gutterWidth: number;
  charWidth: number;
  paddingLeft: number;
  paddingTop: number;
}

export interface TeardropHit {
  type: 'cursor' | 'start' | 'end';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FreeHandleVisual {
  type: 'cursor' | 'start' | 'end';
  x: number;
  y: number;
}

function orderedSelection(sel: SelectionState): {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
} {
  const a = sel.anchor;
  const b = sel.active;
  const aBefore =
    a.lineNumber < b.lineNumber ||
    (a.lineNumber === b.lineNumber && a.column <= b.column);
  if (aBefore) {
    return {
      startLine: a.lineNumber,
      startCol: a.column,
      endLine: b.lineNumber,
      endCol: b.column,
    };
  }
  return {
    startLine: b.lineNumber,
    startCol: b.column,
    endLine: a.lineNumber,
    endCol: a.column,
  };
}

/** Smaller width; body hangs below tip (tip stays on baseline). */
export const TEARDROP = { w: 26, h: 34 };
const CARET_H = 18;
const CARET_W = 2;

export class CanvasRenderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  lastTeardrops: TeardropHit[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Mono Editor: 2d context unavailable');
    this.ctx = ctx;
  }

  resize(cssWidth: number, cssHeight: number): void {
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.floor(cssWidth * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(cssHeight * this.dpr));
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  measureCharWidth(font: string): number {
    this.ctx.font = font;
    return this.ctx.measureText('M').width || 8;
  }

  paint(opts: {
    model: TextModel;
    selection: SelectionState;
    scrollTop: number;
    scrollLeft: number;
    cssWidth: number;
    cssHeight: number;
    metrics: RenderMetrics;
    theme: MonoEditorTheme;
    showLineNumbers: boolean;
    overscan: number;
    showTeardrops?: boolean;
    freeHandle?: FreeHandleVisual | null;
    /** Optional syntax tokens for a line (1-based). Empty → plain foreground. */
    getLineTokens?: (lineNumber: number) => MonoToken[];
    stickyLines?: StickyRenderLine[];
  }): void {
    const {
      model, selection, scrollTop, scrollLeft, cssWidth, cssHeight,
      metrics, theme, showLineNumbers, overscan,
      showTeardrops = true,
      freeHandle = null,
      getLineTokens,
      stickyLines = [],
    } = opts;

    const { ctx } = this;
    const { lineHeight, fontSize, fontFamily, gutterWidth, paddingLeft, paddingTop } = metrics;

    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const font = `${fontSize}px ${fontFamily}`;
    ctx.font = font;
    ctx.textBaseline = 'top';

    const firstLine = Math.max(1, Math.floor(scrollTop / lineHeight) + 1 - overscan);
    const visibleCount = Math.ceil(cssHeight / lineHeight) + overscan * 2;
    const lastLine = Math.min(model.getLineCount(), firstLine + visibleCount);
    const textX0 = (showLineNumbers ? gutterWidth : 0) + paddingLeft - scrollLeft;
    const contentLeft = showLineNumbers ? gutterWidth : 0;

    if (showLineNumbers) {
      ctx.fillStyle = theme.gutterBackground;
      ctx.fillRect(0, 0, gutterWidth, cssHeight);
    }

    const caretLine = selection.active.lineNumber;
    const caretCol = selection.active.column;
    const range = orderedSelection(selection);
    const hasSelection = !selection.isEmpty;

    ctx.save();
    ctx.beginPath();
    ctx.rect(contentLeft, 0, Math.max(0, cssWidth - contentLeft), cssHeight);
    ctx.clip();

    for (let line = firstLine; line <= lastLine; line++) {
      const y = paddingTop + (line - 1) * lineHeight - scrollTop;
      if (y + lineHeight < 0 || y > cssHeight) continue;

      if (line === caretLine) {
        ctx.fillStyle = theme.lineHighlight;
        ctx.fillRect(contentLeft, y, cssWidth - contentLeft, lineHeight);
      }

      const content = model.getLineContent(line);

      if (hasSelection && line >= range.startLine && line <= range.endLine) {
        let fromCol = 1;
        let toCol = content.length + 1;
        if (line === range.startLine) fromCol = range.startCol;
        if (line === range.endLine) toCol = range.endCol;
        const prefix = content.slice(0, Math.max(0, fromCol - 1));
        const mid = content.slice(Math.max(0, fromCol - 1), Math.max(0, toCol - 1));
        const x1 = textX0 + Math.max(0, fromCol - 1) * metrics.charWidth;
        const w = Math.max((toCol - fromCol) * metrics.charWidth, line === range.endLine ? 2 : 0);
        ctx.fillStyle = theme.selection;
        ctx.fillRect(x1, y, w || 4, lineHeight);
      }

      {
        const textY = y + (lineHeight - fontSize) / 2;
        const tokens = getLineTokens?.(line) ?? [];
        if (!tokens.length) {
          ctx.fillStyle = theme.foreground;
          ctx.fillText(content, textX0, textY);
        } else {
          const colors = { ...DEFAULT_TOKEN_COLORS, ...(theme.tokenColors ?? {}) };
          const cw = metrics.charWidth;
          let col = 1;
          const emit = (from: number, to: number, type: string) => {
            if (to <= from) return;
            const slice = content.slice(from - 1, to - 1);
            if (!slice) return;
            // Monospace: use charWidth — avoids measureText jitter while scrolling
            const x = textX0 + (from - 1) * cw;
            ctx.fillStyle = (colors as any)[type] ?? theme.foreground;
            ctx.fillText(slice, x, textY);
          };
          for (const tok of tokens) {
            if (tok.startColumn > col) emit(col, tok.startColumn, 'plain');
            emit(tok.startColumn, tok.endColumn, tok.type);
            col = Math.max(col, tok.endColumn);
          }
          if (col <= content.length) emit(col, content.length + 1, 'plain');
        }
      }

      if (line === caretLine && !hasSelection) {
        const prefix = content.slice(0, Math.max(0, caretCol - 1));
        const cx = textX0 + Math.max(0, caretCol - 1) * metrics.charWidth;
        ctx.fillStyle = theme.caret;
        ctx.fillRect(cx, y + 2, 2, lineHeight - 4);
      }
    }
    ctx.restore();

    if (showLineNumbers) {
      ctx.fillStyle = theme.gutterBackground;
      ctx.fillRect(0, 0, gutterWidth, cssHeight);
      for (let line = firstLine; line <= lastLine; line++) {
        const y = paddingTop + (line - 1) * lineHeight - scrollTop;
        if (y + lineHeight < 0 || y > cssHeight) continue;
        ctx.fillStyle = theme.gutterForeground;
        ctx.textAlign = 'right';
        ctx.fillText(String(line), gutterWidth - 8, y + (lineHeight - fontSize) / 2);
      }
      ctx.textAlign = 'left';
      ctx.strokeStyle = theme.gutterForeground;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.moveTo(gutterWidth - 0.5, 0);
      ctx.lineTo(gutterWidth - 0.5, cssHeight);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }


    this.lastTeardrops = [];
    if (showTeardrops) {
      const dropColor = theme.caret || '#007acc';
      if (hasSelection) {
        this.paintTeardropAt(
          range.startLine, range.startCol, 'start',
          model, metrics, scrollTop, scrollLeft, showLineNumbers, dropColor, freeHandle,
        );
        this.paintTeardropAt(
          range.endLine, range.endCol, 'end',
          model, metrics, scrollTop, scrollLeft, showLineNumbers, dropColor, freeHandle,
        );
      } else {
        this.paintTeardropAt(
          caretLine, caretCol, 'cursor',
          model, metrics, scrollTop, scrollLeft, showLineNumbers, dropColor, freeHandle,
        );
      }
    }

    // --- Sticky scroll overlay (outer on top; gutter above sticky text) ---
    if (stickyLines.length) {
      const stackBottom = Math.max(
        ...stickyLines.map((s) => s.y + lineHeight),
        stickyLines.length * lineHeight,
      );
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, cssWidth, Math.max(0, stackBottom + 4));
      ctx.clip();

      // Innermost first → outermost last
      for (let i = stickyLines.length - 1; i >= 0; i--) {
        const s = stickyLines[i]!;
        const line = s.lineNumber;
        const y = s.y;
        if (y + lineHeight < -2 || y > cssHeight) continue;
        const content = model.getLineContent(line);
        const textY = y + (lineHeight - fontSize) / 2;
        const alpha = s.visibility ?? 1;

        ctx.save();
        let topClip = y;
        if (i > 0) {
          const prevBottom = stickyLines[i - 1]!.y + lineHeight;
          topClip = Math.max(y, prevBottom);
        }
        if (topClip >= y + lineHeight) {
          ctx.restore();
          continue;
        }
        ctx.beginPath();
        ctx.rect(0, topClip, cssWidth, y + lineHeight - topClip);
        ctx.clip();

        // Full-row background
        ctx.globalAlpha = 1;
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, y, cssWidth, lineHeight);

        // Text only in content area — never over gutter (horizontal scroll safe)
        ctx.save();
        ctx.beginPath();
        ctx.rect(contentLeft, y, Math.max(0, cssWidth - contentLeft), lineHeight);
        ctx.clip();

        const tokens = getLineTokens?.(line) ?? [];
        const textX0s = contentLeft + paddingLeft - scrollLeft;
        const cw = metrics.charWidth;
        ctx.globalAlpha = alpha;
        if (!tokens.length) {
          ctx.fillStyle = theme.foreground;
          ctx.fillText(content, textX0s, textY);
        } else {
          const colors = { ...DEFAULT_TOKEN_COLORS, ...(theme.tokenColors ?? {}) };
          let col = 1;
          const emit = (from: number, to: number, type: string) => {
            if (to <= from) return;
            const slice = content.slice(from - 1, to - 1);
            if (!slice) return;
            ctx.fillStyle = (colors as any)[type] ?? theme.foreground;
            ctx.fillText(slice, textX0s + (from - 1) * cw, textY);
          };
          for (const tok of tokens) {
            if (tok.startColumn > col) emit(col, tok.startColumn, 'plain');
            emit(tok.startColumn, tok.endColumn, tok.type);
            col = Math.max(col, tok.endColumn);
          }
          if (col <= content.length) emit(col, content.length + 1, 'plain');
        }
        ctx.globalAlpha = 1;
        ctx.restore(); // end content clip

        // Gutter ON TOP of any scrolled text that tried to enter left strip
        if (showLineNumbers) {
          ctx.fillStyle = theme.gutterBackground;
          ctx.fillRect(0, y, gutterWidth, lineHeight);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = theme.gutterForeground;
          ctx.textAlign = 'right';
          ctx.fillText(String(line), gutterWidth - 8, textY);
          ctx.textAlign = 'left';
          ctx.globalAlpha = 1;
          // separator
          ctx.strokeStyle = theme.gutterForeground;
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.moveTo(gutterWidth - 0.5, y);
          ctx.lineTo(gutterWidth - 0.5, y + lineHeight);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.restore(); // end row clip
      }

      const edgeY = Math.max(...stickyLines.map((s) => s.y + lineHeight));
      if (edgeY > 0) {
        const alphas = [0.55, 0.3, 0.14, 0.05];
        for (let i = 0; i < alphas.length; i++) {
          ctx.fillStyle = `rgba(0,0,0,${alphas[i]})`;
          ctx.fillRect(0, edgeY + i, cssWidth, 1);
        }
      }
      ctx.restore();
    }
  }

  private paintTeardropAt(
    line: number, col: number, type: 'cursor' | 'start' | 'end',
    model: TextModel, metrics: RenderMetrics,
    scrollTop: number, scrollLeft: number, showLineNumbers: boolean, color: string,
    freeHandle?: FreeHandleVisual | null,
  ): void {
    const { lineHeight, paddingTop, paddingLeft, gutterWidth } = metrics;
    const { w, h } = TEARDROP;

    let cx: number;
    let tipY: number;
    let lineTop: number;

    if (freeHandle && freeHandle.type === type) {
      cx = freeHandle.x;
      tipY = freeHandle.y;
      lineTop = tipY - lineHeight + 1;
    } else {
      const content = model.getLineContent(line);
      const prefix = content.slice(0, Math.max(0, col - 1));
      const textX0 = (showLineNumbers ? gutterWidth : 0) + paddingLeft - scrollLeft;
      this.ctx.font = `${metrics.fontSize}px ${metrics.fontFamily}`;
      cx = textX0 + this.ctx.measureText(prefix).width;
      lineTop = paddingTop + (line - 1) * lineHeight - scrollTop;
      tipY = lineTop + lineHeight - 1;
    }

    let left = cx - w / 2;
    if (type === 'start') left = cx - w * 0.42;
    else if (type === 'end') left = cx - w * 0.58;

    this.drawTeardropShape(left, tipY, w, h, color, type);
    this.drawTipCaret(left, tipY, w, type, lineTop, lineHeight);
    this.lastTeardrops.push({ type, x: left, y: tipY, w, h: h + 12 });
  }

  private drawTeardropShape(
    x: number, y: number, w: number, h: number, color: string,
    type: 'cursor' | 'start' | 'end',
  ): void {
    const ctx = this.ctx;
    const sx = w / 24;
    const sy = h / 32;

    ctx.save();
    ctx.translate(x + w / 2, y);
    if (type === 'start') {
      ctx.rotate((28 * Math.PI) / 180);
    } else if (type === 'end') {
      ctx.rotate((-28 * Math.PI) / 180);
    }
    ctx.scale(sx, sy);
    ctx.translate(-12, 0);

    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.bezierCurveTo(18, 6, 24, 12, 24, 18);
    ctx.arc(12, 18, 12, 0, Math.PI, false);
    ctx.bezierCurveTo(0, 12, 6, 6, 12, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.arc(9, 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawTipCaret(
    x: number,
    _tipY: number,
    w: number,
    type: 'cursor' | 'start' | 'end',
    lineTop: number,
    lineHeight: number,
  ): void {
    const ctx = this.ctx;
    let cx = x + w / 2;
    if (type === 'start') cx = x + w * 0.58 - 3;
    else if (type === 'end') cx = x + w * 0.42 + 3;
    const caretTop = lineTop + Math.max(0, (lineHeight - CARET_H) / 2 - 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - CARET_W / 2, caretTop, CARET_W, CARET_H);
  }
}