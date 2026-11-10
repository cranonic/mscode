// src/core/extensionAPI/modules/terminalSwitch.ts
//
// Dual terminal (native / proot) resolution with optional confirmation.
// Used by Code Runner, LSP, and other plugins via mscode.terminalSwitch.

import { Capacitor, registerPlugin } from '@capacitor/core';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTermisStore } from '@/features/termis/store/termisStore';
import { useModalStore } from '@/store/modalStore';
import { taskManager } from '@/core/extensionAPI/tasks/taskManager';

const NativeTerminal = registerPlugin<any>('NativeTerminal');

export type TerminalBackend = 'native' | 'proot';

export interface SwitchOptions {
  preferred?: TerminalBackend;
  fallbackOnError?: boolean;
  message?: string;
  title?: string;
  forceExclusive?: boolean;
}

export interface SwitchResult {
  backend: TerminalBackend;
  switched: boolean;
  setupStarted?: boolean;
}

/** How a command may run across terminal backends. */
export interface DualBackendOptions {
  /** Supported backends (order ignored). Default: both. */
  backends?: TerminalBackend[];
  /** First-priority backend when nothing remembered. Default: proot. */
  preferred?: TerminalBackend;
  /**
   * Last backend the user ran this feature on (skip confirm next time).
   * Caller should persist after a successful run.
   */
  remembered?: TerminalBackend | null;
  /**
   * When preferred ≠ current enabled terminal:
   * - dual support → optional confirm (Switch / Stay)
   * - single support → mandatory confirm (Switch / Cancel)
   */
  confirm?: boolean;
  title?: string;
  /** Soft message when dual + preferred differs from current (Java-style). */
  softMessage?: string;
  /** Hard message when command only supports the other backend. */
  hardMessage?: string;
}

export interface DualResolveResult {
  backend: TerminalBackend;
  /** User cancelled mandatory switch. */
  cancelled?: boolean;
  /** Whether user explicitly chose to stay on non-preferred. */
  stayedOnCurrent?: boolean;
  switched?: boolean;
}

function currentDefault(): TerminalBackend {
  const mode = useSettingsStore.getState().settings?.['terminal.defaultExecMode'];
  return mode === 'native' ? 'native' : 'proot';
}

function label(b: TerminalBackend): string {
  return b === 'proot' ? 'Linux (Alpine / proot)' : 'Android (native)';
}

/**
 * Ensure the active terminal policy matches `preferred`.
 */
export async function requestTerminalBackend(
  options: SwitchOptions = {},
): Promise<SwitchResult> {
  const preferred = options.preferred ?? 'proot';
  const message =
    options.message ??
    (preferred === 'proot'
      ? 'This feature runs in the Linux (Alpine) terminal. Switching…'
      : 'Switching to Android (native) terminal…');
  const title = options.title ?? 'Terminal';

  const before = currentDefault();
  let switched = false;

  if (before !== preferred) {
    useSettingsStore.getState().updateSetting('terminal.defaultExecMode', preferred);
    switched = true;
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      source: 'Terminal',
      message,
    });

    if (options.forceExclusive !== false && Capacitor.isNativePlatform()) {
      try {
        const other = preferred === 'proot' ? 'native' : 'proot';
        await NativeTerminal.killAllSessionsOfType?.({ execType: other });
      } catch {
        /* optional */
      }
    }
  }

  let setupStarted = false;
  if (preferred === 'proot' && Capacitor.isNativePlatform()) {
    try {
      const ready = await NativeTerminal.ensureProotRootfs?.({});
      if (ready && ready.ready === false) setupStarted = true;
    } catch {
      setupStarted = true;
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Linux setup',
        source: 'Terminal',
        message: 'Setting up Alpine Linux… Progress is shown in Terminal.',
      });
    }
  }

  try {
    useTermisStore.getState().setActiveView?.('terminal');
  } catch {
    /* optional */
  }

  return { backend: preferred, switched, setupStarted };
}

/**
 * Pick which backend to use for a dual/single-capable command.
 *
 * Rules (user product policy):
 * 1. Dual support + preferred ≠ current → optional modal (Switch / Try current)
 * 2. Single support + current ≠ only backend → mandatory modal (Switch / Cancel)
 * 3. remembered backend in supported list → use it without modal
 * 4. Otherwise use preferred if supported, else first supported
 */
export async function resolveExecBackend(
  options: DualBackendOptions = {},
): Promise<DualResolveResult> {
  const supported = (options.backends?.length
    ? options.backends
    : (['proot', 'native'] as TerminalBackend[])
  ).filter((b, i, a) => a.indexOf(b) === i);

  if (supported.length === 0) {
    return { backend: 'proot', cancelled: true };
  }

  const preferred =
    options.preferred && supported.includes(options.preferred)
      ? options.preferred
      : supported[0];

  const remembered =
    options.remembered && supported.includes(options.remembered)
      ? options.remembered
      : null;

  const current = currentDefault();
  const confirm = options.confirm !== false;
  const title = options.title ?? 'Terminal';

  // ── remembered wins (no nag) ───────────────────────────────────────────
  if (remembered) {
    if (remembered !== current) {
      await requestTerminalBackend({
        preferred: remembered,
        message: `Using ${label(remembered)} (your last choice for this task).`,
        title,
      });
      return { backend: remembered, switched: true };
    }
    return { backend: remembered, switched: false };
  }

  // ── single-backend command ─────────────────────────────────────────────
  if (supported.length === 1) {
    const only = supported[0];
    if (current === only) return { backend: only, switched: false };

    if (!confirm) {
      await requestTerminalBackend({ preferred: only, title });
      return { backend: only, switched: true };
    }

    const switchLabel = only === 'proot' ? 'Switch to Linux' : 'Switch to Native';
    const choice = await useModalStore.getState().showModal({
      title,
      message:
        options.hardMessage ||
        `This command only runs on **${label(only)}**.\n\n` +
          `Your current terminal is **${label(current)}**.\n\n` +
          `Switch to ${label(only)} to continue?`,
      buttons: [switchLabel, 'Cancel'],
    });

    if (choice !== switchLabel) {
      return { backend: only, cancelled: true };
    }
    await requestTerminalBackend({ preferred: only, title });
    return { backend: only, switched: true };
  }

  // ── dual support ───────────────────────────────────────────────────────
  // Prefer running on currently enabled terminal when it is supported.
  if (current === preferred) {
    return { backend: current, switched: false };
  }

  // preferred ≠ current — soft optional confirm
  if (confirm) {
    const switchLabel =
      preferred === 'proot' ? 'Switch to Linux' : 'Switch to Native';
    const stayLabel =
      current === 'proot' ? 'Stay on Linux' : 'Stay on Native';
    const choice = await useModalStore.getState().showModal({
      title,
      message:
        options.softMessage ||
        `This can run on both terminals.\n\n` +
          `**Preferred:** ${label(preferred)}\n` +
          `**Current:** ${label(current)}\n\n` +
          `Switch to preferred, or try on the current terminal?`,
      buttons: [switchLabel, stayLabel, 'Cancel'],
    });

    if (choice === 'Cancel' || choice === null) {
      return { backend: preferred, cancelled: true };
    }
    if (choice === stayLabel) {
      return { backend: current, stayedOnCurrent: true, switched: false };
    }
    await requestTerminalBackend({ preferred, title });
    return { backend: preferred, switched: true };
  }

  // no confirm → use preferred
  if (current !== preferred) {
    await requestTerminalBackend({ preferred, title });
    return { backend: preferred, switched: true };
  }
  return { backend: preferred, switched: false };
}

/**
 * Run a shell command on the preferred backend; on failure optionally retry the other.
 */
export async function runOnBackend(
  command: string,
  options: SwitchOptions & {
    cwd?: string;
    onData?: (d: string) => void;
    backends?: TerminalBackend[];
  } = {},
): Promise<{ exitCode: number; backend: TerminalBackend }> {
  const preferred = options.preferred ?? 'proot';
  const fallback = options.fallbackOnError !== false;
  const backends = options.backends ?? [preferred, preferred === 'proot' ? 'native' : 'proot'];

  const resolved = await resolveExecBackend({
    backends: backends as TerminalBackend[],
    preferred,
    confirm: true,
    title: options.title,
  });
  if (resolved.cancelled) {
    return { exitCode: 130, backend: preferred };
  }

  const mode = resolved.backend;
  await requestTerminalBackend({ ...options, preferred: mode });

  const run = (m: TerminalBackend) =>
    taskManager.execute(
      command,
      options.cwd || '/',
      options.onData || (() => {}),
      false,
      m,
    ).result;

  let res = await run(mode);
  if (res.exitCode !== 0 && fallback) {
    const other: TerminalBackend = mode === 'proot' ? 'native' : 'proot';
    if ((backends as TerminalBackend[]).includes(other)) {
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: options.title ?? 'Terminal',
        source: 'Terminal',
        message:
          options.message ||
          `Retrying on ${label(other)}…`,
      });
      await requestTerminalBackend({
        ...options,
        preferred: other,
        message: `Switched to ${label(other)} after an error.`,
      });
      res = await run(other);
      return { exitCode: res.exitCode, backend: other };
    }
  }
  return { exitCode: res.exitCode, backend: mode };
}

/** Factory for extension API surface */
export function createTerminalSwitchModule(_extId: string) {
  return {
    requestBackend: requestTerminalBackend,
    resolveBackend: resolveExecBackend,
    run: runOnBackend,
    getDefaultBackend: currentDefault,
  };
}