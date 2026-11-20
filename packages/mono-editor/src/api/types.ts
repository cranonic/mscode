/** Public options for createMonoEditor */
export type MonoLineNumbers = 'on' | 'off';

export interface MonoEditorTheme {
  background: string;
  foreground: string;
  gutterBackground: string;
  gutterForeground: string;
  caret: string;
  selection: string;
  lineHighlight: string;
  /** Syntax token colors (VS Code style). Missing keys fall back to DEFAULT_TOKEN_COLORS. */
  tokenColors?: import('../language/tokenTypes').MonoTokenTheme;
}

export interface MonoEditorOptions {
  value?: string;
  language?: string;
  readOnly?: boolean;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  tabSize?: number;
  lineNumbers?: MonoLineNumbers;
  theme?: Partial<MonoEditorTheme>;
  overscan?: number;
  /** VS Code / Monaco sticky scroll */
  stickyScroll?: import('../view/StickyScroll').MonoStickyScrollOptions;
}

export interface MonoContentChangeEvent {
  value: string;
}

export type MonoDisposable = { dispose: () => void };

/** Monaco-compatible position (1-based line & column). */
export interface IPosition {
  lineNumber: number;
  column: number;
}

/** Monaco-compatible selection (anchor = selection start, active = caret). */
export interface ISelection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  /** Selection direction: anchor → active */
  selectionStartLineNumber?: number;
  selectionStartColumn?: number;
  positionLineNumber?: number;
  positionColumn?: number;
}

export interface ICursorPositionChangedEvent {
  position: IPosition;
  secondaryPositions: IPosition[];
  reason: number;
  source: string;
}

export interface ICursorSelectionChangedEvent {
  selection: ISelection;
  secondarySelections: ISelection[];
  modelVersionId: number;
  oldSelections: ISelection[] | null;
  oldModelVersionId: number;
  source: string;
  reason: number;
}

export interface IScrollEvent {
  scrollTop: number;
  scrollLeft: number;
  scrollWidth: number;
  scrollHeight: number;
  scrollTopChanged: boolean;
  scrollLeftChanged: boolean;
}

export interface IIdentifiedSingleEditOperation {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string | null;
  forceMoveMarkers?: boolean;
}

/** Thin model surface app hooks expect (Monaco ITextModel subset). */
export interface IMonoTextModel {
  uri?: { toString(): string };
  getValue(): string;
  setValue(value: string): void;
  getLineCount(): number;
  getLineContent(lineNumber: number): string;
  getOffsetAt(position: IPosition): number;
  getPositionAt(offset: number): IPosition;
  getVersionId(): number;
  getAlternativeVersionId(): number;
  getLanguageId(): string;
  uriString?: string;
}

export interface IMonoEditorAction {
  id: string;
  label?: string;
  run: () => unknown | Promise<unknown>;
  isSupported?: () => boolean;
}

export interface IMonoEditor {
  // ── Content ──────────────────────────────────────────
  getValue(): string;
  setValue(value: string): void;
  getLanguageId(): string;
  setLanguageId(id: string): void;
  getModelVersionId(): number;
  getAlternativeVersionId(): number;
  getModel(): IMonoTextModel;
  executeEdits(
    source: string | null | undefined,
    edits: IIdentifiedSingleEditOperation[],
  ): boolean;

  // ── Cursor / selection ───────────────────────────────
  getPosition(): IPosition;
  /**
   * Monaco: setPosition({ lineNumber, column })
   * App palette: setPosition(line, column?)
   */
  setPosition(positionOrLine: IPosition | number, column?: number): void;
  getSelection(): ISelection;
  setSelection(selection: ISelection): void;
  getSelections(): ISelection[];

  // ── Reveal / scroll ──────────────────────────────────
  revealLine(lineNumber: number, scrollType?: number): void;
  revealLineInCenter(lineNumber: number): void;
  revealPosition(position: IPosition, scrollType?: number): void;
  revealPositionInCenter(position: IPosition): void;
  revealRange(range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }): void;
  getScrollTop(): number;
  setScrollTop(scrollTop: number): void;
  getScrollLeft(): number;
  setScrollLeft(scrollLeft: number): void;

  // ── Focus ────────────────────────────────────────────
  focus(): void;
  blur?(): void;
  hasTextFocus(): boolean;
  layout(): void;

  // ── Options / theme ──────────────────────────────────
  updateOptions(options: Partial<MonoEditorOptions>): void;
  setTheme(theme: Partial<MonoEditorTheme> | string): void;
  getOption?<T = unknown>(name: string): T | undefined;

  // ── Events ───────────────────────────────────────────
  onDidChangeModelContent(listener: (e: MonoContentChangeEvent) => void): MonoDisposable;
  onDidChangeCursorPosition(
    listener: (e: ICursorPositionChangedEvent) => void,
  ): MonoDisposable;
  onDidChangeCursorSelection(
    listener: (e: ICursorSelectionChangedEvent) => void,
  ): MonoDisposable;
  onDidScrollChange(listener: (e: IScrollEvent) => void): MonoDisposable;
  onDidFocusEditorText?(listener: () => void): MonoDisposable;
  onDidBlurEditorText?(listener: () => void): MonoDisposable;

  // ── Commands ─────────────────────────────────────────
  addAction?(action: import('../commands/types').MonoAction): MonoDisposable;
  getAction(id: string): IMonoEditorAction | null;
  executeCommand?(id: string, ...args: unknown[]): Promise<unknown>;

  // ── Menu / keybindings / sticky (Mono extensions) ────
  setContextMenuItems?(items: import('../menu/types').MonoMenuItem[]): void;
  addContextMenuItem?(item: import('../menu/types').MonoMenuItem): void;
  removeContextMenuItem?(id: string): void;
  setContextMenuStyle?(style: import('../menu/types').MonoMenuStyle): void;
  hideContextMenu?(): void;
  addKeybinding?(
    binding: import('../keybindings/KeybindingService').MonoKeybinding,
  ): () => void;
  removeKeybinding?(id: string): void;
  listKeybindings?(): import('../keybindings/KeybindingService').MonoKeybinding[];
  setStickyScroll?(opts: import('../view/StickyScroll').MonoStickyScrollOptions): void;
  revealFind?(): void;
  revealReplace?(): void;

  dispose(): void;
}

export const DEFAULT_THEME: MonoEditorTheme = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  gutterBackground: '#1e1e1e',
  gutterForeground: '#858585',
  caret: '#aeafad',
  selection: '#264f78',
  lineHighlight: '#2a2a2a',
};
