// Lightweight Emmet expand for HTML completions (no npm dep).
// Supports: tag, #id, .class, >, +, *N, [] attrs, {} text

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

export function isEmmetLike(token: string): boolean {
  if (!token || token.length > 80) return false;
  // plain tag or emmet operators
  return /^[a-zA-Z][\w:-]*(?:[#.[{][\w\-$.]*)*(?:[>+*][\w:#.\[\]{}()\-*$]*)*$/.test(token)
    || /^[a-zA-Z][\w:-]*$/.test(token);
}

export function expandEmmet(abbr: string): string | null {
  const s = String(abbr || '').trim().replace(/[\s;]+$/g, '');
  if (!s) return null;
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
  const gMul = s.match(/^\((.+)\)\*(\d+)$/);
  if (gMul) return { type: 'mul', count: +gMul[2], template: parse(gMul[1]) };
  if (s.startsWith('(') && s.endsWith(')')) return parse(s.slice(1, -1));

  const mul = s.match(/^(.*)\*(\d+)$/);
  if (mul && !mul[1].endsWith(')')) {
    return { type: 'mul', count: +mul[2], template: parseAtom(mul[1]) };
  }

  let i = 0;
  let tag = 'div';
  if (/^[a-zA-Z]/.test(s)) {
    const m = s.match(/^[a-zA-Z][\w:-]*/)!;
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
      const m = s.slice(i).match(/^[\w-]+/);
      if (m) { id = m[0]; i += m[0].length; }
    } else if (c === '.') {
      i++;
      const m = s.slice(i).match(/^[\w-]+/);
      if (m) { classes.push(m[0]); i += m[0].length; }
    } else if (c === '[') {
      const end = s.indexOf(']', i);
      if (end < 0) break;
      const inner = s.slice(i + 1, end).trim();
      if (inner) attrs.push(inner.includes('=') ? inner : `${inner}`);
      i = end + 1;
    } else if (c === '{') {
      const end = s.indexOf('}', i);
      if (end < 0) break;
      text = s.slice(i + 1, end);
      i = end + 1;
    } else break;
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
  if (n.classes?.length) attrParts.push(`class="${n.classes.join(' ')}"`);
  for (const a of n.attrs || []) {
    if (a.includes('=')) attrParts.push(a.replace(/^([^=]+)=(.+)$/, (_, k, v) => {
      const val = v.replace(/^["']|["']$/g, '');
      return `${k}="${val}"`;
    }));
    else attrParts.push(a);
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

/** Token left of cursor that looks like Emmet / tag name */
export function emmetTokenBefore(
  line: string,
  column: number, // 1-based monaco column
): { token: string; startColumn: number } | null {
  const left = line.slice(0, column - 1);
  // Don't treat as emmet inside/after an open tag name already started with <
  if (/<[\w:-]*$/.test(left)) return null;
  const m = left.match(/([a-zA-Z][a-zA-Z0-9_#.[\]{}()>+\-*$:]*)$/);
  if (!m) return null;
  return { token: m[1], startColumn: column - m[1].length };
}
