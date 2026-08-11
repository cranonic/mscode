// src/features/termis/index.ts
export { TermisPanel } from './TermisPanel';
export { TerminalInstance } from './components/terminal/components/TerminalInstance';
export { useTerminalPanel } from './components/terminal/hooks/useTerminalPanel';
export { useTerminalStore } from './components/terminal/store/terminalStore';
export type {
  TerminalInstance as TerminalInstanceType,
  TerminalShell,
  TerminalRuntime,
  TerminalStatus,
} from './components/terminal/store/terminalStore';

// Architecture barrel (config, lifecycle, native/proot builders, settings)
export {
  TERMINAL_CONFIG,
  oppositeExecMode,
  planNewSession,
  gracefulKillSessions,
  computeActiveExecType,
  NativeCommandBuilder,
  ProotCommandBuilder,
  TERMINAL_SETTINGS_DEFAULTS,
  type ExecMode,
  type TerminalConfig,
  type ExclusivePlan,
  type ActiveExecType,
} from './components/terminal';
