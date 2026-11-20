/**
 * Icons not available as standard codicons (or different size/style).
 * Register into the codicon API at module load.
 */
import { registerExtraIcon } from './codicons';

/** Context-menu style (24px material-like) — not in 16px codicon set */
const MENU_EXTRA = {
  'menu-copy':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
  'menu-cut':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z"/></svg>',
  'menu-paste':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/></svg>',
  'menu-select-all':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="24" height="24" fill="currentColor"><path d="M5 3C3.909 3 3 3.909 3 5V6H5V5H6V3H5ZM8 3V5H10V3H8ZM12 3V5H14V3H12ZM16 3V5H18V3H16ZM20 3V5H22V3H20ZM24 3V5H25V6H27V5C27 3.909 26.091 3 25 3H24ZM3 8V10H5V8H3ZM25 8V10H27V8H25ZM11 9C9.909 9 9 9.909 9 11V19C9 20.091 9.909 21 11 21H19C20.091 21 21 20.091 21 19V11C21 9.909 20.091 9 19 9H11ZM11 11H19V19H11V11ZM3 12V14H5V12H3ZM25 12V14H27V12H25ZM3 16V18H5V16H3ZM25 16V18H27V16H25ZM3 20V22H5V20H3ZM25 20V22H27V20H25ZM3 24V25C3 26.091 3.909 27 5 27H6V25H5V24H3ZM25 24V25H24V27H25C26.091 27 27 26.091 27 25V24H25ZM8 25V27H10V25H8ZM12 25V27H14V25H12ZM16 25V27H18V25H16ZM20 25V27H22V25H20Z"/></svg>',
} as const;

let registered = false;
export function ensureExtraIcons(): void {
  if (registered) return;
  registered = true;
  for (const [id, svg] of Object.entries(MENU_EXTRA)) {
    registerExtraIcon(id, svg);
  }
}

// Auto-register on import
ensureExtraIcons();
