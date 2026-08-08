// src/features/editor/hooks/useDiagnosticPopup.ts
//
// When the cursor sits on a diagnostic (error/warning/info) for ~1s,
// show a Monaco content-widget popup. Hide on cursor move, scroll, or blur.

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

function markerAtPosition(
  model: monaco.editor.ITextModel,
  pos: monaco.Position,
): monaco.editor.IMarker | null {
  const markers = monaco.editor.getModelMarkers({ resource: model.uri });
  // Prefer the tightest range that contains the cursor
  let best: monaco.editor.IMarker | null = null;
  let bestSpan = Infinity;
  for (const m of markers) {
    const inLine =
      pos.lineNumber >= m.startLineNumber && pos.lineNumber <= m.endLineNumber;
    if (!inLine) continue;
    const startCol = pos.lineNumber === m.startLineNumber ? m.startColumn : 1;
    const endCol =
      pos.lineNumber === m.endLineNumber ? m.endColumn : model.getLineMaxColumn(pos.lineNumber);
    if (pos.column < startCol || pos.column > endCol) continue;
    const span =
      (m.endLineNumber - m.startLineNumber) * 10000 + (m.endColumn - m.startColumn);
    if (span < bestSpan) {
      best = m;
      bestSpan = span;
    }
  }
  return best;
}

export function useDiagnosticPopup(editor: monaco.editor.IStandaloneCodeEditor | null): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetRef = useRef<monaco.editor.IContentWidget | null>(null);
  const domRef = useRef<HTMLDivElement | null>(null);

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
      domRef.current = null;
    };

    const show = (marker: monaco.editor.IMarker, pos: monaco.Position) => {
      hide();

      const dom = document.createElement('div');
      dom.className = 'ms-diagnostic-popup';
      dom.style.cssText = [
        'max-width:420px',
        'padding:8px 12px',
        'border-radius:6px',
        'background:var(--ms-editor-widget-bg, #252526)',
        'border:1px solid var(--ms-border, #454545)',
        'box-shadow:0 4px 16px rgba(0,0,0,.45)',
        'color:var(--ms-fg, #cccccc)',
        'font-size:12px',
        'line-height:1.45',
        'z-index:100',
        'pointer-events:auto',
        'white-space:pre-wrap',
        'word-break:break-word',
      ].join(';');

      const head = document.createElement('div');
      head.style.cssText = `font-weight:600;margin-bottom:4px;color:${severityColor(marker.severity)}`;
      head.textContent = `${severityLabel(marker.severity)}${marker.source ? `  ·  ${marker.source}` : ''}`;
      dom.appendChild(head);

      const body = document.createElement('div');
      body.textContent = marker.message;
      dom.appendChild(body);

      if (marker.code) {
        const code = document.createElement('div');
        code.style.cssText = 'opacity:.7;margin-top:4px;font-size:11px';
        code.textContent =
          typeof marker.code === 'string' ? marker.code : String((marker.code as any).value ?? '');
        dom.appendChild(code);
      }

      domRef.current = dom;

      const widget: monaco.editor.IContentWidget = {
        getId: () => 'mscode.diagnosticPopup',
        getDomNode: () => dom,
        getPosition: () => ({
          position: { lineNumber: pos.lineNumber, column: pos.column },
          preference: [
            monaco.editor.ContentWidgetPositionPreference.ABOVE,
            monaco.editor.ContentWidgetPositionPreference.BELOW,
          ],
        }),
      };
      widgetRef.current = widget;
      editor.addContentWidget(widget);
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
    // Mouse leave editor area
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
