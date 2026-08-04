// src/core/services/lsp/LspProviders.ts
//
// Responsibility: Register Monaco language providers and track model changes.
// Each provider independently sends LSP requests over the transport layer.
//
// Sections:
//   §1  Public API          – registerProviders / teardownProviders
//   §2  Completion          – textDocument/completion
//   §3  Hover               – textDocument/hover
//   §4  Signature Help      – textDocument/signatureHelp
//   §5  Go-to Definition    – textDocument/definition
//   §6  Model Change Tracking – debounced textDocument/didChange
//   §7  Helpers             – completion kind mapping

import * as monaco from 'monaco-editor';
import type { LspState, LspOptions } from './types';
import { sendRequest, sendNotify }   from './LspTransport';
import { getDocUri, fromLspUri }     from './utils/uriHelpers';
import { debounce }                  from './utils/debounce';
import { notifyDocumentOpen }        from './LspDocumentManager';


// §1  Public API

/**
 * Registers all Monaco language providers for the language configured in
 * `state` and starts tracking model changes.
 *
 * Which providers are registered is controlled by `options`:
 *   - `options.completion     !== false` → Completion (default: on)
 *   - `options.hover          !== false` → Hover       (default: on)
 *   - `options.signatureHelp  !== false` → Signature   (default: on)
 *   - Go-to Definition is always registered (no opt-out flag).
 *
 * Every `IDisposable` returned by Monaco is stored in `state.disposables` so
 * that `teardownProviders` can clean everything up in one pass.
 */
export function registerProviders(state: LspState, options: LspOptions): void {
  if (options.completion    !== false) registerCompletion(state);
  if (options.hover         !== false) registerHover(state);
  if (options.signatureHelp !== false) registerSignatureHelp(state);
  registerDefinition(state);
  registerDocumentFormatting(state);
  registerRename(state);

  if (options.references        !== false) registerReferences(state);
  if (options.documentHighlight !== false) registerDocumentHighlight(state);
  if (options.documentSymbol    !== false) registerDocumentSymbol(state);
  if (options.codeActions       !== false) registerCodeAction(state);
  if (options.foldingRange      !== false) registerFoldingRange(state);
  if (options.codeLens          !== false) registerCodeLens(state);
  if (options.documentLink      !== false) registerDocumentLink(state);
  if (options.selectionRange    !== false) registerSelectionRange(state);
  if (options.colorProvider     !== false) registerColorProvider(state);
  if (options.onTypeFormatting  !== false) registerOnTypeFormatting(state);
  // Optional / version-gated features
  if (options.semanticTokens    !== false) registerSemanticTokens(state);
  if (options.inlayHints        !== false) registerInlayHints(state);

  bindModelTracking(state);
}

/**
 * Disposes every provider and model-change listener registered by
 * `registerProviders`, then clears all LSP diagnostic markers from every
 * open model.
 *
 * Safe to call multiple times – subsequent calls are no-ops because
 * `state.disposables` is reset to an empty array on first call.
 */
export function teardownProviders(state: LspState): void {
  state.disposables.forEach(d => d.dispose());
  state.disposables = [];

  for (const model of monaco.editor.getModels()) {
    monaco.editor.setModelMarkers(model, 'lsp', []);
  }
}


// §2  Completion  –  textDocument/completion

/**
 * Registers an LSP-backed completion-item provider.
 *
 * Trigger characters
 * ──────────────────
 * Only structural characters (`.`, `:`, `/`, `#`, `@`, `<`, `>`) are used as
 * trigger characters.  Characters like `(`, `"`, `'`, `,`, and ` ` were
 * intentionally excluded because they caused spurious suggestion popups inside
 * function calls and string literals (e.g. typing `print("|")` no longer
 * fires an unwanted completion request).
 *
 * JIT sync
 * ────────
 * Immediately before sending `textDocument/completion`, the latest document
 * content is pushed to the server via a `textDocument/didChange` notification.
 * This prevents stale-content mismatches when the debounced model tracker
 * hasn't fired yet (e.g. the user typed a trigger character very quickly).
 *
 * Snippet detection
 * ─────────────────
 * If the server returns `insertTextFormat === 2` on a completion item, Monaco
 * is told to treat the insert text as a snippet
 * (`InsertAsSnippet`).  Items without that flag are inserted as plain text.
 */
function registerCompletion(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerCompletionItemProvider(state.languageId, {
      triggerCharacters: ['.', ':', '/', '#', '@', '<', '>'],

      provideCompletionItems: async (model, position, context) => {
        if (!state.initialized) return { suggestions: [] };

        try {
          // JIT sync: push current content before asking for completions
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          // Map Monaco trigger kind → LSP trigger kind
          let triggerKind = 1; // Invoked
          if (context.triggerKind === monaco.languages.CompletionTriggerKind.TriggerCharacter)
            triggerKind = 2;
          else if (context.triggerKind === monaco.languages.CompletionTriggerKind.TriggerForIncompleteCompletions)
            triggerKind = 3;

          const result: any = await sendRequest(state, 'textDocument/completion', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
            context:      { triggerKind, triggerCharacter: context.triggerCharacter },
          });

          const items = Array.isArray(result) ? result : result?.items ?? [];
          if (!items.length) return { suggestions: [], incomplete: false };

          return {
            incomplete:  result?.isIncomplete === true,
            suggestions: items.map((item: any) => {
              // Prefer the range from textEdit; fall back to the current word boundary
              let range: monaco.IRange | undefined;
              const te = item.textEdit;
              if (te) {
                const r = te.range ?? te.replace;
                if (r) {
                  range = {
                    startLineNumber: r.start.line + 1, startColumn: r.start.character + 1,
                    endLineNumber:   r.end.line   + 1, endColumn:   r.end.character   + 1,
                  };
                }
              }
              if (!range) {
                const w = model.getWordUntilPosition(position);
                range = {
                  startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                  startColumn:     w.startColumn,       endColumn:     w.endColumn,
                };
              }

              return {
                label:         item.label.trim(),
                kind:          completionKind(item.kind),
                detail:        item.detail ?? '',
                documentation: typeof item.documentation === 'string'
                  ? item.documentation
                  : item.documentation?.value ?? '',
                insertText:    item.textEdit?.newText ?? item.insertText ?? item.label,
                range,
                // Only set InsertAsSnippet when the server explicitly requests it
                insertTextRules: item.insertTextFormat === 2
                  ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                  : undefined,
              };
            }),
          };
        } catch {
          return { suggestions: [] };
        }
      },
    })
  );
}


// §3  Hover  –  textDocument/hover

/**
 * Registers an LSP-backed hover provider.
 *
 * The server response's `contents` field may be a single item or an array;
 * both forms are normalised to an array of `{ value: string }` objects that
 * Monaco's hover widget can render as Markdown.
 *
 * Returns `null` (no hover) when:
 *   - The LSP connection is not yet initialised.
 *   - The server returns an empty / missing `contents` field.
 *   - The request throws (e.g. timeout or transport error).
 */
function registerHover(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerHoverProvider(state.languageId, {
      provideHover: async (model, position) => {
        if (!state.initialized) return null;

        try {
          const result: any = await sendRequest(state, 'textDocument/hover', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
          });

          if (!result?.contents) return null;

          const contents = Array.isArray(result.contents)
            ? result.contents
            : [result.contents];

          return {
            contents: contents.map((c: any) => ({
              value: typeof c === 'string' ? c : c.value ?? '',
            })),
          };
        } catch {
          return null;
        }
      },
    })
  );
}


// §4  Signature Help  –  textDocument/signatureHelp

/**
 * Registers an LSP-backed signature-help provider.
 *
 * Trigger / retrigger characters
 * ───────────────────────────────
 * `(` and `,` open the signature widget; `,` and ` ` retrigger it when
 * navigating between parameters.
 *
 * JIT sync
 * ────────
 * Same as the completion provider: the latest document text is force-pushed to
 * the server immediately before the request so the server always sees the most
 * recent content, regardless of debounce state.
 *
 * Context forwarding
 * ──────────────────
 * When Monaco supplies an `activeSignatureHelp` context (e.g. the widget is
 * already open), the full signature state is forwarded to the server so it can
 * maintain the active-signature index correctly across retriggers.
 *
 * Returns `null` when the server returns no signatures or the request fails.
 */
function registerSignatureHelp(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerSignatureHelpProvider(state.languageId, {
      signatureHelpTriggerCharacters:   ['(', ','],
      signatureHelpRetriggerCharacters: [',', ' '],

      provideSignatureHelp: async (model, position, _token, context) => {
        if (!state.initialized) return null;

        try {
          // JIT sync: push current content before requesting signature help
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          // Build the LSP context object from Monaco's context
          let lspContext: any;
          if (context) {
            lspContext = {
              triggerKind:
                context.triggerKind === monaco.languages.SignatureHelpTriggerKind.TriggerCharacter ? 2
                : context.triggerKind === monaco.languages.SignatureHelpTriggerKind.ContentChange  ? 3
                : 1,
              isRetrigger:      context.isRetrigger,
              triggerCharacter: context.triggerCharacter,
            };

            // Forward the currently displayed signature so the server can
            // preserve the active-signature index across retriggers
            if (context.activeSignatureHelp) {
              lspContext.activeSignatureHelp = {
                signatures: context.activeSignatureHelp.signatures.map(s => ({
                  label:           s.label,
                  documentation:   s.documentation,
                  parameters:      s.parameters.map(p => ({
                    label:         p.label,
                    documentation: p.documentation,
                  })),
                  activeParameter: s.activeParameter,
                })),
                activeSignature: context.activeSignatureHelp.activeSignature,
                activeParameter: context.activeSignatureHelp.activeParameter,
              };
            }
          }

          const result: any = await sendRequest(state, 'textDocument/signatureHelp', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
            context:      lspContext,
          });

          if (!result?.signatures?.length) return null;

          const activeSignature = result.activeSignature ?? 0;
          const activeParameter =
            result.activeParameter ?? result.signatures[activeSignature]?.activeParameter ?? 0;

          return {
            value: {
              signatures: result.signatures.map((s: any) => ({
                label:         s.label,
                documentation: typeof s.documentation === 'string'
                  ? s.documentation
                  : s.documentation?.value ?? '',
                parameters: (s.parameters ?? []).map((p: any) => ({
                  label:         p.label,
                  documentation: typeof p.documentation === 'string'
                    ? p.documentation
                    : p.documentation?.value ?? '',
                })),
                activeParameter: s.activeParameter,
              })),
              activeSignature,
              activeParameter,
            },
            dispose: () => {},
          };
        } catch {
          return null;
        }
      },
    })
  );
}


// §5  Go-to Definition  –  textDocument/definition

/**
 * Registers an LSP-backed go-to-definition provider.
 *
 * The server may return a single `Location` or an array of `Location` objects;
 * both are normalised to an array.  Each LSP URI is converted to a Monaco URI
 * via `fromLspUri` so cross-file navigation works correctly even when the
 * server uses `file://` URIs with different casing or encoding.
 *
 * Line/column numbers are converted from 0-based (LSP) to 1-based (Monaco).
 *
 * Returns `null` when the server returns no result or the request fails.
 */
function registerDefinition(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDefinitionProvider(state.languageId, {
      provideDefinition: async (model, position) => {
        if (!state.initialized) return null;

        try {
          const result: any = await sendRequest(state, 'textDocument/definition', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
          });

          if (!result) return null;

          const locations = Array.isArray(result) ? result : [result];
          return locations.map((loc: any) => ({
            uri:   monaco.Uri.parse(fromLspUri(loc.uri)),
            range: {
              startLineNumber: (loc.range?.start?.line      ?? 0) + 1,
              startColumn:     (loc.range?.start?.character ?? 0) + 1,
              endLineNumber:   (loc.range?.end?.line        ?? 0) + 1,
              endColumn:       (loc.range?.end?.character   ?? 0) + 1,
            },
          }));
        } catch {
          return null;
        }
      },
    })
  );
}


// §6  Model Change Tracking  –  debounced textDocument/didChange

/**
 * Subscribes to content-change events for every Monaco model whose language
 * matches `state.languageId`.
 *
 * Debounce strategy
 * ─────────────────
 * A separate 400 ms debounce instance is created per model so that typing in
 * one file does not delay change notifications for another file that happens
 * to be open at the same time.
 *
 * New models
 * ──────────
 * `monaco.editor.onDidCreateModel` is used to bind the same change listener
 * to models created after this function runs (e.g. when the user opens a new
 * file).  If the LSP connection is already initialised at that point, a
 * `textDocument/didOpen` notification is also sent immediately so the server
 * registers the document.
 *
 * Note: the JIT sync inside the completion and signature-help providers
 * ensures the server always has the latest content even when the debounce
 * timer has not fired yet.
 */
function bindModelTracking(state: LspState): void {
  const bindModel = (model: monaco.editor.ITextModel): void => {
    if (model.getLanguageId() !== state.languageId) return;

    // Each model gets its own debounce instance to avoid cross-file delays
    const sendDidChange = debounce(() => {
      if (!state.initialized) return;
      sendNotify(state, 'textDocument/didChange', {
        textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
        contentChanges: [{ text: model.getValue() }],
      });
    }, 400);

    state.disposables.push(
      model.onDidChangeContent(() => {
        if (!state.initialized) return;
        sendDidChange();
      })
    );
  };

  // Bind existing models
  monaco.editor.getModels().forEach(bindModel);

  // Bind models created after this point (e.g. user opens a new file)
  state.disposables.push(
    monaco.editor.onDidCreateModel(model => {
      bindModel(model);
      if (state.initialized && model.getLanguageId() === state.languageId) {
        notifyDocumentOpen(state, model);
      }
    })
  );
}



// §7  Document Formatting  –  textDocument/formatting

/**
 * Registers an LSP-backed document formatting provider.
 * Monaco's built-in `editor.action.formatDocument` will call this.
 */
function registerDocumentFormatting(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDocumentFormattingEditProvider(state.languageId, {
      provideDocumentFormattingEdits: async (model, options) => {
        if (!state.initialized) return [];

        try {
          // Push latest content so the server formats what the user actually sees
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          const result: any = await sendRequest(state, 'textDocument/formatting', {
            textDocument: { uri: getDocUri(model, state) },
            options: {
              tabSize:      options.tabSize,
              insertSpaces: options.insertSpaces,
            },
          });

          if (!Array.isArray(result) || result.length === 0) return [];

          return result.map((edit: any) => ({
            range: {
              startLineNumber: (edit.range?.start?.line      ?? 0) + 1,
              startColumn:     (edit.range?.start?.character ?? 0) + 1,
              endLineNumber:   (edit.range?.end?.line        ?? 0) + 1,
              endColumn:       (edit.range?.end?.character   ?? 0) + 1,
            },
            text: edit.newText ?? '',
          }));
        } catch (e) {
          console.warn('[LSP] formatting failed:', e);
          return [];
        }
      },
    })
  );

  // Optional: format selection / range
  state.disposables.push(
    monaco.languages.registerDocumentRangeFormattingEditProvider(state.languageId, {
      provideDocumentRangeFormattingEdits: async (model, range, options) => {
        if (!state.initialized) return [];

        try {
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          const result: any = await sendRequest(state, 'textDocument/rangeFormatting', {
            textDocument: { uri: getDocUri(model, state) },
            range: {
              start: { line: range.startLineNumber - 1, character: range.startColumn - 1 },
              end:   { line: range.endLineNumber   - 1, character: range.endColumn   - 1 },
            },
            options: {
              tabSize:      options.tabSize,
              insertSpaces: options.insertSpaces,
            },
          });

          if (!Array.isArray(result) || result.length === 0) return [];

          return result.map((edit: any) => ({
            range: {
              startLineNumber: (edit.range?.start?.line      ?? 0) + 1,
              startColumn:     (edit.range?.start?.character ?? 0) + 1,
              endLineNumber:   (edit.range?.end?.line        ?? 0) + 1,
              endColumn:       (edit.range?.end?.character   ?? 0) + 1,
            },
            text: edit.newText ?? '',
          }));
        } catch {
          return [];
        }
      },
    })
  );
}


// §8  Rename Symbol  –  textDocument/rename (+ prepareRename)

/**
 * Registers an LSP-backed rename provider.
 * Monaco's built-in rename widget (`editor.action.rename` / F2 on symbol)
 * calls this — no custom modal required.
 */
function registerRename(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerRenameProvider(state.languageId, {
      // Optional: validate the symbol under the cursor before showing the input
      resolveRenameLocation: async (model, position) => {
        if (!state.initialized) return null;
        try {
          const result: any = await sendRequest(state, 'textDocument/prepareRename', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
          });

          if (!result) return null;

          // Server may return Range or { range, placeholder }
          const r = result.range ?? result;
          if (r?.start == null) return null;

          return {
            range: {
              startLineNumber: r.start.line + 1,
              startColumn:     r.start.character + 1,
              endLineNumber:   r.end.line + 1,
              endColumn:       r.end.character + 1,
            },
            text: result.placeholder
              ?? model.getValueInRange({
                   startLineNumber: r.start.line + 1,
                   startColumn:     r.start.character + 1,
                   endLineNumber:   r.end.line + 1,
                   endColumn:       r.end.character + 1,
                 }),
          };
        } catch {
          // prepareRename not supported — Monaco falls back to word-at-position
          return null;
        }
      },

      provideRenameEdits: async (model, position, newName) => {
        if (!state.initialized) {
          return { edits: [], rejectReason: 'LSP not ready' };
        }

        try {
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          const result: any = await sendRequest(state, 'textDocument/rename', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
            newName,
          });

          if (!result) {
            return { edits: [], rejectReason: 'No rename edits returned' };
          }

          // WorkspaceEdit → Monaco WorkspaceEdit
          const edits: monaco.languages.IWorkspaceTextEdit[] = [];

          // documentChanges form (preferred)
          if (Array.isArray(result.documentChanges)) {
            for (const change of result.documentChanges) {
              if (!change?.edits || !change?.textDocument?.uri) continue;
              const resource = monaco.Uri.parse(fromLspUri(change.textDocument.uri));
              for (const e of change.edits) {
                edits.push({
                  resource,
                  versionId: undefined,
                  textEdit: {
                    range: {
                      startLineNumber: (e.range?.start?.line      ?? 0) + 1,
                      startColumn:     (e.range?.start?.character ?? 0) + 1,
                      endLineNumber:   (e.range?.end?.line        ?? 0) + 1,
                      endColumn:       (e.range?.end?.character   ?? 0) + 1,
                    },
                    text: e.newText ?? '',
                  },
                });
              }
            }
          }
          // changes form: { [uri]: TextEdit[] }
          else if (result.changes && typeof result.changes === 'object') {
            for (const [uri, textEdits] of Object.entries(result.changes as Record<string, any[]>)) {
              const resource = monaco.Uri.parse(fromLspUri(uri));
              for (const e of textEdits) {
                edits.push({
                  resource,
                  versionId: undefined,
                  textEdit: {
                    range: {
                      startLineNumber: (e.range?.start?.line      ?? 0) + 1,
                      startColumn:     (e.range?.start?.character ?? 0) + 1,
                      endLineNumber:   (e.range?.end?.line        ?? 0) + 1,
                      endColumn:       (e.range?.end?.character   ?? 0) + 1,
                    },
                    text: e.newText ?? '',
                  },
                });
              }
            }
          }

          if (edits.length === 0) {
            return { edits: [], rejectReason: 'Nothing to rename' };
          }

          return { edits };
        } catch (e: any) {
          return { edits: [], rejectReason: e?.message ?? 'Rename failed' };
        }
      },
    })
  );
}



// ── Shared range helpers ─────────────────────────────────────────────────────

function toMonacoRange(r: any): monaco.IRange {
  return {
    startLineNumber: (r?.start?.line      ?? 0) + 1,
    startColumn:     (r?.start?.character ?? 0) + 1,
    endLineNumber:   (r?.end?.line        ?? 0) + 1,
    endColumn:       (r?.end?.character   ?? 0) + 1,
  };
}

function toLspPosition(pos: monaco.Position) {
  return { line: pos.lineNumber - 1, character: pos.column - 1 };
}

function toLspRange(range: monaco.IRange) {
  return {
    start: { line: range.startLineNumber - 1, character: range.startColumn - 1 },
    end:   { line: range.endLineNumber   - 1, character: range.endColumn   - 1 },
  };
}

function asLocationArray(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return [result];
}

// §9  References  –  textDocument/references

function registerReferences(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerReferenceProvider(state.languageId, {
      provideReferences: async (model, position, context) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/references', {
            textDocument: { uri: getDocUri(model, state) },
            position:     toLspPosition(position),
            context:      { includeDeclaration: context.includeDeclaration !== false },
          });
          return asLocationArray(result).map((loc: any) => ({
            uri:   monaco.Uri.parse(fromLspUri(loc.uri)),
            range: toMonacoRange(loc.range),
          }));
        } catch {
          return [];
        }
      },
    })
  );
}

// §10  Document Highlight  –  textDocument/documentHighlight

function registerDocumentHighlight(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDocumentHighlightProvider(state.languageId, {
      provideDocumentHighlights: async (model, position) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/documentHighlight', {
            textDocument: { uri: getDocUri(model, state) },
            position:     toLspPosition(position),
          });
          if (!Array.isArray(result)) return [];
          const K = monaco.languages.DocumentHighlightKind;
          const kindMap: Record<number, monaco.languages.DocumentHighlightKind> = {
            1: K.Text, 2: K.Read, 3: K.Write,
          };
          return result.map((h: any) => ({
            range: toMonacoRange(h.range),
            kind:  kindMap[h.kind ?? 1] ?? K.Text,
          }));
        } catch {
          return [];
        }
      },
    })
  );
}

// §11  Document Symbols  –  textDocument/documentSymbol

function mapSymbolKind(kind?: number): monaco.languages.SymbolKind {
  // LSP SymbolKind 1..26 maps closely to Monaco's enum
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

function mapDocumentSymbol(s: any): monaco.languages.DocumentSymbol {
  const range = toMonacoRange(s.range ?? s.location?.range);
  const selectionRange = s.selectionRange
    ? toMonacoRange(s.selectionRange)
    : range;
  return {
    name:            s.name || '?',
    detail:          s.detail || '',
    kind:            mapSymbolKind(s.kind),
    tags:            s.tags || [],
    range,
    selectionRange,
    children:        Array.isArray(s.children)
      ? s.children.map(mapDocumentSymbol)
      : undefined,
  };
}

function registerDocumentSymbol(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDocumentSymbolProvider(state.languageId, {
      provideDocumentSymbols: async (model) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/documentSymbol', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return [];
          // Hierarchical DocumentSymbol[] or flat SymbolInformation[]
          return result.map((s: any) => {
            if (s.location) {
              // SymbolInformation shape
              const range = toMonacoRange(s.location.range);
              return {
                name: s.name || '?',
                detail: '',
                kind: mapSymbolKind(s.kind),
                tags: [],
                range,
                selectionRange: range,
              } as monaco.languages.DocumentSymbol;
            }
            return mapDocumentSymbol(s);
          });
        } catch {
          return [];
        }
      },
    })
  );
}

// §12  Code Actions  –  textDocument/codeAction  (lightbulb / quick-fix)

function registerCodeAction(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerCodeActionProvider(state.languageId, {
      provideCodeActions: async (model, range, context) => {
        if (!state.initialized) return { actions: [], dispose: () => {} };
        try {
          const diagnostics = (context.markers || []).map((m: any) => ({
            range: toLspRange(m),
            message: m.message,
            severity: m.severity === monaco.MarkerSeverity.Error ? 1
              : m.severity === monaco.MarkerSeverity.Warning ? 2
              : m.severity === monaco.MarkerSeverity.Info ? 3 : 4,
            source: m.source,
            code: typeof m.code === 'object' ? m.code?.value : m.code,
          }));

          const result: any = await sendRequest(state, 'textDocument/codeAction', {
            textDocument: { uri: getDocUri(model, state) },
            range: toLspRange(range),
            context: {
              diagnostics,
              only: context.only ? [context.only] : undefined,
              triggerKind: context.trigger === monaco.languages.CodeActionTriggerType.Invoke ? 1 : 2,
            },
          });

          if (!Array.isArray(result)) return { actions: [], dispose: () => {} };

          const actions: monaco.languages.CodeAction[] = [];
          for (const item of result) {
            // Command-only (no edit)
            if (item.command && !item.edit && !item.title) {
              // rare shape
            }
            const action: monaco.languages.CodeAction = {
              title: item.title || item.command?.title || 'Code Action',
              kind: item.kind || 'quickfix',
              isPreferred: item.isPreferred,
              diagnostics: context.markers,
            };

            if (item.edit) {
              action.edit = workspaceEditToMonaco(item.edit);
            }
            if (item.command) {
              action.command = {
                id: item.command.command || item.command.id,
                title: item.command.title || action.title,
                arguments: item.command.arguments,
              };
            }
            actions.push(action);
          }
          return { actions, dispose: () => {} };
        } catch {
          return { actions: [], dispose: () => {} };
        }
      },
    })
  );
}

function workspaceEditToMonaco(edit: any): monaco.languages.WorkspaceEdit {
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

// §13  Folding Range  –  textDocument/foldingRange

function registerFoldingRange(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerFoldingRangeProvider(state.languageId, {
      provideFoldingRanges: async (model) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/foldingRange', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return [];
          const K = monaco.languages.FoldingRangeKind;
          return result.map((f: any) => ({
            start: f.startLine + 1,
            end:   f.endLine + 1,
            kind:  f.kind === 'comment' ? K.Comment
              : f.kind === 'imports' ? K.Imports
              : f.kind === 'region'  ? K.Region
              : undefined,
          }));
        } catch {
          return [];
        }
      },
    })
  );
}

// §14  CodeLens  –  textDocument/codeLens

function registerCodeLens(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerCodeLensProvider(state.languageId, {
      provideCodeLenses: async (model) => {
        if (!state.initialized) return { lenses: [], dispose: () => {} };
        try {
          const result: any = await sendRequest(state, 'textDocument/codeLens', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return { lenses: [], dispose: () => {} };
          const lenses = result
            .filter((l: any) => l?.range)
            .map((l: any) => ({
              range: toMonacoRange(l.range),
              id: l.data ? JSON.stringify(l.data) : undefined,
              command: l.command
                ? {
                    id: l.command.command,
                    title: l.command.title || '',
                    arguments: l.command.arguments,
                  }
                : undefined,
            }));
          return { lenses, dispose: () => {} };
        } catch {
          return { lenses: [], dispose: () => {} };
        }
      },
      resolveCodeLens: async (_model, codeLens) => {
        if (!state.initialized || !codeLens.id) return codeLens;
        try {
          const data = JSON.parse(codeLens.id);
          const result: any = await sendRequest(state, 'codeLens/resolve', {
            range: {
              start: {
                line: codeLens.range.startLineNumber - 1,
                character: codeLens.range.startColumn - 1,
              },
              end: {
                line: codeLens.range.endLineNumber - 1,
                character: codeLens.range.endColumn - 1,
              },
            },
            data,
          });
          if (result?.command) {
            codeLens.command = {
              id: result.command.command,
              title: result.command.title || '',
              arguments: result.command.arguments,
            };
          }
        } catch { /* keep unresolved */ }
        return codeLens;
      },
    })
  );
}

// §15  Document Link  –  textDocument/documentLink

function registerDocumentLink(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerLinkProvider(state.languageId, {
      provideLinks: async (model) => {
        if (!state.initialized) return { links: [] };
        try {
          const result: any = await sendRequest(state, 'textDocument/documentLink', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return { links: [] };
          const links = result
            .filter((l: any) => l?.range)
            .map((l: any) => ({
              range: toMonacoRange(l.range),
              url: l.target ? fromLspUri(l.target) : undefined,
              tooltip: l.tooltip,
            }));
          return { links };
        } catch {
          return { links: [] };
        }
      },
    })
  );
}

// §16  Selection Range  –  textDocument/selectionRange  (smart select)

function registerSelectionRange(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerSelectionRangeProvider(state.languageId, {
      provideSelectionRanges: async (model, positions) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/selectionRange', {
            textDocument: { uri: getDocUri(model, state) },
            positions: positions.map(toLspPosition),
          });
          if (!Array.isArray(result)) return [];
          // Each entry is a linked list: { range, parent? }
          const mapChain = (node: any): monaco.languages.SelectionRange[] => {
            const out: monaco.languages.SelectionRange[] = [];
            let cur = node;
            while (cur?.range) {
              out.push({ range: toMonacoRange(cur.range) });
              cur = cur.parent;
            }
            return out;
          };
          return result.map(mapChain);
        } catch {
          return [];
        }
      },
    })
  );
}

// §17  Color Provider  –  textDocument/documentColor
// Note: CSS/HTML already get Monaco built-in swatches. This is for LSP servers
// that publish colours (e.g. specialised CSS LS). Harmless no-op if empty.

function registerColorProvider(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerDocumentColorProvider(state.languageId, {
      provideDocumentColors: async (model) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/documentColor', {
            textDocument: { uri: getDocUri(model, state) },
          });
          if (!Array.isArray(result)) return [];
          return result.map((c: any) => ({
            color: {
              red:   c.color?.red   ?? 0,
              green: c.color?.green ?? 0,
              blue:  c.color?.blue  ?? 0,
              alpha: c.color?.alpha ?? 1,
            },
            range: toMonacoRange(c.range),
          }));
        } catch {
          return [];
        }
      },
      provideColorPresentations: async (model, colorInfo) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/colorPresentation', {
            textDocument: { uri: getDocUri(model, state) },
            color: colorInfo.color,
            range: toLspRange(colorInfo.range),
          });
          if (!Array.isArray(result)) return [];
          return result.map((p: any) => ({
            label: p.label,
            textEdit: p.textEdit
              ? { range: toMonacoRange(p.textEdit.range), text: p.textEdit.newText }
              : undefined,
            additionalTextEdits: Array.isArray(p.additionalTextEdits)
              ? p.additionalTextEdits.map((e: any) => ({
                  range: toMonacoRange(e.range),
                  text: e.newText ?? '',
                }))
              : undefined,
          }));
        } catch {
          return [];
        }
      },
    })
  );
}

// §18  On-Type Formatting  –  textDocument/onTypeFormatting

function registerOnTypeFormatting(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerOnTypeFormattingEditProvider(state.languageId, {
      autoFormatTriggerCharacters: ['}', ';', '\n'],
      provideOnTypeFormattingEdits: async (model, position, ch, options) => {
        if (!state.initialized) return [];
        try {
          const result: any = await sendRequest(state, 'textDocument/onTypeFormatting', {
            textDocument: { uri: getDocUri(model, state) },
            position: toLspPosition(position),
            ch,
            options: {
              tabSize: options.tabSize,
              insertSpaces: options.insertSpaces,
            },
          });
          if (!Array.isArray(result)) return [];
          return result.map((e: any) => ({
            range: toMonacoRange(e.range),
            text: e.newText ?? '',
          }));
        } catch {
          return [];
        }
      },
    })
  );
}

// §19  Semantic Tokens  –  textDocument/semanticTokens/full
// Requires editor.semanticHighlighting.enabled. Legend is fixed to common LSP defaults.

const SEMANTIC_LEGEND = {
  tokenTypes: [
    'namespace', 'type', 'class', 'enum', 'interface', 'struct', 'typeParameter',
    'parameter', 'variable', 'property', 'enumMember', 'event', 'function',
    'method', 'macro', 'keyword', 'modifier', 'comment', 'string', 'number',
    'regexp', 'operator', 'decorator',
  ],
  tokenModifiers: [
    'declaration', 'definition', 'readonly', 'static', 'deprecated',
    'abstract', 'async', 'modification', 'documentation', 'defaultLibrary',
  ],
};

function registerSemanticTokens(state: LspState): void {
  const provider: any = {
    getLegend: () => SEMANTIC_LEGEND,
    provideDocumentSemanticTokens: async (model: monaco.editor.ITextModel) => {
      if (!state.initialized) return null;
      try {
        const result: any = await sendRequest(state, 'textDocument/semanticTokens/full', {
          textDocument: { uri: getDocUri(model, state) },
        });
        if (!result?.data) return null;
        // Monaco expects a Uint32Array of the same delta-encoded LSP data
        return {
          data: Uint32Array.from(result.data),
          resultId: result.resultId,
        };
      } catch {
        return null;
      }
    },
    releaseDocumentSemanticTokens: () => {},
  };

  try {
    state.disposables.push(
      monaco.languages.registerDocumentSemanticTokensProvider(state.languageId, provider)
    );
  } catch (e) {
    console.warn('[LSP] semantic tokens not available in this monaco build:', e);
  }
}

// §20  Inlay Hints  –  textDocument/inlayHint

function registerInlayHints(state: LspState): void {
  // API exists in monaco-editor ≥ 0.34
  const reg = (monaco.languages as any).registerInlayHintsProvider;
  if (typeof reg !== 'function') {
    console.warn('[LSP] registerInlayHintsProvider missing — upgrade monaco-editor');
    return;
  }

  state.disposables.push(
    reg(state.languageId, {
      provideInlayHints: async (model: monaco.editor.ITextModel, range: monaco.IRange) => {
        if (!state.initialized) return { hints: [], dispose: () => {} };
        try {
          const result: any = await sendRequest(state, 'textDocument/inlayHint', {
            textDocument: { uri: getDocUri(model, state) },
            range: toLspRange(range),
          });
          if (!Array.isArray(result)) return { hints: [], dispose: () => {} };
          const hints = result.map((h: any) => ({
            label: typeof h.label === 'string'
              ? h.label
              : (h.label || []).map((p: any) => (typeof p === 'string' ? p : p.value)).join(''),
            position: {
              lineNumber: (h.position?.line ?? 0) + 1,
              column:     (h.position?.character ?? 0) + 1,
            },
            kind: h.kind, // 1=Type, 2=Parameter
            tooltip: typeof h.tooltip === 'string' ? h.tooltip : h.tooltip?.value,
            paddingLeft: h.paddingLeft,
            paddingRight: h.paddingRight,
          }));
          return { hints, dispose: () => {} };
        } catch {
          return { hints: [], dispose: () => {} };
        }
      },
    })
  );
}


// §7  Helpers  –  LSP completion kind → Monaco completion kind

/**
 * Maps an LSP `CompletionItemKind` number to the corresponding Monaco enum
 * value.
 *
 * LSP kinds not present in the map (e.g. deprecated or rarely-used entries)
 * fall back to `CompletionItemKind.Text`.
 *
 * Reference: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItemKind
 */
function completionKind(kind?: number): monaco.languages.CompletionItemKind {
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