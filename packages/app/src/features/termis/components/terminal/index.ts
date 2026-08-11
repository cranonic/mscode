// src/features/termis/components/terminal

export {
  TERMINAL_CONFIG,
  oppositeExecMode,
  type TerminalConfig,
  type ExecMode,
  type KillScope,
} from './common/config';

export {
  translatePathToGuest,
  translatePathToHost,
  type PathTranslateContext,
} from './common/pathTranslator';

export type {
  ITerminalCommandBuilder,
  SessionBuildInput,
  BackgroundBuildInput,
} from './common/TerminalCommandBuilder';

export {
  planNewSession,
  gracefulKillSessions,
  computeActiveExecType,
  type ExclusivePlan,
  type ActiveExecType,
  type LifecycleInstance,
} from './common/sessionLifecycle';

export { NativeCommandBuilder } from './native/NativeCommandBuilder';
export { NATIVE_ENV } from './native/nativeEnv';
export { ProotCommandBuilder } from './proot/ProotCommandBuilder';
export { PROOT_ENV, alpineUrlForArch } from './proot/prootEnv';

export {
  TERMINAL_SETTINGS_DEFAULTS,
  TERMINAL_SETTING_KEYS,
  type TerminalSettingsSchema,
} from './settings/terminalSettings';
