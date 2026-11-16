// src/features/editor/hooks/useStickyHighlight.ts

import { useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { symbolManager } from '@/core/symbols';
import type { DocumentSymbol } from '@/core/symbols';

export const useStickyHighlight = (editor: monaco.editor.IStandaloneCodeEditor | null) => {
  useEffect(() => {
    if (!editor) return;

    const domNode = editor.getDomNode();
    if (!domNode) return;

    let timeout: ReturnType<typeof setTimeout>;

    const applyHighlight = async (position: monaco.Position) => {
      const model = editor.getModel();
      if (!model) return;

      const currentLine = position.lineNumber;
      const symbols = await symbolManager.getSymbols(model);

      const findMatchingScope = (nodes: DocumentSymbol[], line: number): DocumentSymbol | null => {
        let match: DocumentSymbol | null = null;
        for (const node of nodes) {
          if (line === node.range.startLineNumber || line === node.range.endLineNumber) {
            match = node;
          }
          if (node.children && node.children.length > 0) {
            const childMatch = findMatchingScope(node.children, line);
            if (childMatch) match = childMatch;
          }
        }
        return match;
      };

      const matchedSymbol = findMatchingScope(symbols || [], currentLine);

      domNode.querySelectorAll('.ms-active-sticky-line').forEach((el) => el.classList.remove('ms-active-sticky-line'));
      domNode.querySelectorAll('.ms-exact-bracket-highlight').forEach((el) => el.classList.remove('ms-exact-bracket-highlight'));

      if (matchedSymbol && matchedSymbol.range.startLineNumber !== matchedSymbol.range.endLineNumber) {
        const targetLine = matchedSymbol.range.startLineNumber;
        const stickyLineEl = domNode.querySelector(`.sticky-widget .stickyLine${targetLine}`);

        if (stickyLineEl) {
          stickyLineEl.classList.add('ms-active-sticky-line');

          const spans = Array.from(stickyLineEl.querySelectorAll('span')).filter(
            (s) => (s as HTMLElement).children.length === 0,
          ) as HTMLElement[];
          let exactTarget: HTMLElement | null = null;

          for (let i = spans.length - 1; i >= 0; i--) {
            if (spans[i].textContent?.includes('{')) {
              exactTarget = spans[i];
              break;
            }
          }

          if (!exactTarget) {
            for (let i = 0; i < spans.length; i++) {
              if (spans[i].textContent?.includes('<')) {
                exactTarget = spans[i];
                break;
              }
            }
          }

          if (exactTarget) {
            exactTarget.classList.add('ms-exact-bracket-highlight');
          }
        }
      }
    };

    const handleCursorMove = (e: monaco.editor.ICursorPositionChangedEvent) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => applyHighlight(e.position), 50);
    };

    const handleScroll = () => {
      const pos = editor.getPosition();
      if (pos) {
        clearTimeout(timeout);
        timeout = setTimeout(() => applyHighlight(pos), 50);
      }
    };

    const cursorDisposable = editor.onDidChangeCursorPosition(handleCursorMove);
    const scrollDisposable = editor.onDidScrollChange(handleScroll);

    return () => {
      cursorDisposable.dispose();
      scrollDisposable.dispose();
      clearTimeout(timeout);
      domNode.querySelectorAll('.ms-active-sticky-line').forEach((el) => el.classList.remove('ms-active-sticky-line'));
      domNode.querySelectorAll('.ms-exact-bracket-highlight').forEach((el) => el.classList.remove('ms-exact-bracket-highlight'));
    };
  }, [editor]);
};
