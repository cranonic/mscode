// src/features/lsp/LspProcessManager.ts
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useNotificationStore } from '@/store/notificationStore';
import { useStatusBarStore } from '@/features/statusbar/store/statusBarStore';

const NativeTerminal = registerPlugin<any>('NativeTerminal');

const LANGUAGE_CONFIGS: Record<string, { packages: string[]; postInstall?: string[]; checkCmd: string; serverCmd: string }> = {};

// Package manager retry config (Termux/Native Bionic)
const PKG_MAX_RETRIES    = 3;
const PKG_RETRY_DELAY_MS = 3_000;

export class LspProcessManager {

    // ─── Port registry ────────────────────────────────────────────────────────
    // Tracks every language that has a running server: language → port.
    private activePorts = new Map<string, number>();
    /** Languages whose WebSocket handshake completed (Android may kill the process later). */
    private aliveLanguages = new Set<string>();
    private pendingStarts = new Map<string, Promise<number | null>>();

    // ─── Serial installation queue ────────────────────────────────────────────
    // Modifying the Termux $PREFIX via `pkg install` concurrently can cause
    // race conditions or partial extractions. Every new startServer call
    // chains off this Promise so only one _doStart body executes at a time.
    private installQueue: Promise<void> = Promise.resolve();

    public dynamicConfigs: Record<string, any> = {};

    public registerDynamicConfig(language: string, config: any): void {
        this.dynamicConfigs[language] = config;
        console.log(`[LSP] dynamic config registered for "${language}"`);
    }

    public removeDynamicConfig(language: string): void {
        delete this.dynamicConfigs[language];
    }

    /**
     * Reuse an already-spawned process port for a sibling language id
     * (e.g. typescript → javascript / tsx after one typescript-language-server boot).
     */
    public sharePort(fromLanguage: string, toLanguage: string): void {
        const port = this.activePorts.get(fromLanguage);
        if (port == null) return;
        this.activePorts.set(toLanguage, port);
        if (this.aliveLanguages.has(fromLanguage)) {
            this.aliveLanguages.add(toLanguage);
        }
    }

    // ─── Low-level streaming ───────────────────────────────
    private async executeStreamCommand(
        sessionId: string,
        command: string,
        onLog: (data: string) => void
    ): Promise<number> {
        return new Promise(async (resolve, reject) => {
            let dataListener: any;
            let exitListener: any;

            const cleanup = () => {
                if (dataListener) dataListener.remove();
                if (exitListener) exitListener.remove();
            };

            try {
                dataListener = await NativeTerminal.addListener('onBackgroundData', (event: any) => {
                    if (event.sessionId === sessionId) onLog(event.data);
                });

                exitListener = await NativeTerminal.addListener('onBackgroundExit', (event: any) => {
                    if (event.sessionId === sessionId) {
                        cleanup();
                        resolve(event.exitCode);
                    }
                });

                await NativeTerminal.streamBackgroundExecute({ sessionId, command });
            } catch (err) {
                cleanup();
                reject(err);
            }
        });
    }

    private async executeWithRetry(
        baseSessionId: string,
        command: string,
        onLog: (data: string) => void,
    ): Promise<number> {
        for (let attempt = 1; attempt <= PKG_MAX_RETRIES; attempt++) {
            const exitCode = await this.executeStreamCommand(
                `${baseSessionId}_attempt${attempt}`,
                command,
                onLog,
            );

            if (exitCode === 0) return 0;

            if (attempt < PKG_MAX_RETRIES) {
                onLog(`\n> Command failed (exit ${exitCode}) — retrying in ${PKG_RETRY_DELAY_MS / 1000}s… (${attempt}/${PKG_MAX_RETRIES})\n`);
                await new Promise(r => setTimeout(r, PKG_RETRY_DELAY_MS));
                continue;
            }

            return exitCode; // non-retryable failure
        }
        return -1;
    }

    // ─── Public entry point ───────────────────────────────────────────────────
    public startServer(language: string): Promise<number | null> {
        if (!Capacitor.isNativePlatform()) return Promise.resolve(null);

        const config = this.dynamicConfigs[language] || LANGUAGE_CONFIGS[language];
        if (!config) return Promise.resolve(null);

        // Fast path 1: only reuse port if handshake previously succeeded AND we
        // have not marked it dead (background kill clears aliveLanguages).
        const cached = this.activePorts.get(language);
        if (cached && this.aliveLanguages.has(language)) {
            return Promise.resolve(cached);
        }
        if (cached && !this.aliveLanguages.has(language)) {
            // Stale cache after process death — drop it and respawn below
            this.activePorts.delete(language);
        }

        // Fast path 2: an install for this exact language is already in progress.
        const inflight = this.pendingStarts.get(language);
        if (inflight) return inflight;

        // Slow path: queue behind any running installation so we never run two
        // `pkg install` commands at the same time.
        let releaseQueue!: () => void;
        const mySlot = new Promise<void>(r => { releaseQueue = r; });

        // Chain: next caller waits for mySlot, which we release in finally{}.
        const prevQueue    = this.installQueue;
        this.installQueue  = mySlot;

        const promise = prevQueue
            .then(() => this._doStart(language))
            .finally(() => {
                this.pendingStarts.delete(language);
                releaseQueue(); // let the next queued language proceed
            });

        this.pendingStarts.set(language, promise);
        return promise;
    }

    // ─── Core install + spawn logic ───────────────────────────────────────────
    private async _doStart(language: string): Promise<number | null> {
        const config = this.dynamicConfigs[language] || LANGUAGE_CONFIGS[language];

        // Re-check: another queued call may have already finished this language
        // while we were waiting in the queue.
        const cached = this.activePorts.get(language);
        if (cached) return cached;

        const notifId   = `lsp-boot-${language}`;
        let consoleLogs = '';

        useStatusBarStore.getState().updateItem('lsp-status', {
            label: `Starting ${language}…`,
            icon: 'sync',
            spin: true,
        });

        useNotificationStore.getState().addNotification({
            id: notifId,
            type: 'loading',
            title: `Initializing ${language.toUpperCase()} Server`,
            source: 'MS Code LSP',
            message: 'Checking dependencies…',
        });

        try {
            consoleLogs += `> Checking for existing installation: ${config.checkCmd}\n`;

            const checkRes = await NativeTerminal.backgroundExecute({
                sessionId: notifId + '_check',
                command: config.checkCmd
            });

            if (checkRes.exitCode === 0) {
                consoleLogs += `> Server binary found! Skipping installation.\n`;
                useNotificationStore.getState().updateNotification(notifId, {
                    message: 'Dependencies verified. Booting up server…',
                    fullMessage: consoleLogs,
                });
            } else {
                const pkgs = config.packages.join(' ');
                if (pkgs) {
                    consoleLogs += `> Executing: pkg install ${pkgs}\n`;
                    useNotificationStore.getState().updateNotification(notifId, {
                        message: `Installing ${language} toolchain… (expand to view logs)`,
                        fullMessage: consoleLogs,
                    });

                    const exitCode = await this.executeWithRetry(
                        notifId,
                        `pkg install ${pkgs}`,
                        (data) => {
                            consoleLogs += data;
                            useNotificationStore.getState().updateNotification(notifId, { fullMessage: consoleLogs });
                        }
                    );

                    if (exitCode !== 0) throw new Error(`Package installation failed (Exit Code: ${exitCode})`);
                }

                if (config.postInstall?.length) {
                    for (const cmd of config.postInstall) {
                        consoleLogs += `\n> Executing: ${cmd}\n`;
                        useNotificationStore.getState().updateNotification(notifId, {
                            message: `Running setup: ${cmd}…`,
                            fullMessage: consoleLogs,
                        });

                        const exitCode = await this.executeWithRetry(
                            `${notifId}_post`,
                            cmd,
                            (data) => {
                                consoleLogs += data;
                                useNotificationStore.getState().updateNotification(notifId, { fullMessage: consoleLogs });
                            }
                        );

                        if (exitCode !== 0) throw new Error(`Setup command failed: ${cmd}`);
                    }
                }
            }

            consoleLogs += `\n> Booting language server process…\n`;
            useNotificationStore.getState().updateNotification(notifId, {
                message: 'Booting up server…',
                fullMessage: consoleLogs,
            });

            const result = await NativeTerminal.spawnLsp({ command: config.serverCmd });

            if (result?.port) {
                this.activePorts.set(language, result.port);

                useNotificationStore.getState().updateNotification(notifId, {
                    message: 'Server process spawned. Connecting to editor…',
                });
                return result.port;
            }
            throw new Error('Port not received from Java Backend');

        } catch (err: any) {
            console.error(`[LSP] Failed to start ${language} server:`, err);
            useNotificationStore.getState().updateNotification(notifId, {
                type: 'error',
                message: `Boot failed: ${err.message}`,
                fullMessage: consoleLogs + `\n[ERROR] ${err.message}`,
            });
            useStatusBarStore.getState().updateItem('lsp-status', {
                label: 'LSP Error',
                icon: 'error',
                spin: false,
                color: 'var(--vscode-errorForeground)',
            });
            return null;
        }
    }

    /**
     * Stops tracked LSP server(s).
     * Always attempts a native killLsp so the language-server process
     * and listening WebSocket are torn down — not just the JS port map.
     */
    /** Call after LSP initialize succeeds. */
    public markAlive(language: string): void {
        this.aliveLanguages.add(language);
    }

    /** Call when WebSocket dies / boot fails — forces respawn on next startServer. */
    public invalidatePort(language: string): void {
        this.activePorts.delete(language);
        this.aliveLanguages.delete(language);
    }

    public stopServer(language?: string): void {
        const kill = (lang: string, port: number) => {
            this.activePorts.delete(lang);
            this.aliveLanguages.delete(lang);
            NativeTerminal.killLsp({ port }).catch((err: any) => {
                console.warn(`[LSP] killLsp(${port}) for ${lang} failed:`, err);
            });
        };

        if (language) {
            const port = this.activePorts.get(language);
            if (port != null) kill(language, port);
            else this.activePorts.delete(language);
        } else {
            const entries = [...this.activePorts.entries()];
            this.activePorts.clear();
            for (const [lang, port] of entries) {
                NativeTerminal.killLsp({ port }).catch((err: any) => {
                    console.warn(`[LSP] killLsp(${port}) for ${lang} failed:`, err);
                });
            }
            NativeTerminal.killAllLsp?.().catch(() => {});
        }
    }

    public getActiveLanguage(): string | null {
        // Returns the most recently started language (Map preserves insertion order).
        const keys = [...this.activePorts.keys()];
        return keys.at(-1) ?? null;
    }
}

export const lspProcessManager = new LspProcessManager();
