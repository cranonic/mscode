import { FIND_ICON_SVG as FIND_ICONS, codicon } from '../icons';
import { attachPressFeedback, haptic } from '../util/haptic';
import type { FindOptions, FindState } from './types';

export interface FindWidgetCallbacks {
  onSearchChange: (value: string) => void;
  onReplaceChange: (value: string) => void;
  onToggleOption: (key: keyof FindOptions) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onToggleReplace: () => void;
  onTogglePreserveCase?: () => void;
  onClose: () => void;
}

/**
 * VS Code–like find bar:
 *  [v] [ input | Aa ab .* ]  count  ↑ ↓ ✕
 *      [ replace | AB ]  replace  replaceAll   ← buttons outside border
 */
export class FindWidget {
  private root: HTMLElement;
  private el: HTMLDivElement | null = null;
  private findInput: HTMLInputElement | null = null;
  private replaceInput: HTMLInputElement | null = null;
  private countEl: HTMLSpanElement | null = null;
  private replaceRow: HTMLDivElement | null = null;
  private cbs: FindWidgetCallbacks;
  private preserveCase = false;

  constructor(host: HTMLElement, callbacks: FindWidgetCallbacks) {
    this.root = host;
    this.cbs = callbacks;
  }

  isVisible(): boolean {
    return !!this.el;
  }

  /**
   * @param focusInput when true, focus find box (open gesture only — not on every keystroke)
   * @param selectAll when true, select all text (only on first open / Ctrl+F)
   */
  reveal(replace: boolean, focusInput = true, selectAll = false): void {
    if (!this.el) this.build();
    this.setReplaceVisible(replace);
    if (focusInput && this.findInput) {
      // Don't steal selection while user is typing
      if (document.activeElement !== this.findInput) {
        this.findInput.focus();
        if (selectAll) this.findInput.select();
      } else if (selectAll) {
        this.findInput.select();
      }
    }
  }

  hide(): void {
    if (this.el) {
      this.el.remove();
      this.el = null;
      this.findInput = null;
      this.replaceInput = null;
      this.countEl = null;
      this.replaceRow = null;
    }
  }

  update(state: FindState): void {
    if (!this.el) return;
    // Never rewrite value while the user is typing in that field (preserves caret)
    if (
      this.findInput &&
      this.findInput.value !== state.searchString &&
      document.activeElement !== this.findInput
    ) {
      this.findInput.value = state.searchString;
    }
    if (
      this.replaceInput &&
      this.replaceInput.value !== state.replaceString &&
      document.activeElement !== this.replaceInput
    ) {
      this.replaceInput.value = state.replaceString;
    }
    this.setReplaceVisible(state.isReplaceRevealed);
    this.syncToggles(state.options);
    if (this.countEl) {
      if (!state.searchString) this.countEl.textContent = '';
      else if (state.matches.length === 0) this.countEl.textContent = 'No results';
      else this.countEl.textContent = `${state.currentIndex + 1} of ${state.matches.length}`;
    }
  }

  dispose(): void {
    this.hide();
  }

  private setReplaceVisible(on: boolean): void {
    if (this.replaceRow) this.replaceRow.style.display = on ? 'flex' : 'none';
    const chevron = this.el?.querySelector('[data-action="toggle-replace"]') as HTMLElement | null;
    if (chevron) {
      chevron.innerHTML = on ? FIND_ICONS.collapse : FIND_ICONS.expand;
      chevron.title = on ? 'Hide Replace' : 'Toggle Replace';
    }
  }

  private syncToggles(opts: FindOptions): void {
    if (!this.el) return;
    const map: Record<string, boolean> = {
      matchCase: opts.matchCase,
      wholeWord: opts.wholeWord,
      regex: opts.regex,
      preserveCase: this.preserveCase,
    };
    this.el.querySelectorAll<HTMLButtonElement>('[data-opt]').forEach((btn) => {
      const key = btn.dataset.opt!;
      const on = !!map[key];
      btn.classList.toggle('mono-find-toggle-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.style.background = on ? 'rgba(0, 127, 212, 0.35)' : 'transparent';
      btn.style.color = on ? '#ffffff' : '#c5c5c5';
    });
  }

  private build(): void {
    const el = document.createElement('div');
    el.className = 'mono-find-widget';
    Object.assign(el.style, {
      position: 'absolute',
      top: '8px',
      right: '12px',
      zIndex: '40',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: 'min(380px, calc(100% - 24px))',
      maxWidth: '380px',
      minWidth: '260px',
      boxSizing: 'border-box',
      background: '#252526',
      border: '1px solid #454545',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.36)',
      padding: '6px',
      gap: '4px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      color: '#cccccc',
      pointerEvents: 'auto',
      // Prevent sticky :hover on touch
      touchAction: 'manipulation',
    } as unknown as CSSStyleDeclaration);

    // Chevron toggle replace
    const chevron = this.iconBtn(FIND_ICONS.expand, 'Toggle Replace', () => this.cbs.onToggleReplace());
    chevron.dataset.action = 'toggle-replace';
    Object.assign(chevron.style, { marginTop: '4px' });

    const col = document.createElement('div');
    Object.assign(col.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      flex: '1',
      minWidth: '0',
    });

    // ── Find row: [bordered input+opts]  count  nav  close ──
    const findRow = document.createElement('div');
    Object.assign(findRow.style, {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '4px',
      minWidth: '0',
    });

    const findBox = this.inputBox();
    const findInput = this.makeInput('Find');
    findInput.addEventListener('input', () => this.cbs.onSearchChange(findInput.value));
    findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) this.cbs.onFindPrevious();
        else this.cbs.onFindNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cbs.onClose();
      }
    });
    this.findInput = findInput;
    findBox.appendChild(findInput);
    findBox.appendChild(this.toggleBtn('matchCase', FIND_ICONS.caseSensitive, 'Match Case'));
    findBox.appendChild(this.toggleBtn('wholeWord', FIND_ICONS.wholeWord, 'Match Whole Word'));
    findBox.appendChild(this.toggleBtn('regex', FIND_ICONS.regex, 'Use Regular Expression'));

    const count = document.createElement('span');
    Object.assign(count.style, {
      fontSize: '12px',
      color: '#bbbbbb',
      padding: '0 4px',
      minWidth: '56px',
      textAlign: 'right',
      whiteSpace: 'nowrap',
      flexShrink: '0',
    });
    this.countEl = count;

    findRow.appendChild(findBox);
    findRow.appendChild(count);
    findRow.appendChild(this.iconBtn(FIND_ICONS.previous, 'Previous Match', () => this.cbs.onFindPrevious()));
    findRow.appendChild(this.iconBtn(FIND_ICONS.next, 'Next Match', () => this.cbs.onFindNext()));
    findRow.appendChild(this.iconBtn(FIND_ICONS.close, 'Close', () => this.cbs.onClose()));

    // ── Replace row: [bordered input+AB]  replace  replaceAll (outside) ──
    const replaceRow = document.createElement('div');
    Object.assign(replaceRow.style, {
      display: 'none',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '4px',
      minWidth: '0',
    });
    this.replaceRow = replaceRow;

    const replaceBox = this.inputBox();
    const replaceInput = this.makeInput('Replace');
    replaceInput.addEventListener('input', () => this.cbs.onReplaceChange(replaceInput.value));
    replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.cbs.onReplace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cbs.onClose();
      }
    });
    this.replaceInput = replaceInput;
    replaceBox.appendChild(replaceInput);
    // AB = preserve case (inside border)
    replaceBox.appendChild(
      this.toggleBtn('preserveCase', codicon('preserve-case'), 'Preserve Case', () => {
        this.preserveCase = !this.preserveCase;
        this.cbs.onTogglePreserveCase?.();
        this.syncToggles({
          matchCase: false,
          wholeWord: false,
          regex: false,
        });
        // re-sync will fix match toggles on next update; force preserve only
        const btn = replaceBox.querySelector('[data-opt="preserveCase"]') as HTMLButtonElement;
        if (btn) {
          btn.classList.toggle('mono-find-toggle-on', this.preserveCase);
          btn.style.background = this.preserveCase ? 'rgba(0, 127, 212, 0.35)' : 'transparent';
        }
      }),
    );

    replaceRow.appendChild(replaceBox);
    replaceRow.appendChild(this.iconBtn(FIND_ICONS.replace, 'Replace', () => this.cbs.onReplace()));
    replaceRow.appendChild(this.iconBtn(FIND_ICONS.replaceAll, 'Replace All', () => this.cbs.onReplaceAll()));

    col.appendChild(findRow);
    col.appendChild(replaceRow);
    el.appendChild(chevron);
    el.appendChild(col);
    this.root.appendChild(el);
    this.el = el;

    el.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  /** Bordered group: only inputs + option toggles */
  private inputBox(): HTMLDivElement {
    const box = document.createElement('div');
    Object.assign(box.style, {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '2px',
      flex: '1',
      minWidth: '0',
      background: '#3c3c3c',
      borderRadius: '4px',
      padding: '2px 4px',
      border: '1px solid #007fd4',
      boxSizing: 'border-box',
    });
    return box;
  }

  private makeInput(placeholder: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.setAttribute('aria-label', placeholder);
    Object.assign(input.style, {
      flex: '1 1 auto',
      minWidth: '60px',
      width: '0',
      maxWidth: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: '#cccccc',
      fontSize: '13px',
      padding: '4px 6px',
      boxSizing: 'border-box',
    });
    return input;
  }

  private iconBtn(svg: string, title: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = title;
    b.innerHTML = svg;
    b.setAttribute('aria-label', title);
    Object.assign(b.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      padding: '0',
      border: 'none',
      borderRadius: '4px',
      background: 'transparent',
      color: '#c5c5c5',
      cursor: 'pointer',
      flexShrink: '0',
      // no :hover sticky — only press scale
      transform: 'scale(1)',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
    } as unknown as CSSStyleDeclaration);
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    attachPressFeedback(b);
    return b;
  }

  private toggleBtn(
    opt: string,
    svg: string,
    title: string,
    custom?: () => void,
  ): HTMLButtonElement {
    const b = this.iconBtn(svg, title, () => {
      if (custom) custom();
      else this.cbs.onToggleOption(opt as keyof FindOptions);
    });
    b.dataset.opt = opt;
    return b;
  }
}
