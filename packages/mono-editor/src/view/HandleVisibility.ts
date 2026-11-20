/**
 * Teardrop handle visibility policy:
 * - Scroll: hide; finger up + scroll fully stopped → show
 * - Typing: hide; 3s after last type → fade in (light)
 * - Touch/hover handle or caret move: full opacity
 * - Idle 10s → fade; idle 20s → hide
 */

export type HandleVisState = 'hidden' | 'faded' | 'visible';

export class HandleVisibility {
  private state: HandleVisState = 'visible';
  private timers: ReturnType<typeof setTimeout>[] = [];
  private scrolling = false;
  private typing = false;
  private onChange: (state: HandleVisState, alpha: number) => void;

  /** Fade opacity for "faded" state */
  static readonly FADE_ALPHA = 0.4;
  static readonly TYPE_FADE_MS = 3000;
  static readonly IDLE_FADE_MS = 10000;
  static readonly IDLE_HIDE_MS = 20000;

  constructor(onChange: (state: HandleVisState, alpha: number) => void) {
    this.onChange = onChange;
  }

  getState(): HandleVisState {
    return this.state;
  }

  getAlpha(): number {
    if (this.state === 'hidden') return 0;
    if (this.state === 'faded') return HandleVisibility.FADE_ALPHA;
    return 1;
  }

  dispose(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  private emit(): void {
    this.onChange(this.state, this.getAlpha());
  }

  private setState(s: HandleVisState): void {
    if (this.state === s) return;
    this.state = s;
    this.emit();
  }

  private scheduleIdle(): void {
    this.clearTimers();
    if (this.scrolling || this.typing) return;
    this.timers.push(
      setTimeout(() => {
        if (this.scrolling || this.typing) return;
        this.setState('faded');
      }, HandleVisibility.IDLE_FADE_MS),
    );
    this.timers.push(
      setTimeout(() => {
        if (this.scrolling || this.typing) return;
        this.setState('hidden');
      }, HandleVisibility.IDLE_HIDE_MS),
    );
  }

  /** Finger scrolling / wheel */
  onScrollStart(): void {
    this.scrolling = true;
    this.clearTimers();
    this.setState('hidden');
  }

  /** Finger up + fling finished */
  onScrollEnd(): void {
    this.scrolling = false;
    this.setState('visible');
    this.scheduleIdle();
  }

  /** Character typed / edit */
  onType(): void {
    this.typing = true;
    this.clearTimers();
    this.setState('hidden');
    this.timers.push(
      setTimeout(() => {
        this.typing = false;
        this.setState('faded');
        this.scheduleIdle();
      }, HandleVisibility.TYPE_FADE_MS),
    );
  }

  /** Tap, select, handle touch, caret placed */
  onUserInteract(): void {
    this.typing = false;
    this.scrolling = false;
    this.clearTimers();
    this.setState('visible');
    this.scheduleIdle();
  }
}
