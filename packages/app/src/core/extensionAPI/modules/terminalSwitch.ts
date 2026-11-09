// src/core/extensionAPI/modules/terminalSwitch.ts
//
// Plugin-facing API: request proot/native backend switch without per-plugin dialogs.
// System detects preferred backend; shows a short info toast (customizable message).

import { Capacitor, registerPlugin } from '@capacitor/core';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTermisStore } from '@/features/termis/store/termisStore';

const NativeTerminal = registerPlugin<any>('NativeTerminal');

export type TerminalBackend = 'native' | 'proot';

export interface SwitchOptions {
  /** Preferred backend for this task/plugin. Default: proot. */
  preferred?: TerminalBackend;
  /**
   * If preferred backend fails (e.g. native linker), fall back to the other.
   * Default: true.
   */
  fallbackOnError?: boolean;
  /** Toast / status text while switching. */
  message?: string;
  /** Notification title. */
  title?: string;
  /**
   * When true (default), if the other exclusive backend has open sessions,
   * kill them silently (no confirm) — plugins should not show their own dialogs.
   */
  forceExclusive?: boolean;
}

export interface SwitchResult {
  backend: TerminalBackend;
  switched: boolean;
  /** True when Alpine/rootfs was not ready and setup was triggered. */
  setupStarted?: boolean;
}

function currentDefault(): TerminalBackend {
  const mode = useSettingsStore.getState().settings?.['terminal.defaultExecMode'];
  return mode === 'native' ? 'native' : 'proot';
}

/**
 * Ensure the active terminal policy matches `preferred`.
 * - Updates defaultExecMode when needed
 * - Optionally ensures Alpine rootfs for proot
 * - Shows a short system message (no plugin confirmation UI)
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

    // Exclusive mode: drop other-backend sessions without plugin confirm
    if (options.forceExclusive !== false && Capacitor.isNativePlatform()) {
      try {
        const other = preferred === 'proot' ? 'native' : 'proot';
        await NativeTerminal.killAllSessionsOfType?.({ execType: other });
      } catch { /* optional */ }
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
  } catch { /* optional */ }

  return { backend: preferred, switched, setupStarted };
}

/**
 * Run a shell command on the preferred backend; on failure optionally retry the other.
 */
export async function runOnBackend(
  command: string,
  options: SwitchOptions & {
    cwd?: string;
    onData?: (d: string) => void;
  } = {},
): Promise<{ exitCode: number; backend: TerminalBackend }> {
  const { taskManager } = await import('@/core/extensionAPI/tasks/taskManager');
  const preferred = options.preferred ?? 'proot';
  const fallback = options.fallbackOnError !== false;

  await requestTerminalBackend(options);

  const run = (mode: TerminalBackend) =>
    taskManager.execute(
      command,
      options.cwd || '/',
      options.onData || (() => {}),
      false,
      mode,
    ).result;

  let res = await run(preferred);
  if (res.exitCode !== 0 && fallback) {
    const other: TerminalBackend = preferred === 'proot' ? 'native' : 'proot';
    useNotificationStore.getState().addNotification({
      type: 'info',
      title: options.title ?? 'Terminal',
      source: 'Terminal',
      message:
        options.message ||
        `Retrying on ${other === 'proot' ? 'Linux (Alpine)' : 'Android (native)'}…`,
    });
    await requestTerminalBackend({
      ...options,
      preferred: other,
      message:
        options.message ||
        `Switched to ${other === 'proot' ? 'Linux (Alpine)' : 'native'} after an error.`,
    });
    res = await run(other);
    return { exitCode: res.exitCode, backend: other };
  }
  return { exitCode: res.exitCode, backend: preferred };
}

/** Factory for extension API surface */
export function createTerminalSwitchModule(_extId: string) {
  return {
    requestBackend: requestTerminalBackend,
    run: runOnBackend,
    getDefaultBackend: currentDefault,
  };
}