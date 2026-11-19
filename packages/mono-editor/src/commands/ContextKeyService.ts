import type { MonoContextKeyValue, MonoDisposable } from './types';

/**
 * Minimal Monaco ContextKeyService.
 * Supports: key, !key, key == value, a && b, a || b (no parens nesting beyond simple).
 */
export class ContextKeyService {
  private keys = new Map<string, MonoContextKeyValue>();
  private listeners = new Set<() => void>();

  set(key: string, value: MonoContextKeyValue): void {
    const prev = this.keys.get(key);
    if (prev === value) return;
    this.keys.set(key, value);
    this.emit();
  }

  get(key: string): MonoContextKeyValue | undefined {
    return this.keys.get(key);
  }

  createKey(key: string, defaultValue: MonoContextKeyValue): {
    set: (v: MonoContextKeyValue) => void;
    get: () => MonoContextKeyValue;
    reset: () => void;
  } {
    if (!this.keys.has(key)) this.keys.set(key, defaultValue);
    return {
      set: (v) => this.set(key, v),
      get: () => this.keys.get(key) ?? defaultValue,
      reset: () => this.set(key, defaultValue),
    };
  }

  onDidChange(listener: () => void): MonoDisposable {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }

  /** Evaluate when-clause string or fn. Empty/undefined → true. */
  match(when?: string | (() => boolean)): boolean {
    if (when == null || when === '') return true;
    if (typeof when === 'function') {
      try {
        return !!when();
      } catch {
        return false;
      }
    }
    return this.evalExpr(when.trim());
  }

  private emit(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* */
      }
    }
  }

  private evalExpr(expr: string): boolean {
    // Split OR first
    const orParts = expr.split('||').map((s) => s.trim());
    return orParts.some((part) =>
      part
        .split('&&')
        .map((s) => s.trim())
        .every((term) => this.evalTerm(term)),
    );
  }

  private evalTerm(term: string): boolean {
    if (!term) return true;
    if (term.startsWith('!')) {
      return !this.truthy(term.slice(1).trim());
    }
    const eq = term.match(/^([\w.]+)\s*==\s*(.+)$/);
    if (eq) {
      const key = eq[1]!;
      let raw = eq[2]!.trim();
      if (
        (raw.startsWith("'") && raw.endsWith("'")) ||
        (raw.startsWith('"') && raw.endsWith('"'))
      ) {
        raw = raw.slice(1, -1);
      }
      const v = this.keys.get(key);
      if (raw === 'true') return v === true;
      if (raw === 'false') return v === false;
      return String(v) === raw;
    }
    const ne = term.match(/^([\w.]+)\s*!=\s*(.+)$/);
    if (ne) {
      return !this.evalTerm(`${ne[1]} == ${ne[2]}`);
    }
    return this.truthy(term);
  }

  private truthy(key: string): boolean {
    const v = this.keys.get(key);
    if (v === undefined) return false;
    return !!v;
  }
}
