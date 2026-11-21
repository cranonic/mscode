import type { CompletionItem, CompletionItemKind } from '../../language/features';
import { CompletionItemKind as Kind } from '../../language/features';
import { attachPressFeedback, haptic } from '../../util/haptic';
import { createIcon, kindToCodicon, ensureCodicons } from '../../icons';

export interface SuggestWidgetOptions {
  maxHeight?: number;
  maxWidth?: number;
  fontFamily?: string;
  fontSize?: number;
  background?: string;
  border?: string;
  selectedBackground?: string;
  foreground?: string;
  detailForeground?: string;
  /** Extra class on root for app theming */
  className?: string;
}

const DEFAULTS: Required<SuggestWidgetOptions> = {
  maxHeight: 220,
  maxWidth: 460,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSize: 12.5,
  background: '#252526',
  border: '1px solid #454545',
  selectedBackground: '#094771',
  foreground: '#cccccc',
  detailForeground: '#858585',
  className: '',
};


function kindColor(k?: number): string {
  const colors: Record<number, string> = {
    1: '#b180d7', 2: '#b180d7', 5: '#75beff', 6: '#ee9d28',
    13: '#569cd6', 14: '#d7ba7d',
  };
  return colors[k ?? 0] ?? '#c5c5c5';
}
function highlightMatch(label: string, filter: string): string {
  if (!filter) return label;
  const idx = label.toLowerCase().indexOf(filter.toLowerCase());
  if (idx < 0) return label;
  const before = label.slice(0, idx);
  const match = label.slice(idx, idx + filter.length);
  const after = label.slice(idx + filter.length);
  return before + '<span style="color:#4fc1ff;font-weight:600">' + match + '</span>' + after;
}
function kindLabel(k?: number): string {
  if (k == null) return '';
  const names: Record<number, string> = {
    [Kind.Method]: 'method',
    [Kind.Function]: 'fn',
    [Kind.Variable]: 'var',
    [Kind.Class]: 'class',
    [Kind.Interface]: 'iface',
    [Kind.Property]: 'prop',
    [Kind.Keyword]: 'kw',
    [Kind.Snippet]: 'snip',
    [Kind.Text]: 'text',
    [Kind.Module]: 'mod',
    [Kind.Field]: 'field',
    [Kind.Constant]: 'const',
  };
  return names[k] ?? '';
}

function labelOf(item: CompletionItem): string {
  return typeof item.label === 'string' ? item.label : (item.label as any)?.label || '';
}

/**
 * Monaco-like suggest widget (floating list under caret).
 * Customizable via SuggestWidgetOptions / CSS className.
 */
export class SuggestWidget {
  private host: HTMLElement;
  private el: HTMLDivElement | null = null;
  private listEl: HTMLDivElement | null = null;
  private items: CompletionItem[] = [];
  private index = 0;
  private opts: Required<SuggestWidgetOptions>;
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
    this.opts = { ...DEFAULTS, ...options };
  }

  setOptions(options: SuggestWidgetOptions): void {
    this.opts = { ...this.opts, ...options };
    if (this.el) this.applyChrome();
  }

  isVisible(): boolean {
    return !!this.el;
  }

  show(items: CompletionItem[], anchor: { x: number; y: number }, filter?: string): void {
    this.items = items;
    (this as any)._filter = filter || "";
    this.index = Math.max(
      0,
      items.findIndex((i) => i.preselect),
    );
    if (this.index < 0) this.index = 0;
    if (!this.el) this.build();
    this.renderList();
    this.position(anchor.x, anchor.y);
  }

  hide(): void {
    if (this.el) {
      this.el.remove();
      this.el = null;
      this.listEl = null;
    }
    this.items = [];
  }

  selectNext(): void {
    if (!this.items.length) return;
    this.index = (this.index + 1) % this.items.length;
    this.renderList();
    haptic('light');
  }

  selectPrev(): void {
    if (!this.items.length) return;
    this.index = (this.index - 1 + this.items.length) % this.items.length;
    this.renderList();
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

  private build(): void {
    const el = document.createElement('div');
    el.className = `mono-suggest-widget ${this.opts.className}`.trim();
    el.setAttribute('role', 'listbox');
    Object.assign(el.style, {
      position: 'absolute',
      zIndex: '45',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      borderRadius: '4px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
      overflow: 'hidden',
      pointerEvents: 'auto',
      touchAction: 'manipulation',
    } as CSSStyleDeclaration);
    this.applyChrome(el);

    const list = document.createElement('div');
    Object.assign(list.style, {
      overflowY: 'auto',
      maxHeight: `${this.opts.maxHeight}px`,
      outline: 'none',
    });
    this.listEl = list;
    el.appendChild(list);
    list.addEventListener('pointerdown', (e) => e.stopPropagation());
    list.addEventListener('wheel', (e) => e.stopPropagation());
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.host.appendChild(el);
    this.el = el;
  }

  private applyChrome(el: HTMLElement = this.el!): void {
    el.style.background = this.opts.background;
    el.style.border = this.opts.border;
    el.style.fontFamily = this.opts.fontFamily;
    el.style.fontSize = `${this.opts.fontSize}px`;
    el.style.color = this.opts.foreground;
    el.style.maxWidth = `${this.opts.maxWidth}px`;
    el.style.minWidth = '280px';
  }

  private lastAnchor = { x: 0, y: 0 };

  private position(x: number, y: number): void {
    if (!this.el) return;
    this.lastAnchor = { x, y };
    const hostBox = this.host.getBoundingClientRect();
    const w = Math.min(this.opts.maxWidth, hostBox.width - 16);
    let left = x;
    let top = y + 2;
    // Prefer below caret; flip above if not enough room
    const h = Math.min(this.opts.maxHeight, this.el.offsetHeight || 120);
    if (top + h > hostBox.height - 4 && y - h > 4) {
      top = y - h - 2;
    }
    // Clamp horizontally but keep near caret
    if (left + w > hostBox.width - 4) left = Math.max(4, hostBox.width - w - 4);
    if (left < 4) left = 4;
    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
    this.el.style.width = `${w}px`;
  }

  /** Call on scroll so the widget stays near the caret. */
  reposition(x: number, y: number): void {
    if (this.el && this.el.style.display !== 'none') this.position(x, y);
  }

  private renderList(): void {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    this.items.forEach((item, i) => {
      const row = document.createElement('div');
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', i === this.index ? 'true' : 'false');
      Object.assign(row.style, {
        display: 'flex',
        alignItems: 'center',
        padding: '1px 10px',
        cursor: 'pointer',
        background: i === this.index ? this.opts.selectedBackground : 'transparent',
        whiteSpace: 'nowrap',
        height: '22px',
        boxSizing: 'border-box',
      });
      ensureCodicons();
      const kind = createIcon(kindToCodicon(item.kind), 16);
      Object.assign(kind.style, {
        width: '16px',
        height: '16px',
        flexShrink: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: kindColor(item.kind),
        marginRight: '3px',
      });
      const svg = kind.querySelector('svg');
      if (svg) {
        svg.style.width = '16px';
        svg.style.height = '16px';
      }
      const lab = document.createElement('span');
      const filter = (this as any)._filter || '';
      lab.innerHTML = highlightMatch(labelOf(item), filter);
      Object.assign(lab.style, {
        flex: '1',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        color: i === this.index ? '#ffffff' : '#cccccc',
        fontSize: '12.5px',
      });
      const detail = document.createElement('span');
      detail.textContent = item.detail ?? kindLabel(item.kind);
      Object.assign(detail.style, {
        color: i === this.index ? '#ffffff' : '#cccccc',
        fontSize: '11px',
        fontWeight: '400',
        opacity: '0.7',
        marginLeft: '8px',
        flexShrink: '0',
      });
      row.appendChild(kind);
      row.appendChild(lab);
      if (item.detail) row.appendChild(detail);
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
        if (moved) return; // was a scroll
        e.preventDefault();
        e.stopPropagation();
        this.index = i;
        this.acceptSelected();
      });
      attachPressFeedback(row, { scale: 0.98 });
      this.listEl!.appendChild(row);
      if (i === this.index) {
        row.scrollIntoView({ block: 'nearest' });
      }
    });
  }
}
