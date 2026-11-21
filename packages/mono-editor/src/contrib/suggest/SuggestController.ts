import type { TextModel } from '../../core/TextModel';
import type { SelectionState } from '../../core/Selection';
import type { ViewController } from '../../view/ViewController';
import {
  languageFeatures,
  createWordBasedCompletionProvider,
  type CompletionItem,
  type CompletionContext,
} from '../../language/features';
import { SuggestWidget, type SuggestAnchor, type SuggestWidgetOptions } from './SuggestWidget';

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
  /** Caret position the list was opened for — moving away from it closes the list */
  private anchorPos: { lineNumber: number; column: number } | null = null;
  /** Column where the word being completed starts (widget label lines up with it) */
  private wordStartCol = 1;

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
        onAccept: (item) => {
          // widget hides itself after accept; keep controller state in sync so
          // arrow keys / Enter are not swallowed afterwards
          this.open = false;
          this.seq++;
          this.anchorPos = null;
          this.apply(item);
        },
        onDismiss: () => this.cancel(),
      },
      widgetOptions,
    );

    // Always-on word completion fallback
    languageFeatures.registerCompletionItemProvider(
      '*',
      createWordBasedCompletionProvider(),
    );
    // Demo keywords so Ctrl+Space always shows something
    languageFeatures.registerCompletionItemProvider('*', {
      provideCompletionItems() {
        const kws = ['function', 'const', 'let', 'if', 'else', 'return', 'for', 'while', 'class', 'import', 'export', 'async', 'await', 'true', 'false', 'null', 'undefined'];
        return {
          suggestions: kws.map((k) => ({
            label: k,
            kind: 13,
            detail: 'keyword',
            insertText: k,
          })),
        };
      },
    });
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
        const items = Array.isArray(list) ? list : list?.suggestions;
        if (items?.length) all.push(...items);
      } catch (e) {
        console.warn('[mono suggest]', e);
      }
    }

    // Dedupe by label
    const seen = new Set<string>();
    const unique = all.filter((it) => {
      const lab = typeof it.label === 'string' ? it.label : (it.label as any)?.label || '';
      if (seen.has(lab)) return false;
      seen.add(lab);
      return true;
    });

    if (!unique.length) {
      this.cancel();
      return;
    }
    // Caret moved while providers were running → this list is for a stale position
    const now = this.selection.active;
    if (now.lineNumber !== pos.lineNumber || now.column !== pos.column) return;

    this.open = true;
    this.anchorPos = pos;
    const prefix = this.currentPrefix();
    this.wordStartCol = pos.column - prefix.length;
    this.widget.show(unique, this.anchor(), prefix);
    // Opened while the caret line is under a sticky header / off-screen → start suspended
    this.widget.setSuspended(!this.view.isLineInView(pos.lineNumber));
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
    if (!this.open || this.widget.isSuspended()) return false;
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

  /**
   * Scroll / layout changed. The list belongs to the line it was opened on:
   * hide it while that line is scrolled off-screen, bring it back (and keep it
   * glued to the line) when the line is visible again.
   */
  updatePosition(): void {
    if (!this.open || !this.anchorPos) return;
    const visible = this.view.isLineInView(this.anchorPos.lineNumber);
    this.widget.setSuspended(!visible);
    if (visible) this.widget.reposition(this.anchor());
  }

  /** Caret moved (tap, handle drag, arrow keys, API) → close unless it is still where we opened. */
  syncCursor(): void {
    if (!this.open || !this.anchorPos) return;
    const a = this.selection.active;
    if (a.lineNumber !== this.anchorPos.lineNumber || a.column !== this.anchorPos.column) {
      this.cancel();
    }
  }

  cancel(): void {
    this.open = false;
    this.anchorPos = null;
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
    this.model.replaceRange(start, end, insert); // one undo step
    const pos = this.model.getPositionAt(start + insert.length);
    this.selection.setCaret(pos.lineNumber, pos.column);
    this.onEdit();
  }

  private currentPrefix(): string {
    const pos = this.selection.active;
    const line = this.model.getLineContent(pos.lineNumber);
    const before = line.slice(0, Math.max(0, pos.column - 1));
    const m = before.match(/[A-Za-z0-9_$]*$/);
    return m ? m[0] : '';
  }

  /** Widget anchor: start of the current word, bottom + top of the caret line (root-local px). */
  private anchor(): SuggestAnchor {
    const line = this.anchorPos?.lineNumber ?? this.selection.active.lineNumber;
    const p = this.view.screenPosOf(line, this.wordStartCol);
    return { x: p.x, y: p.y + p.h, top: p.y };
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
