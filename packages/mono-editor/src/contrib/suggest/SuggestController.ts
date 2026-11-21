import type { TextModel } from '../../core/TextModel';
import type { SelectionState } from '../../core/Selection';
import type { ViewController } from '../../view/ViewController';
import {
  languageFeatures,
  createWordBasedCompletionProvider,
  type CompletionItem,
  type CompletionContext,
} from '../../language/features';
import { SuggestWidget, type SuggestWidgetOptions } from './SuggestWidget';

export class SuggestController {
  private model: TextModel;
  private selection: SelectionState;
  private view: ViewController;
  private host: HTMLElement;
  private widget: SuggestWidget;
  private open = false;
  private seq = 0;
  private onEdit: () => void;
  private disposed = false;

  constructor(
    host: HTMLElement,
    model: TextModel,
    selection: SelectionState,
    view: ViewController,
    onEdit: () => void,
    widgetOptions?: SuggestWidgetOptions,
  ) {
    this.host = host;
    this.model = model;
    this.selection = selection;
    this.view = view;
    this.onEdit = onEdit;
    this.widget = new SuggestWidget(
      host,
      {
        onAccept: (item) => this.apply(item),
        onDismiss: () => this.cancel(),
      },
      widgetOptions,
    );

    // Always-on word completion fallback
    languageFeatures.registerCompletionItemProvider(
      '*',
      createWordBasedCompletionProvider(),
    );
  }

  setWidgetOptions(opts: SuggestWidgetOptions): void {
    this.widget.setOptions(opts);
  }

  isOpen(): boolean {
    return this.open;
  }

  /** Ctrl+Space or trigger character */
  async trigger(triggerCharacter?: string): Promise<void> {
    if (this.disposed) return;
    const my = ++this.seq;
    const pos = {
      lineNumber: this.selection.active.lineNumber,
      column: this.selection.active.column,
    };
    const lang = this.model.getLanguageId();
    const providers = languageFeatures.getCompletionProviders(lang);
    const context: CompletionContext = {
      triggerKind: triggerCharacter ? 1 : 0,
      triggerCharacter,
    };
    const token = { isCancellationRequested: false };
    const modelLike = this.modelAsLike();

    const all: CompletionItem[] = [];
    for (const p of providers) {
      try {
        const list = await Promise.resolve(
          p.provideCompletionItems(modelLike, pos, context, token),
        );
        if (my !== this.seq) return;
        if (list?.suggestions?.length) all.push(...list.suggestions);
      } catch (e) {
        console.warn('[mono suggest]', e);
      }
    }

    // Dedupe by label
    const seen = new Set<string>();
    const unique = all.filter((it) => {
      const lab = typeof it.label === 'string' ? it.label : it.label.label;
      if (seen.has(lab)) return false;
      seen.add(lab);
      return true;
    });

    if (!unique.length) {
      this.cancel();
      return;
    }

    this.open = true;
    const anchor = this.caretScreen();
    this.widget.show(unique, anchor);
  }

  /** Called after typing — soft retrigger */
  async onType(ch: string): Promise<void> {
    const lang = this.model.getLanguageId();
    const providers = languageFeatures.getCompletionProviders(lang);
    const triggers = new Set<string>();
    for (const p of providers) {
      for (const t of p.triggerCharacters ?? []) triggers.add(t);
    }
    // Word chars → retrigger if already open or always after identifier char
    if (/[A-Za-z0-9_$]/.test(ch) || triggers.has(ch)) {
      await this.trigger(triggers.has(ch) ? ch : undefined);
    } else if (this.open) {
      this.cancel();
    }
  }

  handleKey(e: KeyboardEvent): boolean {
    if (!this.open) return false;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.widget.selectNext();
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.widget.selectPrev();
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      return this.widget.acceptSelected();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      this.cancel();
      return true;
    }
    return false;
  }

  cancel(): void {
    this.open = false;
    this.seq++;
    this.widget.hide();
  }

  dispose(): void {
    this.disposed = true;
    this.cancel();
    this.widget.dispose();
  }

  private apply(item: CompletionItem): void {
    const text = item.insertText ?? (
      typeof item.label === 'string' ? item.label : item.label.label
    );
    const insert = text.replace(/\$\d+/g, ''); // naive snippet strip
    let start: number;
    let end: number;
    if (item.range) {
      start = this.model.getOffsetAt(item.range.startLineNumber, item.range.startColumn);
      end = this.model.getOffsetAt(item.range.endLineNumber, item.range.endColumn);
    } else {
      const a = this.selection.active;
      end = this.model.getOffsetAt(a.lineNumber, a.column);
      const line = this.model.getLineContent(a.lineNumber);
      const before = line.slice(0, a.column - 1);
      const m = before.match(/[A-Za-z_$][\w$]*$/);
      const prefixLen = m ? m[0].length : 0;
      start = end - prefixLen;
    }
    this.model.delete(start, end);
    this.model.insert(start, insert);
    const pos = this.model.getPositionAt(start + insert.length);
    this.selection.setCaret(pos.lineNumber, pos.column);
    this.onEdit();
  }

  private caretScreen(): { x: number; y: number } {
    // Approximate from view metrics — ViewController may expose better later
    const m = (this.view as any).getMetrics?.() ?? {
      lineHeight: 20,
      charWidth: 8,
      paddingTop: 4,
      paddingLeft: 4,
      gutterWidth: 48,
    };
    const line = this.selection.active.lineNumber;
    const col = this.selection.active.column;
    const x =
      (m.gutterWidth ?? 0) +
      (m.paddingLeft ?? 0) +
      Math.max(0, col - 1) * (m.charWidth ?? 8) -
      (this.view.scrollLeft || 0);
    const y =
      (m.paddingTop ?? 0) +
      (line - 1) * (m.lineHeight ?? 20) -
      (this.view.scrollTop || 0) +
      (m.lineHeight ?? 20);
    return { x: Math.max(0, x), y: Math.max(0, y) };
  }

  private modelAsLike() {
    return {
      getValue: () => this.model.getValue(),
      getLineContent: (n: number) => this.model.getLineContent(n),
      getLineCount: () => this.model.getLineCount(),
      getOffsetAt: (l: number, c: number) => this.model.getOffsetAt(l, c),
      getPositionAt: (o: number) => this.model.getPositionAt(o),
      getLanguageId: () => this.model.getLanguageId(),
    };
  }
}
