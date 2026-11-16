import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type { ViewController } from '../view/ViewController';
import type { RenderMetrics, TeardropHit } from '../render/CanvasRenderer';

/**
 * Touch + mouse with Android-like fling physics.
 * Long-press → selection mode; double-tap → select word.
 */
export class PointerController {
  private root: HTMLElement;
  private model: TextModel;
  private selection: SelectionState;
  private view: ViewController;
  private getMetrics: () => RenderMetrics;
  private getTeardrops: () => TeardropHit[];
  private onInteract: (kind: 'tap' | 'scroll' | 'select' | 'handle') => void;
  private disposed = false;

  private active = false;
  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private lastT = 0;
  private startScrollTop = 0;
  private startScrollLeft = 0;
  private moved = false;
  private selecting = false;
  private handleDrag: TeardropHit['type'] | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressFired = false;

  // velocity samples (px/ms)
  private vx = 0;
  private vy = 0;
  private samples: { t: number; x: number; y: number }[] = [];

  // fling
  private flingRaf = 0;
  private flingVx = 0;
  private flingVy = 0;
  private flingLastT = 0;

  // double-tap
  private lastTapT = 0;
  private lastTapX = 0;
  private lastTapY = 0;

  private static readonly MOVE_THRESH = 8;
  private static readonly LONG_MS = 380;
  private static readonly DOUBLE_MS = 320;
  private static readonly DOUBLE_DIST = 28;
  private static readonly FRICTION = 0.0028; // per ms damping factor approx
  private static readonly MIN_FLING = 0.15; // px/ms

  constructor(
    root: HTMLElement,
    model: TextModel,
    selection: SelectionState,
    view: ViewController,
    getMetrics: () => RenderMetrics,
    getTeardrops: () => TeardropHit[],
    onInteract: (kind: 'tap' | 'scroll' | 'select' | 'handle') => void,
  ) {
    this.root = root;
    this.model = model;
    this.selection = selection;
    this.view = view;
    this.getMetrics = getMetrics;
    this.getTeardrops = getTeardrops;
    this.onInteract = onInteract;

    root.style.touchAction = 'none';
    root.addEventListener('pointerdown', this.onDown, { passive: false });
    root.addEventListener('pointermove', this.onMove, { passive: false });
    root.addEventListener('pointerup', this.onUp);
    root.addEventListener('pointercancel', this.onUp);
    root.addEventListener('lostpointercapture', this.onUp);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearLongPress();
    this.stopFling();
    this.root.removeEventListener('pointerdown', this.onDown);
    this.root.removeEventListener('pointermove', this.onMove);
    this.root.removeEventListener('pointerup', this.onUp);
    this.root.removeEventListener('pointercancel', this.onUp);
    this.root.removeEventListener('lostpointercapture', this.onUp);
  }

  hitTest(clientX: number, clientY: number): { lineNumber: number; column: number } {
    const rect = this.root.getBoundingClientRect();
    const m = this.getMetrics();
    const x = clientX - rect.left + this.view.scrollLeft;
    const y = clientY - rect.top + this.view.scrollTop - m.paddingTop;
    const lineNumber = Math.max(
      1,
      Math.min(this.model.getLineCount(), Math.floor(y / m.lineHeight) + 1),
    );
    const textX = x - m.gutterWidth - m.paddingLeft;
    const line = this.model.getLineContent(lineNumber);
    let column = Math.floor(textX / Math.max(1, m.charWidth)) + 1;
    column = Math.max(1, Math.min(line.length + 1, column));
    return { lineNumber, column };
  }

  /** Select word under position (double-tap). */
  selectWordAt(clientX: number, clientY: number): void {
    const pos = this.hitTest(clientX, clientY);
    const line = this.model.getLineContent(pos.lineNumber);
    if (!line.length) {
      this.selection.setCaret(pos.lineNumber, 1);
      return;
    }
    const idx = Math.max(0, Math.min(line.length - 1, pos.column - 1));
    const isWord = (ch: string) => /[A-Za-z0-9_$]/.test(ch);
    let start = idx;
    let end = idx;
    if (!isWord(line[idx]!)) {
      // select single non-word char
      this.selection.anchor = { lineNumber: pos.lineNumber, column: idx + 1 };
      this.selection.active = { lineNumber: pos.lineNumber, column: idx + 2 };
      return;
    }
    while (start > 0 && isWord(line[start - 1]!)) start--;
    while (end < line.length - 1 && isWord(line[end + 1]!)) end++;
    this.selection.anchor = { lineNumber: pos.lineNumber, column: start + 1 };
    this.selection.active = { lineNumber: pos.lineNumber, column: end + 2 };
  }

  private hitTeardrop(clientX: number, clientY: number): TeardropHit | null {
    const rect = this.root.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const pad = 14;
    for (const t of this.getTeardrops()) {
      if (x >= t.x - pad && x <= t.x + t.w + pad && y >= t.y - pad && y <= t.y + t.h + pad) {
        return t;
      }
    }
    return null;
  }

  private stopFling(): void {
    if (this.flingRaf) {
      cancelAnimationFrame(this.flingRaf);
      this.flingRaf = 0;
    }
    this.flingVx = 0;
    this.flingVy = 0;
  }

  private startFling(vx: number, vy: number): void {
    this.stopFling();
    // finger move up → content up → scrollTop increases → velocity sign:
    // we tracked dy of finger; scroll used startScroll - dy, so fling scroll vel = -fingerVel
    this.flingVx = -vx;
    this.flingVy = -vy;
    if (
      Math.abs(this.flingVx) < PointerController.MIN_FLING &&
      Math.abs(this.flingVy) < PointerController.MIN_FLING
    ) {
      return;
    }
    this.flingLastT = performance.now();
    const step = (now: number) => {
      if (this.disposed) return;
      const dt = Math.min(32, now - this.flingLastT);
      this.flingLastT = now;
      // exponential friction ~ Android OverScroller
      const damp = Math.exp(-PointerController.FRICTION * dt * 60);
      this.flingVx *= damp;
      this.flingVy *= damp;

      this.view.scrollLeft = Math.max(0, this.view.scrollLeft + this.flingVx * dt);
      this.view.scrollTop = Math.max(0, this.view.scrollTop + this.flingVy * dt);
      this.view.clampScrollPublic();
      this.view.paint();
      this.onInteract('scroll');

      if (
        Math.abs(this.flingVx) < PointerController.MIN_FLING &&
        Math.abs(this.flingVy) < PointerController.MIN_FLING
      ) {
        this.flingRaf = 0;
        return;
      }
      this.flingRaf = requestAnimationFrame(step);
    };
    this.flingRaf = requestAnimationFrame(step);
  }

  private pushSample(x: number, y: number, t: number): void {
    this.samples.push({ t, x, y });
    // keep ~100ms window
    while (this.samples.length > 1 && t - this.samples[0]!.t > 100) {
      this.samples.shift();
    }
  }

  private computeVelocity(): { vx: number; vy: number } {
    if (this.samples.length < 2) return { vx: 0, vy: 0 };
    const a = this.samples[0]!;
    const b = this.samples[this.samples.length - 1]!;
    const dt = Math.max(1, b.t - a.t);
    return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
  }

  private onDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    // Tap while flinging → stop (Android behavior)
    this.stopFling();

    this.active = true;
    this.pointerId = e.pointerId;
    this.startX = this.lastX = e.clientX;
    this.startY = this.lastY = e.clientY;
    this.lastT = performance.now();
    this.startScrollTop = this.view.scrollTop;
    this.startScrollLeft = this.view.scrollLeft;
    this.moved = false;
    this.selecting = e.shiftKey;
    this.handleDrag = null;
    this.longPressFired = false;
    this.samples = [];
    this.pushSample(e.clientX, e.clientY, this.lastT);

    const hit = this.hitTeardrop(e.clientX, e.clientY);
    if (hit) {
      this.handleDrag = hit.type;
      this.selecting = hit.type !== 'cursor';
    }

    try { this.root.setPointerCapture(e.pointerId); } catch { /* */ }

    this.clearLongPress();
    if (!this.handleDrag) {
      const sx = e.clientX;
      const sy = e.clientY;
      this.longPressTimer = setTimeout(() => {
        if (!this.active || this.moved || this.handleDrag) return;
        this.longPressFired = true;
        this.selecting = true;
        // seed selection at press point; drag will extend
        const pos = this.hitTest(sx, sy);
        this.selection.setCaret(pos.lineNumber, pos.column);
        // haptic if available
        try { navigator.vibrate?.(12); } catch { /* */ }
        this.view.paint();
        this.onInteract('select');
      }, PointerController.LONG_MS);
    }
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.active || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    const now = performance.now();
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    if (!this.moved && Math.hypot(dx, dy) > PointerController.MOVE_THRESH) {
      this.moved = true;
      this.clearLongPress();
    }
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastT = now;
    this.pushSample(e.clientX, e.clientY, now);

    if (this.handleDrag) {
      const pos = this.hitTest(e.clientX, e.clientY);
      if (this.handleDrag === 'cursor') {
        this.selection.setCaret(pos.lineNumber, pos.column);
      } else if (this.handleDrag === 'start') {
        this.selection.anchor = { lineNumber: pos.lineNumber, column: pos.column };
      } else {
        this.selection.moveActive(pos.lineNumber, pos.column, true);
      }
      this.view.ensureCaretVisible();
      this.view.paint();
      this.onInteract('handle');
      return;
    }

    if (this.selecting || this.longPressFired) {
      const pos = this.hitTest(e.clientX, e.clientY);
      this.selection.moveActive(pos.lineNumber, pos.column, true);
      this.view.ensureCaretVisible();
      this.view.paint();
      this.onInteract('select');
      return;
    }

    if (this.moved) {
      this.view.scrollTop = Math.max(0, this.startScrollTop - dy);
      this.view.scrollLeft = Math.max(0, this.startScrollLeft - dx);
      this.view.clampScrollPublic();
      this.view.paint();
      this.onInteract('scroll');
    }
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.active || (this.pointerId !== null && e.pointerId !== this.pointerId)) return;
    this.clearLongPress();
    const wasSelecting = this.selecting || this.longPressFired;
    const wasMoved = this.moved;
    const wasHandle = this.handleDrag;
    this.active = false;
    this.pointerId = null;
    this.handleDrag = null;

    if (wasHandle) {
      this.onInteract('handle');
      return;
    }

    // end of pan → fling
    if (wasMoved && !wasSelecting) {
      this.pushSample(e.clientX, e.clientY, performance.now());
      const { vx, vy } = this.computeVelocity();
      this.startFling(vx, vy);
      this.onInteract('scroll');
      return;
    }

    if (this.longPressFired) {
      // selection already active; leave as-is
      this.onInteract('select');
      return;
    }

    if (!wasMoved && !wasSelecting) {
      const now = performance.now();
      const dist = Math.hypot(e.clientX - this.lastTapX, e.clientY - this.lastTapY);
      const isDouble =
        now - this.lastTapT < PointerController.DOUBLE_MS &&
        dist < PointerController.DOUBLE_DIST;

      if (isDouble) {
        this.selectWordAt(e.clientX, e.clientY);
        this.view.paint();
        this.onInteract('select');
        this.lastTapT = 0; // prevent triple as double
      } else {
        const pos = this.hitTest(e.clientX, e.clientY);
        this.selection.setCaret(pos.lineNumber, pos.column);
        this.view.paint();
        this.onInteract('tap');
        this.lastTapT = now;
        this.lastTapX = e.clientX;
        this.lastTapY = e.clientY;
      }
    } else if (wasSelecting) {
      this.onInteract('select');
    }
  };

  private clearLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}
