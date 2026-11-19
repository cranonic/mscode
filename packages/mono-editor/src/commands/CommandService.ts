import { CommandsRegistry } from './CommandsRegistry';
import { ContextKeyService } from './ContextKeyService';
import type { KeybindingService } from '../keybindings/KeybindingService';
import type {
  MonoAction,
  MonoCommandHandler,
  MonoDisposable,
  MonoPaletteCommandItem,
  MonoRegisteredCommand,
} from './types';

/**
 * Per-editor command hub — Monaco editor.addAction / executeCommand surface.
 */
export class CommandService {
  readonly context: ContextKeyService;
  readonly registry: CommandsRegistry;
  private keybindings: KeybindingService;
  private disposables: MonoDisposable[] = [];

  constructor(keybindings: KeybindingService) {
    this.context = new ContextKeyService();
    this.registry = new CommandsRegistry(this.context);
    this.keybindings = keybindings;
    this.registry.setShortcutResolver((id) => this.keybindings.getShortcutLabel(id));

    // Default editor context keys
    this.context.set('editorFocus', false);
    this.context.set('editorTextFocus', false);
    this.context.set('editorReadonly', false);
    this.context.set('editorHasSelection', false);
    this.context.set('textInputFocus', false);
  }

  registerCommand(
    id: string,
    handler: MonoCommandHandler,
    meta?: Omit<MonoRegisteredCommand, 'id' | 'handler'>,
  ): MonoDisposable {
    const d = this.registry.registerCommand(id, handler, meta);
    this.disposables.push(d);
    return d;
  }

  /**
   * Monaco `editor.addAction({ id, label, keybindings, precondition, run })`
   */
  addAction(action: MonoAction): MonoDisposable {
    const dCmd = this.registry.registerCommand(action.id, action.run, {
      title: action.title,
      category: action.category,
      icon: action.icon,
      precondition: action.precondition,
      paletteHide: action.paletteHide,
      order: action.order,
    });

    const chords = [
      ...(action.keybinding ? [action.keybinding] : []),
      ...(action.keybindings ?? []),
    ];
    const kbDisposers: Array<() => void> = [];
    for (const chord of chords) {
      const remove = this.keybindings.add({
        id: action.id,
        primary: chord,
        weight: action.weight ?? 100,
        when: () =>
          this.context.match(action.keybindingWhen ?? action.precondition),
        handler: () => {
          void this.executeCommand(action.id);
        },
      });
      kbDisposers.push(remove);
    }

    const d: MonoDisposable = {
      dispose: () => {
        dCmd.dispose();
        kbDisposers.forEach((r) => r());
      },
    };
    this.disposables.push(d);
    return d;
  }

  executeCommand(id: string, ...args: unknown[]): Promise<unknown> {
    return this.registry.executeCommand(id, ...args);
  }

  getCommandsForPalette(filter?: string): MonoPaletteCommandItem[] {
    return this.registry.getCommandsForPalette(filter);
  }

  getCommands(): MonoRegisteredCommand[] {
    return this.registry.getCommands();
  }

  setContext(key: string, value: boolean | string | number): void {
    this.context.set(key, value);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }
}
