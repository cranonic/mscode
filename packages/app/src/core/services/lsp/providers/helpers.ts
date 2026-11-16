// src/core/services/lsp/providers/helpers.ts
import * as monaco from 'monaco-editor';
import { fromLspUri } from '../utils/uriHelpers';

export function toMonacoRange(r: any): monaco.IRange {
  return {
    startLineNumber: (r?.start?.line      ?? 0) + 1,
    startColumn:     (r?.start?.character ?? 0) + 1,
    endLineNumber:   (r?.end?.line        ?? 0) + 1,
    endColumn:       (r?.end?.character   ?? 0) + 1,
  };
}

export function toLspPosition(pos: monaco.Position) {
  return { line: pos.lineNumber - 1, character: pos.column - 1 };
}

export function toLspRange(range: monaco.IRange) {
  return {
    start: { line: range.startLineNumber - 1, character: range.startColumn - 1 },
    end:   { line: range.endLineNumber   - 1, character: range.endColumn   - 1 },
  };
}

export function asLocationArray(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return [result];
}

export function workspaceEditToMonaco(edit: any): monaco.languages.WorkspaceEdit {
  const edits: monaco.languages.IWorkspaceTextEdit[] = [];
  if (Array.isArray(edit?.documentChanges)) {
    for (const change of edit.documentChanges) {
      if (!change?.edits || !change?.textDocument?.uri) continue;
      const resource = monaco.Uri.parse(fromLspUri(change.textDocument.uri));
      for (const e of change.edits) {
        edits.push({
          resource,
          versionId: undefined,
          textEdit: { range: toMonacoRange(e.range), text: e.newText ?? '' },
        });
      }
    }
  } else if (edit?.changes && typeof edit.changes === 'object') {
    for (const [uri, textEdits] of Object.entries(edit.changes as Record<string, any[]>)) {
      const resource = monaco.Uri.parse(fromLspUri(uri));
      for (const e of textEdits) {
        edits.push({
          resource,
          versionId: undefined,
          textEdit: { range: toMonacoRange(e.range), text: e.newText ?? '' },
        });
      }
    }
  }
  return { edits };
}

/** Maps LSP CompletionItemKind → Monaco CompletionItemKind */
export function completionKind(kind?: number): monaco.languages.CompletionItemKind {
  const K = monaco.languages.CompletionItemKind;
  const map: Record<number, monaco.languages.CompletionItemKind> = {
    1:  K.Text,          2:  K.Method,       3:  K.Function,
    4:  K.Constructor,   5:  K.Field,        6:  K.Variable,
    7:  K.Class,         8:  K.Interface,    9:  K.Module,
    10: K.Property,      12: K.Value,        14: K.Keyword,
    17: K.File,          18: K.Reference,    22: K.Struct,
    23: K.Event,         25: K.TypeParameter,
  };
  return map[kind ?? 1] ?? K.Text;
}

export function mapSymbolKind(kind?: number): monaco.languages.SymbolKind {
  const K = monaco.languages.SymbolKind;
  const map: Record<number, monaco.languages.SymbolKind> = {
    1: K.File, 2: K.Module, 3: K.Namespace, 4: K.Package, 5: K.Class,
    6: K.Method, 7: K.Property, 8: K.Field, 9: K.Constructor, 10: K.Enum,
    11: K.Interface, 12: K.Function, 13: K.Variable, 14: K.Constant,
    15: K.String, 16: K.Number, 17: K.Boolean, 18: K.Array, 19: K.Object,
    20: K.Key, 21: K.Null, 22: K.EnumMember, 23: K.Struct, 24: K.Event,
    25: K.Operator, 26: K.TypeParameter,
  };
  return map[kind ?? 13] ?? K.Variable;
}

export function mapDocumentSymbol(s: any): monaco.languages.DocumentSymbol {
  const range = toMonacoRange(s.range ?? s.location?.range);
  const selectionRange = s.selectionRange ? toMonacoRange(s.selectionRange) : range;
  return {
    name: s.name || '?',
    detail: s.detail || '',
    kind: mapSymbolKind(s.kind),
    tags: s.tags || [],
    range,
    selectionRange,
    children: Array.isArray(s.children) ? s.children.map(mapDocumentSymbol) : undefined,
  };
}

/** Simple debounce used by model tracking */
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  }) as T;
}
