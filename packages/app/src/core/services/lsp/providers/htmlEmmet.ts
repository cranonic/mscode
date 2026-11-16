// Lightweight Emmet expand for HTML completions (no npm dep).
// Supports: tag, #id, .class, >, +, *N, [] attrs, {} text
// Implicit div: `#myid` → <div id="myid">, `.x` → <div class="x">

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

/** Common HTML5 tag names — used for bare-prefix completions (type `i` → img, input, …). */
export const HTML5_TAGS: readonly string[] = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd',
  'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'menu', 'meta', 'meter',
  'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'picture', 'pre', 'progress',
  'q',
  'rp', 'rt', 'ruby',
  's', 'samp', 'script', 'search', 'section', 'select', 'slot', 'small', 'source',
  'span', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time',
  'title', 'tr', 'track',
  'u', 'ul',
  'var', 'video',
  'wbr',
];

/** Tags whose name starts with prefix (case-insensitive). */
export function tagsMatchingPrefix(prefix: string): string[] {
  const p = (prefix || '').toLowerCase();
  if (!p || !/^[a-z][\w:-]*$/i.test(p)) return [];
  return HTML5_TAGS.filter((t) => t.startsWith(p));
}


/** Loose check — keep permissive so p>li*6 / #id / .class all qualify */
export function isEmmetLike(token: string): boolean {
  if (!token || token.length > 100) return false;
  // Must start like an Emmet abbr
  if (!/^[a-zA-Z.#]/.test(token)) return false;
  // Only Emmet alphabet (allow trailing operators while typing)
  if (!/^[a-zA-Z0-9_#.[\]{}()>+\-*$:]+$/.test(token)) return false;
  // Reject pure punctuation
  if (/^[.#>+*]+$/.test(token) && token !== '.') return false;
  return true;
}

export function expandEmmet(abbr: string): string | null {
  // Strip trailing incomplete operators (user still typing: p>li*6>)
  let s = String(abbr || '').trim().replace(/[\s;]+$/g, '');
  s = s.replace(/[>+]+$/g, '');
  if (!s || s === '.' || s === '#') {
    // `.` alone → empty class div; `#` alone → empty id div
    if (abbr.trim() === '.') return '<div class="$1">$0</div>';
    if (abbr.trim() === '#') return '<div id="$1">$0</div>';
    if (!s) return null;
  }
  try {
    return expandNode(parse(s), 0).replace(/\n$/, '');
  } catch {
    return null;
  }
}

function parse(s: string): any {
  const siblings = splitTop(s, '+');
  if (siblings.length > 1) {
    return { type: 'sib', kids: siblings.map(parse) };
  }
  const parts = splitTop(s, '>');
  if (parts.length > 1) {
    let root = parseAtom(parts[0]);
    let attach: any = root;
    for (let i = 1; i < parts.length; i++) {
      const child = parse(parts[i]);
      const host = deepest(attach);
      host.kids = host.kids || [];
      host.kids.push(child);
      attach = child;
    }
    return root;
  }
  return parseAtom(s);
}

function deepest(n: any): any {
  if (n.type === 'mul' && n.template) return deepest(n.template);
  if (n.type === 'sib' && n.kids?.length) return deepest(n.kids[n.kids.length - 1]);
  return n;
}

function splitTop(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    if (c === sep && depth === 0) {
      out.push(buf);
      buf = '';
    } else buf += c;
  }
  if (buf) out.push(buf);
  return out;
}

function parseAtom(s: string): any {
  s = s.trim();
  if (!s) return { type: 'tag', tag: 'div', id: '', classes: [], attrs: [], text: '', kids: [] };

  const gMul = s.match(/^\((.+)\)\*(\d+)$/);
  if (gMul) return { type: 'mul', count: +gMul[2], template: parse(gMul[1]) };
  if (s.startsWith('(') && s.endsWith(')')) return parse(s.slice(1, -1));

  const mul = s.match(/^(.*)\*(\d+)$/);
  if (mul && mul[1] !== '' && !mul[1].endsWith(')')) {
    return { type: 'mul', count: +mul[2], template: parseAtom(mul[1]) };
  }

  let i = 0;
  // Implicit div when abbr starts with # or .
  let tag = 'div';
  if (/^[a-zA-Z]/.test(s)) {
    const m = s.match(/^[a-zA-Z][\w:-]*/) as RegExpMatchArray;
    tag = m[0];
    i = tag.length;
  }

  let id = '';
  const classes: string[] = [];
  const attrs: string[] = [];
  let text = '';

  while (i < s.length) {
    const c = s[i];
    if (c === '#') {
      i++;
      const m = s.slice(i).match(/^[\w-]*/);
      if (m) {
        id = m[0];
        i += m[0].length;
      }
    } else if (c === '.') {
      i++;
      const m = s.slice(i).match(/^[\w-]*/);
      if (m) {
        // empty class still allowed (`.`)
        if (m[0]) classes.push(m[0]);
        else classes.push('');
        i += m[0].length;
      }
    } else if (c === '[') {
      const end = s.indexOf(']', i);
      if (end < 0) break;
      const inner = s.slice(i + 1, end).trim();
      if (inner) attrs.push(inner);
      i = end + 1;
    } else if (c === '{') {
      const end = s.indexOf('}', i);
      if (end < 0) break;
      text = s.slice(i + 1, end);
      i = end + 1;
    } else {
      break;
    }
  }

  return { type: 'tag', tag, id, classes, attrs, text, kids: [] as any[] };
}

function expandNode(n: any, indent: number): string {
  const pad = (x: number) => '  '.repeat(x);
  if (n.type === 'sib') {
    return (n.kids || []).map((k: any) => expandNode(k, indent)).join('\n');
  }
  if (n.type === 'mul') {
    const lines: string[] = [];
    for (let i = 0; i < n.count; i++) {
      lines.push(expandNode(n.template, indent));
    }
    return lines.join('\n');
  }

  const tag = n.tag || 'div';
  const attrParts: string[] = [];
  if (n.id) attrParts.push(`id="${n.id}"`);
  if (n.classes?.length) {
    const cls = n.classes.filter((c: string) => c !== undefined && c !== null).join(' ').trim();
    // Always emit class= for intentional `.` / `.x` (even empty class list from lone `.`)
    if (n.classes.length) attrParts.push(`class="${cls}"`);
  }
  for (const a of n.attrs || []) {
    if (a.includes('=')) {
      attrParts.push(a.replace(/^([^=]+)=(.+)$/, (_m: string, k: string, v: string) => {
        const val = v.replace(/^["']|["']$/g, '');
        return `${k}="${val}"`;
      }));
    } else {
      attrParts.push(a);
    }
  }
  const attrStr = attrParts.length ? ' ' + attrParts.join(' ') : '';

  if (VOID.has(tag.toLowerCase())) {
    return `${pad(indent)}<${tag}${attrStr}>`;
  }

  const kids = n.kids || [];
  const text = n.text || '';
  if (!kids.length && !text) {
    return `${pad(indent)}<${tag}${attrStr}>$0</${tag}>`;
  }
  if (!kids.length && text) {
    return `${pad(indent)}<${tag}${attrStr}>${text}</${tag}>`;
  }
  const inner = kids.map((k: any) => expandNode(k, indent + 1)).join('\n');
  const body = text ? `${pad(indent + 1)}${text}\n${inner}` : inner;
  return `${pad(indent)}<${tag}${attrStr}>\n${body}\n${pad(indent)}</${tag}>`;
}

/**
 * True when cursor is in element text content, e.g. `<p>hello|</p>`.
 * After a completed tag's `>` and not inside another tag.
 * VS Code does not offer Emmet for plain words here — only if user types
 * a real abbreviation (operators) or an extra `>` starts a new expression.
 */
export function isInsideHtmlTextContent(line: string, column: number): boolean {
  const left = line.slice(0, column - 1);
  const lastLt = left.lastIndexOf('<');
  const lastGt = left.lastIndexOf('>');
  // Still inside `<...` (tag / attrs) — not text content
  if (lastLt > lastGt) return false;
  // After some `>` → text content region (until next `<` on the right, ignored)
  if (lastGt >= 0 && lastGt > lastLt) return true;
  return false;
}

/**
 * Token left of cursor that looks like Emmet / tag / #id / .class
 * Must allow leading `#` and `.` (implicit div).
 *
 * Inside `<p>hello|</p>` plain `hello` is NOT Emmet (matches VS Code).
 * After an extra `>` e.g. `<p>hello>|` token can start again.
 */
export function emmetTokenBefore(
  line: string,
  column: number, // 1-based monaco column
): { token: string; startColumn: number } | null {
  const left = line.slice(0, column - 1);
  // Inside an HTML open tag name after `<` — leave to HTML LS
  if (/<[\w:-]*$/.test(left)) return null;

  // Allow start with letter, #, or .
  const m = left.match(/([a-zA-Z.#][a-zA-Z0-9_#.[\]{}()>+\-*$:]*)$/);
  if (!m) return null;
  const token = m[1];

  // In element text content (`<p>hello|</p>`): do NOT treat plain words as Emmet.
  // Allow if (a) token has operators / #. or (b) an extra `>` was typed before the token
  // e.g. `<p>hello>p|` — same as VS Code behavior.
  if (isInsideHtmlTextContent(line, column)) {
    const beforeTok = left.slice(0, left.length - token.length);
    const afterExtraGt = />$/.test(beforeTok) && !/<\/[\w:-]*$/.test(beforeTok);
    const intentional =
      /[.#>+*\[{]/.test(token) || token.startsWith('#') || token.startsWith('.');
    if (!intentional && !afterExtraGt) return null;
  }

  return { token, startColumn: column - token.length };
}
