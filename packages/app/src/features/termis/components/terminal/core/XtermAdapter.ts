// src/features/terminal/core/XtermAdapter.ts
//
// Sets up an xterm.js Terminal instance with addons and connects it
// to a TerminalProcess.
//
// Why a separate adapter?
//   - xterm.js is an optional dependency (may not be installed yet)
//   - Addon loading is async and messy — centralize it here
//   - Swap to AnsiParser fallback cleanly if xterm unavailable
//
// Usage:
//   const adapter = new XtermAdapter(containerEl, process, theme);
//   await adapter.init();
//   // later:
//   adapter.dispose();

import type { TerminalProcess } from './TerminalProcess';

// ─── Theme Type ───────────────────────────────────────────────────────────────

export interface XtermTheme {
  background:   string;
  foreground:   string;
  cursor:       string;
  selectionBg:  string;
  black:        string;  red:   string;  green:  string;  yellow: string;
  blue:         string;  magenta: string; cyan:  string;  white:  string;
  brightBlack:  string;  brightRed: string;  brightGreen: string;
  brightYellow: string;  brightBlue: string; brightMagenta: string;
  brightCyan:   string;  brightWhite: string;
}

export const DARK_XTERM_THEME: XtermTheme = {
  background:     '#1e1e1e',  foreground:     '#d4d4d4',
  cursor:         '#d4d4d4',  selectionBg:    '#264f78',
  black:          '#1e1e1e',  red:          '#f44747',
  green:          '#4ec9b0',  yellow:       '#dcdcaa',
  blue:           '#569cd6',  magenta:      '#c586c0',
  cyan:           '#9cdcfe',  white:        '#d4d4d4',
  brightBlack:    '#808080',  brightRed:    '#f44747',
  brightGreen:    '#4ec9b0',  brightYellow: '#dcdcaa',
  brightBlue:     '#569cd6',  brightMagenta:'#c586c0',
  brightCyan:     '#9cdcfe',  brightWhite:  '#ffffff',
};

export const LIGHT_XTERM_THEME: XtermTheme = {
  background:     '#ffffff',  foreground:     '#1e1e1e',
  cursor:         '#1e1e1e',  selectionBg:    '#add6ff',
  black:          '#000000',  red:          '#cd3131',
  green:          '#107c10',  yellow:       '#949800',
  blue:           '#0070c1',  magenta:      '#bc05bc',
  cyan:           '#0070c1',  white:        '#555555',
  brightBlack:    '#666666',  brightRed:    '#f14c4c',
  brightGreen:    '#23d18b',  brightYellow: '#f5f543',
  brightBlue:     '#3b8eea',  brightMagenta:'#d670d6',
  brightCyan:     '#29b8db',  brightWhite:  '#e5e5e5',
};

// ─── Settings Options Type ────────────────────────────────────────────────────
export interface TerminalOptions {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | number;
  letterSpacing?: number;
  tabStopWidth?: number;
  cursorStyle?: 'block' | 'underline' | 'bar';
  fontLigatures?: boolean;
  mouseWheelZoom?: boolean;

  cursorBlink?: boolean;
  cursorWidth?: number;
  scrollback?: number;
  macOptionIsMeta?: boolean;
  rightClickSelectsWord?: boolean;
  fastScrollModifier?: 'alt' | 'ctrl' | 'shift';
}

// ─── XtermAdapter ─────────────────────────────────────────────────────────────

export class XtermAdapter {
  private xterm:          any = null; // xterm.Terminal
  private fitAddon:       any = null;
  private webglAddon:     any = null;
  private searchAddon:    any = null;
  private webLinksAddon:  any = null;
  private ligaturesAddon: any = null;

  private disposables: Array<{ dispose(): void }> = [];
  private resizeObserver?: ResizeObserver;
  private _fitTimer: any = null;

  private container: HTMLElement;
  private process:   TerminalProcess;
  private theme:     XtermTheme;
  public  options:   TerminalOptions;

  constructor(
    container: HTMLElement,
    process:   TerminalProcess,
    theme:     XtermTheme = DARK_XTERM_THEME,
    options:   TerminalOptions = {}
  ) {
    this.container = container;
    this.process   = process;
    this.theme     = theme;
    this.options   = {
      fontSize: 13,
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
      fontWeight: 'normal',
      letterSpacing: 0,
      cursorStyle: 'bar',
      tabStopWidth: 8,
      fontLigatures: false,
      mouseWheelZoom: false,
      cursorBlink: true,
      cursorWidth: 2,
      scrollback: 10000,
      macOptionIsMeta: true,
      rightClickSelectsWord: false,
      fastScrollModifier: 'alt',
      ...options
    };
  }

  // ── init ───────────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    let TerminalClass: any;
    try {
      const mod = await import('@xterm/xterm');
      TerminalClass = mod.Terminal;
    } catch {
      console.warn('[XtermAdapter] @xterm/xterm not installed — using fallback renderer');
      this._initFallback();
      return;
    }

    this.xterm = new TerminalClass({
      theme:          this._mapTheme(),
      fontFamily:     this.options.fontFamily,
      fontSize:       this.options.fontSize,
      fontWeight:     this.options.fontWeight,
      letterSpacing:  this.options.letterSpacing,
      tabStopWidth:   this.options.tabStopWidth,
      cursorStyle:    this.options.cursorStyle,
      cursorBlink:    this.options.cursorBlink,
      cursorWidth:    this.options.cursorWidth,
      scrollback:     this.options.scrollback,
      macOptionIsMeta:       this.options.macOptionIsMeta,
      rightClickSelectsWord: this.options.rightClickSelectsWord,
      fastScrollModifier:    this.options.fastScrollModifier,

      allowProposedApi:      true,
      allowTransparency:     false,
      convertEol:            true,
      disableStdin:          false,
      logLevel: 'off',
    });

    await this._loadAddons();

    this.xterm.open(this.container);

    setTimeout(() => this.fitAddon?.fit(), 50);

    this._connectProcess();
    this._setupResizeObserver();
    this._setupMouseWheelZoom();
    this._setupTouchScrolling();
    this._setupMobileSelection();
  }

  private async _loadAddons(): Promise<void> {
    const results = await Promise.allSettled([
      import('@xterm/addon-fit'),
      import('@xterm/addon-webgl'),
      import('@xterm/addon-search'),
      import('@xterm/addon-web-links'),
    ]);

    if (results[0].status === 'fulfilled') {
      this.fitAddon = new results[0].value.FitAddon();
      this.xterm.loadAddon(this.fitAddon);
    }

    if (results[1].status === 'fulfilled') {
      try {
        this.webglAddon = new results[1].value.WebglAddon();
        this.webglAddon.onContextLoss(() => {
          this.webglAddon?.dispose();
          this.webglAddon = null;
        });
        this.xterm.loadAddon(this.webglAddon);
      } catch {}
    }

    if (results[2].status === 'fulfilled') {
      this.searchAddon = new results[2].value.SearchAddon();
      this.xterm.loadAddon(this.searchAddon);
    }

    if (results[3].status === 'fulfilled') {
      this.webLinksAddon = new results[3].value.WebLinksAddon();
      this.xterm.loadAddon(this.webLinksAddon);
    }

    if (this.options.fontLigatures) {
      await this._enableLigatures();
    }
  }

  private async _enableLigatures() {
    try {
      if (!this.ligaturesAddon) {
        const mod = await import('@xterm/addon-ligatures');
        this.ligaturesAddon = new mod.LigaturesAddon();
        this.xterm.loadAddon(this.ligaturesAddon);
      }
    } catch (e) {
      console.warn('[XtermAdapter] Failed to load font ligatures addon', e);
    }
  }

  private _disableLigatures() {
    if (this.ligaturesAddon) {
      this.ligaturesAddon.dispose();
      this.ligaturesAddon = null;
    }
  }

  private _connectProcess(): void {
    const offData = this.process.on((event) => {
      if (event.type === 'data') this.xterm.write(event.data);
      if (event.type === 'exit') {
        this.xterm.write(`\r\n\x1b[2m[Process exited with code ${event.code}]\x1b[0m\r\n`);
      }
    });
    this.disposables.push({ dispose: offData });

    const onData = this.xterm.onData((data: string) => this.process.write(data));
    this.disposables.push(onData);

    const onResize = this.xterm.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      this.process.resize(cols, rows);
    });
    this.disposables.push(onResize);
  }

  private _setupResizeObserver(): void {
    if (!this.fitAddon) return;

    const doFit = () => {
      clearTimeout(this._fitTimer);
      this._fitTimer = setTimeout(() => {
        try {
          this.fitAddon?.fit();
          if (this.xterm && this.xterm.cols && this.xterm.rows) {
            this.process.resize(this.xterm.cols, this.xterm.rows);
          }
        } catch (e) {}
      }, 40);
    };

    this.resizeObserver = new ResizeObserver(doFit);
    this.resizeObserver.observe(this.container);

    const onWindowResize = () => {
      doFit();
      setTimeout(doFit, 150);
      setTimeout(doFit, 300);
      setTimeout(doFit, 500);
    };

    window.addEventListener('resize', onWindowResize);
    this.disposables.push({ dispose: () => window.removeEventListener('resize', onWindowResize) });
  }

  private _onWheel = (e: WheelEvent) => {
    if (!this.options.mouseWheelZoom) return;

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const currentSize = this.options.fontSize || 13;
      const newSize = e.deltaY > 0 ? Math.max(6, currentSize - 1) : Math.min(100, currentSize + 1);

      this.updateSettings({ fontSize: newSize });
    }
  };

  private _setupMouseWheelZoom() {
    this.container.addEventListener('wheel', this._onWheel, { passive: false });
    this.disposables.push({
      dispose: () => this.container.removeEventListener('wheel', this._onWheel)
    });
  }

  // Programmatic Touch Scrolling for Web/Mobile
  private _setupTouchScrolling() {
    let lastY = 0;
    let scrolling = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastY = e.touches[0].clientY;
        scrolling = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && this.xterm) {
        const currentY = e.touches[0].clientY;
        const deltaY = lastY - currentY;

        const lineHeight = (this.options.fontSize || 14) * 1.2;

        if (Math.abs(deltaY) >= lineHeight) {
          // Mark as scroll so long-press selection cancels
          scrolling = true;
          e.preventDefault();

          const linesToScroll = Math.trunc(deltaY / lineHeight);

          this.xterm.scrollLines(linesToScroll);
          lastY -= (linesToScroll * lineHeight);
        }
      }
    };

    this.container.addEventListener('touchstart', onTouchStart, { passive: true });
    this.container.addEventListener('touchmove', onTouchMove, { passive: false });

    this.disposables.push({
      dispose: () => {
        this.container.removeEventListener('touchstart', onTouchStart);
        this.container.removeEventListener('touchmove', onTouchMove);
      }
    });

    // Expose scrolling flag for mobile selection (shared via closure on instance)
    (this as any)._touchScrolling = () => scrolling;
    (this as any)._resetTouchScrolling = () => { scrolling = false; };
  }

  /**
   * Long-press (~500ms) selects a word under the finger.
   * Cancels if the finger moves more than ~10px (scroll / drag).
   */
  private _setupMobileSelection() {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !this.xterm) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      (this as any)._resetTouchScrolling?.();

      clearTimer();
      timer = setTimeout(() => {
        // If user was scrolling, don't select
        if ((this as any)._touchScrolling?.()) return;

        const rect = this.container.getBoundingClientRect();
        const { cellW, cellH } = this._getCellSize();
        if (cellW <= 0 || cellH <= 0) return;

        const col = Math.max(0, Math.min(
          this.xterm.cols - 1,
          Math.floor((startX - rect.left) / cellW)
        ));
        const rowInViewport = Math.max(0, Math.min(
          this.xterm.rows - 1,
          Math.floor((startY - rect.top) / cellH)
        ));
        const bufferRow = rowInViewport + this.xterm.buffer.active.viewportY;

        try {
          // Select a short span; onSelectionChange in the hook will show the menu
          this.xterm.select(Math.max(0, col - 1), bufferRow, 12);
        } catch {
          try {
            this.xterm.select(col, bufferRow, 1);
          } catch {}
        }
      }, 500);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!timer || e.touches.length !== 1) return;
      const t = e.touches[0];
      if (Math.abs(t.clientX - startX) > 12 || Math.abs(t.clientY - startY) > 12) {
        clearTimer();
      }
    };

    const onTouchEnd = () => clearTimer();

    this.container.addEventListener('touchstart', onTouchStart, { passive: true });
    this.container.addEventListener('touchmove', onTouchMove, { passive: true });
    this.container.addEventListener('touchend', onTouchEnd);
    this.container.addEventListener('touchcancel', onTouchEnd);

    this.disposables.push({
      dispose: () => {
        clearTimer();
        this.container.removeEventListener('touchstart', onTouchStart);
        this.container.removeEventListener('touchmove', onTouchMove);
        this.container.removeEventListener('touchend', onTouchEnd);
        this.container.removeEventListener('touchcancel', onTouchEnd);
      },
    });
  }

  /**
   * Cell size + render padding inside the xterm screen element.
   */
  private _getCellSize(): { cellW: number; cellH: number; padX: number; padY: number } {
    let cellW = 8;
    let cellH = 16;
    let padX = 0;
    let padY = 0;
    if (!this.xterm) return { cellW, cellH, padX, padY };

    try {
      const core = (this.xterm as any)._core;
      const dim = core?._renderService?.dimensions;
      if (dim?.css?.cell?.width && dim.css.cell.width > 0) {
        cellW = dim.css.cell.width;
        cellH = dim.css.cell.height;
      } else if (dim?.actualCellWidth && dim.actualCellWidth > 0) {
        cellW = dim.actualCellWidth;
        cellH = dim.actualCellHeight;
      } else if (this.container.clientWidth && this.xterm.cols) {
        cellW = this.container.clientWidth / this.xterm.cols;
        cellH = this.container.clientHeight / Math.max(1, this.xterm.rows);
      }

      // xterm screen padding (canvas is inset inside the container)
      if (dim?.css?.pad) {
        padX = dim.css.pad.left || 0;
        padY = dim.css.pad.top || 0;
      } else if (dim?.css?.padding) {
        padX = dim.css.padding.left || dim.css.padding || 0;
        padY = dim.css.padding.top || dim.css.padding || 0;
      } else {
        // Fallback: measure .xterm-screen or canvas offset within container
        const screen = this.container.querySelector('.xterm-screen, canvas') as HTMLElement | null;
        if (screen) {
          const cr = this.container.getBoundingClientRect();
          const sr = screen.getBoundingClientRect();
          padX = Math.max(0, sr.left - cr.left);
          padY = Math.max(0, sr.top - cr.top);
        }
      }
    } catch {}

    return { cellW, cellH, padX, padY };
  }

  /**
   * Set an exact buffer-range selection (works for multi-line).
   * Prefer SelectionService model; fall back to public select APIs.
   */
  public setSelectionRange(
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
  ): void {
    if (!this.xterm) return;

    let sc = startCol, sr = startRow, ec = endCol, er = endRow;
    if (sr > er || (sr === er && sc > ec)) {
      sc = endCol; sr = endRow;
      ec = startCol; er = startRow;
    }

    sc = Math.max(0, Math.min(this.xterm.cols - 1, sc));
    ec = Math.max(0, Math.min(this.xterm.cols, ec));
    sr = Math.max(0, sr);
    er = Math.max(0, er);

    const core = (this.xterm as any)._core;
    const sel = core?._selectionService || core?.selectionService;

    try {
      if (sel?._model) {
        // Clear then set model — this is the reliable multi-line path.
        //
        // IMPORTANT: we do NOT also call sel.setSelection(sc, sr, ec, er) here.
        // SelectionService#setSelection is actually a single-row API with the
        // signature (col, row, length) — it's what Terminal#select() calls
        // internally. Calling it with 4 args doesn't throw (JS ignores extra
        // args), but it silently reinterprets `ec` as a cell-count `length`,
        // completely ignores `er`, and internally calls clearSelection() —
        // wiping out the multi-row selectionStart/selectionEnd we just set
        // above and collapsing everything back to one row. That's what was
        // causing multi-line drag to visually stay on a single line.
        if (typeof sel.clearSelection === 'function') sel.clearSelection();
        sel._model.selectionStart = [sc, sr];
        sel._model.selectionEnd = [ec, er];
        // hasSelection flag on some versions
        if ('hasSelection' in sel._model) sel._model.hasSelection = true;

        // Force redraw
        if (typeof sel.refresh === 'function') sel.refresh();
        else if (typeof sel._refreshSelection === 'function') sel._refreshSelection();
        else if (typeof sel.refreshSelection === 'function') sel.refreshSelection();
        // Notify listeners
        try { (this.xterm as any)._onSelectionChange?.fire?.(); } catch {}
        return;
      }

      // Public API fallback
      if (sr === er) {
        this.xterm.select(sc, sr, Math.max(1, ec - sc));
      } else {
        this.xterm.selectLines(sr, er);
      }
    } catch (e) {
      console.warn('[XtermAdapter] setSelectionRange failed', e);
      try {
        if (sr === er) this.xterm.select(sc, sr, Math.max(1, ec - sc));
        else this.xterm.selectLines(sr, er);
      } catch {}
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  focus(): void { this.xterm?.focus(); }
  blur():  void { this.xterm?.blur(); }

  fit(): void {
    this.fitAddon?.fit();
  }

  findNext(term: string): boolean {
    return this.searchAddon?.findNext(term, { incremental: true }) ?? false;
  }

  findPrevious(term: string): boolean {
    return this.searchAddon?.findPrevious(term) ?? false;
  }

  /**
   * Clears viewport AND scrollback buffer.
   * xterm.clear() alone only clears the visible area — history remains on scroll-up.
   */
  clear(): void {
    if (!this.xterm) return;
    // CSI 2J = erase display, CSI 3J = erase scrollback, CSI H = cursor home
    this.xterm.write('\x1b[2J\x1b[3J\x1b[H');
    this.xterm.clear();
    try {
      this.xterm.scrollToBottom();
    } catch {}
  }

  setTheme(theme: XtermTheme): void {
    this.theme = theme;
    if (this.xterm?.options) {
      // xterm v5+ : options.theme assignment
      try {
        this.xterm.options.theme = this._mapTheme();
      } catch {
        try {
          this.xterm.options.setOption?.('theme', this._mapTheme());
        } catch {}
      }
    }
  }

  // Update Settings Dynamically
  public async updateSettings(settings: Partial<TerminalOptions>) {
    if (!this.xterm) return;

    this.options = { ...this.options, ...settings };

    if (settings.fontSize !== undefined) this.xterm.options.fontSize = settings.fontSize;
    if (settings.fontFamily !== undefined) this.xterm.options.fontFamily = settings.fontFamily;
    if (settings.fontWeight !== undefined) this.xterm.options.fontWeight = settings.fontWeight;
    if (settings.letterSpacing !== undefined) this.xterm.options.letterSpacing = settings.letterSpacing;
    if (settings.cursorStyle !== undefined) this.xterm.options.cursorStyle = settings.cursorStyle;
    if (settings.tabStopWidth !== undefined) this.xterm.options.tabStopWidth = settings.tabStopWidth;
    if (settings.cursorBlink !== undefined) this.xterm.options.cursorBlink = settings.cursorBlink;
    if (settings.cursorWidth !== undefined) this.xterm.options.cursorWidth = settings.cursorWidth;
    if (settings.scrollback !== undefined) this.xterm.options.scrollback = settings.scrollback;
    if (settings.macOptionIsMeta !== undefined) this.xterm.options.macOptionIsMeta = settings.macOptionIsMeta;
    if (settings.rightClickSelectsWord !== undefined) this.xterm.options.rightClickSelectsWord = settings.rightClickSelectsWord;
    if (settings.fastScrollModifier !== undefined) this.xterm.options.fastScrollModifier = settings.fastScrollModifier;

    if (settings.fontLigatures !== undefined) {
      if (settings.fontLigatures) {
        await this._enableLigatures();
      } else {
        this._disableLigatures();
      }
    }

    this.fit();
  }

  public get xtermInstance() {
    return this.xterm;
  }

  public getSelection(): string {
    return this.xterm?.getSelection() || '';
  }

  public clearSelection(): void {
    this.xterm?.clearSelection();
  }

  /**
   * Selection metrics in container-local CSS pixels (viewport-relative rows).
   * Handles both xterm selection position shapes:
   *   - { startColumn, startRow, endColumn, endRow }
   *   - { start: {x,y}, end: {x,y} }
   */
  public getSelectionMetrics() {
    if (!this.xterm) return null;

    const pos = this.xterm.getSelectionPosition?.();
    if (!pos) return null;

    let startColumn: number;
    let startRow: number;
    let endColumn: number;
    let endRow: number;

    if (pos.start && typeof pos.start === 'object') {
      startColumn = pos.start.x;
      startRow    = pos.start.y;
      endColumn   = pos.end.x;
      endRow      = pos.end.y;
    } else {
      startColumn = pos.startColumn;
      startRow    = pos.startRow;
      endColumn   = pos.endColumn;
      endRow      = pos.endRow;
    }

    if (
      startColumn == null || startRow == null ||
      endColumn == null || endRow == null
    ) {
      return null;
    }

    const { cellW, cellH, padX, padY } = this._getCellSize();
    if (cellW <= 0 || cellH <= 0) return null;

    const viewportY = this.xterm.buffer.active.viewportY;

    return {
      startColumn,
      startRow: startRow - viewportY,
      endColumn,
      endRow: endRow - viewportY,
      cellW,
      cellH,
      padX,
      padY,
    };
  }

  /** Public cell metrics for drag math outside the adapter. */
  public getCellMetrics() {
    return this._getCellSize();
  }

  dispose(): void {
    clearTimeout(this._fitTimer);
    this.resizeObserver?.disconnect();
    this.disposables.forEach(d => d.dispose());

    this._disableLigatures();
    this.webglAddon?.dispose();
    this.searchAddon?.dispose();
    this.webLinksAddon?.dispose();
    this.fitAddon?.dispose();
    this.xterm?.dispose();

    this.xterm = null;
  }

  private _initFallback(): void {
    const fontFam = this.options.fontFamily || "'Fira Code', 'Cascadia Code', Consolas, monospace";
    const fontSz  = this.options.fontSize || 13;

    this.container.style.cssText = `
      background: ${this.theme.background};
      color:      ${this.theme.foreground};
      font-family: ${fontFam};
      font-size:   ${fontSz}px;
      padding:     10px;
      overflow-y:  auto;
      height:      100%;
      box-sizing:  border-box;
      white-space: pre-wrap;
    `;

    const offData = this.process.on((event) => {
      if (event.type === 'data') {
        const clean = event.data
          .replace(/\x1b\[[0-9;]*m/g, '')
          .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
        this.container.textContent += clean;
        this.container.scrollTop = this.container.scrollHeight;
      }
    });
    this.disposables.push({ dispose: offData });
  }

  private _mapTheme() {
    return {
      background: this.theme.background,
      foreground: this.theme.foreground,
      cursor: this.theme.cursor,
      selectionBackground: this.theme.selectionBg,
      black: this.theme.black,
      red: this.theme.red,
      green: this.theme.green,
      yellow: this.theme.yellow,
      blue: this.theme.blue,
      magenta: this.theme.magenta,
      cyan: this.theme.cyan,
      white: this.theme.white,
      brightBlack: this.theme.brightBlack,
      brightRed: this.theme.brightRed,
      brightGreen: this.theme.brightGreen,
      brightYellow: this.theme.brightYellow,
      brightBlue: this.theme.brightBlue,
      brightMagenta: this.theme.brightMagenta,
      brightCyan: this.theme.brightCyan,
      brightWhite: this.theme.brightWhite,
    };
  }
}