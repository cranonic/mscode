// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri } from '../utils/uriHelpers';
import { completionKind } from './helpers';
import { expandEmmet, emmetTokenBefore, isEmmetLike } from './htmlEmmet';

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

function isHtmlLang(id: string): boolean {
  return id === 'html' || id === 'handlebars' || id === 'razor';
}

/** After `<div` / `<p` — turn bare tag name insert into `<tag>$0</tag>` snippet */
function closeTagSnippet(tagName: string): string {
  const t = tagName.replace(/^<\/?/, '').replace(/>$/, '').trim();
  if (!t || /\s/.test(t)) return tagName;
  const base = t.split(/[\s./]/)[0];
  if (VOID_TAGS.has(base.toLowerCase())) {
    return `${base}>`;
  }
  return `${base}>$0</${base}>`;
}

export function registerCompletion(state: LspState): void {
  const langId = state.languageId;
  const html = isHtmlLang(langId);

  state.disposables.push(
    monaco.languages.registerCompletionItemProvider(langId, {
      // HTML: re-trigger on Emmet operators + digits (p>li*6 while typing)
      triggerCharacters: html
        ? ['.', ':', '/', '#', '@', '<', '>', '!', '*', '+', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        : ['.', ':', '/', '#', '@', '<', '>'],

      provideCompletionItems: async (model, position, context) => {
        if (!state.initialized) return { suggestions: [] };

        try {
          const line = model.getLineContent(position.lineNumber);
          const textBefore = line.substring(0, position.column - 1);

          // ── HTML Emmet / bare-tag completions (VS Code-like, not snippets) ──
          const emmetSuggestions: monaco.languages.CompletionItem[] = [];
          if (html) {
            const tok = emmetTokenBefore(line, position.column);
            if (tok && isEmmetLike(tok.token)) {
              const expanded = expandEmmet(tok.token);
              if (expanded) {
                const range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: tok.startColumn,
                  endColumn: position.column,
                };
                // filterText = full token so Monaco doesn't drop item when word is only "6"
                const lastSeg = tok.token.split(/[>+*]/).pop() || tok.token;
                emmetSuggestions.push({
                  label: {
                    label: tok.token,
                    description: 'Emmet',
                  },
                  kind: monaco.languages.CompletionItemKind.Property,
                  detail: 'Emmet Abbreviation',
                  documentation: { value: '```html\n' + expanded.replace(/\$\d+/g, '') + '\n```' },
                  insertText: expanded,
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  range,
                  sortText: '0_' + tok.token,
                  filterText: tok.token + ' ' + lastSeg,
                });
              }
            }
          }

          // JIT sync
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          let triggerKind = 1;
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
          const inOpenTag = /<[\w:-]*$/.test(textBefore);

          const lspSuggestions: monaco.languages.CompletionItem[] = items.map((item: any) => {
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

            let insertText = item.textEdit?.newText ?? item.insertText ?? item.label;
            let insertTextRules = item.insertTextFormat === 2
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined;

            // HTML: completing a tag name after `<` → also close the tag
            if (html && inOpenTag && typeof insertText === 'string') {
              const label = String(item.label || '').trim();
              const looksLikeTag =
                item.kind === 7 /* Property */ ||
                item.kind === 14 /* Keyword */ ||
                item.kind === 17 /* Class */ ||
                /^[a-zA-Z][\w:-]*$/.test(label);

              if (looksLikeTag && !insertText.includes('<') && !insertText.includes('</')) {
                const closed = closeTagSnippet(insertText.trim() || label);
                if (closed !== insertText) {
                  insertText = closed;
                  insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                }
              }
            }

            return {
              label:         String(item.label).trim(),
              kind:          completionKind(item.kind),
              detail:        item.detail ?? '',
              documentation: typeof item.documentation === 'string'
                ? item.documentation
                : item.documentation?.value ?? '',
              insertText,
              range,
              insertTextRules,
              sortText: '1_' + String(item.label).trim(),
            };
          });

          // Bare-tag path: if LSP returned nothing but we have emmet, still show it.
          // Also: when user typed bare `p`, re-query is not possible; emmet covers it.
          const suggestions = [...emmetSuggestions, ...lspSuggestions];
          if (!suggestions.length) return { suggestions: [], incomplete: false };

          return {
            incomplete: result?.isIncomplete === true,
            suggestions,
          };
        } catch {
          return { suggestions: [] };
        }
      },
    })
  );
}
