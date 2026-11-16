// src/core/extensionAPI/registry/snippetRegistry.ts
import * as monaco from 'monaco-editor';

function matchGlob(str: string, pattern: string): boolean {
  const cleanPath = str.startsWith('/') ? str.substring(1) : str;
  const re = new RegExp(
    '^' + pattern.replace(/\*\*/g, '\u00a7').replace(/\*/g, '[^/]*').replace(/\u00a7/g, '.*') + '$',
  );
  return re.test(cleanPath) || re.test(str);
}

class SnippetRegistry {
  private snippetsMap: Record<string, Record<string, Record<string, any>>> = {};
  private registeredLanguages = new Set<string>();

  registerSnippets(
    languageId: string,
    snippetsObj: Record<string, any>,
    source: string = 'default',
  ): { dispose: () => void } {
    const count = Object.keys(snippetsObj).length;
    if (count === 0) {
      return { dispose: () => {} };
    }

    if (!this.snippetsMap[languageId]) {
      this.snippetsMap[languageId] = {};
    }
    this.snippetsMap[languageId][source] = snippetsObj;

    if (this.registeredLanguages.has(languageId)) {
      return {
        dispose: () => {
          if (this.snippetsMap[languageId] && this.snippetsMap[languageId][source]) {
            delete this.snippetsMap[languageId][source];
          }
        },
      };
    }

    this.registeredLanguages.add(languageId);

    const provider = monaco.languages.registerCompletionItemProvider(languageId, {
      triggerCharacters: ['!', ':', '>', '*', '.', '#', '+', '('],
      provideCompletionItems: (model: any, position: any) => {
        try {
          const wordUntil = model.getWordUntilPosition(position);
          const wordAt = model.getWordAtPosition(position);
          const currentPath = model.uri.path;

          const lineContent = model.getLineContent(position.lineNumber);
          const textBeforeCursor = lineContent.substring(0, position.column - 1);

          let inString = false;
          let quoteChar: string | null = null;
          let openParens = 0;

          for (let i = 0; i < textBeforeCursor.length; i++) {
            const char = textBeforeCursor[i];
            if ((char === '"' || char === "'" || char === '`') && textBeforeCursor[i - 1] !== '\\') {
              if (!inString) {
                inString = true;
                quoteChar = char;
              } else if (quoteChar === char) {
                inString = false;
                quoteChar = null;
              }
            }
            if (!inString) {
              if (char === '(') openParens++;
              if (char === ')') openParens--;
            }
          }

          const inParameter = openParens > 0;
          if (inString) {
            return { suggestions: [], incomplete: false };
          }

          let startColumn = wordUntil.startColumn;
          const bang = textBeforeCursor.match(/(!{1,2})$/);
          if (bang) {
            startColumn = position.column - bang[1].length;
          } else {
            const emmetTok = textBeforeCursor.match(/(?:^[\s>]|[\s>])([a-zA-Z][a-zA-Z0-9_#.[\]{}()>+\-*$:]*)$/);
            if (emmetTok) {
              startColumn = position.column - emmetTok[1].length;
            }
          }

          const range = {
            insert: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn,
              endColumn: position.column,
            },
            replace: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn,
              endColumn: wordAt ? Math.max(wordAt.endColumn, position.column) : position.column,
            },
          };

          const formattedSnippets: monaco.languages.CompletionItem[] = [];
          const sourceGroups = this.snippetsMap[languageId] || {};

          for (const [sourceName, snippets] of Object.entries(sourceGroups)) {
            for (const [name, snippet] of Object.entries(snippets)) {
              if (snippet.include && Array.isArray(snippet.include)) {
                if (!snippet.include.some((p: string) => matchGlob(currentPath, p))) continue;
              }
              if (snippet.exclude && Array.isArray(snippet.exclude)) {
                if (snippet.exclude.some((p: string) => matchGlob(currentPath, p))) continue;
              }

              const prefixes = Array.isArray(snippet.prefix) ? snippet.prefix : [snippet.prefix];
              const bodyStr = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body || '';
              const basePriority = inParameter ? 'zzz_snippet_' : sourceName === 'user' ? '000_' : '001_';

              for (const prefix of prefixes) {
                if (!prefix) continue;
                formattedSnippets.push({
                  label: prefix,
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  documentation: `${snippet.description || name}\n\nSource: ${sourceName === 'user' ? 'User Snippet' : sourceName}`,
                  insertText: bodyStr,
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  sortText: basePriority + prefix,
                  filterText: prefix,
                  range,
                });
              }
            }
          }

          const textContent = model.getValue() as string;
          const uniqueWords = Array.from(new Set(textContent.match(/\b[a-zA-Z_]\w*\b/g) || [])) as string[];
          const localWords = uniqueWords
            .filter((w: string) => w !== wordUntil.word && w.length > 1)
            .map((w: string) => ({
              label: w,
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: w,
              range,
              sortText: (inParameter ? 'zzz_word_' : 'zzz_') + w,
              filterText: w,
            }));

          return { suggestions: [...formattedSnippets, ...localWords], incomplete: false };
        } catch (err) {
          console.error(`[SnippetRegistry] Crash during completion evaluation:`, err);
          return { suggestions: [], incomplete: false };
        }
      },
    });

    return {
      dispose: () => {
        if (this.snippetsMap[languageId] && this.snippetsMap[languageId][source]) {
          delete this.snippetsMap[languageId][source];
        }
        provider.dispose();
      },
    };
  }
}

export const snippets = new SnippetRegistry();
