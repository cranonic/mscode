import type { TextModel } from '../core/TextModel';
import type { RenderMetrics } from '../render/CanvasRenderer';

/**
 * Monaco/VS Code sticky scroll options (compatible surface).
 * @see https://code.visualstudio.com/docs/editor/codebasics#_sticky-scroll
 */
export interface MonoStickyScrollOptions {
  enabled?: boolean;
  /** Max sticky lines (VS Code default 5) */
  maxLineCount?: number;
  /**
   * indentationModel — pure indent (no LSP)
   * outlineModel — uses optional outline provider when registered
   */
  defaultModel?: 'indentationModel' | 'outlineModel';
  /** When true, sticky line pushes away as its real line approaches (VS Code default) */
  scrollWithEditor?: boolean;
}

export const DEFAULT_STICKY_SCROLL: Required<MonoStickyScrollOptions> = {
  enabled: true,
  maxLineCount: 5,
  defaultModel: 'indentationModel',
  scrollWithEditor: true,
};

export interface StickyLine {
  lineNumber: number;
  /** Depth 0 = outermost */
  depth: number;
}

export interface StickyRenderLine extends StickyLine {
  /**
   * Vertical draw offset in sticky region (px from top of sticky area).
   * When scrollWithEditor and the source line is pushing, this can be negative.
   */
  yOffset: number;
  /** 0..1 how much this sticky row is still visible (for fade/push) */
  visibility: number;
}

function leadingIndent(text: string): number {
  let i = 0;
  while (i < text.length && (text[i] === ' ' || text[i] === '\t')) i++;
  return i;
}

function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Indentation model (VS Code fallback when no outline):
 * From the first visible line, walk upward; lines with strictly smaller indent
 * that are non-blank become sticky candidates (innermost last).
 */
export function computeIndentationStickyLines(
  model: TextModel,
  firstVisibleLine: number,
  maxLineCount: number,
): StickyLine[] {
  if (firstVisibleLine <= 1) return [];
  const lineCount = model.getLineCount();
  const start = Math.min(Math.max(1, firstVisibleLine), lineCount);

  // Find reference indent: first non-blank at or below start
  let refLine = start;
  while (refLine <= lineCount && isBlank(model.getLineContent(refLine))) refLine++;
  if (refLine > lineCount) refLine = start;
  let refIndent = leadingIndent(model.getLineContent(refLine));

  const candidates: StickyLine[] = [];
  let searchIndent = refIndent;

  for (let line = start - 1; line >= 1 && candidates.length < maxLineCount * 3; line--) {
    const text = model.getLineContent(line);
    if (isBlank(text)) continue;
    const ind = leadingIndent(text);
    if (ind < searchIndent) {
      candidates.push({ lineNumber: line, depth: ind });
      searchIndent = ind;
      if (searchIndent === 0 && candidates.length >= maxLineCount) break;
    }
  }

  // Outermost first; keep last maxLineCount
  candidates.reverse();
  if (candidates.length > maxLineCount) {
    return candidates.slice(candidates.length - maxLineCount);
  }
  return candidates;
}

/**
 * Build render list with VS Code-style "push" when the real line scrolls into the sticky zone.
 *
 * stickyIndex i is drawn at y = i * lineHeight + pushOffset for the bottom-most
 * sticky that is intersecting its document position.
 */
export function layoutStickyLines(
  stickies: StickyLine[],
  scrollTop: number,
  metrics: RenderMetrics,
  scrollWithEditor: boolean,
): StickyRenderLine[] {
  const { lineHeight, paddingTop } = metrics;
  if (!stickies.length) return [];

  const out: StickyRenderLine[] = stickies.map((s, i) => ({
    ...s,
    yOffset: i * lineHeight,
    visibility: 1,
  }));

  if (!scrollWithEditor) return out;

  // Bottom sticky (innermost) pushes first when its document Y approaches sticky bottom
  for (let i = stickies.length - 1; i >= 0; i--) {
    const line = stickies[i]!.lineNumber;
    const docY = paddingTop + (line - 1) * lineHeight - scrollTop;
    // Natural sticky slot bottom for this index
    const slotTop = i * lineHeight;
    // When the real line scrolls up to meet its sticky slot, push this and all above
    if (docY < slotTop + lineHeight && docY > slotTop - lineHeight * 2) {
      const push = Math.min(0, docY - slotTop);
      // Apply push to this line and shift outer lines only when this is collapsing
      out[i]!.yOffset = slotTop + push;
      out[i]!.visibility = Math.max(0, Math.min(1, (lineHeight + push) / lineHeight));
      // Outer stickies stay until this one fully collapses — VS Code collapses bottom-up
      if (push < 0) {
        for (let j = 0; j < i; j++) {
          // slight coupled push only if bottom is leaving
          if (out[i]!.visibility < 1) {
            // keep outer fixed until bottom gone — match VS Code: only current line moves
          }
        }
      }
      break; // only the active collapsing sticky moves at once
    }
  }

  return out.filter((s) => s.visibility > 0.02);
}
