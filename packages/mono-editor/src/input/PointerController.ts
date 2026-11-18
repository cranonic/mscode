import type { TextModel } from '../core/TextModel';
import type { SelectionState } from '../core/Selection';
import type { ViewController } from '../view/ViewController';
import type { RenderMetrics, TeardropHit } from '../render/CanvasRenderer';

/**
 * Touch + mouse for mono-editor canvas.
 *
 * - Smooth axis-locked touch scroll with zero-jump threshold anchoring + rAF coalesced painting.
 * - Clean velocity sampling for jitter-free fling.
 * - Directional teardrop hitbox + free teardrop drag with sticky-line hysteresis.
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
  private scrollAnchorX = 0;
  private scrollAnchorY = 0;
  private startScrollTop = 0;
  private startScrollLeft = 0;
  private scrollAxis: 'none' | 'x' | 'y' = 'none';
  private maxDist = 0;
  private scrolling = false;
  private selecting = false;

  // Free teardrop drag state
  private handleDrag: TeardropHit['type'] | null = null;
  private handleMoved = false;
  private handleLift = 26;
  private stickyLine: number | null = null;
  private dragAnchor: { lineNumber: number; column: number } | null = null;
  private autoScrollRaf = 0;
  private autoScrollDelta = 0;

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressFired = false;
  private longPressX = 0;
  private longPressY = 0;

  private samples: { t: number; x: number; y: number }[] = [];
  private flingRaf = 0;
  private flingVx = 0;
  private flingVy = 0;
  private flingLastT = 0;

  // Double-tap state
  private lastTapT = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  private pendingDouble = false;
  private singleTapTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly TAP_SLOP = 14;
  private static readonly SCROLL_THRESH = 10;
  private static readonly HANDLE_MOVE_THRESH = 3;
  private static readonly LONG_MS = 450;
  private static readonly DOUBLE_MS = 400;
  private static readonly DOUBLE_DIST = 36;
  private static readonly FRICTION_PER_MS = 0.0028;
  private static readonly MIN_FLING_START = 0.25;
  private static readonly MIN_FLING_STOP = 0.03;
  private static readonly MAX_FLING = 6.5;
  private static readonly AXIS_LOCK_RATIO = 1.25;
  private static readonly LINE_SWITCH_DOWN = 0.42;
  private static readonly LINE_SWITCH_UP = 0.51;
  private static readonly AUTO_SCROLL_EDGE = 56;
  private static readonly AUTO_SCROLL_SPEED = 12;

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
    this.clearSingleTap();
    this.stopFling();
    this.stopAutoScroll();
    this.view.freeHandle = null;
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
    const textX = x - this.view.contentLeft - m.paddingLeft;
    const line = this.model.getLineContent(lineNumber);
    let column = Math.floor(textX / Math.max(1, m.charWidth)) + 1;
    column = Math.max(1, Math.min(line.length + 1, column));
    return { lineNumber, column };
  }

  private posFromHandleFree(clientX: number, clientY: number): {
    lineNumber: number;
    column: number;
  } {
    const rect = this.root.getBoundingClientRect();
    const m = this.getMetrics();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const caretMidY = localY - this.handleLift - m.lineHeight * 0.45;
    const sticky = this.stickyLine ?? this.hitTest(clientX, clientY).lineNumber;
    const lineMidY =
      m.paddingTop + (sticky - 1) * m.lineHeight - this.view.scrollTop + m.lineHeight / 2;
    const dy = caretMidY - lineMidY;

    let nextLine = sticky;
    if (dy > m.lineHeight * PointerController.LINE_SWITCH_DOWN) {
      nextLine = Math.min(this.model.getLineCount(), sticky + 1);
    } else if (dy < -m.lineHeight * PointerController.LINE_SWITCH_UP) {
      nextLine = Math.max(1, sticky - 1);
    }
    this.stickyLine = nextLine;

    const textX = localX + this.view.scrollLeft - this.view.contentLeft - m.paddingLeft;
    const lineLen = this.model.getLineContent(nextLine).length;
    const column = Math.max(
      1,
      Math.min(lineLen + 1, Math.round(textX / Math.max(1, m.charWidth)) + 1),
    );
    return { lineNumber: nextLine, column };
  }

  private updateHandleDrag(clientX: number, clientY: number, immediate = false): void {
    if (!this.handleDrag) return;
    const rect = this.root.getBoundingClientRect();
    const pos = this.posFromHandleFree(clientX, clientY);

    let visualType: TeardropHit['type'] = this.handleDrag;

    if (this.handleDrag === 'cursor') {
      this.selection.setCaret(pos.lineNumber, pos.column);
    } else if (this.dragAnchor) {
      const anchor = this.dragAnchor;
      if (pos.lineNumber !== anchor.lineNumber || pos.column !== anchor.column) {
        this.selection.anchor = { ...anchor };
        this.selection.active = pos;
      }
      const posBeforeAnchor =
        pos.lineNumber < anchor.lineNumber ||
        (pos.lineNumber === anchor.lineNumber && pos.column <= anchor.column);
      visualType = posBeforeAnchor ? 'start' : 'end';
    }

    this.view.freeHandle = {
      type: visualType,
      x: clientX - rect.left,
      y: clientY - rect.top - this.handleLift,
    };

    if (immediate) this.view.schedulePaint();
    else this.view.schedulePaint();
    this.onInteract('handle');
  }

  private ensureAutoScroll(): void {
    if (this.autoScrollRaf) return;
    const loop = () => {
      if (this.disposed || !this.handleDrag || this.autoScrollDelta === 0) {
        this.autoScrollRaf = 0;
        return;
      }
      this.view.scrollTop = Math.max(0, this.view.scrollTop + this.autoScrollDelta);
      this.view.clampScrollPublic();
      this.updateHandleDrag(this.lastX, this.lastY, true);
      this.autoScrollRaf = requestAnimationFrame(loop);
    };
    this.autoScrollRaf = requestAnimationFrame(loop);
  }

  private stopAutoScroll(): void {
    this.autoScrollDelta = 0;
    if (this.autoScrollRaf) {
      cancelAnimationFrame(this.autoScrollRaf);
      this.autoScrollRaf = 0;
    }
  }

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
    const padX = 18;
    const padTop = 4;
    const padBottom = 22;
    let best: TeardropHit | null = null;
    let bestD = Infinity;
    for (const t of this.getTeardrops()) {
      const cx = t.x + t.w / 2;
      const cy = t.y + t.h / 2;
      if (
        x >= t.x - padX &&
        x <= t.x + t.w + padX &&
        y >= t.y - padTop &&
        y <= t.y + t.h + padBottom
      ) {
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
    }
    return best;
  }

  private edgePosForHandle(type: TeardropHit['type']): { lineNumber: number; column: number } {
    const sel = this.selection;
    if (type === 'cursor') {
      return { lineNumber: sel.active.lineNumber, column: sel.active.column };
    }
    const a = sel.anchor;
    const b = sel.active;
    const aBefore =
      a.lineNumber < b.lineNumber ||
      (a.lineNumber === b.lineNumber && a.column <= b.column);
    if (type === 'start') {
      return aBefore
        ? { lineNumber: a.lineNumber, column: a.column }
        : { lineNumber: b.lineNumber, column: b.column };
    }
    return aBefore
      ? { lineNumber: b.lineNumber, column: b.column }
      : { lineNumber: a.lineNumber, column: a.column };
  }

  private stopFling(): void {
    if (this.flingRaf) {
      cancelAnimationFrame(this.flingRaf);
      this.flingRaf = 0;
    }
    this.flingVx = 0;
    this.flingVy = 0;
  }

  private startFling(vx: number, vy: number, axis: 'none' | 'x' | 'y'): void {
    this.stopFling();
    let sx = axis === 'y' ? 0 : -vx;
    let sy = axis === 'x' ? 0 : -vy;
    const ax = Math.abs(sx);
    const ay = Math.abs(sy);
    if (ay > ax * PointerController.AXIS_LOCK_RATIO) sx = 0;
    else if (ax > ay * PointerController.AXIS_LOCK_RATIO) sy = 0;
    const clamp = (v: number) =>
      Math.max(-PointerController.MAX_FLING, Math.min(PointerController.MAX_FLING, v));
    this.flingVx = clamp(sx);
    this.flingVy = clamp(sy);
    if (
      Math.abs(this.flingVx) < PointerController.MIN_FLING_START &&
      Math.abs(this.flingVy) < PointerController.MIN_FLING_START
    ) {
      return;
    }
    this.flingLastT = performance.now();
    const step = (now: number) => {
      if (this.disposed) return;
      const dt = Math.min(32, Math.max(0, now - this.flingLastT));
      this.flingLastT = now;
      if (dt <= 0) {
        this.flingRaf = requestAnimationFrame(step);
        return;
      }
      const damp = Math.exp(-PointerController.FRICTION_PER_MS * dt);
      this.flingVx *= damp;
      this.flingVy *= damp;
      const prevTop = this.view.scrollTop;
      const prevLeft = this.view.scrollLeft;
      this.view.scrollLeft = Math.max(0, this.view.scrollLeft + this.flingVx * dt);
      this.view.scrollTop = Math.max(0, this.view.scrollTop + this.flingVy * dt);
      this.view.clampScrollPublic();
      this.view.paint();
      this.onInteract('scroll');
      const moved =
        Math.abs(this.view.scrollTop - prevTop) > 0.01 ||
        Math.abs(this.view.scrollLeft - prevLeft) > 0.01;
      if (
        !moved ||
        (Math.abs(this.flingVx) < PointerController.MIN_FLING_STOP &&
          Math.abs(this.flingVy) < PointerController.MIN_FLING_STOP)
      ) {
        this.flingRaf = 0;
        return;
      }
      this.flingRaf = requestAnimationFrame(step);
    };
    this.flingRaf = requestAnimationFrame(step);
  }

  private pushSample(x: number, y: number, t: number): void {
    const prev = this.samples[this.samples.length - 1];
    if (prev && t - prev.t < 2) return; // Skip coalesced duplicate timestamps
    this.samples.push({ t, x, y });
    while (this.samples.length > 2 && t - this.samples[0]!.t > 90) {
      this.samples.shift();
    }
  }

  private computeVelocity(now: number): { vx: number; vy: number } {
    if (this.samples.length < 2) return { vx: 0, vy: 0 };
    const last = this.samples[this.samples.length - 1]!;
    // Finger paused before lift -> no fling
    if (now - last.t > 60) return { vx: 0, vy: 0 };

    const first = this.samples[0]!;
    const dt = last.t - first.t;
    if (dt < 8) return { vx: 0, vy: 0 };
    return {
      vx: (last.x - first.x) / dt,
      vy: (last.y - first.y) / dt,
    };
  }

  private isWithinDoubleWindow(x: number, y: number, t: number): boolean {
    if (this.lastTapT <= 0) return false;
    if (t - this.lastTapT > PointerController.DOUBLE_MS) return false;
    return Math.hypot(x - this.lastTapX, y - this.lastTapY) <= PointerController.DOUBLE_DIST;
  }

  private onDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    this.stopFling();
    this.stopAutoScroll();

    const now = performance.now();
    this.active = true;
    this.pointerId = e.pointerId;
    this.startX = this.lastX = this.scrollAnchorX = e.clientX;
    this.startY = this.lastY = this.scrollAnchorY = e.clientY;
    this.lastT = now;
    this.startScrollTop = this.view.scrollTop;
    this.startScrollLeft = this.view.scrollLeft;
    this.scrollAxis = 'none';
    this.maxDist = 0;
    this.scrolling = false;
    this.selecting = e.shiftKey;
    this.handleDrag = null;
    this.handleMoved = false;
    this.stickyLine = null;
    this.dragAnchor = null;
    this.longPressFired = false;
    this.samples = [];
    this.pushSample(e.clientX, e.clientY, now);

    this.pendingDouble = this.isWithinDoubleWindow(e.clientX, e.clientY, now);
    if (this.pendingDouble) {
      this.clearSingleTap();
    }

    const hit = this.pendingDouble ? null : this.hitTeardrop(e.clientX, e.clientY);
    if (hit) {
      this.handleDrag = hit.type;
      const edge = this.edgePosForHandle(hit.type);
      this.stickyLine = edge.lineNumber;

      if (hit.type === 'start') {
        this.dragAnchor = this.edgePosForHandle('end');
      } else if (hit.type === 'end') {
        this.dragAnchor = this.edgePosForHandle('start');
      } else {
        this.dragAnchor = null;
      }

      const rect = this.root.getBoundingClientRect();
      const rawLift = (e.clientY - rect.top) - hit.y;
      this.handleLift = Math.max(14, Math.min(38, rawLift));
    }

    try {
      this.root.setPointerCapture(e.pointerId);
    } catch {
      /* */
    }

    this.clearLongPress();
    if (!this.handleDrag && !this.pendingDouble) {
      this.longPressX = e.clientX;
      this.longPressY = e.clientY;
      this.longPressTimer = setTimeout(() => {
        if (!this.active || this.scrolling || this.handleDrag) return;
        if (this.maxDist > PointerController.TAP_SLOP) return;
        this.longPressFired = true;
        this.selecting = true;
        this.selectWordAt(this.longPressX, this.longPressY);
        try {
          navigator.vibrate?.(12);
        } catch {
          /* */
        }
        this.view.schedulePaint();
        this.onInteract('select');
      }, PointerController.LONG_MS);
    }
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.active || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    const now = performance.now();
    const totalDx = e.clientX - this.startX;
    const totalDy = e.clientY - this.startY;
    const dist = Math.hypot(totalDx, totalDy);
    if (dist > this.maxDist) this.maxDist = dist;

    if (!this.scrolling && !this.handleDrag && !this.selecting && !this.longPressFired) {
      if (dist > PointerController.SCROLL_THRESH) {
        this.scrolling = true;
        this.pendingDouble = false;
        this.clearLongPress();
        // Anchor scroll to threshold crossing point (eliminates initial jump)
        this.scrollAnchorX = e.clientX;
        this.scrollAnchorY = e.clientY;
        this.startScrollTop = this.view.scrollTop;
        this.startScrollLeft = this.view.scrollLeft;
        // Lock axis so vertical scrolling never wobbles horizontally
        const ax = Math.abs(totalDx);
        const ay = Math.abs(totalDy);
        this.scrollAxis = ax > ay * PointerController.AXIS_LOCK_RATIO ? 'x' : 'y';
      }
    }

    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastT = now;
    this.pushSample(e.clientX, e.clientY, now);

    if (this.handleDrag) {
      if (!this.handleMoved && dist < PointerController.HANDLE_MOVE_THRESH) return;
      this.handleMoved = true;

      const rect = this.root.getBoundingClientRect();
      let delta = 0;
      if (e.clientY < rect.top + PointerController.AUTO_SCROLL_EDGE) {
        delta = -PointerController.AUTO_SCROLL_SPEED;
      } else if (e.clientY > rect.bottom - PointerController.AUTO_SCROLL_EDGE) {
        delta = PointerController.AUTO_SCROLL_SPEED;
      }
      this.autoScrollDelta = delta;
      if (delta !== 0) this.ensureAutoScroll();
      else this.stopAutoScroll();

      this.updateHandleDrag(e.clientX, e.clientY);
      return;
    }

    if (this.selecting || this.longPressFired) {
      const pos = this.hitTest(e.clientX, e.clientY);
      this.selection.moveActive(pos.lineNumber, pos.column, true);
      this.view.ensureCaretVisible();
      this.view.schedulePaint();
      this.onInteract('select');
      return;
    }

    if (this.scrolling) {
      const dx = e.clientX - this.scrollAnchorX;
      const dy = e.clientY - this.scrollAnchorY;
      if (this.scrollAxis !== 'x') {
        this.view.scrollTop = Math.max(0, this.startScrollTop - dy);
      }
      if (this.scrollAxis !== 'y') {
        this.view.scrollLeft = Math.max(0, this.startScrollLeft - dx);
      }
      this.view.clampScrollPublic();
      this.view.schedulePaint();
      this.onInteract('scroll');
    }
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.active || (this.pointerId !== null && e.pointerId !== this.pointerId)) return;
    this.clearLongPress();
    this.stopAutoScroll();

    const wasHandleDrag = Boolean(this.handleDrag && this.handleMoved);
    const wasSelecting = (this.selecting && !this.handleDrag) || this.longPressFired;
    const wasScrolling = this.scrolling;
    const axis = this.scrollAxis;
    const wasTap = !wasScrolling && this.maxDist <= PointerController.TAP_SLOP;
    const pendingDouble = this.pendingDouble;

    this.active = false;
    this.pointerId = null;
    this.handleDrag = null;
    this.handleMoved = false;
    this.stickyLine = null;
    this.dragAnchor = null;
    this.pendingDouble = false;
    this.scrolling = false;
    this.scrollAxis = 'none';

    if (wasHandleDrag) {
      this.view.freeHandle = null;
      this.view.ensureCaretVisible();
      this.view.schedulePaint();
      this.onInteract('handle');
      return;
    }

    if (wasScrolling && !wasSelecting) {
      const { vx, vy } = this.computeVelocity(performance.now());
      this.startFling(vx, vy, axis);
      this.onInteract('scroll');
      this.lastTapT = 0;
      this.clearSingleTap();
      return;
    }

    if (this.longPressFired) {
      this.onInteract('select');
      this.onInteract('tap');
      this.lastTapT = 0;
      this.clearSingleTap();
      return;
    }

    if (wasTap && !wasSelecting) {
      const now = performance.now();
      const nearLast =
        this.lastTapT > 0 &&
        now - this.lastTapT <= PointerController.DOUBLE_MS &&
        Math.hypot(e.clientX - this.lastTapX, e.clientY - this.lastTapY) <=
          PointerController.DOUBLE_DIST;

      if (pendingDouble || nearLast) {
        this.clearSingleTap();
        this.selectWordAt(e.clientX, e.clientY);
        this.view.schedulePaint();
        this.onInteract('select');
        this.onInteract('tap');
        this.lastTapT = 0;
        try {
          navigator.vibrate?.(8);
        } catch {
          /* */
        }
        return;
      }

      this.clearSingleTap();
      const pos = this.hitTest(e.clientX, e.clientY);
      this.selection.setCaret(pos.lineNumber, pos.column);
      this.view.schedulePaint();
      this.onInteract('tap');
      this.lastTapT = now;
      this.lastTapX = e.clientX;
      this.lastTapY = e.clientY;
      return;
    }

    if (wasSelecting) {
      this.onInteract('select');
      this.onInteract('tap');
    }
  };

  private clearSingleTap(): void {
    if (this.singleTapTimer) {
      clearTimeout(this.singleTapTimer);
      this.singleTapTimer = null;
    }
  }

  private clearLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}