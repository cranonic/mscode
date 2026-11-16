import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type { MonoEditorTheme } from '../api/types';

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

/** Classic mobile teardrop: pointy tip UP toward caret, round body below */
export const TEARDROP = { w: 24, h: 30 };

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
  }): void {
    const {
      model, selection, scrollTop, scrollLeft, cssWidth, cssHeight,
      metrics, theme, showLineNumbers, overscan, showTeardrops = true,
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
        const x1 = textX0 + ctx.measureText(prefix).width;
        const w = Math.max(ctx.measureText(mid).width, line === range.endLine ? 2 : 0);
        ctx.fillStyle = theme.selection;
        ctx.fillRect(x1, y, w || 4, lineHeight);
      }

      ctx.fillStyle = theme.foreground;
      ctx.fillText(content, textX0, y + (lineHeight - fontSize) / 2);

      if (line === caretLine && !hasSelection) {
        const prefix = content.slice(0, Math.max(0, caretCol - 1));
        const cx = textX0 + ctx.measureText(prefix).width;
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
      const dropColor = theme.caret || '#4fc3f7';
      if (hasSelection) {
        this.paintTeardropAt(range.startLine, range.startCol, 'start', model, metrics, scrollTop, scrollLeft, showLineNumbers, dropColor);
        this.paintTeardropAt(range.endLine, range.endCol, 'end', model, metrics, scrollTop, scrollLeft, showLineNumbers, dropColor);
      } else {
        this.paintTeardropAt(caretLine, caretCol, 'cursor', model, metrics, scrollTop, scrollLeft, showLineNumbers, dropColor);
      }
    }
  }

  private paintTeardropAt(
    line: number, col: number, type: 'cursor' | 'start' | 'end',
    model: TextModel, metrics: RenderMetrics,
    scrollTop: number, scrollLeft: number, showLineNumbers: boolean, color: string,
  ): void {
    const { lineHeight, paddingTop, paddingLeft, gutterWidth, charWidth } = metrics;
    const content = model.getLineContent(line);
    const prefix = content.slice(0, Math.max(0, col - 1));
    const textX0 = (showLineNumbers ? gutterWidth : 0) + paddingLeft - scrollLeft;
    const cx = textX0 + prefix.length * charWidth;
    const y = paddingTop + (line - 1) * lineHeight - scrollTop;
    const bottom = y + lineHeight;
    const { w, h } = TEARDROP;
    let left = cx;
    if (type === 'start') left = cx - w;
    else if (type === 'cursor') left = cx - w / 2;
    // tip touches line bottom, body hangs below
    const top = bottom - 1;
    this.drawTeardropShape(left, top, w, h, color, type);
    this.lastTeardrops.push({ type, x: left, y: top, w, h: h + 10 });
  }

  /**
   * Orientation: TIP at top (toward caret), ROUND bulb at bottom.
   * (180° from previous version)
   */
  private drawTeardropShape(
    x: number, y: number, w: number, h: number, color: string,
    type: 'cursor' | 'start' | 'end',
  ): void {
    const ctx = this.ctx;
    const r = w * 0.42;
    const cx = x + w / 2;
    // tip y, bulb center lower
    const tipY = y;
    const bulbCy = y + h - r - 2;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;

    // tip point + sides into circle
    ctx.beginPath();
    // tip
    if (type === 'start') {
      // tip aligned to right edge (selection start)
      const tipX = x + w;
      ctx.moveTo(tipX, tipY);
      ctx.quadraticCurveTo(tipX, tipY + 8, cx + r * 0.3, bulbCy - r * 0.6);
      ctx.arc(cx, bulbCy, r, -0.9, Math.PI + 0.9, false);
      ctx.quadraticCurveTo(tipX - 4, tipY + 10, tipX, tipY);
    } else if (type === 'end') {
      const tipX = x;
      ctx.moveTo(tipX, tipY);
      ctx.quadraticCurveTo(tipX + 4, tipY + 10, cx - r * 0.3, bulbCy - r * 0.6);
      ctx.arc(cx, bulbCy, r, Math.PI - 0.9, 0.9, false);
      ctx.quadraticCurveTo(tipX, tipY + 8, tipX, tipY);
    } else {
      ctx.moveTo(cx, tipY);
      ctx.quadraticCurveTo(cx + 3, tipY + 10, cx + r * 0.85, bulbCy - r * 0.5);
      ctx.arc(cx, bulbCy, r, -0.7, Math.PI + 0.7, false);
      ctx.quadraticCurveTo(cx - 3, tipY + 10, cx, tipY);
    }
    ctx.closePath();
    ctx.fill();

    // highlight on bulb
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, bulbCy - r * 0.25, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
