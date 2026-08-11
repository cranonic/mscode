// src/features/termis/components/terminal/store/terminalStore.ts

import { create } from 'zustand';
import { msEvents } from '@/core/extensionAPI/events/EventManager';
import {
  TERMINAL_CONFIG,
  type ExecMode,
  planNewSession,
  gracefulKillSessions,
  computeActiveExecType,
  type ActiveExecType,
  type ExclusivePlan,
} from '..';
import { terminalProcessRegistry } from '../core/TerminalRegistry';
import { NativeTerminal } from '../core/TerminalProcess';

export type TerminalStatus = 'initializing' | 'ready' | 'busy' | 'exited' | 'error';
export type TerminalShell = 'bash' | 'sh' | 'zsh' | 'fish' | 'powershell' | 'cmd';

/** @deprecated use ExecMode — kept for older UI imports */
export type TerminalRuntime = ExecMode;

export interface TerminalInstance {
  id: string;
  title: string;
  shell: TerminalShell;
  /** Backend: Android bionic vs Alpine proot */
  execMode: ExecMode;
  /** @deprecated alias of execMode for older UI */
  runtime: ExecMode;
  status: TerminalStatus;
  workingDir: string;
  pid?: number;
  exitCode?: number;
  createdAt: number;
}

interface TerminalState {
  instances: TerminalInstance[];
  activeId: string | null;
  defaultShell: TerminalShell;

  /** Fast exclusive-check: native | proot | mixed | null */
  activeExecType: ActiveExecType;
  /** True while exclusive kill + cleanup runs — blocks new spawns */
  isSwitchingMode: boolean;

  createInstance: (
    opts?: Partial<Pick<TerminalInstance, 'title' | 'shell' | 'workingDir' | 'execMode' | 'runtime'>>,
  ) => string;
  /**
   * Full spawn path with exclusive-mode / caps.
   * Returns { ok, id?, plan?, blocked? }.
   * If plan.needsConfirm, caller must show dialog then call confirmExclusiveSpawn.
   */
  requestSpawn: (
    mode: ExecMode,
    opts?: Partial<Pick<TerminalInstance, 'title' | 'shell' | 'workingDir'>>,
  ) => {
    ok: boolean;
    id?: string;
    plan?: ExclusivePlan;
    blocked?: string;
  };
  /** After user confirms exclusive kill — kills other type, then spawns. */
  confirmExclusiveSpawn: (
    mode: ExecMode,
    opts?: Partial<Pick<TerminalInstance, 'title' | 'shell' | 'workingDir'>>,
  ) => Promise<{ ok: boolean; id?: string; error?: string }>;

  removeInstance: (id: string) => void;
  setActive: (id: string) => void;
  updateInstance: (id: string, patch: Partial<TerminalInstance>) => void;
  renameInstance: (id: string, title: string) => void;
  killAllOfType: (mode: ExecMode) => Promise<void>;
  refreshActiveExecType: () => void;
}

function recomputeActive(instances: TerminalInstance[]): ActiveExecType {
  return computeActiveExecType(
    instances.map(i => ({
      id: i.id,
      execMode: i.execMode,
      status: i.status,
    })),
  );
}

function resolveMode(
  opts?: Partial<Pick<TerminalInstance, 'execMode' | 'runtime'>>,
): ExecMode {
  const m = opts?.execMode || opts?.runtime;
  return m === 'proot' || m === ('linux' as string) ? 'proot' : 'native';
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  instances: [],
  activeId: null,
  defaultShell: 'sh',
  activeExecType: null,
  isSwitchingMode: false,

  createInstance: (opts) => {
    // Direct create (no exclusive checks) — prefer requestSpawn from UI
    const id = `term-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    const execMode = resolveMode(opts);
    const instance: TerminalInstance = {
      id,
      title: opts?.title || 'Terminal',
      shell: opts?.shell || get().defaultShell,
      execMode,
      runtime: execMode,
      status: 'initializing',
      workingDir: opts?.workingDir || '/storage/emulated/0',
      createdAt: Date.now(),
    };

    set(s => {
      const instances = [...s.instances, instance];
      return {
        instances,
        activeId: id,
        activeExecType: recomputeActive(instances),
      };
    });

    msEvents.emit('onDidOpenTerminal', instance);
    return id;
  },

  requestSpawn: (mode, opts) => {
    const s = get();
    const plan = planNewSession(
      mode,
      s.instances.map(i => ({
        id: i.id,
        execMode: i.execMode,
        status: i.status,
      })),
      { isSwitchingMode: s.isSwitchingMode },
    );

    if (plan.blocked) {
      return { ok: false, blocked: plan.blocked, plan };
    }

    if (plan.toKill.length > 0) {
      // Need kill (and maybe confirm) before spawn
      return { ok: false, plan };
    }

    const id = get().createInstance({ ...opts, execMode: mode });
    return { ok: true, id, plan };
  },

  confirmExclusiveSpawn: async (mode, opts) => {
    const s = get();
    if (s.isSwitchingMode) {
      return { ok: false, error: 'Cleaning up other sessions… please wait.' };
    }

    const plan = planNewSession(
      mode,
      s.instances.map(i => ({
        id: i.id,
        execMode: i.execMode,
        status: i.status,
      })),
      { isSwitchingMode: false },
    );

    if (plan.blocked) return { ok: false, error: plan.blocked };

    set({ isSwitchingMode: true });
    try {
      if (plan.toKill.length > 0) {
        await get().killAllOfType(oppositeOf(mode));
      }
      const id = get().createInstance({ ...opts, execMode: mode });
      return { ok: true, id };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    } finally {
      set({ isSwitchingMode: false });
      get().refreshActiveExecType();
    }
  },

  removeInstance: (id) => {
    let closedInstance: TerminalInstance | undefined;
    set(s => {
      closedInstance = s.instances.find(t => t.id === id);
      const remaining = s.instances.filter(t => t.id !== id);
      let newActive = s.activeId;

      if (s.activeId === id) {
        const idx = s.instances.findIndex(t => t.id === id);
        const next = remaining[Math.max(0, idx - 1)];
        newActive = next?.id ?? null;
      }
      return {
        instances: remaining,
        activeId: newActive,
        activeExecType: recomputeActive(remaining),
      };
    });

    try {
      terminalProcessRegistry.get(id)?.kill();
    } catch { /* */ }
    terminalProcessRegistry.unregister(id);

    if (closedInstance) {
      msEvents.emit('onDidCloseTerminal', {
        id,
        exitCode: closedInstance.exitCode,
      });
    }
  },

  setActive: (id) => {
    set({ activeId: id });
    const inst = get().instances.find(t => t.id === id);
    if (inst) msEvents.emit('onDidChangeActiveTerminal', inst);
  },

  updateInstance: (id, patch) =>
    set(s => {
      const instances = s.instances.map(t => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        if (patch.execMode) next.runtime = patch.execMode;
        if (patch.runtime && !patch.execMode) {
          next.execMode = patch.runtime;
        }
        return next;
      });
      return {
        instances,
        activeExecType: recomputeActive(instances),
      };
    }),

  renameInstance: (id, title) => {
    const next = title.trim() || 'Terminal';
    set(s => ({
      instances: s.instances.map(t => (t.id === id ? { ...t, title: next } : t)),
    }));
  },

  killAllOfType: async (mode) => {
    const targets = get().instances.filter(
      i =>
        i.execMode === mode &&
        i.status !== 'exited' &&
        i.status !== 'error',
    );
    const ids = targets.map(t => t.id);
    if (ids.length === 0) return;

    await gracefulKillSessions(ids, {
      graceMs: TERMINAL_CONFIG.KILL_GRACE_MS,
      write: (id, data) => {
        try {
          terminalProcessRegistry.get(id)?.write(data);
        } catch { /* */ }
      },
      kill: (id) => {
        try {
          terminalProcessRegistry.get(id)?.kill();
        } catch { /* */ }
        try {
          // Native bridge force-kill (no-op on web)
          void NativeTerminal.kill?.({ id });
        } catch { /* */ }
      },
    });

    // Backend batch kill for background/servers when KILL_SCOPE includes them
    try {
      const anyNative = NativeTerminal as any;
      if (typeof anyNative.killAllSessionsOfType === 'function') {
        await anyNative.killAllSessionsOfType({ execType: mode });
      }
    } catch { /* plugin may not be updated yet */ }

    for (const id of ids) {
      get().removeInstance(id);
    }
  },

  refreshActiveExecType: () => {
    set(s => ({ activeExecType: recomputeActive(s.instances) }));
  },
}));

function oppositeOf(mode: ExecMode): ExecMode {
  return mode === 'native' ? 'proot' : 'native';
}
