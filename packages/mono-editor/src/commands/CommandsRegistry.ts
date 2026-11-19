import type {
  MonoCommandHandler,
  MonoDisposable,
  MonoPaletteCommandItem,
  MonoRegisteredCommand,
} from './types';
import type { ContextKeyService } from './ContextKeyService';

/**
 * Global + per-editor command registry (Monaco CommandsRegistry style).
 * Palette UI reads listCommands(); does not render.
 */
export class CommandsRegistry {
  private commands = new Map<string, MonoRegisteredCommand>();
  private context: ContextKeyService;
  /** Optional: resolve shortcut label for palette row */
  private shortcutResolver?: (commandId: string) => string | undefined;

  constructor(context: ContextKeyService) {
    this.context = context;
  }

  setShortcutResolver(fn: (commandId: string) => string | undefined): void {
    this.shortcutResolver = fn;
  }

  registerCommand(
    id: string,
    handler: MonoCommandHandler,
    meta?: Omit<MonoRegisteredCommand, 'id' | 'handler'>,
  ): MonoDisposable {
    const entry: MonoRegisteredCommand = {
      id,
      handler,
      title: meta?.title,
      category: meta?.category,
      icon: meta?.icon,
      precondition: meta?.precondition,
      paletteHide: meta?.paletteHide,
      order: meta?.order,
    };
    this.commands.set(id, entry);
    return {
      dispose: () => {
        if (this.commands.get(id) === entry) this.commands.delete(id);
      },
    };
  }

  unregisterCommand(id: string): void {
    this.commands.delete(id);
  }

  hasCommand(id: string): boolean {
    return this.commands.has(id);
  }

  getCommand(id: string): MonoRegisteredCommand | undefined {
    return this.commands.get(id);
  }

  async executeCommand(id: string, ...args: unknown[]): Promise<unknown> {
    const cmd = this.commands.get(id);
    if (!cmd) {
      console.warn(`[CommandsRegistry] Command not found: ${id}`);
      return undefined;
    }
    if (!this.context.match(cmd.precondition)) {
      console.warn(`[CommandsRegistry] Precondition failed: ${id}`);
      return undefined;
    }
    return await Promise.resolve(cmd.handler(...args));
  }

  /** All registered (debug / keybinding editor). */
  getCommands(): MonoRegisteredCommand[] {
    return Array.from(this.commands.values()).map((c) => ({ ...c }));
  }

  /**
   * Palette-ready list (title required, not paletteHide).
   * `enabled` reflects precondition at call time.
   */
  getCommandsForPalette(filter = ''): MonoPaletteCommandItem[] {
    const q = filter.trim().toLowerCase();
    const items: MonoPaletteCommandItem[] = [];
    for (const cmd of this.commands.values()) {
      if (!cmd.title || cmd.paletteHide) continue;
      if (q) {
        const hay = `${cmd.title} ${cmd.category ?? ''} ${cmd.id}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      items.push({
        id: cmd.id,
        label: cmd.title,
        category: cmd.category,
        icon: cmd.icon,
        shortcut: this.shortcutResolver?.(cmd.id),
        enabled: this.context.match(cmd.precondition),
        description: cmd.category,
      });
    }
    items.sort((a, b) => {
      const ca = (a.category || '').localeCompare(b.category || '');
      if (ca !== 0) return ca;
      return a.label.localeCompare(b.label);
    });
    return items;
  }
}
