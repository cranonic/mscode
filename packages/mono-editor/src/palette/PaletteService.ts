import type { CommandService } from '../commands/CommandService';
import type {
  MonoDisposable,
  MonoPaletteItem,
  MonoPaletteProvideContext,
  MonoPaletteProvider,
} from '../commands/types';

/**
 * Engine-side quick-access registry (Monaco QuickAccessController idea).
 * UI in app calls resolve(query) and renders items.
 *
 * Built-in: prefix ">" → list/run commands from CommandService.
 * App adds ":", "@", "/" providers without touching mono-editor core.
 */
export class PaletteService {
  private providers: MonoPaletteProvider[] = [];
  private commands: CommandService;

  constructor(commands: CommandService) {
    this.commands = commands;
    // Default: Show and Run Commands
    this.registerProvider({
      id: 'commands',
      prefix: '>',
      label: 'Show and Run Commands',
      provideItems: (filter, ctx) => {
        return ctx.listCommands().map((c) => ({
          id: c.id,
          label: c.label,
          description: c.category,
          icon: c.icon,
          shortcut: c.shortcut,
          enabled: c.enabled,
          type: 'item' as const,
          onSelect: () => {
            if (!c.enabled) return;
            void ctx.executeCommand(c.id);
          },
        }));
      },
    });
  }

  registerProvider(provider: MonoPaletteProvider): MonoDisposable {
    this.providers = this.providers.filter((p) => p.id !== provider.id);
    this.providers.push(provider);
    // Longer prefixes first (@: before @)
    this.providers.sort((a, b) => b.prefix.length - a.prefix.length);
    return {
      dispose: () => {
        this.providers = this.providers.filter((p) => p.id !== provider.id);
      },
    };
  }

  listProviders(): { id: string; prefix: string; label: string }[] {
    return this.providers.map((p) => ({
      id: p.id,
      prefix: p.prefix,
      label: p.label,
    }));
  }

  /**
   * Parse query → provider + filter, return items.
   * "" with no match → help-style list of prefixes (if help provider registered).
   */
  async resolve(query: string): Promise<{
    providerId: string;
    prefix: string;
    filter: string;
    items: MonoPaletteItem[];
  }> {
    const q = query ?? '';
    const ctx = this.ctx();

    for (const p of this.providers) {
      if (p.prefix === '') continue;
      if (q.startsWith(p.prefix)) {
        const filter = q.slice(p.prefix.length);
        const items = await Promise.resolve(p.provideItems(filter, ctx));
        return {
          providerId: p.id,
          prefix: p.prefix,
          filter,
          items: this.filterEnabled(items, filter),
        };
      }
    }

    // Empty-prefix / help providers
    const help = this.providers.filter((p) => p.prefix === '');
    if (help.length) {
      const items: MonoPaletteItem[] = [];
      for (const p of help) {
        items.push(...(await Promise.resolve(p.provideItems(q, ctx))));
      }
      return { providerId: 'help', prefix: '', filter: q, items };
    }

    // Fallback: treat whole query as command filter under >
    const items = await Promise.resolve(
      this.providers
        .find((p) => p.prefix === '>')!
        .provideItems(q, ctx),
    );
    return {
      providerId: 'commands',
      prefix: '>',
      filter: q,
      items: this.filterEnabled(items, q),
    };
  }

  private filterEnabled(items: MonoPaletteItem[], filter: string): MonoPaletteItem[] {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      if (it.type === 'separator') return true;
      const hay = `${it.label} ${it.description ?? ''} ${it.detail ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  private ctx(): MonoPaletteProvideContext {
    return {
      executeCommand: (id, ...args) => this.commands.executeCommand(id, ...args),
      listCommands: () => this.commands.getCommandsForPalette(),
      getContext: (key) => this.commands.context.get(key),
    };
  }
}
