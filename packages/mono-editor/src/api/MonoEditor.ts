import { TextModel } from '../core/TextModel';
import { SelectionState } from '../core/Selection';
import { CanvasRenderer, TEARDROP } from '../render/CanvasRenderer';
import { InputController } from '../input/InputController';
import { PointerController } from '../input/PointerController';
import { ViewController } from '../view/ViewController';
import {
  DEFAULT_THEME,
  type ICursorPositionChangedEvent,
  type ICursorSelectionChangedEvent,
  type IIdentifiedSingleEditOperation,
  type IMonoEditor,
  type IMonoEditorAction,
  type IMonoTextModel,
  type IPosition,
  type IScrollEvent,
  type ISelection,
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
import { CommandService } from '../commands/CommandService';
import { monoThemeService, registerBuiltinThemes } from '../theme';
import { HandleVisibility } from '../view/HandleVisibility';
import { PaletteService } from '../palette/PaletteService';
import type { MonoAction, MonoCommandHandler, MonoRegisteredCommand } from '../commands/types';
import { FindController } from '../find/FindController';
import { SuggestController } from '../contrib/suggest/SuggestController';
import { HoverController } from '../contrib/hover/HoverController';
import { DecorationsCollection, MarkerService } from '../decorations';
import type { IMarkerData, IModelDeltaDecoration } from '../decorations';

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
  private cursorPosListeners = new Set<(e: ICursorPositionChangedEvent) => void>();
  private cursorSelListeners = new Set<(e: ICursorSelectionChangedEvent) => void>();
  private scrollListeners = new Set<(e: IScrollEvent) => void>();
  private focusListeners = new Set<() => void>();
  private blurListeners = new Set<() => void>();
  private markerListeners = new Set<(markers: import("../decorations").IMarker[]) => void>();
  private diagHover: HTMLDivElement | null = null;
  private diagHoverTimer: ReturnType<typeof setTimeout> | null = null;
  private tabSize = 2;
  private readOnly = false;
  private altVersionId = 1;
  private themeUnsub: { dispose(): void } | null = null;
  private handleVis: HandleVisibility | null = null;
  private ro?: ResizeObserver;
  private disposed = false;
  private unsubModel: () => void;
  private tokenization = new TokenizationSupport();
  private menu!: ContextMenuController;
  private keybindings = new KeybindingService();
  private commands!: CommandService;
  private palette!: PaletteService;
  private find!: FindController;
  private suggest!: SuggestController;
  private hover!: HoverController;
  private decorations = new DecorationsCollection();
  private markers = new MarkerService();
  /** Menu was open when scrolling started → bring it back when scroll+touch ended */
  private menuRestore = false;
  private onDocPointerDown: ((e: PointerEvent) => void) | null = null;
  private onRootKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(host: HTMLElement, options: MonoEditorOptions = {}) {
    registerDefaultLanguages();
    registerBuiltinThemes();
    this.host = host;
    this.fontFamily =
      options.fontFamily ?? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    this.fontSize = options.fontSize ?? 14;
    this.lineHeight = options.lineHeight ?? Math.round(this.fontSize * 1.45);
    this.lineNumbers = (options.lineNumbers ?? 'on') === 'on';
    this.overscan = options.overscan ?? 3;
    this.tabSize = options.tabSize ?? 2;
    this.readOnly = !!options.readOnly;
    registerBuiltinThemes();
    // Start from global mono theme, then allow constructor overrides
    this.theme = {
      ...DEFAULT_THEME,
      ...monoThemeService.toPartialEditorTheme(),
      ...options.theme,
    };
    this.themeUnsub = monoThemeService.onDidChangeColorTheme(() => {
      if (this.disposed) return;
      const partial = monoThemeService.toPartialEditorTheme();
      this.theme = { ...this.theme, ...partial };
      this.root.style.background = this.theme.background;
      this.view.paint();
    });
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

    this.diagHover = document.createElement('div');
    Object.assign(this.diagHover.style, {
      position: 'absolute', display: 'none', zIndex: '100',
      maxWidth: '360px', padding: '6px 8px', borderRadius: '4px',
      fontSize: '12px', lineHeight: '1.4', pointerEvents: 'none',
      background: '#252526', color: '#cccccc', border: '1px solid #454545',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)', whiteSpace: 'pre-wrap',
    });
    this.root.appendChild(this.diagHover);

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

    this.handleVis = new HandleVisibility((state, alpha) => {
      this.view.handlesVisible = state !== 'hidden';
      this.view.handleAlpha = alpha;
      this.view.schedulePaint();
    });

    this.input = new InputController(
      this.root,
      this.model,
      this.selection,
      () => {
        // Typing: hide menu + teardrops; fade back after 3s
        this.menuRestore = false;
        this.menu?.hide();
        this.suggest?.cancel();
        this.hover?.hide();
        this.handleVis?.onType();
        this.view.ensureCaretVisible();
        this.syncTextarea();
        this.view.paint();
        this.emitContent();
        this.emitCursorEvents('keyboard');
        this.scheduleDiagHover();
      },
      {
        tabSize: this.tabSize,
        readOnly: this.readOnly,
        pageSize: 40,
        bracketEnterIndent: options.bracketEnterIndent !== false,
      },
    );

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
    this.commands = new CommandService(this.keybindings);
    this.palette = new PaletteService(this.commands);
    this.commands.setContext('editorReadonly', !!options.readOnly);

    this.find = new FindController(
      this.root,
      this.model,
      this.selection,
      this.view,
      () => {
        this.view.ensureCaretVisible();
        this.syncTextarea();
        this.view.paint();
        this.emitContent();
      },
    );

    this.suggest = new SuggestController(
      this.root,
      this.model,
      this.selection,
      this.view,
      () => {
        this.view.ensureCaretVisible();
        this.syncTextarea();
        this.view.paint();
        this.emitContent();
      },
    );

    this.hover = new HoverController(
      this.root,
      this.model,
      this.selection,
      this.view,
    );
    this.view.setFindDecorationsProvider(() => ({
      matches: this.find.getMatches(),
      currentIndex: this.find.getCurrentIndex(),
    }));
    this.view.setDecorationRenderProvider(() => [
      ...this.markers.toRenderItems(),
      ...this.decorations.toRenderItems(),
    ]);

    this.registerDefaultKeybindings();
    this.keybindings.add({
      id: 'editor.action.triggerSuggest',
      primary: 'ctrl+space',
      handler: () => { void this.suggest.trigger(); },
    });
    this.commands.registerCommand('editor.action.triggerSuggest', () => {
      void this.suggest.trigger();
    }, { title: 'Trigger Suggest', category: 'Edit' });
    // App command palette (Ctrl+Shift+P)
    this.commands.registerCommand('workbench.action.showCommands', () => {
      window.dispatchEvent(new CustomEvent('mono:showCommands'));
    });
    this.keybindings.add({
      id: 'workbench.action.showCommands',
      primary: 'ctrl+shift+p',
      handler: () => {
        window.dispatchEvent(new CustomEvent('mono:showCommands'));
      },
    });
    this.registerDefaultActions();
    this.registerFindCommands();

    // Single capture listener: only when focus is in this editor
    this.onRootKeyDown = (e: KeyboardEvent) => {
      if (this.disposed) return;
      const active = document.activeElement;
      const inEditor =
        active === this.input.textarea ||
        (active != null && this.root.contains(active));
      if (!inEditor) return;
      if (this.suggest?.handleKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
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
          this.hideMenuForScroll();
          this.handleVis?.onScrollStart();
          this.emitScrollEvent(true, true);
          return;
        }
        if (kind === 'scrollEnd') {
          this.handleVis?.onScrollEnd();
          this.restoreMenuAfterScroll();
          return;
        }
        if (kind === 'tap') {
          this.menuRestore = false;
          this.menu?.hide();
          this.handleVis?.onUserInteract();
          this.syncTextarea();
          this.input.focus();
          this.view.paint();
          const p = this.selection.active;
          this.hover?.schedule(p.lineNumber, p.column, 600);
        } else if (kind === 'handle') {
          this.menuRestore = false;
          this.menu?.hide();
          this.handleVis?.onUserInteract();
          this.syncTextarea();
          this.view.paint();
        } else if (kind === 'handleTap') {
          this.handleVis?.onUserInteract();
          this.syncTextarea();
          this.input.focus();
          this.view.paint();
          this.commands?.setContext('editorHasSelection', !this.selection.isEmpty);
          requestAnimationFrame(() => this.showEditorMenu());
        } else if (kind === 'select') {
          this.handleVis?.onUserInteract();
          this.syncTextarea();
          this.view.paint();
          this.commands?.setContext('editorHasSelection', !this.selection.isEmpty);
          if (!this.selection.isEmpty) {
            requestAnimationFrame(() => this.showEditorMenu());
          } else {
            this.menuRestore = false;
            this.menu?.hide();
          }
        }
      },
    );
    this.unsubModel = this.model.onDidChange((versionId, change) => {
      // Incremental: only the touched lines get re-tokenized (lazily, on paint)
      this.tokenization.applyChange(change, versionId);
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
  focus(): void { this.syncTextarea(); this.input.focus(); this.emitFocus(); }
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


  deltaDecorations(
    oldDecorations: string[],
    newDecorations: IModelDeltaDecoration[],
  ): string[] {
    const ids = this.decorations.deltaDecorations(oldDecorations, newDecorations);
    this.view.paint();
    return ids;
  }

  setModelMarkers(owner: string, markers: IMarkerData[]): void {
    this.markers.setModelMarkers(owner, markers);
    const all = this.markers.getModelMarkers();
    console.log('[Mono] setModelMarkers', owner, 'count=', all.length, all);
    this.view.paint();
    for (const l of this.markerListeners) {
      try { l(all); } catch { /* */ }
    }
  }

  onDidChangeMarkers(listener: (markers: import("../decorations").IMarker[]) => void): { dispose(): void } {
    this.markerListeners.add(listener);
    return { dispose: () => this.markerListeners.delete(listener) };
  }

  private scheduleDiagHover(): void {
    if (this.diagHoverTimer) clearTimeout(this.diagHoverTimer);
    this.diagHoverTimer = setTimeout(() => this.updateDiagHover(), 400);
  }

  private updateDiagHover(): void {
    if (!this.diagHover || this.disposed) return;
    const pos = this.selection.active;
    const markers = this.markers.getModelMarkers();
    const hit = markers.find(m =>
      pos.lineNumber >= m.startLineNumber && pos.lineNumber <= m.endLineNumber &&
      (pos.lineNumber !== m.startLineNumber || pos.column >= m.startColumn) &&
      (pos.lineNumber !== m.endLineNumber || pos.column <= m.endColumn)
    );
    if (!hit) { this.diagHover.style.display = 'none'; return; }
    const sev = hit.severity >= 8 ? 'Error' : hit.severity >= 4 ? 'Warning' : hit.severity >= 2 ? 'Info' : 'Hint';
    this.diagHover.textContent = sev + ': ' + hit.message;
    this.diagHover.style.display = 'block';
    const screen = this.view.caretScreenPos();
    this.diagHover.style.left = Math.max(4, screen.x) + 'px';
    this.diagHover.style.top = Math.max(4, screen.y - 28) + 'px';
  }

  getModelMarkers(filter?: { owner?: string; take?: number }) {
    return this.markers.getModelMarkers(filter);
  }

  revealFind(): void {
    this.find.startFind();
  }

  revealReplace(): void {
    this.find.startFindReplace();
  }

  // ── Commands / palette engine (Monaco-level) ──────────────────────────
  addAction(action: MonoAction): { dispose(): void } {
    return this.commands.addAction(action);
  }

  registerCommand(
    id: string,
    handler: MonoCommandHandler,
    meta?: Omit<MonoRegisteredCommand, 'id' | 'handler'>,
  ): { dispose(): void } {
    return this.commands.registerCommand(id, handler, meta);
  }

  executeCommand(id: string, ...args: unknown[]): Promise<unknown> {
    // Mono registry returns undefined (no throw) when command is missing.
    // Detect that and let the app registry handle it.
    const known = this.commands.getCommands?.().some((c: any) => c.id === id);
    if (!known) {
      window.dispatchEvent(new CustomEvent('mono:executeCommand', { detail: { id, args } }));
      return Promise.resolve(undefined);
    }
    return this.commands.executeCommand(id, ...args);
  }

  getCommandsForPalette(filter?: string) {
    return this.commands.getCommandsForPalette(filter);
  }

  getPaletteService(): PaletteService {
    return this.palette;
  }

  setContext(key: string, value: boolean | string | number): void {
    this.commands.setContext(key, value);
  }



  setStickyScroll(opts: import('../view/StickyScroll').MonoStickyScrollOptions): void {
    this.view.setStickyScroll(opts);
  }


  // ═══════════════════════════════════════════════════════════
  // PART 1 — Monaco-parity bridge API
  // ═══════════════════════════════════════════════════════════

  getPosition(): IPosition {
    const p = this.selection.active;
    return { lineNumber: p.lineNumber, column: p.column };
  }

  setPosition(positionOrLine: IPosition | number, column?: number): void {
    let line: number;
    let col: number;
    if (typeof positionOrLine === 'number') {
      line = positionOrLine;
      col = column ?? 1;
    } else {
      line = positionOrLine.lineNumber;
      col = positionOrLine.column;
    }
    line = Math.max(1, Math.min(this.model.getLineCount(), line | 0));
    const maxCol = this.model.getLineContent(line).length + 1;
    col = Math.max(1, Math.min(maxCol, col | 0));
    this.selection.setCaret(line, col);
    this.view.ensureCaretVisible();
    this.syncTextarea();
    this.view.paint();
    this.emitCursorEvents('api');
    this.scheduleDiagHover();
  }

  getSelection(): ISelection {
    return this.toISelection();
  }

  setSelection(sel: ISelection): void {
    const clamp = (ln: number, col: number): IPosition => {
      const line = Math.max(1, Math.min(this.model.getLineCount(), ln | 0));
      const maxCol = this.model.getLineContent(line).length + 1;
      return { lineNumber: line, column: Math.max(1, Math.min(maxCol, col | 0)) };
    };
    // Prefer explicit selectionStart/position (Monaco Selection shape)
    const a = clamp(
      sel.selectionStartLineNumber ?? sel.startLineNumber,
      sel.selectionStartColumn ?? sel.startColumn,
    );
    const b = clamp(
      sel.positionLineNumber ?? sel.endLineNumber,
      sel.positionColumn ?? sel.endColumn,
    );
    this.selection.anchor = a;
    this.selection.active = b;
    this.view.ensureCaretVisible();
    this.syncTextarea();
    this.view.paint();
    this.emitCursorEvents('api');
    this.scheduleDiagHover();
  }

  getSelections(): ISelection[] {
    return [this.getSelection()];
  }

  revealLine(lineNumber: number, _scrollType?: number): void {
    this.revealPosition({ lineNumber, column: 1 }, _scrollType);
  }

  revealLineInCenter(lineNumber: number): void {
    const m = this.metrics();
    const line = Math.max(1, Math.min(this.model.getLineCount(), lineNumber));
    const docY = m.paddingTop + (line - 1) * m.lineHeight;
    this.view.scrollTop = Math.max(0, docY - this.view.cssHeight / 2 + m.lineHeight / 2);
    this.view.clampScrollPublic();
    this.emitScrollEvent(true, false);
    this.view.paint();
  }

  revealPosition(position: IPosition, _scrollType?: number): void {
    const m = this.metrics();
    const line = Math.max(1, Math.min(this.model.getLineCount(), position.lineNumber));
    const maxCol = this.model.getLineContent(line).length + 1;
    const col = Math.max(1, Math.min(maxCol, position.column));
    const docY = m.paddingTop + (line - 1) * m.lineHeight;
    // Vertical: ensure line visible
    if (docY < this.view.scrollTop + m.paddingTop) {
      this.view.scrollTop = Math.max(0, docY - m.paddingTop);
    } else if (docY + m.lineHeight > this.view.scrollTop + this.view.cssHeight) {
      this.view.scrollTop = docY + m.lineHeight - this.view.cssHeight;
    }
    // Horizontal: ensure column visible
    const contentLeft = this.lineNumbers ? m.gutterWidth : 0;
    const x = contentLeft + m.paddingLeft + (col - 1) * m.charWidth;
    const viewW = this.view.cssWidth;
    if (x - this.view.scrollLeft < contentLeft + m.paddingLeft) {
      this.view.scrollLeft = Math.max(0, x - contentLeft - m.paddingLeft - 40);
    } else if (x - this.view.scrollLeft > viewW - 40) {
      this.view.scrollLeft = Math.max(0, x - viewW + 80);
    }
    this.view.clampScrollPublic();
    this.emitScrollEvent(true, true);
    this.view.paint();
  }

  revealPositionInCenter(position: IPosition): void {
    this.revealLineInCenter(position.lineNumber);
    this.revealPosition(position);
  }

  revealRange(range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }): void {
    this.revealPosition({
      lineNumber: range.startLineNumber,
      column: range.startColumn,
    });
  }

  getScrollTop(): number {
    return this.view.scrollTop;
  }

  setScrollTop(scrollTop: number): void {
    const prev = this.view.scrollTop;
    this.view.scrollTop = Math.max(0, scrollTop);
    this.view.clampScrollPublic();
    if (this.view.scrollTop !== prev) {
      this.emitScrollEvent(true, false);
      this.view.schedulePaint();
    }
  }

  getScrollLeft(): number {
    return this.view.scrollLeft;
  }

  setScrollLeft(scrollLeft: number): void {
    const prev = this.view.scrollLeft;
    this.view.scrollLeft = Math.max(0, scrollLeft);
    this.view.clampScrollPublic();
    if (this.view.scrollLeft !== prev) {
      this.emitScrollEvent(false, true);
      this.view.schedulePaint();
    }
  }

  hasTextFocus(): boolean {
    return document.activeElement === this.input.textarea;
  }

  blur(): void {
    this.input.blur();
    this.emitBlur();
  }

  getAlternativeVersionId(): number {
    return this.altVersionId;
  }

  getModel(): IMonoTextModel {
    const model = this.model;
    return {
      getValue: () => model.getValue(),
      setValue: (v: string) => {
        model.setValue(v);
        this.view.paint();
        this.emitContent();
      },
      getLineCount: () => model.getLineCount(),
      getLineContent: (ln: number) => model.getLineContent(ln),
      getOffsetAt: (pos: IPosition) => model.getOffsetAt(pos.lineNumber, pos.column),
      getPositionAt: (offset: number) => model.getPositionAt(offset),
      getVersionId: () => model.getVersionId(),
      getAlternativeVersionId: () => this.altVersionId,
      getLanguageId: () => model.getLanguageId(),
    };
  }

  executeEdits(
    _source: string | null | undefined,
    edits: IIdentifiedSingleEditOperation[],
  ): boolean {
    if (this.readOnly || !edits.length) return false;
    // Apply bottom-up so earlier offsets stay valid
    const sorted = [...edits].sort((a, b) => {
      if (a.range.startLineNumber !== b.range.startLineNumber) {
        return b.range.startLineNumber - a.range.startLineNumber;
      }
      return b.range.startColumn - a.range.startColumn;
    });
    for (const edit of sorted) {
      const start = this.model.getOffsetAt(
        edit.range.startLineNumber,
        edit.range.startColumn,
      );
      const end = this.model.getOffsetAt(
        edit.range.endLineNumber,
        edit.range.endColumn,
      );
      const text = edit.text ?? '';
      // single undo entry per edit (delete+insert would be two)
      this.model.replaceRange(start, end, text);
      const pos = this.model.getPositionAt(start + text.length);
      this.selection.setCaret(pos.lineNumber, pos.column);
    }
    this.altVersionId++;
    this.view.ensureCaretVisible();
    this.syncTextarea();
    this.view.paint();
    this.emitContent();
    this.emitCursorEvents(_source || 'executeEdits');
    return true;
  }

  updateOptions(options: Partial<MonoEditorOptions>): void {
    if (options.fontFamily != null) this.fontFamily = options.fontFamily;
    if (options.fontSize != null) {
      this.fontSize = options.fontSize;
      if (options.lineHeight == null) {
        this.lineHeight = Math.round(this.fontSize * 1.45);
      }
    }
    if (options.lineHeight != null) this.lineHeight = options.lineHeight;
    if (options.tabSize != null) {
      this.tabSize = options.tabSize;
      this.input?.setTabSize?.(options.tabSize);
    }
    if (options.lineNumbers != null) this.lineNumbers = options.lineNumbers === 'on';
    if (options.readOnly != null) {
      this.readOnly = options.readOnly;
      this.input?.setReadOnly?.(options.readOnly);
      this.commands?.setContext('editorReadonly', options.readOnly);
    }
    if (options.theme) {
      this.theme = { ...this.theme, ...options.theme };
      this.root.style.background = this.theme.background;
    }
    if (options.stickyScroll) this.view.setStickyScroll(options.stickyScroll);
    if (options.bracketEnterIndent != null) {
      this.input?.setBracketEnterIndent?.(options.bracketEnterIndent);
    }
    if (options.language) this.setLanguageId(options.language);
    if (options.value != null) this.setValue(options.value);
    this.view.paint();
    this.syncTextarea();
  }

  setTheme(theme: Partial<MonoEditorTheme> | string): void {
    if (typeof theme === 'string') {
      registerBuiltinThemes();
      // Named id → registry (mscode-dark, solarized-light, …)
      if (monoThemeService.getTheme(theme)) {
        monoThemeService.setTheme(theme);
        // listener updates this.theme; force sync in case we are only instance
        this.theme = {
          ...this.theme,
          ...monoThemeService.toPartialEditorTheme(theme),
        };
      } else if (theme === 'vs' || theme === 'light') {
        monoThemeService.setTheme('mscode-light');
        this.theme = { ...this.theme, ...monoThemeService.toPartialEditorTheme() };
      } else if (theme === 'vs-dark' || theme === 'dark') {
        monoThemeService.setTheme('mscode-dark');
        this.theme = { ...this.theme, ...monoThemeService.toPartialEditorTheme() };
      } else {
        console.warn(`[MonoEditor] Unknown theme id "${theme}"`);
      }
    } else {
      this.theme = { ...this.theme, ...theme };
    }
    this.root.style.background = this.theme.background;
    this.view.paint();
  }

  getAction(id: string): IMonoEditorAction | null {
    // Only return an action for commands Mono actually owns.
    // Unknown IDs must return null so the app registry can handle them.
    const known = this.commands.getCommands?.().some((c: any) => c.id === id);
    if (!known) return null;
    const self = this;
    return {
      id,
      label: id,
      run: async () => {
        await self.commands.executeCommand(id);
      },
      isSupported: () => true,
    };
  }

  onDidChangeCursorPosition(
    listener: (e: ICursorPositionChangedEvent) => void,
  ): MonoDisposable {
    this.cursorPosListeners.add(listener);
    return { dispose: () => this.cursorPosListeners.delete(listener) };
  }

  onDidChangeCursorSelection(
    listener: (e: ICursorSelectionChangedEvent) => void,
  ): MonoDisposable {
    this.cursorSelListeners.add(listener);
    return { dispose: () => this.cursorSelListeners.delete(listener) };
  }

  onDidScrollChange(listener: (e: IScrollEvent) => void): MonoDisposable {
    this.scrollListeners.add(listener);
    return { dispose: () => this.scrollListeners.delete(listener) };
  }

  onDidFocusEditorText(listener: () => void): MonoDisposable {
    this.focusListeners.add(listener);
    return { dispose: () => this.focusListeners.delete(listener) };
  }

  onDidBlurEditorText(listener: () => void): MonoDisposable {
    this.blurListeners.add(listener);
    return { dispose: () => this.blurListeners.delete(listener) };
  }

  // ── Bridge helpers ───────────────────────────────────

  private toISelection(): ISelection {
    const a = this.selection.anchor;
    const b = this.selection.active;
    const forward =
      a.lineNumber < b.lineNumber ||
      (a.lineNumber === b.lineNumber && a.column <= b.column);
    const start = forward ? a : b;
    const end = forward ? b : a;
    return {
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
      selectionStartLineNumber: a.lineNumber,
      selectionStartColumn: a.column,
      positionLineNumber: b.lineNumber,
      positionColumn: b.column,
    };
  }

  private emitCursorEvents(source: string): void {
    const position = this.getPosition();
    const selection = this.getSelection();
    const posEv: ICursorPositionChangedEvent = {
      position,
      secondaryPositions: [],
      reason: 0,
      source,
    };
    const selEv: ICursorSelectionChangedEvent = {
      selection,
      secondarySelections: [],
      modelVersionId: this.model.getVersionId(),
      oldSelections: null,
      oldModelVersionId: this.model.getVersionId(),
      source,
      reason: 0,
    };
    for (const l of this.cursorPosListeners) {
      try {
        l(posEv);
      } catch {
        /* */
      }
    }
    for (const l of this.cursorSelListeners) {
      try {
        l(selEv);
      } catch {
        /* */
      }
    }
    this.commands?.setContext('editorHasSelection', !this.selection.isEmpty);
  }

  private emitScrollEvent(topChanged: boolean, leftChanged: boolean): void {
    if (!this.scrollListeners.size) return;
    const m = this.metrics();
    const ev: IScrollEvent = {
      scrollTop: this.view.scrollTop,
      scrollLeft: this.view.scrollLeft,
      scrollWidth: this.view.cssWidth + this.view.scrollLeft + 200,
      scrollHeight:
        this.model.getLineCount() * m.lineHeight + m.paddingTop + 100,
      scrollTopChanged: topChanged,
      scrollLeftChanged: leftChanged,
    };
    for (const l of this.scrollListeners) {
      try {
        l(ev);
      } catch {
        /* */
      }
    }
    if (this.suggest?.isOpen?.()) this.suggest.updatePosition();
  }

  private emitFocus(): void {
    for (const l of this.focusListeners) {
      try {
        l();
      } catch {
        /* */
      }
    }
  }

  private emitBlur(): void {
    for (const l of this.blurListeners) {
      try {
        l();
      } catch {
        /* */
      }
    }
  }


  layout(): void {
    if (this.disposed) return;
    const rect = this.root.getBoundingClientRect();
    this.view.setSize(rect.width, rect.height);
    const m = this.metrics();
    const pages = Math.max(1, Math.floor(rect.height / Math.max(1, m.lineHeight)) - 2);
    this.input?.setPageSize?.(pages);
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
    this.commands?.dispose();
    this.find?.dispose();
    if (this.onDocPointerDown) {
      document.removeEventListener('pointerdown', this.onDocPointerDown, true);
      this.onDocPointerDown = null;
    }
    if (this.onRootKeyDown) {
      window.removeEventListener('keydown', this.onRootKeyDown, true);
      this.onRootKeyDown = null;
    }
    this.input.dispose();
    this.themeUnsub?.dispose();
    this.handleVis?.dispose();
    this.handleVis = null;
    this.themeUnsub = null;
    this.contentListeners.clear();
    this.cursorPosListeners.clear();
    this.cursorSelListeners.clear();
    this.scrollListeners.clear();
    this.focusListeners.clear();
    this.blurListeners.clear();
    this.markerListeners.clear();
    if (this.diagHoverTimer) clearTimeout(this.diagHoverTimer);
    this.diagHover?.remove();
    this.diagHover = null;
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



  private registerFindCommands(): void {
    this.keybindings.addMany([
      {
        id: 'actions.find',
        primary: 'ctrl+f',
        weight: 5,
        handler: () => this.find.startFind(),
      },
      {
        id: 'editor.action.startFindReplaceAction',
        primary: 'ctrl+h',
        weight: 5,
        handler: () => this.find.startFindReplace(),
      },
      {
        id: 'editor.action.nextMatchFindAction',
        primary: 'f3',
        weight: 5,
        handler: () => this.find.findNext(),
      },
      {
        id: 'editor.action.previousMatchFindAction',
        primary: 'shift+f3',
        weight: 5,
        handler: () => this.find.findPrevious(),
      },
    ]);

    this.commands.registerCommand('actions.find', () => this.find.startFind(), {
      title: 'Find',
      category: 'Find',
    });
    this.commands.registerCommand(
      'editor.action.startFindReplaceAction',
      () => this.find.startFindReplace(),
      { title: 'Replace', category: 'Find' },
    );
    this.commands.registerCommand(
      'editor.action.nextMatchFindAction',
      () => this.find.findNext(),
      { title: 'Find Next', category: 'Find' },
    );
    this.commands.registerCommand(
      'editor.action.previousMatchFindAction',
      () => this.find.findPrevious(),
      { title: 'Find Previous', category: 'Find' },
    );
  }

  private registerDefaultActions(): void {
    const titles: Record<string, { title: string; category: string; precondition?: string }> = {
      undo: { title: 'Undo', category: 'Edit' },
      redo: { title: 'Redo', category: 'Edit' },
      'editor.action.clipboardCopyAction': {
        title: 'Copy',
        category: 'Edit',
        precondition: 'editorHasSelection',
      },
      'editor.action.clipboardCutAction': {
        title: 'Cut',
        category: 'Edit',
        precondition: 'editorHasSelection',
      },
      'editor.action.clipboardPasteAction': { title: 'Paste', category: 'Edit' },
      'editor.action.selectAll': { title: 'Select All', category: 'Edit' },
    };
    for (const [id, meta] of Object.entries(titles)) {
      this.commands.registerCommand(
        id,
        () => {
          const kb = this.keybindings.list().find((b) => b.id === id);
          kb?.handler(new KeyboardEvent('keydown'));
        },
        {
          title: meta.title,
          category: meta.category,
          precondition: meta.precondition,
        },
      );
    }
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
        this.model.replaceRange(start, end, text);
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

  showContextMenu(): void {
    this.showEditorMenu();
  }

  /** Scroll started: hide the menu but remember it was open. */
  private hideMenuForScroll(): void {
    if (this.menu?.isOpen()) this.menuRestore = true;
    this.menu?.hide();
  }

  /** Scroll fully stopped (finger up + fling done): show the menu again. */
  private restoreMenuAfterScroll(): void {
    if (!this.menuRestore || this.disposed) return;
    this.menuRestore = false;
    requestAnimationFrame(() => {
      if (!this.disposed) this.showEditorMenu();
    });
  }

  /**
   * Selection / caret floating menu.
   *
   * Placement order (first that fits the viewport and doesn't cover a teardrop):
   *   1. above the START of the selection
   *   2. below the START teardrop
   *   3. above the END of the selection
   *   4. below the END teardrop
   * If the anchors are scrolled out of view, the menu is clamped INSIDE the
   * viewport: selection above → pinned to the top, selection below → pinned to
   * the bottom, selection spanning the whole viewport → top.
   */
  private showEditorMenu(): void {
    if (!this.menu || this.disposed) return;
    this.menuRestore = false;
    const m = this.metrics();
    const contentLeft = this.lineNumbers ? m.gutterWidth : 0;
    const lh = m.lineHeight;
    const a = this.selection.anchor;
    const b = this.selection.active;
    const aBefore =
      a.lineNumber < b.lineNumber ||
      (a.lineNumber === b.lineNumber && a.column <= b.column);
    const s = aBefore ? a : b;
    const e = aBefore ? b : a;
    const toLocal = (p: { lineNumber: number; column: number }) => ({
      x:
        contentLeft +
        m.paddingLeft +
        Math.max(0, p.column - 1) * m.charWidth -
        this.view.scrollLeft,
      top: m.paddingTop + (p.lineNumber - 1) * lh - this.view.scrollTop,
    });
    const sp = toLocal(s);
    const ep = toLocal(e);
    const sameLine = s.lineNumber === e.lineNumber;
    const drop = TEARDROP.h;
    const gap = 8;
    const pad = 8;
    const handlesShown = this.view.handlesVisible && this.view.handleAlpha > 0.01;

    this.menu.showAt(sp.x, sp.top, {
      gap,
      placement: (size, host) => {
        const minTop = Math.max(pad, this.view.lastStickyHeight + 4);
        const maxTop = Math.max(
          minTop,
          host.height - size.height - (this.view.lastBottomSticky ? lh : 0) - pad,
        );
        const clampLeft = (cx: number) =>
          Math.max(pad, Math.min(cx - size.width / 2, host.width - size.width - pad));

        // Teardrop bodies hang BELOW their line (tip at line bottom)
        const handleRects: { x1: number; x2: number; y1: number; y2: number }[] = [];
        if (handlesShown) {
          const pts = this.selection.isEmpty ? [sp] : [sp, ep];
          for (const p of pts) {
            const tip = p.top + lh - 1;
            handleRects.push({ x1: p.x - 22, x2: p.x + 22, y1: tip, y2: tip + drop + 8 });
          }
        }
        const overlapsHandle = (left: number, top: number) =>
          handleRects.some(
            (r) =>
              left < r.x2 &&
              left + size.width > r.x1 &&
              top < r.y2 &&
              top + size.height > r.y1,
          );

        const midX = (sp.x + ep.x) / 2;
        const candidates: { top: number; cx: number }[] = [
          { top: sp.top - size.height - gap, cx: sameLine ? midX : sp.x },
          { top: sp.top + lh + drop + gap, cx: sameLine ? midX : sp.x },
          { top: ep.top - size.height - gap, cx: sameLine ? midX : ep.x },
          { top: ep.top + lh + drop + gap, cx: sameLine ? midX : ep.x },
        ];
        for (const c of candidates) {
          if (c.top < minTop || c.top > maxTop) continue;
          const left = clampLeft(c.cx);
          if (overlapsHandle(left, c.top)) continue;
          return { left, top: c.top };
        }

        // Anchors out of view → stick to the nearest viewport edge
        if (ep.top + lh < minTop) return { left: clampLeft(ep.x), top: minTop };
        if (sp.top > host.height) return { left: clampLeft(sp.x), top: maxTop };
        return { left: clampLeft((contentLeft + host.width) / 2), top: minTop };
      },
    });
  }

  private syncTextarea(): void {
    const p = this.view.caretScreenPos();
    this.input.moveTo(p.x, p.y, p.h);
  }

  private emitContent(): void {
    this.altVersionId++;
    if (!this.contentListeners.size) return;
    // `value` is computed on first read: a 20k-line join per keystroke is wasted
    // work when nobody reads it (listeners that only mark "dirty" etc.).
    const model = this.model;
    let cached: string | undefined;
    const e: MonoContentChangeEvent = {
      get value(): string {
        return cached ?? (cached = model.getValue());
      },
    };
    for (const l of this.contentListeners) l(e);
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.hideMenuForScroll();
    this.handleVis?.onScrollStart();
    const pt = this.view.scrollTop;
    const pl = this.view.scrollLeft;
    this.view.scrollBy(e.deltaX, e.deltaY);
    this.emitScrollEvent(
      this.view.scrollTop !== pt,
      this.view.scrollLeft !== pl,
    );
    // Debounced scroll end for wheel
    window.clearTimeout((this as any)._wheelEndT);
    (this as any)._wheelEndT = window.setTimeout(() => {
      this.handleVis?.onScrollEnd();
      this.restoreMenuAfterScroll();
    }, 150);
  };
}

export function createMonoEditor(host: HTMLElement, options?: MonoEditorOptions): IMonoEditor {
  return new MonoEditor(host, options);
}
