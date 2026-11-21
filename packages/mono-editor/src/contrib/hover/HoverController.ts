import type { TextModel } from '../../core/TextModel';
import type { SelectionState } from '../../core/Selection';
import type { ViewController } from '../../view/ViewController';
import { languageFeatures } from '../../language/features';
import { HoverWidget, type HoverWidgetOptions } from './HoverWidget';

export class HoverController {
  private model: TextModel;
  private selection: SelectionState;
  private view: ViewController;
  private widget: HoverWidget;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private seq = 0;

  constructor(
    host: HTMLElement,
    model: TextModel,
    selection: SelectionState,
    view: ViewController,
    options?: HoverWidgetOptions,
  ) {
    this.model = model;
    this.selection = selection;
    this.view = view;
    this.widget = new HoverWidget(host, options);
  }

  setWidgetOptions(o: HoverWidgetOptions): void {
    this.widget.setOptions(o);
  }

  /** Long-press / dwell at position */
  schedule(line: number, column: number, delayMs = 400): void {
    this.cancelTimer();
    this.timer = setTimeout(() => {
      void this.showAt(line, column);
    }, delayMs);
  }

  cancelTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  hide(): void {
    this.cancelTimer();
    this.widget.hide();
  }

  async showAt(line: number, column: number): Promise<void> {
    const my = ++this.seq;
    const lang = this.model.getLanguageId();
    const providers = languageFeatures.getHoverProviders(lang);
    const modelLike = {
      getValue: () => this.model.getValue(),
      getLineContent: (n: number) => this.model.getLineContent(n),
      getLineCount: () => this.model.getLineCount(),
      getOffsetAt: (l: number, c: number) => this.model.getOffsetAt(l, c),
      getPositionAt: (o: number) => this.model.getPositionAt(o),
      getLanguageId: () => this.model.getLanguageId(),
    };
    const token = { isCancellationRequested: false };
    const parts: string[] = [];
    for (const p of providers) {
      try {
        const h = await Promise.resolve(
          p.provideHover(modelLike, { lineNumber: line, column }, token),
        );
        if (my !== this.seq) return;
        if (!h?.contents?.length) continue;
        for (const c of h.contents) {
          parts.push(typeof c === 'string' ? c : c.value);
        }
      } catch (e) {
        console.warn('[mono hover]', e);
      }
    }
    if (!parts.length) {
      this.widget.hide();
      return;
    }
    const m = (this.view as any).getMetrics?.() ?? {
      lineHeight: 20,
      charWidth: 8,
      paddingTop: 4,
      paddingLeft: 4,
      gutterWidth: 48,
    };
    const x =
      (m.gutterWidth ?? 0) +
      (m.paddingLeft ?? 0) +
      Math.max(0, column - 1) * (m.charWidth ?? 8) -
      this.view.scrollLeft;
    const y =
      (m.paddingTop ?? 0) +
      line * (m.lineHeight ?? 20) -
      this.view.scrollTop;
    this.widget.show(parts, { x: Math.max(0, x), y: Math.max(0, y) });
  }

  dispose(): void {
    this.hide();
    this.widget.dispose();
  }
}
