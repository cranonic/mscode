// src/features/editor/hooks/useDiagnosticPopup.ts
//
// Cursor on a diagnostic for ~1s → content-widget popup.
// Hide on cursor move, scroll, blur, or model change.

import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

const HOVER_DELAY_MS = 1000;

function severityLabel(s: monaco.MarkerSeverity): string {
  if (s === monaco.MarkerSeverity.Error) return 'Error';
  if (s === monaco.MarkerSeverity.Warning) return 'Warning';
  if (s === monaco.MarkerSeverity.Info) return 'Info';
  return 'Hint';
}

function severityColor(s: monaco.MarkerSeverity): string {
  if (s === monaco.MarkerSeverity.Error) return 'var(--ms-problems-error, #f48771)';
  if (s === monaco.MarkerSeverity.Warning) return 'var(--ms-problems-warning, #cca700)';
  return 'var(--ms-problems-info, #75beff)';
}

/**
 * Find marker under cursor. Prefer exact column range; fall back to any
 * marker on the same line (LSP often underlines only a short span).
 */
function markerAtPosition(
  model: monaco.editor.ITextModel,
  pos: monaco.Position,
): monaco.editor.IMarker | null {
  const markers = monaco.editor.getModelMarkers({ resource: model.uri });
  if (!markers.length) return null;

  let exact: monaco.editor.IMarker | null = null;
  let exactSpan = Infinity;
  let lineBest: monaco.editor.IMarker | null = null;
  let lineDist = Infinity;

  for (const m of markers) {
    const onLine =
      pos.lineNumber >= m.startLineNumber && pos.lineNumber <= m.endLineNumber;
    if (!onLine) continue;

    const startCol = pos.lineNumber === m.startLineNumber ? m.startColumn : 1;
    const endCol =
      pos.lineNumber === m.endLineNumber
        ? m.endColumn
        : model.getLineMaxColumn(pos.lineNumber);

    // Exact column hit
    if (pos.column >= startCol && pos.column <= endCol) {
      const span =
        (m.endLineNumber - m.startLineNumber) * 10000 + (m.endColumn - m.startColumn);
      if (span < exactSpan) {
        exact = m;
        exactSpan = span;
      }
    }

    // Same-line fallback: nearest by column distance to range
    const dist =
      pos.column < startCol
        ? startCol - pos.column
        : pos.column > endCol
          ? pos.column - endCol
          : 0;
    if (dist < lineDist) {
      lineBest = m;
      lineDist = dist;
    }
  }

  return exact ?? lineBest;
}

export function useDiagnosticPopup(editor: monaco.editor.IStandaloneCodeEditor | null): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetRef = useRef<monaco.editor.IContentWidget | null>(null);

  useEffect(() => {
    if (!editor) return;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const hide = () => {
      clearTimer();
      if (widgetRef.current) {
        try {
          editor.removeContentWidget(widgetRef.current);
        } catch {
          /* already removed */
        }
        widgetRef.current = null;
      }
    };

    const show = (marker: monaco.editor.IMarker, pos: monaco.Position) => {
      hide();

      const dom = document.createElement('div');
      dom.className = 'ms-diagnostic-popup';
      // Inline fallbacks — real layout in CodeEditor.css
      dom.setAttribute('role', 'tooltip');

      const head = document.createElement('div');
      head.className = 'ms-diagnostic-popup__title';
      head.style.color = severityColor(marker.severity);
      head.textContent = `${severityLabel(marker.severity)}${
        marker.source ? `  ·  ${marker.source}` : ''
      }`;
      dom.appendChild(head);

      const body = document.createElement('div');
      body.className = 'ms-diagnostic-popup__body';
      body.textContent = marker.message;
      dom.appendChild(body);

      if (marker.code) {
        const code = document.createElement('div');
        code.className = 'ms-diagnostic-popup__code';
        code.textContent =
          typeof marker.code === 'string'
            ? marker.code
            : String((marker.code as { value?: string }).value ?? '');
        dom.appendChild(code);
      }

      const widget: monaco.editor.IContentWidget = {
        getId: () => 'mscode.diagnosticPopup',
        getDomNode: () => dom,
        // Critical: allow rendering outside the editor viewport / overflow clip
        allowEditorOverflow: true,
        getPosition: () => ({
          position: { lineNumber: pos.lineNumber, column: Math.max(1, pos.column) },
          preference: [
            monaco.editor.ContentWidgetPositionPreference.BELOW,
            monaco.editor.ContentWidgetPositionPreference.ABOVE,
          ],
        }),
      };
      widgetRef.current = widget;
      editor.addContentWidget(widget);
      // Force layout after DOM attach so width is measured correctly
      requestAnimationFrame(() => {
        try {
          editor.layoutContentWidget(widget);
        } catch {
          /* ignore */
        }
      });
    };

    const schedule = () => {
      clearTimer();
      hide();
      timerRef.current = setTimeout(() => {
        const model = editor.getModel();
        const pos = editor.getPosition();
        if (!model || !pos) return;
        const marker = markerAtPosition(model, pos);
        if (marker) show(marker, pos);
      }, HOVER_DELAY_MS);
    };

    const d1 = editor.onDidChangeCursorPosition(schedule);
    const d2 = editor.onDidScrollChange(() => hide());
    const d3 = editor.onDidBlurEditorText(() => hide());
    const d4 = editor.onDidChangeModel(() => hide());
    const domNode = editor.getDomNode();
    const onMouseLeave = () => hide();
    domNode?.addEventListener('mouseleave', onMouseLeave);

    return () => {
      hide();
      d1.dispose();
      d2.dispose();
      d3.dispose();
      d4.dispose();
      domNode?.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [editor]);
}
