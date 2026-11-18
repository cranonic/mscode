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

export interface MonoMenuItem {
  id: MonoMenuItemId;
  /** Inline SVG markup (icon only — no text label in default skin) */
  icon: string;
  /** Optional accessibility label */
  label?: string;
  enabled?: boolean | ((ctx: MonoMenuContext) => boolean);
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
  /** Extra CSS for the root container */
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
  selectAll: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c.9 0 2 .9 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm12 2h-2v2h2V5zm0 4h-2v2h2V9zm-2 14c1.1 0 2-.9 2-2h-2v2zm2-6h-2v2h2v-2zm-6 6h2v-2h-2v2zm2-12h2V7h-2v2zm0 4h2v-2h-2v2zm-4 8h2v-2h-2v2z"/></svg>',
};
