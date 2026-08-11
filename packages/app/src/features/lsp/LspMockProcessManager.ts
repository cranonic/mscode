
// src/features/lsp/LspMockProcessManager.ts
/**
 * Manages the execution lifecycle and active configurations of simulated
 * Language Server Protocol (LSP) runtime environments within web-sandboxed architectures.
 *
 * Must mirror the public surface of LspProcessManager used by useLspSync
 * (startServer / stopServer / invalidatePort / markAlive / …).
 */
export class LspMockProcessManager {
    /**
     * Map dictionary housing schema definitions and capabilities flags indexed by language identifier.
     */
    public dynamicConfigs: Record<string, any> = {};

    /**
     * Internal tracking key holding the identifier of the currently running language server.
     */
    private activeLanguage: string | null = null;

    /** Languages marked as successfully initialized (mirrors native aliveLanguages). */
    private aliveLanguages = new Set<string>();

    /**
     * Registers a new language configuration specification structure into the runtime memory registry.
     */
    public registerDynamicConfig(language: string, config: any): void {
        this.dynamicConfigs[language] = config;
    }

    /**
     * Discards a registered language configuration matching the provided key pointer from memory.
     */
    public removeDynamicConfig(language: string): void {
        delete this.dynamicConfigs[language];
    }

    /**
     * Orchestrates simulation routines to spin up a mock server layer instance.
     * @returns Static mock port 9999 when booted, or null upon failure.
     */
    public async startServer(language: string): Promise<number | null> {
        if (!this.dynamicConfigs[language]) {
            console.warn(
                `[Web-Mock] Warning: No extension registered for '${language}'. Forcing mock server start for testing.`,
            );
        }
        console.log(`[Web-Mock] Simulating server start for ${language}...`);
        await new Promise((resolve) => setTimeout(resolve, 800));

        this.activeLanguage = language;
        return 9999;
    }

    /**
     * Tear down instructions terminating active simulated server loops.
     * Optional language arg matches native LspProcessManager.stopServer(language?).
     */
    public stopServer(language?: string): void {
        console.log(`[Web-Mock] Stopped fake server${language ? ` (${language})` : ''}.`);
        if (language) {
            this.aliveLanguages.delete(language);
            if (this.activeLanguage === language) this.activeLanguage = null;
        } else {
            this.aliveLanguages.clear();
            this.activeLanguage = null;
        }
    }

    /**
     * Call after LSP initialize succeeds (no-op on web mock beyond local flag).
     */
    public markAlive(language: string): void {
        this.aliveLanguages.add(language);
        this.activeLanguage = language;
        console.log(`[Web-Mock] markAlive(${language})`);
    }

    /**
     * Call when WebSocket dies / boot fails — forces respawn on next startServer.
     */
    public invalidatePort(language: string): void {
        this.aliveLanguages.delete(language);
        if (this.activeLanguage === language) this.activeLanguage = null;
        console.log(`[Web-Mock] invalidatePort(${language})`);
    }

    /**
     * Mirror LspProcessManager.sharePort — reuse active process for sibling language ids
     * (e.g. typescript → javascript / tsx).
     */
    public sharePort(fromLanguage: string, toLanguage: string): void {
        if (this.activeLanguage === fromLanguage || this.aliveLanguages.has(fromLanguage)) {
            this.aliveLanguages.add(toLanguage);
            this.activeLanguage = toLanguage;
            console.log(`[Web-Mock] sharePort(${fromLanguage} → ${toLanguage})`);
        }
    }

    /**
     * Accesses internal tracking flags to safely resolve the active operational language context.
     */
    public getActiveLanguage(): string | null {
        return this.activeLanguage;
    }
}

/**
 * Global singleton for the web environment LSP mock process pipeline.
 */
export const lspMockProcessManager = new LspMockProcessManager();
