// src/features/editor/hooks/useDiagnosticPopup.ts
//
// In-editor diagnostic presentation controlled by:
//   lsp.diagnostics.displayStyle = 'popup' | 'shadow' | 'off'
//
// Status bar + Problems panel always keep markers (not gated here).

import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useSettingsStore } from '@/features/settings/store/settingsStore';

const HOVER_DELAY_MS = 1000;
const SHADOW_DECO_KEY = 'mscode.diagnosticShadow';

export type DiagnosticDisplayStyle = 'popup' | 'shadow' | 'off';

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

function severityShadowClass(s: monaco.MarkerSeverity): string {
  if (s === monaco.MarkerSeverity.Error) return 'ms-diagnostic-shadow--error';
  if (s === monaco.MarkerSeverity.Warning) return 'ms-diagnostic-shadow--warning';
  return 'ms-diagnostic-shadow--info';
}

function getDisplayStyle(): DiagnosticDisplayStyle {
  const v = useSettingsStore.getState().settings['lsp.diagnostics.displayStyle'];
  if (v === 'shadow' || v === 'off' || v === 'popup') return v;
  return 'popup';
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

    if (pos.column >= startCol && pos.column <= endCol) {
      const span =
        (m.endLineNumber - m.startLineNumber) * 10000 + (m.endColumn - m.startColumn);
      if (span < exactSpan) {
        exact = m;
        exactSpan = span;
      }
    }

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

/** One shadow message per line (highest severity wins). */
function buildShadowDecorations(
  model: monaco.editor.ITextModel,
): monaco.editor.IModelDeltaDecoration[] {
  const markers = monaco.editor.getModelMarkers({ resource: model.uri });
  if (!markers.length) return [];

  // severity: Error=8, Warning=4, Info=2, Hint=1 — higher first
  const byLine = new Map<number, monaco.editor.IMarker>();
  for (const m of markers) {
    const line = m.startLineNumber;
    const prev = byLine.get(line);
    if (!prev || m.severity > prev.severity) byLine.set(line, m);
  }

  const decos: monaco.editor.IModelDeltaDecoration[] = [];
  for (const [line, m] of byLine) {
    const maxCol = model.getLineMaxColumn(line);
    const msg = (m.message || '').replace(/\s+/g, ' ').trim();
    if (!msg) continue;
    const label = severityLabel(m.severity);
    const text = `  ${label}: ${msg}`;
    decos.push({
      range: new monaco.Range(line, maxCol, line, maxCol),
      options: {
        description: SHADOW_DECO_KEY,
        after: {
          content: text.length > 120 ? text.slice(0, 117) + '…' : text,
          inlineClassName: `ms-diagnostic-shadow ${severityShadowClass(m.severity)}`,
          cursorStops: monaco.editor.InjectedTextCursorStops.None,
        },
        showIfCollapsed: true,
      },
    });
  }
  return decos;
}

export function useDiagnosticPopup(editor: monaco.editor.IStandaloneCodeEditor | null): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetRef = useRef<monaco.editor.IContentWidget | null>(null);
  const decoIdsRef = useRef<string[]>([]);
  const styleRef = useRef<DiagnosticDisplayStyle>(getDisplayStyle());

  useEffect(() => {
    if (!editor) return;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const clearShadow = () => {
      const model = editor.getModel();
      if (model && decoIdsRef.current.length) {
        decoIdsRef.current = model.deltaDecorations(decoIdsRef.current, []);
      } else {
        decoIdsRef.current = [];
      }
    };

    const hidePopup = () => {
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

    const hideAll = () => {
      hidePopup();
      clearShadow();
    };

    const showPopup = (marker: monaco.editor.IMarker, pos: monaco.Position) => {
      hidePopup();

      const dom = document.createElement('div');
      dom.className = 'ms-diagnostic-popup';
      dom.setAttribute('role', 'tooltip');

      try {
        const fontFamily = editor.getOption(monaco.editor.EditorOption.fontFamily);
        const fontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
        const fontWeight = editor.getOption(monaco.editor.EditorOption.fontWeight);
        if (fontFamily) dom.style.fontFamily = fontFamily;
        if (fontSize) dom.style.fontSize = `${fontSize}px`;
        if (fontWeight) dom.style.fontWeight = String(fontWeight);
      } catch {
        /* CSS vars fallback */
      }

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
      requestAnimationFrame(() => {
        try {
          editor.layoutContentWidget(widget);
        } catch {
          /* ignore */
        }
      });
    };

    const refreshShadow = () => {
      const model = editor.getModel();
      if (!model || styleRef.current !== 'shadow') {
        clearShadow();
        return;
      }
      const next = buildShadowDecorations(model);
      decoIdsRef.current = model.deltaDecorations(decoIdsRef.current, next);
    };

    const schedulePopup = () => {
      clearTimer();
      hidePopup();
      if (styleRef.current !== 'popup') return;
      timerRef.current = setTimeout(() => {
        if (styleRef.current !== 'popup') return;
        const model = editor.getModel();
        const pos = editor.getPosition();
        if (!model || !pos) return;
        const marker = markerAtPosition(model, pos);
        if (marker) showPopup(marker, pos);
      }, HOVER_DELAY_MS);
    };

    const applyStyle = (style: DiagnosticDisplayStyle) => {
      styleRef.current = style;
      hideAll();
      if (style === 'shadow') refreshShadow();
      else if (style === 'popup') schedulePopup();
    };

    // Initial
    applyStyle(getDisplayStyle());

    const d1 = editor.onDidChangeCursorPosition(() => {
      if (styleRef.current === 'popup') schedulePopup();
    });
    const d2 = editor.onDidScrollChange(() => {
      if (styleRef.current === 'popup') hidePopup();
    });
    const d3 = editor.onDidBlurEditorText(() => {
      if (styleRef.current === 'popup') hidePopup();
    });
    const d4 = editor.onDidChangeModel(() => {
      hideAll();
      if (styleRef.current === 'shadow') refreshShadow();
    });
    const d5 = editor.onDidChangeModelContent(() => {
      if (styleRef.current === 'shadow') refreshShadow();
    });

    // Markers update (LSP publishDiagnostics)
    const d6 = monaco.editor.onDidChangeMarkers((uris) => {
      const model = editor.getModel();
      if (!model) return;
      const hit = uris.some((u) => u.toString() === model.uri.toString());
      if (!hit) return;
      if (styleRef.current === 'shadow') refreshShadow();
      else if (styleRef.current === 'popup') schedulePopup();
    });

    const domNode = editor.getDomNode();
    const onMouseLeave = () => {
      if (styleRef.current === 'popup') hidePopup();
    };
    domNode?.addEventListener('mouseleave', onMouseLeave);

    // React to setting changes
    let lastStyle = styleRef.current;
    const unsub = useSettingsStore.subscribe((state) => {
      const next = state.settings['lsp.diagnostics.displayStyle'];
      const normalized: DiagnosticDisplayStyle =
        next === 'shadow' || next === 'off' || next === 'popup' ? next : 'popup';
      if (normalized !== lastStyle) {
        lastStyle = normalized;
        applyStyle(normalized);
      }
    });

    return () => {
      hideAll();
      d1.dispose();
      d2.dispose();
      d3.dispose();
      d4.dispose();
      d5.dispose();
      d6.dispose();
      unsub();
      domNode?.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [editor]);
}
