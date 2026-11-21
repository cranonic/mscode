/**
 * Icon system for mono-editor.
 * - Real codicons via local CSS/TTF (or CDN fallback)
 * - Custom SVG registration for app-specific icons
 */

const CUSTOM_SVG = new Map<string, string>();

/** Register a custom SVG icon. */
export function registerCustomIcon(id: string, svgMarkup: string): void {
  CUSTOM_SVG.set(id, svgMarkup);
}

/** Get custom SVG markup if registered. */
export function getCustomIcon(id: string): string | undefined {
  return CUSTOM_SVG.get(id);
}

/** Ensure codicon CSS is loaded (local first, then CDN). */
export function ensureCodicons(): void {
  if (document.querySelector('link[data-mono-codicon], link[href*="codicon"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/src/icons/codicons/codicon.css';
  link.setAttribute('data-mono-codicon', '1');
  link.onerror = () => {
    // fallback to CDN if local path fails
    link.href = 'https://cdn.jsdelivr.net/npm/@vscode/codicons/dist/codicon.css';
  };
  document.head.appendChild(link);
}

/**
 * Create an icon element.
 * - If custom SVG registered → inline SVG
 * - Else → <span class="codicon codicon-{id}">
 */
export function createIcon(id: string, size = 16): HTMLElement {
  const custom = CUSTOM_SVG.get(id);
  if (custom) {
    const wrap = document.createElement('span');
    wrap.innerHTML = custom;
    wrap.style.display = 'inline-flex';
    wrap.style.width = `${size}px`;
    wrap.style.height = `${size}px`;
    const svg = wrap.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));
    }
    return wrap;
  }
  ensureCodicons();
  const span = document.createElement('span');
  span.className = `codicon codicon-${id}`;
  span.style.fontSize = `${size}px`;
  span.style.width = `${size}px`;
  span.style.height = `${size}px`;
  span.style.display = 'inline-flex';
  span.style.alignItems = 'center';
  span.style.justifyContent = 'center';
  return span;
}

/** Map CompletionItemKind → codicon id */
export function kindToCodicon(kind?: number): string {
  const map: Record<number, string> = {
    0: 'symbol-text',
    1: 'symbol-method',
    2: 'symbol-function',
    3: 'symbol-class',
    4: 'symbol-field',
    5: 'symbol-variable',
    6: 'symbol-class',
    7: 'symbol-interface',
    8: 'symbol-module',
    9: 'symbol-property',
    12: 'symbol-enum',
    13: 'symbol-keyword',
    14: 'symbol-snippet',
    15: 'symbol-color',
    19: 'symbol-enum-member',
    20: 'symbol-constant',
    22: 'symbol-event',
  };
  return map[kind ?? 0] ?? 'symbol-text';
}


/** Compatibility: Find widget icon SVGs (can migrate to createIcon later). */
export const FIND_ICON_SVG = {
  caseSensitive: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3.3c.1-.4.8-.4.9 0l2 6 .1.3.1.3 1 3c.1.3-.1.6-.4.7-.3.1-.6-.1-.7-.4l-.9-2.7H2.9L2 13c-.1.3-.4.4-.7.3-.3-.1-.4-.4-.3-.7l1-3 .1-.3.1-.3 2-6zM3.2 9h2.6L4.5 5.1 3.2 9z"/><path d="M11.9 6.7c1.3.1 2.1.8 2.1 2v3.7c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-.1c-.7.4-1.3.6-1.8.6-1.2 0-2.2-.9-2.2-2.2 0-1.2.8-2 2.1-2.2.6-.1 1.3 0 1.9.1v-.7c0-.7-.4-1.1-1.2-1.1-.6 0-1.1.1-1.4.3-.2.2-.5.1-.7-.1s-.1-.5.1-.7c.4-.3 1-.5 1.8-.4z"/></svg>`,
  wholeWord: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15.5 12.5c.3 0 .5.2.5.5v.5c0 .8-.7 1.5-1.5 1.5h-13C.7 15 0 14.3 0 13.5V13c0-.3.2-.5.5-.5s.5.2.5.5v.5c0 .3.2.5.5.5h13c.3 0 .5-.2.5-.5V13c0-.3.2-.5.5-.5zM1 2h2v8H1V2zm12 0h2v8h-2V2z"/></svg>`,
  regex: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 2a.5.5 0 00-.5.5V5H7.5a.5.5 0 000 1H10v2.5a.5.5 0 001 0V6h2.5a.5.5 0 000-1H11V2.5a.5.5 0 00-.5-.5zM3 4.5A1.5 1.5 0 014.5 3h2A1.5 1.5 0 018 4.5v7A1.5 1.5 0 016.5 13h-2A1.5 1.5 0 013 11.5v-7zM4.5 4a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h2a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5h-2z"/></svg>`,
  replace: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 1h-11l-.5.5v3l.5.5h11l.5-.5v-3l-.5-.5zM13 4H3V2h10v2zm.5 2h-11l-.5.5v3l.5.5h11l.5-.5v-3l-.5-.5zM13 9H3V7h10v2zm.5 2h-11l-.5.5v3l.5.5h11l.5-.5v-3l-.5-.5zM13 14H3v-2h10v2z"/></svg>`,
  replaceAll: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm1 1v3h3V3H3zm6-1h5v5H9V2zm1 1v3h3V3h-3zM2 9h5v5H2V9zm1 1v3h3v-3H3zm6-1h5v5H9V9zm1 1v3h3v-3h-3z"/></svg>`,
  close: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 7.3L12.3 3l.7.7L8.7 8 13 12.3l-.7.7L8 8.7 3.7 13l-.7-.7L7.3 8 3 3.7l.7-.7L8 7.3z"/></svg>`,
  previous: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3l-5 5 5 5 .7-.7L4.4 8l4.3-4.3L8 3z"/></svg>`,
  next: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3l.7.7L4.4 8l4.3 4.3-.7.7-5-5 5-5z" transform="scale(-1,1) translate(-16,0)"/></svg>`,
  expand: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4 .7.7L8 11.4 3.3 6.7 4 6z"/></svg>`,
  collapse: () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 10l4-4 4 4-.7.7L8 7.4l-3.3 3.3L4 10z"/></svg>`,
};

/** Compatibility alias */
export function codicon(id: string): string {
  const custom = getCustomIcon(id);
  if (custom) return custom;
  return `<span class="codicon codicon-${id}"></span>`;
}

// Demo custom icon
registerCustomIcon(
  'demo-star',
  `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2 4.5 5 .5-3.5 3.5 1 5L8 12l-4.5 2.5 1-5L1 6l5-.5L8 1z"/></svg>`,
);


/** Alias for registerCustomIcon (backward compat). */
export function registerExtraIcon(id: string, svgMarkup: string): void {
  registerCustomIcon(id, svgMarkup);
}

export function hasIcon(id: string): boolean {
  return CUSTOM_SVG.has(id);
}

export function listCodicons(): string[] {
  return Array.from(CUSTOM_SVG.keys());
}

/** Alias used by FindWidget */
export const FIND_ICONS = FIND_ICON_SVG;

export type CodiconId = string;
