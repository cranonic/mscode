import { TextModel } from '../core/TextModel';
import { SelectionState } from '../core/Selection';
import { CanvasRenderer } from '../render/CanvasRenderer';
import { InputController } from '../input/InputController';
import { PointerController } from '../input/PointerController';
import { ViewController } from '../view/ViewController';
import {
  DEFAULT_THEME,
  type IMonoEditor,
  type MonoContentChangeEvent,
  type MonoDisposable,
  type MonoEditorOptions,
  type MonoEditorTheme,
} from './types';
import { TokenizationSupport } from '../language/TokenizationSupport';
import { registerDefaultLanguages } from '../language/registerDefaults';
import { ContextMenuController } from '../menu/ContextMenuController';
import type { MonoMenuItem, MonoMenuStyle } from '../menu/types';
import { KeybindingService, MonoCommands } from '../keybindings/KeybindingService';
import type { MonoKeybinding } from '../keybindings/KeybindingService';

export class MonoEditor implements IMonoEditor {
  private host: HTMLElement;
  private root: HTMLDivElement;
  private model: TextModel;
  private selection = new SelectionState();
  private renderer: CanvasRenderer;
  private input: InputController;
  private pointer: PointerController;
  private view: ViewController;
  private theme: MonoEditorTheme;
  private fontFamily: string;
  private fontSize: number;
  private lineHeight: number;
  private lineNumbers: boolean;
  private overscan: number;
  private contentListeners = new Set<(e: MonoContentChangeEvent) => void>();
  private ro?: ResizeObserver;
  private disposed = false;
  private unsubModel: () => void;
  private tokenization = new TokenizationSupport();
  private menu!: ContextMenuController;
  private keybindings = new KeybindingService();
  private onDocPointerDown: ((e: PointerEvent) => void) | null = null;
  private onRootKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(host: HTMLElement, options: MonoEditorOptions = {}) {
    registerDefaultLanguages();
    this.host = host;
    this.fontFamily =
      options.fontFamily ?? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    this.fontSize = options.fontSize ?? 14;
    this.lineHeight = options.lineHeight ?? Math.round(this.fontSize * 1.45);
    this.lineNumbers = (options.lineNumbers ?? 'on') === 'on';
    this.overscan = options.overscan ?? 3;
    this.theme = { ...DEFAULT_THEME, ...options.theme };
    this.model = new TextModel(options.value ?? '', options.language ?? 'plaintext');
    this.model.setSelectionCapture(() => {
      const a = this.selection.anchor;
      const b = this.selection.active;
      return {
        aLine: a.lineNumber,
        aCol: a.column,
        bLine: b.lineNumber,
        bCol: b.column,
      };
    });

    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      outline: 'none',
      background: this.theme.background,
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
    } as any);
    this.root.tabIndex = -1;

    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    this.root.appendChild(canvas);
    host.appendChild(this.root);

    this.renderer = new CanvasRenderer(canvas);
    this.view = new ViewController(
      this.model,
      this.selection,
      this.renderer,
      () => this.metrics(),
      () => this.theme,
      () => this.lineNumbers,
      this.overscan,
      this.tokenization,
      options.stickyScroll,
    );

    this.input = new InputController(this.root, this.model, this.selection, () => {
      this.view.ensureCaretVisible();
      this.syncTextarea();
      this.view.paint();
      this.emitContent();
    });

    this.menu = new ContextMenuController(
      this.root,
      this.model,
      this.selection,
      () => {
        this.view.ensureCaretVisible();
        this.syncTextarea();
        this.view.paint();
        this.emitContent();
      },
      () => this.focus(),
    );

    this.input.setKeybindingService(this.keybindings);
    this.registerDefaultKeybindings();

    // Single capture listener: only when focus is in this editor
    this.onRootKeyDown = (e: KeyboardEvent) => {
      if (this.disposed) return;
      const active = document.activeElement;
      const inEditor =
        active === this.input.textarea ||
        (active != null && this.root.contains(active));
      if (!inEditor) return;
      if (this.keybindings.dispatch(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', this.onRootKeyDown, true);



    this.onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && !this.root.contains(target)) {
        this.input.blur();
        this.menu.hide();
      }
    };
    document.addEventListener('pointerdown', this.onDocPointerDown, true);



    this.pointer = new PointerController(
      this.root,
      this.model,
      this.selection,
      this.view,
      () => this.metrics(),
      () => this.renderer.lastTeardrops,
      (kind) => {
        if (kind === 'scroll') {
          this.menu?.hide();
          return;
        }
        if (kind === 'tap') {
          this.menu?.hide();
          this.syncTextarea();
          this.input.focus();
          this.view.paint();
        } else if (kind === 'select' || kind === 'handle') {
          this.syncTextarea();
          this.view.paint();
          if (!this.selection.isEmpty) {
            // Delay one frame so layout/selection paints first
            requestAnimationFrame(() => this.showSelectionMenu());
          }
        }
      },
    );
    this.unsubModel = this.model.onDidChange(() => {
      this.tokenization.invalidate();
      this.view.invalidateScopes();
      this.view.paint();
    });

    this.root.addEventListener('wheel', this.onWheel, { passive: false });

    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(this.root);
    requestAnimationFrame(() => {
      this.layout();
      this.syncTextarea();
    });

    if (options.readOnly) this.input.textarea.readOnly = true;
  }

  getValue(): string { return this.model.getValue(); }
  setValue(value: string): void {
    this.model.setValue(value);
    this.selection.setCaret(1, 1);
    this.view.scrollTop = 0;
    this.view.paint();
    this.syncTextarea();
    this.emitContent();
  }
  getLanguageId(): string { return this.model.getLanguageId(); }
  setLanguageId(id: string): void {
    this.model.setLanguageId(id);
    this.tokenization.invalidate();
    this.view.paint();
  }
  getModelVersionId(): number { return this.model.getVersionId(); }
  focus(): void { this.syncTextarea(); this.input.focus(); }
  setContextMenuItems(items: MonoMenuItem[]): void {
    this.menu.setItems(items);
  }

  addContextMenuItem(item: MonoMenuItem): void {
    this.menu.addItem(item);
  }

  removeContextMenuItem(id: string): void {
    this.menu.removeItem(id);
  }

  setContextMenuStyle(style: MonoMenuStyle): void {
    this.menu.setStyle(style);
  }

  hideContextMenu(): void {
    this.menu.hide();
  }

  setStickyScroll(opts: import('../view/StickyScroll').MonoStickyScrollOptions): void {
    this.view.setStickyScroll(opts);
  }

  layout(): void {
    if (this.disposed) return;
    const rect = this.root.getBoundingClientRect();
    this.view.setSize(rect.width, rect.height);
    this.syncTextarea();
  }
  onDidChangeModelContent(listener: (e: MonoContentChangeEvent) => void): MonoDisposable {
    this.contentListeners.add(listener);
    return { dispose: () => this.contentListeners.delete(listener) };
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubModel();
    this.ro?.disconnect();
    this.root.removeEventListener('wheel', this.onWheel);
    this.pointer.dispose();
    this.menu.dispose();
    if (this.onDocPointerDown) {
      document.removeEventListener('pointerdown', this.onDocPointerDown, true);
      this.onDocPointerDown = null;
    }
    if (this.onRootKeyDown) {
      window.removeEventListener('keydown', this.onRootKeyDown, true);
      this.onRootKeyDown = null;
    }
    this.input.dispose();
    this.contentListeners.clear();
    this.root.remove();
  }

  private metrics() {
    const font = `${this.fontSize}px ${this.fontFamily}`;
    const charWidth = this.renderer.measureCharWidth(font);
    const gutterWidth = this.lineNumbers
      ? Math.max(40, String(this.model.getLineCount()).length * charWidth + 16)
      : 0;
    return {
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      lineHeight: this.lineHeight,
      gutterWidth,
      charWidth,
      paddingLeft: 8,
      paddingTop: 4,
    };
  }

  


  /**
   * After undo: if text was restored (cut/del/replace), re-select that range.
   * After redo: restore post-edit caret/selection when known.
   */
  private applyStackSelection(
    entry: {
      inverse: { startOffset: number; endOffset: number; text: string };
      forward: { startOffset: number; endOffset: number; text: string };
      beforeSel?: { aLine: number; aCol: number; bLine: number; bCol: number };
      afterSel?: { aLine: number; aCol: number; bLine: number; bCol: number };
    } | null,
    mode: 'undo' | 'redo',
  ): void {
    if (!entry) return;
    if (mode === 'undo') {
      // Prefer explicit beforeSel (exact selection user had)
      if (entry.beforeSel) {
        const s = entry.beforeSel;
        this.selection.anchor = { lineNumber: s.aLine, column: s.aCol };
        this.selection.active = { lineNumber: s.bLine, column: s.bCol };
        return;
      }
      // Fallback: select restored text range (inverse inserts replaced text)
      const restored = entry.inverse.text;
      if (restored.length > 0) {
        const start = entry.inverse.startOffset;
        const end = start + restored.length;
        const p1 = this.model.getPositionAt(start);
        const p2 = this.model.getPositionAt(end);
        this.selection.anchor = { lineNumber: p1.lineNumber, column: p1.column };
        this.selection.active = { lineNumber: p2.lineNumber, column: p2.column };
        return;
      }
      const pos = this.model.getPositionAt(entry.inverse.startOffset);
      this.selection.setCaret(pos.lineNumber, pos.column);
      return;
    }
    // redo
    if (entry.afterSel) {
      const s = entry.afterSel;
      this.selection.anchor = { lineNumber: s.aLine, column: s.aCol };
      this.selection.active = { lineNumber: s.bLine, column: s.bCol };
      return;
    }
    // Caret at end of forward insert (or start if pure delete)
    const endOff =
      entry.forward.startOffset + entry.forward.text.length;
    const pos = this.model.getPositionAt(endOff);
    this.selection.setCaret(pos.lineNumber, pos.column);
  }

  private registerDefaultKeybindings(): void {
    const runAfter = () => {
      this.view.ensureCaretVisible();
      this.syncTextarea();
      this.view.paint();
      this.emitContent();
    };

    const selectionText = (): string => {
      if (this.selection.isEmpty) return '';
      const a = this.selection.anchor;
      const b = this.selection.active;
      const aOff = this.model.getOffsetAt(a.lineNumber, a.column);
      const bOff = this.model.getOffsetAt(b.lineNumber, b.column);
      const start = Math.min(aOff, bOff);
      const end = Math.max(aOff, bOff);
      return this.model.getValue().slice(start, end);
    };

    const writeClipboard = async (text: string) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
    };

    const doCopy = () => { void writeClipboard(selectionText()); };

    const doCut = () => {
      const text = selectionText();
      if (!text) return;
      void writeClipboard(text);
      const a = this.selection.anchor;
      const b = this.selection.active;
      const aOff = this.model.getOffsetAt(a.lineNumber, a.column);
      const bOff = this.model.getOffsetAt(b.lineNumber, b.column);
      const start = Math.min(aOff, bOff);
      const end = Math.max(aOff, bOff);
      this.model.delete(start, end);
      const pos = this.model.getPositionAt(start);
      this.selection.setCaret(pos.lineNumber, pos.column);
      runAfter();
    };

    const doPaste = async () => {
      let text = '';
      try {
        text = await navigator.clipboard.readText();
      } catch {
        return;
      }
      if (!text) return;
      if (!this.selection.isEmpty) {
        const a = this.selection.anchor;
        const b = this.selection.active;
        const aOff = this.model.getOffsetAt(a.lineNumber, a.column);
        const bOff = this.model.getOffsetAt(b.lineNumber, b.column);
        const start = Math.min(aOff, bOff);
        const end = Math.max(aOff, bOff);
        this.model.delete(start, end);
        this.model.insert(start, text);
        const pos = this.model.getPositionAt(start + text.length);
        this.selection.setCaret(pos.lineNumber, pos.column);
      } else {
        const off = this.model.getOffsetAt(
          this.selection.active.lineNumber,
          this.selection.active.column,
        );
        this.model.insert(off, text);
        const pos = this.model.getPositionAt(off + text.length);
        this.selection.setCaret(pos.lineNumber, pos.column);
      }
      runAfter();
    };

    this.keybindings.addMany([
      {
        id: MonoCommands.Undo,
        primary: 'ctrl+z',
        weight: 5,
        handler: () => {
          const entry = this.model.undoEntry();
          if (entry) {
            this.applyStackSelection(entry, 'undo');
            runAfter();
          }
        },
      },
      {
        id: MonoCommands.Redo,
        primary: 'ctrl+shift+z',
        weight: 5,
        handler: () => {
          const entry = this.model.redoEntry();
          if (entry) {
            this.applyStackSelection(entry, 'redo');
            runAfter();
          }
        },
      },
      {
        id: MonoCommands.Redo + '.y',
        primary: 'ctrl+y',
        weight: 5,
        handler: () => {
          const entry = this.model.redoEntry();
          if (entry) {
            this.applyStackSelection(entry, 'redo');
            runAfter();
          }
        },
      },
      {
        id: MonoCommands.Copy,
        primary: 'ctrl+c',
        weight: 5,
        handler: () => doCopy(),
      },
      {
        id: MonoCommands.Cut,
        primary: 'ctrl+x',
        weight: 5,
        handler: () => doCut(),
      },
      {
        id: MonoCommands.Paste,
        primary: 'ctrl+v',
        weight: 5,
        handler: () => { void doPaste(); },
      },
      {
        id: MonoCommands.SelectAll,
        primary: 'ctrl+a',
        weight: 5,
        handler: () => {
          const last = this.model.getLineCount();
          const lastCol = this.model.getLineContent(last).length + 1;
          this.selection.anchor = { lineNumber: 1, column: 1 };
          this.selection.active = { lineNumber: last, column: lastCol };
          this.view.paint();
        },
      },
    ]);
  }

  addKeybinding(binding: MonoKeybinding): () => void {
    return this.keybindings.add(binding);
  }

  removeKeybinding(id: string): void {
    this.keybindings.remove(id);
  }

  listKeybindings(): MonoKeybinding[] {
    return this.keybindings.list();
  }

  private showSelectionMenu(): void {
    if (!this.menu) return;
    const m = this.metrics();
    const line = this.selection.active.lineNumber;
    const col = this.selection.active.column;
    const x =
      (this.lineNumbers ? m.gutterWidth : 0) +
      m.paddingLeft +
      Math.max(0, col - 1) * m.charWidth -
      this.view.scrollLeft;
    const y =
      m.paddingTop + (line - 1) * m.lineHeight - this.view.scrollTop;
    this.menu.showAt(Math.max(0, x), Math.max(0, y));
  }

  private syncTextarea(): void {
    const p = this.view.caretScreenPos();
    this.input.moveTo(p.x, p.y, p.h);
  }

  private emitContent(): void {
    const e: MonoContentChangeEvent = { value: this.model.getValue() };
    for (const l of this.contentListeners) l(e);
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.view.scrollBy(e.deltaX, e.deltaY);
  };
}

export function createMonoEditor(host: HTMLElement, options?: MonoEditorOptions): IMonoEditor {
  return new MonoEditor(host, options);
}
