/**
 * Slice D tests — incremental TextModel + incremental/lazy tokenizer.
 *
 * Run (no test framework needed):
 *   cd packages/mono-editor && npx tsx tests/slice-d.test.mts
 *
 * Strategy: random edits, compare against a dumb reference every step.
 */
import assert from 'node:assert/strict';
import { TextModel } from '../src/core/TextModel';
import { TokenizationSupport } from '../src/language/TokenizationSupport';
import { registerDefaultLanguages } from '../src/language/registerDefaults';

registerDefaultLanguages();

// deterministic PRNG so failures are reproducible
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PIECES = [
  'a', 'bc', ' ', '\n', '\n\n', 'x\ny', '/*', '*/', '//', '"', '`', 'function f(){', '}', 'let n = 1;',
  '  ', '\t', '', 'é', '/* c */',
];

function refPos(text: string, offset: number) {
  const o = Math.max(0, Math.min(offset, text.length));
  const before = text.slice(0, o).split('\n');
  return { lineNumber: before.length, column: before[before.length - 1]!.length + 1 };
}

// ───────────────────────── TextModel vs reference ─────────────────────────
function testModel(seed: number, steps: number) {
  const r = rng(seed);
  const initial = Array.from({ length: 1 + Math.floor(r() * 30) }, () => PIECES[Math.floor(r() * PIECES.length)]).join('');
  const model = new TextModel(initial);
  let ref = initial;
  const versions: string[] = [initial];
  let versionIds = model.getVersionId();
  let seenChange: any[] = [];
  model.onDidChange((v, ch) => { seenChange.push([v, ch]); });

  for (let i = 0; i < steps; i++) {
    const a = Math.floor(r() * (ref.length + 3));           // may exceed length → must clamp
    const b = Math.min(ref.length + 2, a + Math.floor(r() * 12));
    const text = r() < 0.3 ? '' : PIECES[Math.floor(r() * PIECES.length)]! + (r() < 0.2 ? PIECES[Math.floor(r() * PIECES.length)] : '');
    const start = Math.min(a, ref.length);
    const end = Math.min(Math.max(b, start), ref.length);
    seenChange = [];
    const op = r();
    if (op < 0.4) {
      model.replaceRange(a, b, text);
      if (!(b <= a && text === '')) ref = ref.slice(0, start) + text + ref.slice(end);
    } else if (op < 0.7) {
      model.insert(a, text);
      ref = ref.slice(0, start) + text + ref.slice(start);
    } else {
      model.delete(a, b);
      if (b > a) ref = ref.slice(0, start) + ref.slice(end);
    }
    assert.equal(model.getValue(), ref, `seed ${seed} step ${i}: value`);
    assert.equal(model.getLineCount(), ref.split('\n').length, `seed ${seed} step ${i}: line count`);
    if (ref !== versions[versions.length - 1]) versions.push(ref);

    // positions / offsets must agree with reference + round-trip
    for (let k = 0; k < 4; k++) {
      const off = Math.floor(r() * (ref.length + 1));
      const p = model.getPositionAt(off);
      assert.deepEqual(p, refPos(ref, off), `seed ${seed} step ${i}: getPositionAt(${off})`);
      assert.equal(model.getOffsetAt(p.lineNumber, p.column), off, `seed ${seed} step ${i}: offset round-trip`);
    }
    // every change event must describe the real line delta
    for (const [, ch] of seenChange) {
      assert.ok(ch && ch.startLine >= 1 && ch.oldLineCount >= 1 && ch.newLineCount >= 1, 'change info');
    }
  }
  void versionIds;

  // undo everything → initial; redo everything → final
  const finalText = ref;
  let guard = 0;
  while (model.undoEntry() && guard++ < steps + 5) { /* keep undoing */ }
  assert.equal(model.getValue(), initial, `seed ${seed}: full undo`);
  guard = 0;
  while (model.redoEntry() && guard++ < steps + 5) { /* keep redoing */ }
  assert.equal(model.getValue(), finalText, `seed ${seed}: full redo`);
}

for (let seed = 1; seed <= 300; seed++) testModel(seed, 120);
console.log('✓ TextModel: 300 seeds × 120 random edits match reference (value, positions, undo/redo)');

// large paste (> splice-spread limit) + edit ranges spanning many lines
{
  const m = new TextModel('head\ntail');
  const big = Array.from({ length: 9000 }, (_, i) => 'line ' + i).join('\n');
  m.insert(4, '\n' + big);
  assert.equal(m.getLineCount(), 9002);
  assert.equal(m.getLineContent(9001), 'line 8999');
  m.delete(0, m.getValue().length - 4);
  assert.equal(m.getValue(), 'tail');
  m.undoEntry(); m.undoEntry();
  assert.equal(m.getValue(), 'head\ntail');
}
console.log('✓ TextModel: 9000-line paste / multi-line delete + undo');

// ───────────────────────── Tokenizer: incremental vs full ─────────────────────────
function tokensOf(tok: TokenizationSupport, model: TextModel, line: number) {
  return JSON.stringify(tok.getLineTokens(model, line));
}

function testTokenizer(seed: number, steps: number, language: string) {
  const r = rng(seed * 7919);
  const initial = Array.from({ length: 5 + Math.floor(r() * 40) }, () =>
    PIECES[Math.floor(r() * PIECES.length)]! + (r() < 0.5 ? '\n' : ''),
  ).join('');
  const model = new TextModel(initial, language);
  const inc = new TokenizationSupport();
  model.onDidChange((v, ch) => inc.applyChange(ch, v));
  // warm only part of the doc (lazy)
  inc.getLineTokens(model, Math.min(model.getLineCount(), 3));

  for (let i = 0; i < steps; i++) {
    const len = model.getValue().length;
    const a = Math.floor(r() * (len + 1));
    const b = Math.min(len, a + Math.floor(r() * 10));
    const t = r() < 0.25 ? '' : PIECES[Math.floor(r() * PIECES.length)]!;
    if (r() < 0.55) model.replaceRange(a, b, t);
    else if (r() < 0.5) model.insert(a, t);
    else model.delete(a, b);

    // ask for a random "viewport" (incremental, lazy) …
    const n = model.getLineCount();
    const lo = 1 + Math.floor(r() * n);
    const hi = Math.min(n, lo + Math.floor(r() * 12));
    const full = new TokenizationSupport();           // … and compare with a from-scratch tokenizer
    for (let l = lo; l <= hi; l++) {
      assert.equal(
        tokensOf(inc, model, l),
        tokensOf(full, model, l),
        `seed ${seed} step ${i} (${language}) line ${l}/${n}`,
      );
    }
    // occasionally undo / redo to exercise line-count changes in both directions
    if (r() < 0.15) { model.undoEntry(); }
    else if (r() < 0.1) { model.redoEntry(); }
  }
  // finally: whole document must match
  const full = new TokenizationSupport();
  for (let l = 1; l <= model.getLineCount(); l++) {
    assert.equal(tokensOf(inc, model, l), tokensOf(full, model, l), `seed ${seed} final line ${l}`);
  }
}

for (const lang of ['javascript', 'css', 'python', 'json', 'html', 'plaintext']) {
  for (let seed = 1; seed <= 60; seed++) testTokenizer(seed, 80, lang);
}
console.log('✓ Tokenizer: incremental+lazy == full re-tokenize (js/css/py/json/html/plaintext, 360 runs × 80 edits)');

// Directly: opening a block comment re-colors lines below; closing it restores them
{
  const model = new TextModel('let a = 1;\nlet b = 2;\nlet c = 3;\n// x', 'javascript');
  const tok = new TokenizationSupport();
  model.onDidChange((v, ch) => tok.applyChange(ch, v));
  const before = tokensOf(tok, model, 3);
  model.insert(0, '/*');                                   // line 1 now opens a comment
  assert.ok(JSON.parse(tokensOf(tok, model, 3))[0].type === 'comment', 'line 3 inside comment');
  model.delete(0, 2);
  assert.equal(tokensOf(tok, model, 3), before, 'line 3 restored after removing /*');
}
console.log('✓ Tokenizer: multi-line state propagates and stops correctly');

// Provider swap / language change must not serve stale tokens
{
  const model = new TextModel('def f():\n  return 1', 'python');
  const tok = new TokenizationSupport();
  const py = tokensOf(tok, model, 1);
  model.setLanguageId('plaintext');
  tok.invalidate();
  assert.equal(tokensOf(tok, model, 1), '[]');
  model.setLanguageId('python');
  assert.equal(tokensOf(tok, model, 1), py);
}
console.log('✓ Tokenizer: language change');

console.log('\nAll Slice D tests passed.');
