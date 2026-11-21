import type { TextModel } from '../../core/TextModel';
import type { FoldingRange } from '../../language/features';
import { languageFeatures } from '../../language/features';

/** Indentation-based folding (Monaco fallback strategy). */
export function computeIndentFoldingRanges(model: TextModel): FoldingRange[] {
  const ranges: FoldingRange[] = [];
  const counts = model.getLineCount();
  const indents: number[] = [];
  for (let i = 1; i <= counts; i++) {
    const line = model.getLineContent(i);
    if (!line.trim()) {
      indents.push(-1);
      continue;
    }
    const m = line.match(/^(\s*)/);
    const spaces = m ? m[1].replace(/\t/g, '  ').length : 0;
    indents.push(spaces);
  }
  for (let i = 0; i < indents.length; i++) {
    const ind = indents[i]!;
    if (ind < 0) continue;
    let j = i + 1;
    let max = i;
    while (j < indents.length) {
      const jInd = indents[j]!;
      if (jInd >= 0 && jInd <= ind) break;
      if (jInd > ind) max = j;
      j++;
    }
    if (max > i) {
      ranges.push({ start: i + 1, end: max + 1 });
    }
  }
  return ranges;
}

export class FoldingModel {
  private model: TextModel;
  private ranges: FoldingRange[] = [];
  /** collapsed: start line → end line */
  private collapsed = new Map<number, number>();

  constructor(model: TextModel) {
    this.model = model;
  }

  async update(): Promise<void> {
    const lang = this.model.getLanguageId();
    const providers = languageFeatures.getFoldingProviders(lang);
    const token = { isCancellationRequested: false };
    const modelLike = {
      getValue: () => this.model.getValue(),
      getLineContent: (n: number) => this.model.getLineContent(n),
      getLineCount: () => this.model.getLineCount(),
      getOffsetAt: (l: number, c: number) => this.model.getOffsetAt(l, c),
      getPositionAt: (o: number) => this.model.getPositionAt(o),
      getLanguageId: () => this.model.getLanguageId(),
    };
    let ranges: FoldingRange[] = [];
    if (providers.length) {
      for (const p of providers) {
        try {
          const r = await Promise.resolve(
            p.provideFoldingRanges(modelLike, {}, token),
          );
          if (r?.length) ranges.push(...r);
        } catch {
          /* */
        }
      }
    }
    if (!ranges.length) ranges = computeIndentFoldingRanges(this.model);
    this.ranges = ranges;
    // drop invalid collapses
    for (const [s, e] of [...this.collapsed]) {
      if (!ranges.some((r) => r.start === s && r.end === e)) this.collapsed.delete(s);
    }
  }

  getRanges(): FoldingRange[] {
    return this.ranges;
  }

  isCollapsed(startLine: number): boolean {
    return this.collapsed.has(startLine);
  }

  toggle(startLine: number): void {
    const r = this.ranges.find((x) => x.start === startLine);
    if (!r) return;
    if (this.collapsed.has(startLine)) this.collapsed.delete(startLine);
    else this.collapsed.set(startLine, r.end);
  }

  /** Lines hidden by folds (exclusive of start header line) */
  isLineHidden(line: number): boolean {
    for (const [s, e] of this.collapsed) {
      if (line > s && line <= e) return true;
    }
    return false;
  }

  getCollapsed(): Map<number, number> {
    return new Map(this.collapsed);
  }
}
