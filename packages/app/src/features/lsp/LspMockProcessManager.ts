// Web mock — no real install / spawn
import type { LspServerConfig } from '@/core/extensionAPI/modules/lspModule';

class LspMockProcessManager {
  dynamicConfigs: Record<string, LspServerConfig> = {};
  private activeLanguage: string | null = null;

  registerDynamicConfig(lang: string, config: LspServerConfig): void {
    this.dynamicConfigs[lang] = config;
  }

  removeDynamicConfig(lang: string): void {
    delete this.dynamicConfigs[lang];
  }

  getActiveLanguage(): string | null {
    return this.activeLanguage;
  }

  invalidatePort(_lang: string): void {}

  stopServer(lang?: string): void {
    if (!lang || this.activeLanguage === lang) this.activeLanguage = null;
  }

  sharePort(_fromLang: string, _toLang: string): void {}

  markAlive(lang: string): void {
    this.activeLanguage = lang;
  }

  async startServer(lang: string): Promise<number | null> {
    this.activeLanguage = lang;
    return 0;
  }
}

export const lspMockProcessManager = new LspMockProcessManager();