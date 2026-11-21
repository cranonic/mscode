import type { CompletionItem, CompletionItemKind } from '../../language/features';
import { CompletionItemKind as Kind } from '../../language/features';
import { attachPressFeedback, haptic } from '../../util/haptic';

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
  maxHeight: 280,
  maxWidth: 420,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 13,
  background: '#252526',
  border: '1px solid #454545',
  selectedBackground: '#04395e',
  foreground: '#cccccc',
  detailForeground: '#808080',
  className: '',
};

function kindLabel(k?: CompletionItemKind): string {
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

  show(items: CompletionItem[], anchor: { x: number; y: number }): void {
    this.items = items;
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
      borderRadius: '6px',
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
    el.style.minWidth = '180px';
  }

  private position(x: number, y: number): void {
    if (!this.el) return;
    const hostBox = this.host.getBoundingClientRect();
    const maxW = this.opts.maxWidth;
    let left = x;
    let top = y + 4;
    // keep on screen inside host
    if (left + maxW > hostBox.width - 8) left = Math.max(8, hostBox.width - maxW - 8);
    if (left < 4) left = 4;
    if (top + this.opts.maxHeight > hostBox.height - 8) {
      top = Math.max(4, y - this.opts.maxHeight - 4);
    }
    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
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
        gap: '8px',
        padding: '4px 10px',
        cursor: 'pointer',
        background: i === this.index ? this.opts.selectedBackground : 'transparent',
        whiteSpace: 'nowrap',
      });
      const kind = document.createElement('span');
      kind.textContent = kindLabel(item.kind);
      Object.assign(kind.style, {
        fontSize: '10px',
        color: this.opts.detailForeground,
        width: '36px',
        flexShrink: '0',
        textTransform: 'uppercase',
      });
      const lab = document.createElement('span');
      lab.textContent = labelOf(item);
      lab.style.flex = '1';
      lab.style.overflow = 'hidden';
      lab.style.textOverflow = 'ellipsis';
      const detail = document.createElement('span');
      detail.textContent = item.detail ?? '';
      Object.assign(detail.style, {
        color: this.opts.detailForeground,
        fontSize: '12px',
        marginLeft: '8px',
      });
      row.appendChild(kind);
      row.appendChild(lab);
      if (item.detail) row.appendChild(detail);
      row.addEventListener('pointerdown', (e) => {
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
