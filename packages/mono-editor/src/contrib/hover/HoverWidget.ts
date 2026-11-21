export interface HoverWidgetOptions {
  maxWidth?: number;
  background?: string;
  border?: string;
  foreground?: string;
  fontSize?: number;
  className?: string;
}

/**
 * Monaco-like hover card (markdown-ish plain text for v1).
 */
export class HoverWidget {
  private host: HTMLElement;
  private el: HTMLDivElement | null = null;
  private opts: Required<HoverWidgetOptions>;

  constructor(host: HTMLElement, options?: HoverWidgetOptions) {
    this.host = host;
    this.opts = {
      maxWidth: 360,
      background: '#252526',
      border: '1px solid #454545',
      foreground: '#cccccc',
      fontSize: 12,
      className: '',
      ...options,
    };
  }

  setOptions(o: HoverWidgetOptions): void {
    this.opts = { ...this.opts, ...o };
  }

  show(contents: string[], anchor: { x: number; y: number }): void {
    this.hide();
    const el = document.createElement('div');
    el.className = `mono-hover-widget ${this.opts.className}`.trim();
    Object.assign(el.style, {
      position: 'absolute',
      left: `${Math.max(4, anchor.x)}px`,
      top: `${Math.max(4, anchor.y)}px`,
      zIndex: '46',
      maxWidth: `${this.opts.maxWidth}px`,
      background: this.opts.background,
      border: this.opts.border,
      borderRadius: '6px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      padding: '8px 10px',
      color: this.opts.foreground,
      fontSize: `${this.opts.fontSize}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      pointerEvents: 'auto',
    } as CSSStyleDeclaration);
    el.textContent = contents.join('\n\n');
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.host.appendChild(el);
    this.el = el;
  }

  hide(): void {
    this.el?.remove();
    this.el = null;
  }

  dispose(): void {
    this.hide();
  }
}
