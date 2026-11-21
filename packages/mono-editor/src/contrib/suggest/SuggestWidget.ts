import type { CompletionItem } from '../../language/features';
import { CompletionItemKind as Kind } from '../../language/features';
import { haptic } from '../../util/haptic';
import { createIcon, kindToCodicon, ensureCodicons } from '../../icons';

export interface SuggestWidgetOptions {
  /** Max list height in px (VS Code: 12 rows × 22px) */
  maxHeight?: number;
  /** Max widget width in px. The widget is content-sized, this is only the cap. */
  maxWidth?: number;
  /** Min widget width in px */
  minWidth?: number;
  /** Use the editor's font so labels line up with the code (VS Code does the same) */
  fontFamily?: string;
  fontSize?: number;
  /** Row height in px. Default: max(22, 1.5 × fontSize) */
  rowHeight?: number;
  background?: string;
  border?: string;
  foreground?: string;
  selectedBackground?: string;
  selectedForeground?: string;
  hoverBackground?: string;
  /** Matched characters in the label */
  highlightForeground?: string;
  /** Right-hand text. Default: same colour as the row's label. */
  detailForeground?: string;
  /** Extra class on root for app theming */
  className?: string;
  /** Raw VS Code colour map (`editorSuggestWidget.*`, `symbolIcon.*`, `list.*`) */
  themeColors?: Record<string, string>;
  themeType?: 'dark' | 'light';
}

type Palette = {
  background: string;
  border: string;
  foreground: string;
  selectedBackground: string;
  selectedForeground: string;
  hoverBackground: string;
  highlight: string;
  /** highlight on the selected (filled) row */
  focusHighlight: string;
  shadow: string;
  icon: (kind: number | undefined) => string;
};

// ── VS Code default colours (Dark+ / Light+) ─────────────────────────────────
const DARK = {
  background: '#252526',
  border: '#454545',
  foreground: '#cccccc',
  selectedBackground: '#04395e',
  selectedForeground: '#ffffff',
  hoverBackground: '#2a2d2e',
  highlight: '#2aaaff',
  focusHighlight: '#2aaaff',
  shadow: 'rgba(0,0,0,0.36)',
  iconDefault: '#cccccc',
  method: '#b180d7',
  field: '#75beff',
  klass: '#ee9d28',
};
const LIGHT = {
  background: '#f3f3f3',
  border: '#c8c8c8',
  foreground: '#616161',
  selectedBackground: '#0060c0',
  selectedForeground: '#ffffff',
  hoverBackground: '#e8e8e8',
  highlight: '#0066bf',
  focusHighlight: '#bbe7ff',
  shadow: 'rgba(0,0,0,0.16)',
  iconDefault: '#616161',
  method: '#652d90',
  field: '#007acc',
  klass: '#d67e00',
};

/** CompletionItemKind → VS Code `symbolIcon.*Foreground` key */
const ICON_KEY: Record<number, string> = {
  [Kind.Text]: 'text',
  [Kind.Method]: 'method',
  [Kind.Function]: 'function',
  [Kind.Constructor]: 'constructor',
  [Kind.Field]: 'field',
  [Kind.Variable]: 'variable',
  [Kind.Class]: 'class',
  [Kind.Interface]: 'interface',
  [Kind.Module]: 'module',
  [Kind.Property]: 'property',
  [Kind.Unit]: 'unit',
  [Kind.Value]: 'value',
  [Kind.Enum]: 'enum',
  [Kind.Keyword]: 'keyword',
  [Kind.Snippet]: 'snippet',
  [Kind.Color]: 'color',
  [Kind.File]: 'file',
  [Kind.Reference]: 'reference',
  [Kind.Folder]: 'folder',
  [Kind.EnumMember]: 'enumMember',
  [Kind.Constant]: 'constant',
  [Kind.Struct]: 'struct',
  [Kind.Event]: 'event',
  [Kind.Operator]: 'operator',
  [Kind.TypeParameter]: 'typeParameter',
};

/** CompletionItemKind → readable type shown on the right of every row */
const KIND_NAME: Record<number, string> = {
  [Kind.Text]: 'text',
  [Kind.Method]: 'method',
  [Kind.Function]: 'function',
  [Kind.Constructor]: 'constructor',
  [Kind.Field]: 'field',
  [Kind.Variable]: 'variable',
  [Kind.Class]: 'class',
  [Kind.Interface]: 'interface',
  [Kind.Module]: 'module',
  [Kind.Property]: 'property',
  [Kind.Unit]: 'unit',
  [Kind.Value]: 'value',
  [Kind.Enum]: 'enum',
  [Kind.Keyword]: 'keyword',
  [Kind.Snippet]: 'snippet',
  [Kind.Color]: 'color',
  [Kind.File]: 'file',
  [Kind.Reference]: 'reference',
  [Kind.Folder]: 'folder',
  [Kind.EnumMember]: 'enum member',
  [Kind.Constant]: 'constant',
  [Kind.Struct]: 'struct',
  [Kind.Event]: 'event',
  [Kind.Operator]: 'operator',
  [Kind.TypeParameter]: 'type parameter',
};

function kindLabel(k?: number): string {
  return k == null ? '' : KIND_NAME[k] ?? '';
}

function labelOf(item: CompletionItem): string {
  return typeof item.label === 'string' ? item.label : (item.label as any)?.label || '';
}

/** Which characters of `label` the typed `filter` matched (contiguous first, else fuzzy). */
function matchIndexes(label: string, filter: string): Set<number> | null {
  if (!filter) return null;
  const l = label.toLowerCase();
  const f = filter.toLowerCase();
  const at = l.startsWith(f) ? 0 : l.indexOf(f);
  const out = new Set<number>();
  if (at >= 0) {
    for (let i = 0; i < f.length; i++) out.add(at + i);
    return out;
  }
  let j = 0;
  for (let i = 0; i < l.length && j < f.length; i++) {
    if (l[i] === f[j]) {
      out.add(i);
      j++;
    }
  }
  return j === f.length ? out : null;
}

const STYLE_ID = 'mono-suggest-style';
function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  // Thin VS Code-like scrollbar
  s.textContent = `
.mono-suggest-widget .mono-suggest-list{scrollbar-width:thin;scrollbar-color:rgba(121,121,121,.4) transparent}
.mono-suggest-widget .mono-suggest-list::-webkit-scrollbar{width:10px;height:10px}
.mono-suggest-widget .mono-suggest-list::-webkit-scrollbar-track{background:transparent}
.mono-suggest-widget .mono-suggest-list::-webkit-scrollbar-thumb{background:rgba(121,121,121,.4)}
.mono-suggest-widget .mono-suggest-list::-webkit-scrollbar-thumb:hover{background:rgba(100,100,100,.7)}
.mono-suggest-widget .codicon{line-height:16px}
`;
  document.head.appendChild(s);
}

/** x-distance from the row's left edge to where the label text starts */
const LABEL_OFFSET = 4 /* row padding */ + 2 /* icon margin */ + 16 /* icon */ + 4 /* gap */;
const BORDER = 1;

export interface SuggestAnchor {
  /** x of the start of the word being completed (root-local CSS px) */
  x: number;
  /** y of the BOTTOM of the caret line */
  y: number;
  /** y of the TOP of the caret line (used when the widget flips above) */
  top?: number;
}

/**
 * VS Code-style suggest widget: content-sized floating list next to the caret.
 *  - label text lines up with the word being completed
 *  - right-hand type (keyword / method / …) in the same colour as the label
 *  - can be suspended (hidden) and resumed without losing the list / selection
 */
export class SuggestWidget {
  private host: HTMLElement;
  private el: HTMLDivElement | null = null;
  private listEl: HTMLDivElement | null = null;
  private rows: HTMLDivElement[] = [];
  private items: CompletionItem[] = [];
  private filter = '';
  private index = 0;
  private hoverIndex = -1;
  private suspended = false;
  private anchor: SuggestAnchor = { x: 0, y: 0 };
  private opts: SuggestWidgetOptions;
  private pal: Palette;
  private onAccept: (item: CompletionItem) => void;
  private onDismiss: () => void;

  constructor(
    host: HTMLElement,
    handlers: {
      onAccept: (item: CompletionItem) => void;
      onDismiss: () => void;
    },
    options?: SuggestWidgetOptions,
  ) {
    this.host = host;
    this.onAccept = handlers.onAccept;
    this.onDismiss = handlers.onDismiss;
    this.opts = {
      maxHeight: 150,
      maxWidth: 460,
      minWidth: 250,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 14,
      className: '',
      themeType: 'dark',
      ...options,
    };
    this.pal = this.resolvePalette();
  }

  setOptions(options: SuggestWidgetOptions): void {
    this.opts = { ...this.opts, ...options };
    this.pal = this.resolvePalette();
    if (this.el) {
      this.applyChrome();
      this.renderList();
      this.position();
    }
  }

  /** Widget exists (open), even if temporarily suspended */
  isVisible(): boolean {
    return !!this.el;
  }

  isSuspended(): boolean {
    return this.suspended;
  }

  show(items: CompletionItem[], anchor: SuggestAnchor, filter?: string): void {
    this.items = items;
    this.filter = filter || '';
    this.index = Math.max(0, items.findIndex((i) => i.preselect));
    this.hoverIndex = -1;
    this.suspended = false;
    this.anchor = anchor;
    ensureStyle();
    if (!this.el) this.build();
    this.el!.style.display = 'flex';
    this.renderList();
    this.position();
    this.scrollToSelected();
  }

  hide(): void {
    if (this.el) {
      this.el.remove();
      this.el = null;
      this.listEl = null;
    }
    this.rows = [];
    this.items = [];
    this.suspended = false;
  }

  /**
   * Hide/show without dropping the list or selection
   * (caret line scrolled out of the screen and back).
   */
  setSuspended(suspended: boolean): void {
    if (!this.el || this.suspended === suspended) return;
    this.suspended = suspended;
    this.el.style.display = suspended ? 'none' : 'flex';
    if (!suspended) this.position();
  }

  /** Follow the caret (scroll / resize). */
  reposition(anchor: SuggestAnchor): void {
    this.anchor = anchor;
    if (this.el && !this.suspended) this.position();
  }

  selectNext(): void {
    if (!this.items.length) return;
    this.setIndex((this.index + 1) % this.items.length);
    haptic('light');
  }

  selectPrev(): void {
    if (!this.items.length) return;
    this.setIndex((this.index - 1 + this.items.length) % this.items.length);
    haptic('light');
  }

  acceptSelected(): boolean {
    const item = this.items[this.index];
    if (!item) return false;
    this.onAccept(item);
    this.hide();
    return true;
  }

  dispose(): void {
    this.hide();
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private resolvePalette(): Palette {
    const o = this.opts;
    const c = o.themeColors ?? {};
    const base = o.themeType === 'light' ? LIGHT : DARK;
    const foreground =
      o.foreground ?? c['editorSuggestWidget.foreground'] ?? c['editorWidget.foreground'] ?? base.foreground;
    const iconColor = (key: string, fallback: string) =>
      c[`symbolIcon.${key}Foreground`] ?? fallback;
    const pick = (kind: number | undefined): string => {
      const key = ICON_KEY[kind ?? 0] ?? 'text';
      switch (key) {
        case 'method':
        case 'function':
        case 'constructor':
          return iconColor(key, base.method);
        case 'field':
        case 'variable':
        case 'interface':
        case 'enumMember':
          return iconColor(key, base.field);
        case 'class':
        case 'enum':
        case 'event':
          return iconColor(key, base.klass);
        default:
          return iconColor(key, base.iconDefault);
      }
    };
    return {
      background:
        o.background ?? c['editorSuggestWidget.background'] ?? c['editorWidget.background'] ?? base.background,
      border: o.border ?? `1px solid ${c['editorSuggestWidget.border'] ?? c['editorWidget.border'] ?? base.border}`,
      foreground,
      selectedBackground:
        o.selectedBackground ?? c['editorSuggestWidget.selectedBackground'] ?? c['list.activeSelectionBackground'] ?? base.selectedBackground,
      selectedForeground:
        o.selectedForeground ?? c['editorSuggestWidget.selectedForeground'] ?? c['list.activeSelectionForeground'] ?? base.selectedForeground,
      hoverBackground: o.hoverBackground ?? c['list.hoverBackground'] ?? base.hoverBackground,
      highlight:
        o.highlightForeground ?? c['editorSuggestWidget.highlightForeground'] ?? c['list.highlightForeground'] ?? base.highlight,
      focusHighlight:
        o.highlightForeground ?? c['editorSuggestWidget.focusHighlightForeground'] ?? c['list.focusHighlightForeground'] ?? base.focusHighlight,
      shadow: c['widget.shadow'] ?? base.shadow,
      icon: pick,
    };
  }

  private rowHeight(): number {
    return this.opts.rowHeight ?? Math.max(22, Math.round((this.opts.fontSize ?? 14) * 1.5));
  }

  private build(): void {
    const el = document.createElement('div');
    el.className = `mono-suggest-widget ${this.opts.className ?? ''}`.trim();
    el.setAttribute('role', 'listbox');
    Object.assign(el.style, {
      position: 'absolute',
      zIndex: '45',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      borderRadius: '3px',
      overflow: 'hidden',
      pointerEvents: 'auto',
      touchAction: 'manipulation',
      // Content-sized — NOT stretched to the editor width
      width: 'max-content',
      left: '0px',
      top: '0px',
    } as CSSStyleDeclaration);

    const list = document.createElement('div');
    list.className = 'mono-suggest-list';
    Object.assign(list.style, {
      overflowY: 'auto',
      overflowX: 'hidden',
      outline: 'none',
      overscrollBehavior: 'contain',
    });
    this.listEl = list;
    el.appendChild(list);
    list.addEventListener('pointerdown', (e) => e.stopPropagation());
    list.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    // keep editor focus (and the on-screen keyboard) when tapping the list
    el.addEventListener('mousedown', (e) => e.preventDefault());
    this.host.appendChild(el);
    this.el = el;
    this.applyChrome(el);
  }

  private applyChrome(el: HTMLElement = this.el!): void {
    const p = this.pal;
    el.style.background = p.background;
    el.style.border = p.border;
    el.style.color = p.foreground;
    el.style.fontFamily = this.opts.fontFamily!;
    el.style.fontSize = `${this.opts.fontSize}px`;
    el.style.minWidth = `${this.opts.minWidth}px`;
    el.style.boxShadow = `0 0 8px 2px ${p.shadow}`;
  }

  private position(): void {
    if (!this.el || !this.listEl) return;
    const hostW = this.host.clientWidth;
    const hostH = this.host.clientHeight;
    const { x, y } = this.anchor;
    const lineTop = this.anchor.top ?? y - this.rowHeight();
    const rowH = this.rowHeight();
    const gap = 2;

    this.el.style.maxWidth = `${Math.max(120, Math.min(this.opts.maxWidth!, hostW - 8))}px`;

    // Vertical: prefer below the caret line; use whichever side has more room
    const wanted = Math.min(this.opts.maxHeight!, this.items.length * rowH);
    const below = hostH - y - gap - 4;
    const above = lineTop - gap - 4;
    const placeBelow = below >= wanted + 2 * BORDER || below >= above;
    const avail = Math.max(rowH * 3, placeBelow ? below : above);
    this.listEl.style.maxHeight = `${Math.max(rowH, Math.min(this.opts.maxHeight!, avail - 2 * BORDER))}px`;

    const h = this.el.offsetHeight;
    const w = this.el.offsetWidth;
    const top = placeBelow ? y + gap : Math.max(4, lineTop - gap - h);
    // Horizontal: label text starts exactly under the word being completed
    let left = x - LABEL_OFFSET - BORDER;
    left = Math.min(left, hostW - w - 4);
    left = Math.max(4, left);

    this.el.style.left = `${Math.round(left)}px`;
    this.el.style.top = `${Math.round(top)}px`;
  }

  private setIndex(i: number): void {
    if (i === this.index) return;
    const prev = this.index;
    this.index = i;
    this.paintRow(prev);
    this.paintRow(i);
    this.scrollToSelected();
  }

  private scrollToSelected(): void {
    const list = this.listEl;
    const row = this.rows[this.index];
    if (!list || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }

  /** Row colours depend only on selected / hovered state — repaint just that row. */
  private paintRow(i: number): void {
    const row = this.rows[i];
    if (!row) return;
    const p = this.pal;
    const selected = i === this.index;
    row.setAttribute('aria-selected', selected ? 'true' : 'false');
    row.style.background = selected ? p.selectedBackground : i === this.hoverIndex ? p.hoverBackground : 'transparent';
    row.style.color = selected ? p.selectedForeground : p.foreground;
    const hl = selected ? p.focusHighlight : p.highlight;
    row.querySelectorAll<HTMLElement>('.mono-sg-hl').forEach((h) => (h.style.color = hl));
  }

  private renderList(): void {
    const list = this.listEl;
    if (!list) return;
    ensureCodicons();
    list.textContent = '';
    this.rows = [];
    const p = this.pal;
    const rowH = this.rowHeight();

    this.items.forEach((item, i) => {
      const row = document.createElement('div');
      row.setAttribute('role', 'option');
      Object.assign(row.style, {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        height: `${rowH}px`,
        lineHeight: `${rowH}px`,
        padding: '0 8px 0 4px',
        cursor: 'pointer',
        whiteSpace: 'pre',
      } as CSSStyleDeclaration);

      const icon = createIcon(kindToCodicon(item.kind), 16);
      Object.assign(icon.style, {
        width: '16px',
        height: '16px',
        flexShrink: '0',
        margin: '0 4px 0 2px',
        color: p.icon(item.kind),
      });

      // label — matched characters highlighted (bold, like VS Code)
      const lab = document.createElement('span');
      Object.assign(lab.style, {
        flex: '1 1 auto',
        minWidth: '0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      });
      const text = labelOf(item);
      const hits = matchIndexes(text, this.filter);
      if (!hits) {
        lab.textContent = text;
      } else {
        let run = '';
        let runHit = false;
        const flush = () => {
          if (!run) return;
          if (runHit) {
            const s = document.createElement('span');
            s.textContent = run;
            s.className = 'mono-sg-hl';
            s.style.fontWeight = 'bold';
            lab.appendChild(s);
          } else {
            lab.appendChild(document.createTextNode(run));
          }
          run = '';
        };
        for (let k = 0; k < text.length; k++) {
          const h = hits.has(k);
          if (h !== runHit) {
            flush();
            runHit = h;
          }
          run += text[k];
        }
        flush();
      }

      row.appendChild(icon);
      row.appendChild(lab);

      // right side: type / detail for EVERY row, same colour as the label
      const right = item.detail || kindLabel(item.kind);
      if (right) {
        const d = document.createElement('span');
        d.textContent = right;
        Object.assign(d.style, {
          flex: '0 1 auto',
          maxWidth: '60%',
          marginLeft: '16px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'right',
          fontSize: '85%',
        });
        // inherits the row colour (selected → white) unless an app override is set
        if (this.opts.detailForeground) d.style.color = this.opts.detailForeground;
        row.appendChild(d);
      }

      let startY = 0;
      let moved = false;
      row.addEventListener('pointerdown', (e) => {
        startY = e.clientY;
        moved = false;
        e.stopPropagation();
      });
      row.addEventListener('pointermove', (e) => {
        if (Math.abs(e.clientY - startY) > 4) moved = true;
      });
      row.addEventListener('pointerup', (e) => {
        if (moved) return; // it was a scroll
        e.preventDefault();
        e.stopPropagation();
        this.index = i;
        haptic('light');
        this.acceptSelected();
      });
      row.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        const prev = this.hoverIndex;
        this.hoverIndex = i;
        this.paintRow(prev);
        this.paintRow(i);
      });
      row.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (this.hoverIndex === i) {
          this.hoverIndex = -1;
          this.paintRow(i);
        }
      });

      list.appendChild(row);
      this.rows.push(row);
      this.paintRow(i);
    });
  }
}
