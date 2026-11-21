import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import {
  DEFAULT_MENU_STYLE,
  MENU_ICONS,
  type MonoMenuContext,
  type MonoMenuItem,
  type MonoMenuShowOptions,
  type MonoMenuStyle,
} from './types';

/**
 * Default contribution set — Monaco-style:
 * copy/cut only when there is a selection; paste + selectAll always.
 * Apps can replace via setItems / addItem / removeItem.
 */
function defaultItems(): MonoMenuItem[] {
  return [
    {
      id: 'copy',
      icon: MENU_ICONS.copy,
      label: 'Copy',
      order: 10,
      visible: (ctx) => ctx.hasSelection(),
      enabled: (ctx) => ctx.hasSelection(),
      action: (ctx) => ctx.copy(),
    },
    {
      id: 'cut',
      icon: MENU_ICONS.cut,
      label: 'Cut',
      order: 20,
      visible: (ctx) => ctx.hasSelection(),
      enabled: (ctx) => ctx.hasSelection(),
      action: (ctx) => ctx.cut(),
    },
    {
      id: 'paste',
      icon: MENU_ICONS.paste,
      label: 'Paste',
      order: 30,
      action: (ctx) => ctx.paste(),
    },
    {
      id: 'selectAll',
      icon: MENU_ICONS.selectAll,
      label: 'Select all',
      order: 40,
      action: (ctx) => ctx.selectAll(),
    },
  ];
}

/**
 * Android-style floating icon toolbar.
 * Expandable: setItems / addItem / removeItem / setStyle.
 * Placement avoids teardrop handles when avoidBelowY is provided.
 */
export class ContextMenuController {
  private host: HTMLElement;
  private model: TextModel;
  private selection: SelectionState;
  private onEdit: () => void;
  private focusEditor: () => void;
  private items: MonoMenuItem[] = defaultItems();
  private style: typeof DEFAULT_MENU_STYLE = { ...DEFAULT_MENU_STYLE };
  private el: HTMLDivElement | null = null;
  private open = false;

  constructor(
    host: HTMLElement,
    model: TextModel,
    selection: SelectionState,
    onEdit: () => void,
    focusEditor: () => void,
  ) {
    this.host = host;
    this.model = model;
    this.selection = selection;
    this.onEdit = onEdit;
    this.focusEditor = focusEditor;
  }

  setItems(items: MonoMenuItem[]): void {
    this.items = items.map((i) => ({ ...i }));
    if (this.open) this.render();
  }

  getItems(): MonoMenuItem[] {
    return this.items.map((i) => ({ ...i }));
  }

  addItem(item: MonoMenuItem): void {
    const idx = this.items.findIndex((x) => x.id === item.id);
    if (idx >= 0) this.items[idx] = { ...item };
    else this.items.push({ ...item });
    if (this.open) this.render();
  }

  removeItem(id: string): void {
    this.items = this.items.filter((x) => x.id !== id);
    if (this.open) this.render();
  }

  setStyle(style: MonoMenuStyle): void {
    this.style = { ...this.style, ...style };
    if (this.open) this.render();
  }

  isOpen(): boolean {
    return this.open;
  }

  hide(): void {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
    this.open = false;
  }

  /**
   * @param localX host-local X (usually caret/selection edge)
   * @param localY host-local Y of line top (or caret top)
   * @param opts.avoidBelowY bottom of teardrop cluster — menu starts below this when flipped
   */
  showAt(localX: number, localY: number, opts?: MonoMenuShowOptions): void {
    this.hide();
    this.open = true;
    this.el = document.createElement('div');
    this.el.className = `mono-ctx-menu ${this.style.className || ''}`.trim();
    this.applyRootStyle(this.el);
    this.host.appendChild(this.el);
    this.render();

    // If nothing visible, don't leave an empty bar
    if (!this.el.childElementCount) {
      this.hide();
      return;
    }

    const pad = 8;
    const gap = opts?.gap ?? 8;
    const rect = this.host.getBoundingClientRect();
    const menu = this.el.getBoundingClientRect();

    if (opts?.placement) {
      const p = opts.placement(
        { width: menu.width, height: menu.height },
        { width: rect.width, height: rect.height },
      );
      this.el.style.left = `${p.left}px`;
      this.el.style.top = `${p.top}px`;
      return;
    }

    let left = localX - menu.width / 2;
    left = Math.max(pad, Math.min(left, rect.width - menu.width - pad));

    // Prefer above the caret/line
    let top = localY - menu.height - gap;
    if (top < pad) {
      // Flip below — start AFTER teardrop ends so handles stay tappable
      const belowFrom =
        opts?.avoidBelowY != null
          ? opts.avoidBelowY + gap
          : localY + 28 + gap; // fallback ~ line + drop
      top = belowFrom;
      // If still overflows bottom, clamp but keep as low-overlap as possible
      if (top + menu.height > rect.height - pad) {
        top = Math.max(pad, rect.height - menu.height - pad);
      }
    } else {
      top = Math.max(pad, top);
    }

    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  }

  dispose(): void {
    this.hide();
  }

  private applyRootStyle(el: HTMLDivElement): void {
    const s = this.style;
    Object.assign(el.style, {
      position: 'absolute',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.gap,
      padding: s.padding,
      background: s.background,
      border: s.border,
      borderRadius: s.borderRadius,
      boxShadow: s.shadow,
      zIndex: String(s.zIndex),
      pointerEvents: 'auto',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'manipulation',
    } as any);
  }

  private ctx(): MonoMenuContext {
    const self = this;
    return {
      getValue: () => self.model.getValue(),
      getSelectionText: () => self.getSelectionText(),
      hasSelection: () => !self.selection.isEmpty,
      copy: () => self.copy(),
      cut: () => self.cut(),
      paste: () => self.paste(),
      selectAll: () => self.selectAll(),
      focus: () => self.focusEditor(),
    };
  }

  private getSelectionText(): string {
    if (this.selection.isEmpty) return '';
    const a = this.selection.anchor;
    const b = this.selection.active;
    const aOff = this.model.getOffsetAt(a.lineNumber, a.column);
    const bOff = this.model.getOffsetAt(b.lineNumber, b.column);
    const start = Math.min(aOff, bOff);
    const end = Math.max(aOff, bOff);
    return this.model.getValue().slice(start, end);
  }

  private async copy(): Promise<void> {
    const text = this.getSelectionText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  private async cut(): Promise<void> {
    await this.copy();
    if (this.selection.isEmpty) return;
    const a = this.selection.anchor;
    const b = this.selection.active;
    const aOff = this.model.getOffsetAt(a.lineNumber, a.column);
    const bOff = this.model.getOffsetAt(b.lineNumber, b.column);
    const start = Math.min(aOff, bOff);
    const end = Math.max(aOff, bOff);
    this.model.delete(start, end);
    const pos = this.model.getPositionAt(start);
    this.selection.setCaret(pos.lineNumber, pos.column);
    this.onEdit();
  }

  private async paste(): Promise<void> {
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {
      return;
    }
    if (!text) return;
    if (!this.selection.isEmpty) {
      const a = this.selection.anchor;
      const b = this.selection.active;
      const aOff = this.model.getOffsetAt(a.lineNumber, a.column);
      const bOff = this.model.getOffsetAt(b.lineNumber, b.column);
      const start = Math.min(aOff, bOff);
      const end = Math.max(aOff, bOff);
      this.model.replaceRange(start, end, text);
      const pos = this.model.getPositionAt(start + text.length);
      this.selection.setCaret(pos.lineNumber, pos.column);
    } else {
      const off = this.model.getOffsetAt(
        this.selection.active.lineNumber,
        this.selection.active.column,
      );
      this.model.insert(off, text);
      const pos = this.model.getPositionAt(off + text.length);
      this.selection.setCaret(pos.lineNumber, pos.column);
    }
    this.onEdit();
  }

  private selectAll(): void {
    const last = this.model.getLineCount();
    const lastCol = this.model.getLineContent(last).length + 1;
    this.selection.anchor = { lineNumber: 1, column: 1 };
    this.selection.active = { lineNumber: last, column: lastCol };
    this.onEdit();
  }

  private render(): void {
    if (!this.el) return;
    this.el.innerHTML = '';
    const ctx = this.ctx();
    const sorted = [...this.items].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    const size = this.style.iconSize;

    for (const item of sorted) {
      const visible =
        typeof item.visible === 'function' ? item.visible(ctx) : item.visible !== false;
      if (!visible) continue;
      const enabled =
        typeof item.enabled === 'function' ? item.enabled(ctx) : item.enabled !== false;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = item.label || String(item.id);
      btn.setAttribute('aria-label', item.label || String(item.id));
      btn.dataset.menuId = String(item.id);
      Object.assign(btn.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size + 12}px`,
        height: `${size + 12}px`,
        padding: '0',
        margin: '0',
        border: 'none',
        borderRadius: '8px',
        background: 'transparent',
        color: this.style.iconColor,
        opacity: enabled ? '1' : String(this.style.disabledOpacity),
        cursor: enabled ? 'pointer' : 'default',
        pointerEvents: enabled ? 'auto' : 'none',
      } as any);
      btn.innerHTML = item.icon;
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        (svg as SVGElement).style.display = 'block';
      }
      btn.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      });
      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (!enabled) return;
        try {
          if (item.action) await item.action(ctx);
          else if (item.id === 'copy') await ctx.copy();
          else if (item.id === 'cut') await ctx.cut();
          else if (item.id === 'paste') await ctx.paste();
          else if (item.id === 'selectAll') ctx.selectAll();
        } finally {
          if (item.id === 'cut' || item.id === 'paste') this.hide();
          else this.render();
          this.focusEditor();
        }
      });
      this.el.appendChild(btn);
    }
  }
}
