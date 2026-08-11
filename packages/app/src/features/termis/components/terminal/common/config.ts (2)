// src/features/termis/components/terminal/common/config.ts
//
// Tunable terminal concurrency / exclusive-mode policy.
// Do not hardcode these values in UI or store actions — import TERMINAL_CONFIG.

export type KillScope = 'terminals' | 'terminals+servers' | 'terminals+servers+background';

export interface TerminalConfig {
  /** When true, only one execMode may have live sessions at a time. */
  EXCLUSIVE_MODE: boolean;
  /** Show confirm dialog before exclusive kill (unless SKIP_CONFIRM_IF_IDLE). */
  CONFIRM_BEFORE_KILL: boolean;
  /** Skip confirm when no non-idle (busy) sessions of the other type exist. */
  SKIP_CONFIRM_IF_IDLE: boolean;

  /** Hard cap on total terminal tabs (native + proot). */
  MAX_TOTAL_TABS: number;
  /** Cap when EXCLUSIVE_MODE is false (mixed allowed). */
  MAX_CONCURRENT_NATIVE: number;
  MAX_CONCURRENT_PROOT: number;

  /** After SIGINT / exit, wait this long before force-kill. */
  KILL_GRACE_MS: number;
  /**
   * What exclusive-kill tears down:
   *  - terminals — PTY sessions only
   *  - terminals+servers — + LSP/process servers (when tagged same execType)
   *  - terminals+servers+background — + backgroundExecute jobs
   *
   * LSP wiring is reserved; see terminalSettings — LSP flags are placeholders.
   */
  KILL_SCOPE: KillScope;

  /** Future: suspend idle tabs after this many ms (0 = disabled). */
  IDLE_SUSPEND_MS: number;
}

export const TERMINAL_CONFIG: TerminalConfig = {
  EXCLUSIVE_MODE: true,
  CONFIRM_BEFORE_KILL: true,
  SKIP_CONFIRM_IF_IDLE: true,

  MAX_TOTAL_TABS: 8,
  MAX_CONCURRENT_NATIVE: 6,
  MAX_CONCURRENT_PROOT: 2,

  KILL_GRACE_MS: 1500,
  KILL_SCOPE: 'terminals+servers+background',

  IDLE_SUSPEND_MS: 5 * 60_000,
};

/** Runtime backend for a session. */
export type ExecMode = 'native' | 'proot';

export function oppositeExecMode(mode: ExecMode): ExecMode {
  return mode === 'native' ? 'proot' : 'native';
}
