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

export interface IMonoEditor {
  getValue(): string;
  setValue(value: string): void;
  getLanguageId(): string;
  setLanguageId(id: string): void;
  focus(): void;
  layout(): void;
  setContextMenuItems?(items: import('../menu/types').MonoMenuItem[]): void;
  addContextMenuItem?(item: import('../menu/types').MonoMenuItem): void;
  removeContextMenuItem?(id: string): void;
  setContextMenuStyle?(style: import('../menu/types').MonoMenuStyle): void;
  hideContextMenu?(): void;
  setStickyScroll?(opts: import('../view/StickyScroll').MonoStickyScrollOptions): void;
  getModelVersionId(): number;
  onDidChangeModelContent(listener: (e: MonoContentChangeEvent) => void): MonoDisposable;
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
