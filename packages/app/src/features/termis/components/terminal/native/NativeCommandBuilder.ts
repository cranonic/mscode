// src/features/termis/components/terminal/native/NativeCommandBuilder.ts
// TS-side mirror of Java TerminalCommandBuilder (Bionic + $PREFIX).
// Actual argv is produced on the Java side; this documents the contract.

import type {
  BackgroundBuildInput,
  ITerminalCommandBuilder,
  SessionBuildInput,
} from '../common/TerminalCommandBuilder';

export class NativeCommandBuilder implements ITerminalCommandBuilder {
  readonly execMode = 'native' as const;

  buildSessionCommand(_input: SessionBuildInput): string[] {
    // Java: /system/bin/sh -c '… optional bash exec …'
    return ['/system/bin/sh', '-i'];
  }

  buildSessionEnv(input: SessionBuildInput): Record<string, string> {
    return {
      TERM: 'xterm-256color',
      LANG: 'C.UTF-8',
      ENV: input.initScriptPath,
      MSCODE_EXEC_MODE: 'native',
    };
  }

  buildBackgroundCommand(input: BackgroundBuildInput): string[] {
    return ['/system/bin/sh', '-c', input.shellCommand];
  }

  buildBackgroundEnv(_input: BackgroundBuildInput): Record<string, string> {
    return {
      TERM: 'xterm-256color',
      LANG: 'C.UTF-8',
      MSCODE_EXEC_MODE: 'native',
    };
  }
}
