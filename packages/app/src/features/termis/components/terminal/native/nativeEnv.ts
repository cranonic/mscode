// src/features/termis/components/terminal/native/nativeEnv.ts
// Bionic / Termux-prefix environment notes (no Alpine).

export const NATIVE_ENV = {
  /** Interactive shell always starts from system sh; bash preferred when in $PREFIX. */
  systemShell: '/system/bin/sh',
  term: 'xterm-256color',
  /** Shared env script written by Java SharedEnvCache. */
  sharedEnvName: 'mscode_env.sh',
} as const;
