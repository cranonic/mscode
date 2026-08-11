// src/features/termis/components/terminal/common/TerminalCommandBuilder.ts
// Interface only — implementations live in native/ and proot/.

import type { ExecMode } from './config';

export interface SessionBuildInput {
  initScriptPath: string;
  cwd?: string;
  execMode: ExecMode;
}

export interface BackgroundBuildInput {
  shellCommand: string;
  execMode: ExecMode;
}

/**
 * Builds argv + env for a PTY or background shell.
 * Native and PRoot implement this separately (Java mirrors this split).
 */
export interface ITerminalCommandBuilder {
  readonly execMode: ExecMode;
  buildSessionCommand(input: SessionBuildInput): string[];
  buildSessionEnv(input: SessionBuildInput): Record<string, string>;
  buildBackgroundCommand(input: BackgroundBuildInput): string[];
  buildBackgroundEnv(input: BackgroundBuildInput): Record<string, string>;
}
