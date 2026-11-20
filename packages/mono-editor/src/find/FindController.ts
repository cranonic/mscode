import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type { ViewController } from '../view/ViewController';
import { findMatches, replaceMatch } from './FindModel';
import { FindWidget } from './FindWidget';
import {
  DEFAULT_FIND_OPTIONS,
  type FindMatch,
  type FindOptions,
  type FindState,
} from './types';

export class FindController {
  private model: TextModel;
  private selection: SelectionState;
  private view: ViewController;
  private host: HTMLElement;
  private widget: FindWidget;
  private onChange: () => void;

  private isRevealed = false;
  private isReplaceRevealed = false;
  private searchString = '';
  private replaceString = '';
  private options: FindOptions = { ...DEFAULT_FIND_OPTIONS };
  private matches: FindMatch[] = [];
  private currentIndex = -1;
  private unsubModel: (() => void) | null = null;

  constructor(
    host: HTMLElement,
    model: TextModel,
    selection: SelectionState,
    view: ViewController,
    onChange: () => void,
  ) {
    this.host = host;
    this.model = model;
    this.selection = selection;
    this.view = view;
    this.onChange = onChange;

    this.widget = new FindWidget(host, {
      onSearchChange: (v) => {
        this.searchString = v;
        this.research(true);
      },
      onReplaceChange: (v) => {
        this.replaceString = v;
      },
      onToggleOption: (key) => {
        this.options = { ...this.options, [key]: !this.options[key] };
        this.research(true);
      },
      onFindNext: () => this.findNext(),
      onFindPrevious: () => this.findPrevious(),
      onReplace: () => this.replace(),
      onReplaceAll: () => this.replaceAll(),
      onToggleReplace: () => {
        this.isReplaceRevealed = !this.isReplaceRevealed;
        this.syncWidget();
      },
      onClose: () => this.closeFindWidget(),
    });
  }

  getMatches(): FindMatch[] {
    return this.matches;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getState(): FindState {
    return {
      isRevealed: this.isRevealed,
      isReplaceRevealed: this.isReplaceRevealed,
      searchString: this.searchString,
      replaceString: this.replaceString,
      options: { ...this.options },
      matches: this.matches,
      currentIndex: this.currentIndex,
    };
  }

  /** Ctrl+F */
  startFind(): void {
    this.seedFromSelection();
    this.isRevealed = true;
    this.isReplaceRevealed = false;
    this.widget.reveal(false);
    this.research(true);
    this.ensureModelWatch();
  }

  /** Ctrl+H */
  startFindReplace(): void {
    this.seedFromSelection();
    this.isRevealed = true;
    this.isReplaceRevealed = true;
    this.widget.reveal(true);
    this.research(true);
    this.ensureModelWatch();
  }

  closeFindWidget(): void {
    this.isRevealed = false;
    this.widget.hide();
    this.matches = [];
    this.currentIndex = -1;
    this.view.paint();
  }

  findNext(): void {
    if (!this.isRevealed) {
      this.startFind();
      return;
    }
    if (!this.matches.length) {
      this.research(false);
      if (!this.matches.length) return;
    }
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this.revealCurrent();
    this.syncWidget();
  }

  findPrevious(): void {
    if (!this.isRevealed) {
      this.startFind();
      return;
    }
    if (!this.matches.length) {
      this.research(false);
      if (!this.matches.length) return;
    }
    this.currentIndex =
      (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    this.revealCurrent();
    this.syncWidget();
  }

  replace(): void {
    if (this.currentIndex < 0 || !this.matches[this.currentIndex]) {
      this.findNext();
      return;
    }
    const match = this.matches[this.currentIndex]!;
    replaceMatch(this.model, match, this.replaceString, this.searchString, this.options);
    this.onChange();
    this.research(false);
    if (this.matches.length) {
      this.currentIndex = Math.min(this.currentIndex, this.matches.length - 1);
      this.revealCurrent();
    }
    this.syncWidget();
  }

  replaceAll(): void {
    if (!this.searchString) return;
    // Replace from end so offsets stay valid
    const list = findMatches(this.model, this.searchString, this.options).slice().reverse();
    for (const m of list) {
      replaceMatch(this.model, m, this.replaceString, this.searchString, this.options);
    }
    this.onChange();
    this.research(false);
    this.syncWidget();
  }

  dispose(): void {
    this.unsubModel?.();
    this.widget.dispose();
  }

  private seedFromSelection(): void {
    if (!this.selection.isEmpty) {
      const a = this.selection.anchor;
      const b = this.selection.active;
      const aOff = this.model.getOffsetAt(a.lineNumber, a.column);
      const bOff = this.model.getOffsetAt(b.lineNumber, b.column);
      const start = Math.min(aOff, bOff);
      const end = Math.max(aOff, bOff);
      // Only seed single-line selection
      if (end - start < 200 && !this.model.getValue().slice(start, end).includes('\n')) {
        this.searchString = this.model.getValue().slice(start, end);
      }
    }
  }

  private research(moveToNearest: boolean): void {
    this.matches = findMatches(this.model, this.searchString, this.options);
    if (!this.matches.length) {
      this.currentIndex = -1;
    } else if (moveToNearest || this.currentIndex < 0) {
      this.currentIndex = this.indexNearSelection();
      this.revealCurrent();
    } else {
      this.currentIndex = Math.min(this.currentIndex, this.matches.length - 1);
    }
    this.syncWidget();
    this.view.paint();
  }

  private indexNearSelection(): number {
    const line = this.selection.active.lineNumber;
    const col = this.selection.active.column;
    for (let i = 0; i < this.matches.length; i++) {
      const m = this.matches[i]!;
      if (
        m.startLineNumber > line ||
        (m.startLineNumber === line && m.startColumn >= col)
      ) {
        return i;
      }
    }
    return 0;
  }

  private revealCurrent(): void {
    const m = this.matches[this.currentIndex];
    if (!m) return;
    this.selection.anchor = {
      lineNumber: m.startLineNumber,
      column: m.startColumn,
    };
    this.selection.active = {
      lineNumber: m.endLineNumber,
      column: m.endColumn,
    };
    this.view.ensureCaretVisible();
    this.view.paint();
  }

  private syncWidget(): void {
    if (this.isRevealed) {
      this.widget.reveal(this.isReplaceRevealed);
      this.widget.update(this.getState());
    }
  }

  private ensureModelWatch(): void {
    if (this.unsubModel) return;
    this.unsubModel = this.model.onDidChange(() => {
      if (!this.isRevealed || !this.searchString) return;
      this.matches = findMatches(this.model, this.searchString, this.options);
      if (this.currentIndex >= this.matches.length) {
        this.currentIndex = this.matches.length ? 0 : -1;
      }
      this.syncWidget();
      this.view.paint();
    });
  }
}
