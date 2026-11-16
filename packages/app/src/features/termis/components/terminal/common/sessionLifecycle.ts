// src/features/termis/components/terminal/common/sessionLifecycle.ts
//
// Exclusive-mode spawn + graceful kill orchestration (frontend).
// Race guard: while isSwitchingMode, new spawns are rejected.

import {
  TERMINAL_CONFIG,
  oppositeExecMode,
  type ExecMode,
} from './config';

export type ActiveExecType = ExecMode | 'mixed' | null;

export interface LifecycleInstance {
  id: string;
  execMode: ExecMode;
  status: string;
}

export interface ExclusivePlan {
  /** Target mode for the new session. */
  mode: ExecMode;
  /** Other-type sessions that must die first when EXCLUSIVE_MODE. */
  toKill: LifecycleInstance[];
  /** Whether UI should show a confirm dialog. */
  needsConfirm: boolean;
  /** Human message for the dialog. */
  confirmMessage: string;
  /** Hard block (cap exceeded, switch in progress). */
  blocked?: string;
}

export function computeActiveExecType(
  instances: LifecycleInstance[],
): ActiveExecType {
  const live = instances.filter(
    i => i.status !== 'exited' && i.status !== 'error',
  );
  if (live.length === 0) return null;
  const modes = new Set(live.map(i => i.execMode));
  if (modes.size > 1) return 'mixed';
  return live[0].execMode;
}

export function planNewSession(
  mode: ExecMode,
  instances: LifecycleInstance[],
  opts?: { isSwitchingMode?: boolean },
): ExclusivePlan {
  if (opts?.isSwitchingMode) {
    return {
      mode,
      toKill: [],
      needsConfirm: false,
      confirmMessage: '',
      blocked: 'Cleaning up other sessions… please wait.',
    };
  }

  const live = instances.filter(
    i => i.status !== 'exited' && i.status !== 'error',
  );

  if (live.length >= TERMINAL_CONFIG.MAX_TOTAL_TABS) {
    return {
      mode,
      toKill: [],
      needsConfirm: false,
      confirmMessage: '',
      blocked: `Maximum ${TERMINAL_CONFIG.MAX_TOTAL_TABS} terminal tabs reached.`,
    };
  }

  const same = live.filter(i => i.execMode === mode);
  const other = live.filter(i => i.execMode !== mode);
  const cap =
    mode === 'native'
      ? TERMINAL_CONFIG.MAX_CONCURRENT_NATIVE
      : TERMINAL_CONFIG.MAX_CONCURRENT_PROOT;

  if (!TERMINAL_CONFIG.EXCLUSIVE_MODE) {
    if (same.length >= cap) {
      return {
        mode,
        toKill: [],
        needsConfirm: false,
        confirmMessage: '',
        blocked: `Maximum ${cap} concurrent ${mode} sessions reached.`,
      };
    }
    return { mode, toKill: [], needsConfirm: false, confirmMessage: '' };
  }

  // Exclusive: other type must be killed first
  if (other.length === 0) {
    if (same.length >= cap) {
      return {
        mode,
        toKill: [],
        needsConfirm: false,
        confirmMessage: '',
        blocked: `Maximum ${cap} concurrent ${mode} sessions reached.`,
      };
    }
    return { mode, toKill: [], needsConfirm: false, confirmMessage: '' };
  }

  const busy = other.some(i => i.status === 'busy');
  const skipConfirm =
    TERMINAL_CONFIG.SKIP_CONFIRM_IF_IDLE && !busy;
  const needsConfirm =
    TERMINAL_CONFIG.CONFIRM_BEFORE_KILL && !skipConfirm;

  const otherLabel = oppositeExecMode(mode) === 'proot' ? 'PRoot' : 'Native';
  const n = other.length;
  const confirmMessage =
    n === 1
      ? `1 ${otherLabel} session will be closed. Continue?`
      : `${n} ${otherLabel} sessions will be closed. Continue?`;

  return {
    mode,
    toKill: other,
    needsConfirm,
    confirmMessage,
  };
}

/**
 * Graceful kill sequence for a list of session ids.
 * 1) Ctrl+C + exit\n via registry write
 * 2) wait KILL_GRACE_MS
 * 3) registry kill()
 * NativeTerminal.kill is invoked by TerminalProcess.kill when registered.
 */
export async function gracefulKillSessions(
  ids: string[],
  opts?: {
    graceMs?: number;
    write?: (id: string, data: string) => void;
    kill?: (id: string) => void;
  },
): Promise<void> {
  const grace = opts?.graceMs ?? TERMINAL_CONFIG.KILL_GRACE_MS;
  // Callers should pass write/kill bound to terminalProcessRegistry + NativeTerminal.
  const write = opts?.write ?? (() => {});
  const kill = opts?.kill ?? (() => {});

  for (const id of ids) {
    try {
      write(id, '\x03'); // Ctrl+C
      write(id, 'exit\n');
    } catch {
      /* ignore */
    }
  }

  await new Promise(r => setTimeout(r, grace));

  for (const id of ids) {
    try {
      kill(id);
    } catch {
      /* ignore */
    }
  }
}
