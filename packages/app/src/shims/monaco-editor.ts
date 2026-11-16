/**
 * Shim — Monaco removed. Mono Editor is the default engine.
 * Permissive no-op surface for residual LSP / extension imports.
 * Compatible with erasableSyntaxOnly (no parameter properties).
 */

const dispose = (): { dispose(): void } => ({ dispose() {} });
const reg = (..._args: any[]): { dispose(): void } => dispose();

export type MarkerSeverity = number;
export const MarkerSeverity: {
  Hint: number;
  Info: number;
  Warning: number;
  Error: number;
} = { Hint: 1, Info: 2, Warning: 4, Error: 8 };

export class Uri {
  scheme: string;
  path: string;
  fsPath: string;
  private _s: string;
  constructor(s: string) {
    this._s = s;
    this.scheme = s.includes(':') ? s.split(':')[0] : 'file';
    this.path = s.replace(/^file:\/\//, '') || s;
    this.fsPath = this.path;
  }
  toString(): string {
    return this._s;
  }
  static parse(s: string): Uri {
    return new Uri(s);
  }
  static file(s: string): Uri {
    return new Uri(s.startsWith('file://') ? s : `file://${s}`);
  }
}

export class Range {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  constructor(a: number, b: number, c: number, d: number) {
    this.startLineNumber = a;
    this.startColumn = b;
    this.endLineNumber = c;
    this.endColumn = d;
  }
  static isEmpty(r: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }): boolean {
    return r.startLineNumber === r.endLineNumber && r.startColumn === r.endColumn;
  }
}

export class Position {
  lineNumber: number;
  column: number;
  constructor(lineNumber: number, column: number) {
    this.lineNumber = lineNumber;
    this.column = column;
  }
}

export class Selection extends Range {
  selectionStartLineNumber: number;
  selectionStartColumn: number;
  positionLineNumber: number;
  positionColumn: number;
  constructor(a: number, b: number, c: number, d: number) {
    super(a, b, c, d);
    this.selectionStartLineNumber = a;
    this.selectionStartColumn = b;
    this.positionLineNumber = c;
    this.positionColumn = d;
  }
  getStartPosition(): Position {
    return new Position(this.selectionStartLineNumber, this.selectionStartColumn);
  }
  getEndPosition(): Position {
    return new Position(this.positionLineNumber, this.positionColumn);
  }
  isEmpty(): boolean {
    return Range.isEmpty(this);
  }
}

export const KeyCode: Record<string, number> = {};
export const KeyMod = { CtrlCmd: 2048, Shift: 1024, Alt: 512, WinCtrl: 256 };

export type CancellationToken = any;
export type IRange = any;
export type IMarkdownString = any;
export type IDisposable = { dispose(): void };
export type ITokenThemeRule = any;
export type Thenable<T> = PromiseLike<T>;

function makeEditorInstance(): any {
  return {
    getModel: () => null,
    getValue: () => '',
    setValue: () => {},
    getPosition: () => null,
    setPosition: () => {},
    getSelection: () => null,
    setSelection: () => {},
    focus: () => {},
    layout: () => {},
    dispose: () => {},
    onDidChangeModelContent: reg,
    onDidChangeCursorPosition: reg,
    onDidChangeCursorSelection: reg,
    onDidScrollChange: reg,
    onDidChangeModel: reg,
    onDidChangeModelLanguage: reg,
    onDidChangeConfiguration: reg,
    onDidFocusEditorText: reg,
    onDidBlurEditorText: reg,
    onDidAttemptReadOnlyEdit: reg,
    getDomNode: () => null,
    getScrolledVisiblePosition: () => null,
    getTargetAtClientPoint: () => null,
    getScrollTop: () => 0,
    setScrollTop: () => {},
    getScrollHeight: () => 0,
    getLayoutInfo: () => ({ width: 0, height: 0 }),
    updateOptions: () => {},
    addContentWidget: () => {},
    removeContentWidget: () => {},
    layoutContentWidget: () => {},
    getOption: () => undefined,
    trigger: () => {},
    executeEdits: () => true,
    deltaDecorations: () => [],
    addAction: () => ({ dispose() {} }),
    getModifiedEditor: () => makeEditorInstance(),
    getOriginalEditor: () => makeEditorInstance(),
    setModel: () => {},
    hasTextFocus: () => false,
  };
}

export const editor = {
  create: (..._args: any[]) => makeEditorInstance(),
  createDiffEditor: (..._args: any[]) => makeEditorInstance(),
  createModel: (..._args: any[]) => ({
    uri: Uri.parse('inmemory:0'),
    getValue: () => (typeof _args[0] === 'string' ? _args[0] : ''),
    setValue: () => {},
    getLanguageId: () => (typeof _args[1] === 'string' ? _args[1] : 'plaintext'),
    getLineCount: () => 1,
    getLineMaxColumn: () => 1,
    getLineContent: () => '',
    getEOL: () => '\n',
    getOptions: () => ({ tabSize: 4, insertSpaces: true }),
    getWordUntilPosition: () => ({ startColumn: 1, endColumn: 1, word: '' }),
    getWordAtPosition: () => null,
    deltaDecorations: (..._a: any[]) => [] as string[],
    dispose: () => {},
    onDidChangeContent: reg,
  }),
  setModelLanguage: (..._args: any[]) => {},
  setTheme: (..._args: any[]) => {},
  defineTheme: (..._args: any[]) => {},
  onDidChangeMarkers: (..._args: any[]) => dispose(),
  onDidCreateModel: (..._args: any[]) => dispose(),
  getModelMarkers: (..._args: any[]) => [] as any[],
  setModelMarkers: (..._args: any[]) => {},
  removeAllMarkers: (..._args: any[]) => {},
  getModels: () => [] as any[],
  getModel: (..._args: any[]) => null,
  getEditors: () => [] as any[],
  onWillDisposeModel: (..._args: any[]) => dispose(),
  EditorOption: { fontFamily: 0, fontSize: 1, fontWeight: 2 } as any,
  ContentWidgetPositionPreference: { EXACT: 0, ABOVE: 1, BELOW: 2 } as any,
  InjectedTextCursorStops: { None: 0, Left: 1, Right: 2, Both: 3 } as any,
  EndOfLineSequence: { LF: 0, CRLF: 1 } as any,
} as any;

export namespace editor {
  export type ITextModel = any;
  export type IStandaloneCodeEditor = any;
  export type ICodeEditor = any;
  export type IDiffEditor = any;
  export type IStandaloneDiffEditor = any;
  export type IMarker = any;
  export type IMarkerData = any;
  export type IModelDeltaDecoration = any;
  export type IContentWidget = any;
  export type IEditorOptions = any;
  export type EditorOption = number;
  export type IIdentifiedSingleEditOperation = any;
  export type ICursorPositionChangedEvent = any;
  export type ITokenThemeRule = any;
}

const CompletionItemKind = {
  Method: 0, Function: 1, Constructor: 2, Field: 3, Variable: 4, Class: 5,
  Struct: 6, Interface: 7, Module: 8, Property: 9, Event: 10, Unit: 11,
  Value: 12, Constant: 13, Enum: 14, EnumMember: 15, Keyword: 16, Text: 17,
  Color: 18, File: 19, Reference: 20, Customcolor: 21, Folder: 22, TypeParameter: 23,
  User: 24, Issue: 25, Snippet: 26,
} as any;

const SymbolKind = {
  File: 0, Module: 1, Namespace: 2, Package: 3, Class: 4, Method: 5, Property: 6,
  Field: 7, Constructor: 8, Enum: 9, Interface: 10, Function: 11, Variable: 12,
  Constant: 13, String: 14, Number: 15, Boolean: 16, Array: 17, Object: 18,
  Key: 19, Null: 20, EnumMember: 21, Struct: 22, Event: 23, Operator: 24, TypeParameter: 25,
} as any;

export const languages = {
  register: (..._args: any[]) => {},
  getLanguages: () => [] as { id: string }[],
  setMonarchTokensProvider: reg,
  setLanguageConfiguration: reg,
  registerCompletionItemProvider: reg,
  registerDocumentSymbolProvider: reg,
  registerHoverProvider: reg,
  registerDefinitionProvider: reg,
  registerReferenceProvider: reg,
  registerRenameProvider: reg,
  registerCodeActionProvider: reg,
  registerCodeLensProvider: reg,
  registerDocumentHighlightProvider: reg,
  registerLinkProvider: reg,
  registerDocumentFormattingEditProvider: reg,
  registerDocumentRangeFormattingEditProvider: reg,
  registerOnTypeFormattingEditProvider: reg,
  registerFoldingRangeProvider: reg,
  registerSelectionRangeProvider: reg,
  registerSignatureHelpProvider: reg,
  registerDocumentSemanticTokensProvider: reg,
  registerInlayHintsProvider: reg,
  registerColorProvider: reg,
  CompletionItemKind,
  CompletionItemInsertTextRule: { None: 0, KeepWhitespace: 1, InsertAsSnippet: 4 } as any,
  CompletionTriggerKind: { Invoke: 0, TriggerCharacter: 1, TriggerForIncompleteCompletions: 2 } as any,
  SymbolKind,
  DocumentHighlightKind: { Text: 0, Read: 1, Write: 2 } as any,
  FoldingRangeKind: {
    Comment: { value: 'comment' },
    Imports: { value: 'imports' },
    Region: { value: 'region' },
  } as any,
  SignatureHelpTriggerKind: { Invoke: 1, TriggerCharacter: 2, ContentChange: 3 } as any,
  CodeActionTriggerType: { Invoke: 1, Auto: 2 } as any,
  InlayHintKind: { Type: 1, Parameter: 2 } as any,
  typescript: undefined as any,
  json: undefined as any,
  css: undefined as any,
  html: undefined as any,
} as any;

export namespace languages {
  export type CompletionItem = any;
  export type CompletionList = any;
  export type CompletionItemProvider = any;
  export type CompletionItemKind = number;
  export type CompletionItemInsertTextRule = number;
  export type CompletionTriggerKind = number;
  export type Hover = any;
  export type HoverProvider = any;
  export type DefinitionProvider = any;
  export type ReferenceProvider = any;
  export type DocumentSymbol = any;
  export type DocumentSymbolProvider = any;
  export type SymbolKind = number;
  export type CodeAction = any;
  export type CodeActionProvider = any;
  export type CodeActionTriggerType = number;
  export type CodeLens = any;
  export type CodeLensProvider = any;
  export type DocumentFormattingEditProvider = any;
  export type DocumentRangeFormattingEditProvider = any;
  export type OnTypeFormattingEditProvider = any;
  export type FoldingRangeProvider = any;
  export type FoldingRange = any;
  export type FoldingRangeKind = any;
  export type SelectionRangeProvider = any;
  export type SelectionRange = any;
  export type SignatureHelpProvider = any;
  export type SignatureHelp = any;
  export type SignatureHelpTriggerKind = number;
  export type DocumentHighlightProvider = any;
  export type DocumentHighlight = any;
  export type DocumentHighlightKind = number;
  export type LinkProvider = any;
  export type ILink = any;
  export type RenameProvider = any;
  export type WorkspaceEdit = any;
  export type IWorkspaceTextEdit = any;
  export type InlayHintsProvider = any;
  export type InlayHint = any;
  export type InlayHintList = any;
  export type InlayHintKind = number;
  export type LanguageSelector = any;
  export type DocumentColorProvider = any;
  export type IColorInformation = any;
  export type IColorPresentation = any;
  export type ProviderResult<T = any> = T | undefined | null | Thenable<T | undefined | null>;
  export type TextEdit = any;
  export type FormattingOptions = any;
  export type Location = any;
  export type LocationLink = any;
  export type ILanguageExtensionPoint = any;
  export type LanguageConfiguration = any;
}

const monacoDefault = {
  editor,
  languages,
  Uri,
  KeyCode,
  KeyMod,
  MarkerSeverity,
  Range,
  Position,
  Selection,
} as any;

export default monacoDefault;
