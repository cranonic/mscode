// src/features/termis/components/terminal/hooks/useTerminalInstance.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { TerminalProcess }  from '../core/TerminalProcess';
import { XtermAdapter, DARK_XTERM_THEME, LIGHT_XTERM_THEME } from '../core/XtermAdapter';
import { useTerminalStore } from '../store/terminalStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { terminalProcessRegistry } from '../core/TerminalRegistry';
import { Clipboard } from '@capacitor/clipboard';

interface UseTerminalInstanceOptions {
  terminalId: string;
}

/** Buffer-space selection anchors (absolute buffer rows, not viewport). */
interface SelAnchor {
  startCol: number;
  startRow: number; // buffer row
  endCol: number;
  endRow: number;   // buffer row
}

interface SelectionUI {
  text: string;
  /** Handle pixel positions (container-local), at bottom of start/end cells */
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function useTerminalInstance({ terminalId }: UseTerminalInstanceOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const processRef   = useRef<TerminalProcess | null>(null);
  const adapterRef   = useRef<XtermAdapter | null>(null);

  const [selection, setSelection] = useState<SelectionUI | null>(null);

  // Live buffer anchors — used while dragging handles
  const anchorRef = useRef<SelAnchor | null>(null);
  const dragWhichRef = useRef<'start' | 'end' | null>(null);

  const { instances, updateInstance } = useTerminalStore();
  const settings = useSettingsStore(s => s.settings);

  const instance = instances.find(t => t.id === terminalId);

  // ── Helpers: metrics → UI + apply selection to xterm ────────────────────

  const metricsToUI = useCallback((
    text: string,
    startCol: number,
    startRowBuf: number,
    endCol: number,
    endRowBuf: number,
  ): SelectionUI | null => {
    const adapter = adapterRef.current;
    if (!adapter?.xtermInstance) return null;

    const xterm = adapter.xtermInstance;
    const cell = adapter.getCellMetrics?.() || adapter.getSelectionMetrics();
    const cellW = cell?.cellW || (containerRef.current
      ? containerRef.current.clientWidth / Math.max(1, xterm.cols)
      : 8);
    const cellH = cell?.cellH || (containerRef.current
      ? containerRef.current.clientHeight / Math.max(1, xterm.rows)
      : 16);
    const padX = (cell as any)?.padX ?? 0;
    const padY = (cell as any)?.padY ?? 0;

    const viewportY = xterm.buffer.active.viewportY;

    let sc = startCol, sr = startRowBuf, ec = endCol, er = endRowBuf;
    if (sr > er || (sr === er && sc > ec)) {
      sc = endCol; sr = endRowBuf;
      ec = startCol; er = startRowBuf;
    }

    const startRowVP = sr - viewportY;
    const endRowVP   = er - viewportY;

    // Handles at the exact edges of the blue selection:
    // start = left edge of first cell, end = left edge of end column (exclusive)
    // + padX/padY so we align with xterm's screen canvas, not the outer container
    const startX = padX + sc * cellW;
    const startY = padY + (startRowVP + 1) * cellH;
    const endX   = padX + ec * cellW;
    const endY   = padY + (endRowVP + 1) * cellH;

    const viewH = containerRef.current?.clientHeight ?? 0;
    if (endY < 0 || startY - cellH > viewH) return null;

    return {
      text,
      startX: Math.max(0, startX),
      startY: Math.max(0, startY),
      endX: Math.max(0, endX),
      endY: Math.max(0, endY),
    };
  }, []);

  const applyBufferSelection = useCallback((
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
  ) => {
    const adapter = adapterRef.current;
    const xterm = adapter?.xtermInstance;
    if (!xterm || !adapter) return;

    let sc = startCol, sr = startRow, ec = endCol, er = endRow;
    if (sr > er || (sr === er && sc > ec)) {
      sc = endCol; sr = endRow;
      ec = startCol; er = startRow;
    }

    sc = Math.max(0, Math.min(xterm.cols - 1, sc));
    ec = Math.max(0, Math.min(xterm.cols, ec));
    sr = Math.max(0, sr);
    er = Math.max(0, er);

    // Always use setSelectionRange — handles single + multi-line via SelectionService
    if (typeof (adapter as any).setSelectionRange === 'function') {
      (adapter as any).setSelectionRange(sc, sr, ec, er);
    } else {
      try {
        if (sr === er) xterm.select(sc, sr, Math.max(1, ec - sc));
        else xterm.selectLines(sr, er);
      } catch (e) {
        console.warn('[terminal] applyBufferSelection failed', e);
      }
    }

    anchorRef.current = { startCol: sc, startRow: sr, endCol: ec, endRow: er };

    // Read text after selection is applied
    const selectedText = adapter.getSelection() || '';
    const ui = metricsToUI(selectedText, sc, sr, ec, er);
    if (ui) setSelection(ui);
    else setSelection(selectedText ? { text: selectedText, startX: 16, startY: 16, endX: 80, endY: 40 } : null);
  }, [metricsToUI]);

  const clientToBuffer = useCallback((clientX: number, clientY: number) => {
    const adapter = adapterRef.current;
    const xterm = adapter?.xtermInstance;
    const el = containerRef.current;
    if (!xterm || !el || !adapter) return null;

    const rect = el.getBoundingClientRect();
    const cell = adapter.getCellMetrics?.() || { cellW: 8, cellH: 16, padX: 0, padY: 0 };
    const cellW = cell.cellW || el.clientWidth / Math.max(1, xterm.cols);
    const cellH = cell.cellH || el.clientHeight / Math.max(1, xterm.rows);
    const padX = (cell as any).padX || 0;
    const padY = (cell as any).padY || 0;

    // Subtract screen padding so coords match cell grid
    const localX = clientX - rect.left - padX;
    const localY = clientY - rect.top - padY;

    const col = Math.max(0, Math.min(
      xterm.cols,
      Math.floor(localX / cellW)
    ));
    const rowVP = Math.max(0, Math.min(
      xterm.rows - 1,
      Math.floor(localY / cellH)
    ));
    const row = rowVP + xterm.buffer.active.viewportY;

    return { col, row };
  }, []);

  const beginHandleDrag = useCallback((_which: 'start' | 'end', _cx: number, _cy: number) => {
    dragWhichRef.current = _which;
    if (!anchorRef.current && adapterRef.current) {
      const m = adapterRef.current.getSelectionMetrics();
      const xterm = adapterRef.current.xtermInstance;
      if (m && xterm) {
        const viewportY = xterm.buffer.active.viewportY;
        anchorRef.current = {
          startCol: m.startColumn,
          startRow: m.startRow + viewportY,
          endCol: m.endColumn,
          endRow: m.endRow + viewportY,
        };
      }
    }
  }, []);

  const moveHandleDrag = useCallback((which: 'start' | 'end', clientX: number, clientY: number) => {
    const pos = clientToBuffer(clientX, clientY);
    const anchor = anchorRef.current;
    if (!pos || !anchor) return;

    if (which === 'start') {
      applyBufferSelection(pos.col, pos.row, anchor.endCol, anchor.endRow);
    } else {
      applyBufferSelection(anchor.startCol, anchor.startRow, pos.col, pos.row);
    }
  }, [clientToBuffer, applyBufferSelection]);

  const endHandleDrag = useCallback(() => {
    dragWhichRef.current = null;
  }, []);

  // ── Mount / Unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || !instance) return;

    let alive = true;
    let selTimeout: ReturnType<typeof setTimeout> | undefined;
    let selectionDisposable: { dispose(): void } | undefined;

    const boot = async () => {
      const proc = new TerminalProcess({
        id: terminalId,
        shell:  instance.shell,
        cwd:    instance.workingDir,
        cols:   80,
        rows:   24,
      });
      processRef.current = proc;
      terminalProcessRegistry.register(instance.id, {
        write: (data: string) => { proc.write(data).catch(() => {}); },
        kill: () => { proc.kill(); },
        clear: () => { adapterRef.current?.clear(); },
      });

      const isLight = settings['workbench.theme'] === 'vs-light';
      const theme   = isLight ? LIGHT_XTERM_THEME : DARK_XTERM_THEME;

      const adapter = new XtermAdapter(
        containerRef.current!,
        proc,
        theme,
        {
          fontFamily:      settings['terminal.integrated.fontFamily'] as string || settings['editor.fontFamily'] as string || "'Fira Code', monospace",
          fontSize:        settings['terminal.integrated.fontSize'] as number ?? settings['editor.fontSize'] as number ?? 13,
          fontWeight:      settings['terminal.integrated.fontWeight'] as any || 'normal',
          letterSpacing:   settings['terminal.integrated.letterSpacing'] as number ?? 0,
          cursorStyle:     settings['terminal.integrated.cursorStyle'] as any || 'bar',
          tabStopWidth:    settings['terminal.integrated.tabStopWidth'] as number ?? 8,
          fontLigatures:   settings['terminal.integrated.fontLigatures'] as boolean ?? false,
          mouseWheelZoom:  settings['terminal.integrated.mouseWheelZoom'] as boolean ?? false,
          cursorBlink:     settings['terminal.integrated.cursorBlink'] as boolean ?? true,
          cursorWidth:     settings['terminal.integrated.cursorWidth'] as number ?? 2,
          scrollback:      settings['terminal.integrated.scrollback'] as number ?? 10000,
          macOptionIsMeta: settings['terminal.integrated.macOptionIsMeta'] as boolean ?? true,
          rightClickSelectsWord: settings['terminal.integrated.rightClickSelectsWord'] as boolean ?? false,
          fastScrollModifier:    settings['terminal.integrated.fastScrollModifier'] as 'alt' | 'ctrl' | 'shift' ?? 'alt',
        }
      );
      adapterRef.current = adapter;

      await proc.start();
      if (!alive) { proc.kill(); adapter.dispose(); return; }

      await adapter.init();

      containerRef.current?.addEventListener('contextmenu', (e) => e.preventDefault());

      const xterm = adapter.xtermInstance;
      if (xterm?.onSelectionChange) {
        selectionDisposable = xterm.onSelectionChange(() => {
          if (dragWhichRef.current) return;

          clearTimeout(selTimeout);
          selTimeout = setTimeout(() => {
            const text = adapter.getSelection();
            if (!text || text.trim() === '') {
              anchorRef.current = null;
              setSelection(null);
              return;
            }

            const m = adapter.getSelectionMetrics();
            if (!m || m.cellW <= 0) {
              setSelection({ text, startX: 16, startY: 24, endX: 80, endY: 40 });
              return;
            }

            const viewportY = xterm.buffer.active.viewportY;
            anchorRef.current = {
              startCol: m.startColumn,
              startRow: m.startRow + viewportY,
              endCol: m.endColumn,
              endRow: m.endRow + viewportY,
            };

            // Handles at exact edges + render padding
            const padX = (m as any).padX || 0;
            const padY = (m as any).padY || 0;
            const startX = padX + m.startColumn * m.cellW;
            const startY = padY + (m.startRow + 1) * m.cellH;
            const endX   = padX + m.endColumn * m.cellW;
            const endY   = padY + (m.endRow + 1) * m.cellH;

            const viewH = containerRef.current?.clientHeight ?? 0;
            if (endY < 0 || startY - m.cellH > viewH) {
              setSelection(null);
              return;
            }

            setSelection({
              text,
              startX: Math.max(0, startX),
              startY: Math.max(0, startY),
              endX: Math.max(0, endX),
              endY: Math.max(0, endY),
            });
          }, 50);
        });
      }

      proc.on(event => {
        if (event.type === 'ready') updateInstance(terminalId, { status: 'ready' });
        if (event.type === 'exit') updateInstance(terminalId, { status: 'exited', exitCode: event.code });
        if (event.type === 'error') updateInstance(terminalId, { status: 'error' });
      });

      updateInstance(terminalId, { pid: proc.pid });
    };

    boot().catch(err => {
      console.error('[useTerminalInstance] boot failed:', err);
      updateInstance(terminalId, { status: 'error' });
    });

    return () => {
      alive = false;
      clearTimeout(selTimeout);
      selectionDisposable?.dispose();
      terminalProcessRegistry.unregister(instance.id);
      processRef.current?.kill();
      processRef.current = null;
      adapterRef.current?.dispose();
      adapterRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    if (!adapterRef.current) return;
    const isLight = settings['workbench.theme'] === 'vs-light';
    adapterRef.current.setTheme(isLight ? LIGHT_XTERM_THEME : DARK_XTERM_THEME);
  }, [settings['workbench.theme']]);

  useEffect(() => {
    adapterRef.current?.updateSettings({
      fontSize:        settings['terminal.integrated.fontSize'] as number ?? settings['editor.fontSize'] as number,
      fontFamily:      settings['terminal.integrated.fontFamily'] as string || settings['editor.fontFamily'] as string,
      fontWeight:      settings['terminal.integrated.fontWeight'] as any,
      letterSpacing:   settings['terminal.integrated.letterSpacing'] as number,
      cursorStyle:     settings['terminal.integrated.cursorStyle'] as any,
      tabStopWidth:    settings['terminal.integrated.tabStopWidth'] as number,
      fontLigatures:   settings['terminal.integrated.fontLigatures'] as boolean,
      mouseWheelZoom:  settings['terminal.integrated.mouseWheelZoom'] as boolean,
      cursorBlink:     settings['terminal.integrated.cursorBlink'] as boolean,
      cursorWidth:     settings['terminal.integrated.cursorWidth'] as number,
      scrollback:      settings['terminal.integrated.scrollback'] as number,
      macOptionIsMeta: settings['terminal.integrated.macOptionIsMeta'] as boolean,
      rightClickSelectsWord: settings['terminal.integrated.rightClickSelectsWord'] as boolean,
      fastScrollModifier:    settings['terminal.integrated.fastScrollModifier'] as 'alt' | 'ctrl' | 'shift',
    });
  }, [
    settings['terminal.integrated.fontSize'],
    settings['editor.fontSize'],
    settings['terminal.integrated.fontFamily'],
    settings['editor.fontFamily'],
    settings['terminal.integrated.fontWeight'],
    settings['terminal.integrated.letterSpacing'],
    settings['terminal.integrated.cursorStyle'],
    settings['terminal.integrated.tabStopWidth'],
    settings['terminal.integrated.fontLigatures'],
    settings['terminal.integrated.mouseWheelZoom'],
    settings['terminal.integrated.cursorBlink'],
    settings['terminal.integrated.cursorWidth'],
    settings['terminal.integrated.scrollback'],
    settings['terminal.integrated.macOptionIsMeta'],
    settings['terminal.integrated.rightClickSelectsWord'],
    settings['terminal.integrated.fastScrollModifier'],
  ]);

  const handleCopy = useCallback(async () => {
    if (selection?.text) {
      await Clipboard.write({ string: selection.text });
      adapterRef.current?.clearSelection();
      anchorRef.current = null;
      setSelection(null);
    }
  }, [selection]);

  const handlePaste = useCallback(async () => {
    try {
      const { value } = await Clipboard.read();
      if (value && processRef.current) processRef.current.write(value);
      adapterRef.current?.clearSelection();
      anchorRef.current = null;
      setSelection(null);
    } catch (err) {
      console.error('Paste failed', err);
    }
  }, []);

  const focus = useCallback(() => adapterRef.current?.focus(), []);
  const clear = useCallback(() => adapterRef.current?.clear(), []);
  const fit   = useCallback(() => adapterRef.current?.fit(),   []);
  const findNext     = useCallback((t: string) => adapterRef.current?.findNext(t) ?? false, []);
  const findPrevious = useCallback((t: string) => adapterRef.current?.findPrevious(t) ?? false, []);

  return {
    containerRef,
    focus,
    clear,
    fit,
    findNext,
    findPrevious,
    selection,
    handleCopy,
    handlePaste,
    beginHandleDrag,
    moveHandleDrag,
    endHandleDrag,
  };
}
