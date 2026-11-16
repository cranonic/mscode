// src/features/termis/components/terminal/proot/ProotCommandBuilder.ts
//
// TS mirror of Java ProotCommandBuilder (see Old code - Alpine based proot/).
// Alpine rootfs is downloaded from the internet at first proot session
// (not from app assets). Full spawn is wired on the Java side.

import type {
  BackgroundBuildInput,
  ITerminalCommandBuilder,
  SessionBuildInput,
} from '../common/TerminalCommandBuilder';

export class ProotCommandBuilder implements ITerminalCommandBuilder {
  readonly execMode = 'proot' as const;

  private readonly prootPath: string;
  private readonly rootfsPath: string;

  constructor(prootPath: string = '', rootfsPath: string = '') {
    this.prootPath = prootPath;
    this.rootfsPath = rootfsPath;
  }

  buildSessionCommand(input: SessionBuildInput): string[] {
    // Java builds: proot [flags] -r rootfs -w cwd sh /path/to/init.sh
    if (!this.prootPath) {
      return ['/system/bin/sh', '-i']; // UI-only fallback until rootfs ready
    }
    return [
      this.prootPath,
      '--link2symlink',
      '--kill-on-exit',
      '-0',
      '-r', this.rootfsPath,
      '-b', '/system',
      '-b', '/data',
      '-b', '/dev',
      '-b', '/proc',
      '-b', '/sys',
      '-b', '/storage',
      '-b', '/sdcard',
      '-w', input.cwd || '/root',
      'sh',
      input.initScriptPath,
    ];
  }

  buildSessionEnv(input: SessionBuildInput): Record<string, string> {
    return {
      TERM: 'xterm-256color',
      LANG: 'C.UTF-8',
      HOME: '/root',
      PREFIX: '/usr',
      MSCODE_EXEC_MODE: 'proot',
      PROOT_TMP_DIR: '/tmp',
      ENV: input.initScriptPath,
    };
  }

  buildBackgroundCommand(input: BackgroundBuildInput): string[] {
    if (!this.prootPath) {
      return ['/system/bin/sh', '-c', input.shellCommand];
    }
    return [
      this.prootPath,
      '--link2symlink',
      '--kill-on-exit',
      '-0',
      '-r', this.rootfsPath,
      '-b', '/system',
      '-b', '/storage',
      '-b', '/sdcard',
      'sh',
      '-c',
      input.shellCommand,
    ];
  }

  buildBackgroundEnv(_input: BackgroundBuildInput): Record<string, string> {
    return {
      TERM: 'xterm-256color',
      LANG: 'C.UTF-8',
      MSCODE_EXEC_MODE: 'proot',
    };
  }
}
