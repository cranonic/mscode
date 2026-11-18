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

    this.pointer = new PointerController(
      this.root,
      this.model,
      this.selection,
      this.view,
      () => this.metrics(),
      () => this.renderer.lastTeardrops,
      (kind) => {
        if (kind === 'tap') {
          this.syncTextarea();
          this.input.focus();
          this.view.paint();
        } else if (kind === 'select' || kind === 'handle') {
          this.syncTextarea();
          this.view.paint();
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
