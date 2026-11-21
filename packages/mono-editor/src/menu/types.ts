/** Built-in + custom menu item ids */
export type MonoMenuItemId = 'copy' | 'cut' | 'paste' | 'selectAll' | (string & {});

export interface MonoMenuContext {
  getValue(): string;
  getSelectionText(): string;
  hasSelection(): boolean;
  copy(): Promise<void> | void;
  cut(): Promise<void> | void;
  paste(): Promise<void> | void;
  selectAll(): void;
  focus(): void;
}

/**
 * Monaco-style contribution item.
 * - `visible` / `enabled` can be predicates → dynamic menus
 * - `addItem` / `removeItem` / `setItems` on the editor API
 */
export interface MonoMenuItem {
  id: MonoMenuItemId;
  /** Inline SVG markup (icon only — no text label in default skin) */
  icon: string;
  /** Optional accessibility label */
  label?: string;
  enabled?: boolean | ((ctx: MonoMenuContext) => boolean);
  /** Hide entirely (preferred over disabled for copy/cut when empty) */
  visible?: boolean | ((ctx: MonoMenuContext) => boolean);
  /** Custom handler; built-ins have defaults if omitted */
  action?: (ctx: MonoMenuContext) => void | Promise<void>;
  /** Sort order ascending (default 100) */
  order?: number;
}

export interface MonoMenuStyle {
  background?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  gap?: string;
  shadow?: string;
  iconSize?: number;
  iconColor?: string;
  disabledOpacity?: number;
  zIndex?: number;
  className?: string;
}

export const DEFAULT_MENU_STYLE: Required<Omit<MonoMenuStyle, 'className'>> & {
  className: string;
} = {
  background: '#2d2d2d',
  border: '1px solid #3c3c3c',
  borderRadius: '10px',
  padding: '6px 8px',
  gap: '4px',
  shadow: '0 4px 16px rgba(0,0,0,0.45)',
  iconSize: 22,
  iconColor: '#e0e0e0',
  disabledOpacity: 0.35,
  zIndex: 50,
  className: '',
};

/** Material-like path icons (24 viewBox) */
export const MENU_ICONS = {
  copy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
  cut: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z"/></svg>',
  paste: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/></svg>',
  selectAll: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="currentColor"><path d="M5 3C3.909 3 3 3.909 3 5V6H5V5H6V3H5ZM8 3V5H10V3H8ZM12 3V5H14V3H12ZM16 3V5H18V3H16ZM20 3V5H22V3H20ZM24 3V5H25V6H27V5C27 3.909 26.091 3 25 3H24ZM3 8V10H5V8H3ZM25 8V10H27V8H25ZM11 9C9.909 9 9 9.909 9 11V19C9 20.091 9.909 21 11 21H19C20.091 21 21 20.091 21 19V11C21 9.909 20.091 9 19 9H11ZM11 11H19V19H11V11ZM3 12V14H5V12H3ZM25 12V14H27V12H25ZM3 16V18H5V16H3ZM25 16V18H27V16H25ZM3 20V22H5V20H3ZM25 20V22H27V20H25ZM3 24V25C3 26.091 3.909 27 5 27H6V25H5V24H3ZM25 24V25H24V27H25C26.091 27 27 26.091 27 25V24H25ZM8 25V27H10V25H8ZM12 25V27H14V25H12ZM16 25V27H18V25H16ZM20 25V27H22V25H20Z"/></svg>',
};

/** Options when placing the floating toolbar */
export interface MonoMenuShowOptions {
  /**
   * Y (host-local) below which the menu must start when flipped under the caret.
   * Pass the bottom of the lowest teardrop so the toolbar never covers handles.
   */
  avoidBelowY?: number;
  /** Extra gap between teardrop/caret and menu (default 8) */
  gap?: number;
  /**
   * Full control over placement. Receives the measured menu size and host
   * size (CSS px) and returns host-local left/top. When set, `avoidBelowY`
   * and the default above/below heuristic are ignored.
   */
  placement?: (
    menu: { width: number; height: number },
    host: { width: number; height: number },
  ) => { left: number; top: number };
}
