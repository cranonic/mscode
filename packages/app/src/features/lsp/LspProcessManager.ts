// src/features/lsp/LspProcessManager.ts
//
// Boots language servers: install packages → postInstall → spawn via ProcessServer path.
// Respects terminal.defaultExecMode (native vs proot/Alpine).
// On native CANNOT LINK / node failure → confirm switch to Alpine (proot).

import { Capacitor, registerPlugin } from '@capacitor/core';
import type { LspServerConfig } from '@/core/extensionAPI/modules/lspModule';
import { taskManager } from '@/core/extensionAPI/tasks/taskManager';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useModalStore } from '@/store/modalStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useOutputStore } from '@/features/termis/components/output/store/outputStore';

const NativeTerminal = registerPlugin<any>('NativeTerminal');

export type ExecMode = 'native' | 'proot';

export interface LspServerConfigExt extends LspServerConfig {
  /** Optional Alpine/apk package names when exec mode is proot. */
  prootPackages?: string[];
}

type PortCache = { port: number; execMode: ExecMode };

class LspProcessManager {
  /** languageId → config from extensions */
  dynamicConfigs: Record<string, LspServerConfigExt> = {};
  private ports: Record<string, PortCache> = {};
  private activeLanguage: string | null = null;
  private installLocks: Record<string, Promise<void>> = {};

  registerDynamicConfig(lang: string, config: LspServerConfigExt): void {
    this.dynamicConfigs[lang] = config;
  }

  removeDynamicConfig(lang: string): void {
    delete this.dynamicConfigs[lang];
  }

  getActiveLanguage(): string | null {
    return this.activeLanguage;
  }

  invalidatePort(lang: string): void {
    delete this.ports[lang];
  }

  stopServer(lang?: string): void {
    if (lang) {
      delete this.ports[lang];
      if (this.activeLanguage === lang) this.activeLanguage = null;
      try {
        NativeTerminal.killLsp?.({ language: lang });
      } catch { /* optional native API */ }
      return;
    }
    Object.keys(this.ports).forEach((l) => this.stopServer(l));
    this.activeLanguage = null;
  }

  private preferredExecMode(): ExecMode {
    const mode = useSettingsStore.getState().settings?.['terminal.defaultExecMode'];
    return mode === 'proot' ? 'proot' : 'native';
  }

  private log(channel: string, line: string): void {
    try {
      useOutputStore.getState().createChannel(channel);
      useOutputStore.getState().appendLog(channel, line.endsWith('\n') ? line : `${line}\n`);
    } catch { /* ignore */ }
  }

  /**
   * Ensure packages + postInstall for this language under the given exec mode.
   */
  /** Copy a live port mapping so TS/JS family tabs share one process. */
  sharePort(fromLang: string, toLang: string): void {
    const src = this.ports[fromLang];
    if (!src) return;
    this.ports[toLang] = { ...src };
  }

  /** Mark language as currently healthy (used by useLspSync after connect). */
  markAlive(lang: string): void {
    if (this.ports[lang] || this.dynamicConfigs[lang]) {
      this.activeLanguage = lang;
    }
  }

  private async ensureInstalled(
    lang: string,
    config: LspServerConfigExt,
    execMode: ExecMode,
    channel: string,
  ): Promise<void> {
    const lockKey = `${lang}:${execMode}`;
    const existing = this.installLocks[lockKey];
    if (existing !== undefined) return existing;

    this.installLocks[lockKey] = (async () => {
      const packages =
        execMode === 'proot' && config.prootPackages?.length
          ? config.prootPackages
          : config.packages;

      // 1) checkCmd
      if (config.checkCmd) {
        this.log(channel, `> checkCmd (${execMode}): ${config.checkCmd}`);
        const check = taskManager.execute(
          config.checkCmd,
          '/',
          (d) => this.log(channel, d),
          channel,
          execMode,
        );
        const { exitCode } = await check.result;
        this.log(channel, `> checkCmd exitCode=${exitCode}`);
        if (exitCode === 0) return;
      }

      // 2) packages
      if (packages?.length) {
        if (execMode === 'native' && Capacitor.isNativePlatform()) {
          this.log(channel, `> pkgInstall: ${packages.join(', ')}`);
          try {
            await NativeTerminal.pkgInstall({ packages });
            this.log(channel, '[pkg] already installed / install done');
          } catch (e: any) {
            this.log(channel, `[pkg] install error: ${e?.message || e}`);
          }
        } else {
          // Alpine: apk add
          const apk = `apk add --no-cache ${packages.join(' ')}`;
          this.log(channel, `> ${apk}`);
          const r = taskManager.execute(apk, '/', (d) => this.log(channel, d), channel, 'proot');
          const { exitCode } = await r.result;
          if (exitCode !== 0) {
            throw new Error(`apk add failed (exit ${exitCode})`);
          }
        }
      }

      // 3) postInstall (e.g. npm install -g pyright)
      const posts = config.postInstall || [];
      for (const cmd of posts) {
        this.log(channel, `> Executing: ${cmd}`);
        let out = '';
        const job = taskManager.execute(
          cmd,
          '/',
          (d) => {
            out += d;
            this.log(channel, d);
          },
          channel,
          execMode,
        );
        const { exitCode } = await job.result;
        if (exitCode !== 0) {
          const linkerFail =
            /CANNOT LINK EXECUTABLE/i.test(out) ||
            /cannot locate symbol/i.test(out) ||
            /libnode|nodejs.*not found/i.test(out);
          const err = new Error(
            linkerFail
              ? `LINKER_FAIL: ${cmd}`
              : `Setup command failed: ${cmd}`,
          );
          (err as any).linkerFail = linkerFail;
          (err as any).output = out;
          throw err;
        }
      }
    })();

    try {
      await this.installLocks[lockKey];
    } finally {
      delete this.installLocks[lockKey];
    }
  }

  /**
   * Ask user to switch terminal backend to Alpine (proot) after native failure.
   */
  private async confirmSwitchToAlpine(detail: string): Promise<boolean> {
    const choice = await useModalStore.getState().showModal({
      title: 'Native terminal failed',
      message:
        'Node/Python tools could not run in the Android (native) terminal.\n\n' +
        'This usually means Termux node cannot load the right C++ libraries on this device.\n\n' +
        'Switch to Linux Alpine (proot) terminal?\n' +
        '• If Alpine is not set up yet, setup will run first.\n' +
        '• Then LSP install will retry inside Alpine.\n\n' +
        detail.slice(0, 280),
      iconName: 'warning',
      buttons: ['Switch to Alpine', 'Stay on Native'],
    });
    return choice === 'Switch to Alpine';
  }

  private async setDefaultExecMode(mode: ExecMode): Promise<void> {
    try {
      const store = useSettingsStore.getState();
      if (typeof store.updateSetting === 'function') {
        store.updateSetting('terminal.defaultExecMode', mode);
      }
    } catch { /* best effort */ }
  }

  /**
   * Ensure Alpine rootfs exists (proot path). Uses native plugin if available.
   */
  private async ensureAlpineReady(channel: string): Promise<void> {
    this.log(channel, '[Alpine] Ensuring proot rootfs…');
    try {
      if (typeof NativeTerminal.ensureProotRootfs === 'function') {
        await NativeTerminal.ensureProotRootfs({});
        this.log(channel, '[Alpine] ensureProotRootfs OK');
        return;
      }
      // Fallback: open a short proot background command that forces rootfs extract
      const probe = taskManager.execute(
        'test -f /etc/alpine-release && cat /etc/alpine-release || echo missing',
        '/',
        (d) => this.log(channel, d),
        channel,
        'proot',
      );
      const { exitCode } = await probe.result;
      if (exitCode !== 0) {
        throw new Error('Alpine rootfs not ready');
      }
      this.log(channel, '[Alpine] rootfs ready');
    } catch (e: any) {
      this.log(channel, `[Alpine] setup error: ${e?.message || e}`);
      throw e;
    }
  }

  /**
   * Install (if needed) and return a local port for the language server.
   * Actual process spawn is still owned by native ProcessServer when present;
   * here we guarantee tools exist under the chosen backend.
   */
  async startServer(lang: string): Promise<number | null> {
    const config = this.dynamicConfigs[lang];
    if (!config) {
      console.warn(`[LspProcessManager] No config for ${lang}`);
      return null;
    }

    const channel = `LSP: ${lang}`;
    useOutputStore.getState().createChannel(channel);

    let execMode = this.preferredExecMode();
    this.log(channel, `Starting ${lang} (preferred backend: ${execMode})`);

    try {
      await this.ensureInstalled(lang, config, execMode, channel);
    } catch (e: any) {
      const linkerFail = !!(e?.linkerFail || /LINKER_FAIL|CANNOT LINK/i.test(String(e?.message)));
      this.log(channel, `[ERROR] ${e?.message || e}`);

      if (execMode === 'native' && linkerFail) {
        const ok = await this.confirmSwitchToAlpine(String(e?.output || e?.message || ''));
        if (ok) {
          await this.setDefaultExecMode('proot');
          useNotificationStore.getState().addNotification({
            type: 'info',
            title: 'Terminal backend',
            source: 'LSP',
            message: 'Switched default terminal to Linux Alpine (proot). Setting up…',
          });
          await this.ensureAlpineReady(channel);
          execMode = 'proot';
          await this.ensureInstalled(lang, config, 'proot', channel);
        } else {
          useNotificationStore.getState().addNotification({
            type: 'error',
            title: 'LSP setup failed',
            source: 'LSP',
            message: e?.message || 'Setup command failed',
          });
          throw e;
        }
      } else if (execMode === 'proot') {
        // First time proot may need rootfs
        try {
          await this.ensureAlpineReady(channel);
          await this.ensureInstalled(lang, config, 'proot', channel);
        } catch (e2: any) {
          useNotificationStore.getState().addNotification({
            type: 'error',
            title: 'LSP setup failed',
            source: 'LSP',
            message: e2?.message || 'Alpine setup failed',
          });
          throw e2;
        }
      } else {
        useNotificationStore.getState().addNotification({
          type: 'error',
          title: 'LSP setup failed',
          source: 'LSP',
          message: e?.message || 'Setup command failed',
        });
        throw e;
      }
    }

    // Spawn language server if native bridge exposes it
    try {
      if (typeof NativeTerminal.startLspServer === 'function') {
        const ret = await NativeTerminal.startLspServer({
          language: lang,
          serverCmd: config.serverCmd,
          execType: execMode,
        });
        const port = ret?.port ?? null;
        if (port != null) {
          this.ports[lang] = { port, execMode };
          this.activeLanguage = lang;
          this.log(channel, `Server listening on ${port} (${execMode})`);
          return port;
        }
      }
    } catch (e: any) {
      this.log(channel, `startLspServer: ${e?.message || e}`);
    }

    // Fallback: remember backend even without port (transport may attach later)
    this.ports[lang] = { port: 0, execMode };
    this.activeLanguage = lang;
    this.log(channel, `Tools ready under ${execMode}; waiting for transport bind`);
    return this.ports[lang].port || null;
  }
}

export const lspProcessManager = new LspProcessManager();