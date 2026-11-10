// src/core/extensionAPI/modules/tasksModule.ts

import { taskManager } from '@/core/extensionAPI/tasks/taskManager';
import { useOutputStore } from '@/features/termis/components/output/store/outputStore';
import { useExplorerStore } from '@/features/explorer/store/exploreStore';
import {
  resolveExecBackend,
  type TerminalBackend,
  type DualBackendOptions,
} from './terminalSwitch';

export type TaskExecType = TerminalBackend;

export interface TaskExecuteOptions extends DualBackendOptions {
  cwd?: string;
  channel?: string | false;
  /** Skip resolveExecBackend and force this backend. */
  execType?: TaskExecType;
}

export const createTasksModule = (extId: string) => ({
  /**
   * Run a shell command.
   *
   * Legacy:
   *   execute(cmd, cwd, onData, channel|false, execType?)
   *
   * Options object (dual terminal):
   *   execute(cmd, onData, { preferred: 'proot', backends: ['proot','native'], ... })
   */
  execute: (
    cmd: string,
    cwdOrOnData?: string | ((d: string) => void),
    onDataOrOpts?: ((d: string) => void) | TaskExecuteOptions,
    execTypeOrChannel?: string | false | TaskExecType,
    execType?: TaskExecType,
  ) => {
    // ── options-object form: execute(cmd, onData, opts) ──────────────────
    if (
      typeof cwdOrOnData === 'function' &&
      onDataOrOpts &&
      typeof onDataOrOpts === 'object' &&
      !Array.isArray(onDataOrOpts)
    ) {
      const onData = cwdOrOnData;
      const opts = onDataOrOpts as TaskExecuteOptions;
      const channel = opts.channel ?? false;
      const cwd = opts.cwd || '/';

      const resultPromise = (async () => {
        let mode: TaskExecType = opts.execType || opts.preferred || 'proot';
        if (!opts.execType) {
          const resolved = await resolveExecBackend(opts);
          if (resolved.cancelled) return { exitCode: 130 };
          mode = resolved.backend;
        }
        return taskManager.execute(cmd, cwd, onData, channel, mode).result;
      })();

      return {
        command: cmd,
        result: resultPromise,
        terminate: () => {},
      };
    }

    // ── legacy form ──────────────────────────────────────────────────────
    const cwd = typeof cwdOrOnData === 'string' ? cwdOrOnData : '/';
    const onData =
      typeof cwdOrOnData === 'function'
        ? cwdOrOnData
        : typeof onDataOrOpts === 'function'
          ? onDataOrOpts
          : () => {};

    let channel: string | false = false;
    let mode: TaskExecType = 'proot';

    if (execTypeOrChannel === 'native' || execTypeOrChannel === 'proot') {
      mode = execTypeOrChannel;
    } else if (execTypeOrChannel !== undefined) {
      channel = execTypeOrChannel as string | false;
      if (execType === 'native' || execType === 'proot') mode = execType;
    } else if (execType === 'native' || execType === 'proot') {
      mode = execType;
    }

    const { result, kill } = taskManager.execute(
      cmd,
      cwd,
      onData,
      channel ?? false,
      mode,
    );
    return { command: cmd, result, terminate: kill };
  },

  runInBackground: (
    command: string,
    options?: {
      cwd?: string;
      outputChannel?: string;
      execType?: TaskExecType;
      preferred?: TaskExecType;
      backends?: TaskExecType[];
    },
  ) => {
    const channel = options?.outputChannel ?? `Task: ${extId}`;
    useOutputStore.getState().createChannel(channel);
    const fallbackCwd = useExplorerStore.getState().workspacePath || '/';

    const resultPromise = (async () => {
      let mode: TaskExecType = options?.execType || options?.preferred || 'proot';
      if (!options?.execType && (options?.backends || options?.preferred)) {
        const resolved = await resolveExecBackend({
          backends: options.backends,
          preferred: options.preferred,
        });
        if (resolved.cancelled) return { exitCode: 130 };
        mode = resolved.backend;
      }
      return taskManager.execute(
        command,
        options?.cwd ?? fallbackCwd,
        () => {},
        channel,
        mode,
      ).result;
    })();

    return { command, result: resultPromise, terminate: () => {} };
  },
});

export type TasksModule = ReturnType<typeof createTasksModule>;
