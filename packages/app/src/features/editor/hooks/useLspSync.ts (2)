// src/features/editor/hooks/useLspSync.ts

import { useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import * as monaco from 'monaco-editor';

const NativeTerminal = registerPlugin<any>('NativeTerminal');
import { useSettingsStore }      from '@/features/settings/store/settingsStore';
import { useStatusBarStore } from '@/features/statusbar/store/statusBarStore';
import { useNotificationStore }  from '@/store/notificationStore';
import { useTabStore }           from '@/store/tabStore';
import { useOutputStore } from '@/features/termis/components/output/store/outputStore';

import type { ILspService }                                              from '@/core/services/ILspService';
import { lspProcessManager as realProcessManager }                  from '@/features/lsp/LspProcessManager';
import { lspMockProcessManager }                                    from '@/features/lsp/LspMockProcessManager';
import { LspService }                 from '@/core/services/lsp/LspService';
import { LspMockService }                                           from '@/core/services/lsp/LspMockService';

export const realLspService = new LspService();
export const mockLspService = new LspMockService();


// ─── Environment ──────────────────────────────────────────────────────────────
const isWeb  = Capacitor.getPlatform() === 'web';

export const activeLspService = (isWeb ? mockLspService : realLspService) as ILspService;
const activeProcessManager = isWeb ? lspMockProcessManager : realProcessManager;


/**
 * Languages Monaco can handle alone when NO extension registered an external server.
 * If `dynamicConfigs[langId]` exists (e.g. TypeScript extension → typescript-language-server),
 * external LSP wins and Monaco diagnostics for that language are turned off.
 */
const MONACO_FALLBACK_LANGS = new Set([
  'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
  'json', 'html', 'css', 'scss', 'less',
]);

/** True Monaco-only (no real external server expected). */
const MONACO_ONLY_LANGS = new Set(['json', 'html', 'css', 'scss', 'less']);

let lastNotifiedLang: string | null = null;

function refractorLangId(langId: string): string {
  const map: Record<string, string> = {
    javascript: 'Js', typescript: 'Ts',
    javascriptreact: 'Jsx', typescriptreact: 'Tsx',
    python: 'Py', markdown: 'Md', cpp: 'C++', c: 'C',
  };
  return map[langId] ?? (langId.charAt(0).toUpperCase() + langId.slice(1));
}

function getDynamicConfig(langId: string): any | undefined {
  const configs = (activeProcessManager as any).dynamicConfigs as Record<string, any> | undefined;
  if (!configs) return undefined;
  if (configs[langId]) return configs[langId];
  // TS/JS family often shares one server registered under typescript
  if (langId === 'typescriptreact' && configs['typescript']) return configs['typescript'];
  if (langId === 'javascriptreact' && configs['javascript']) return configs['javascript'];
  if (langId === 'javascript' && configs['typescript']) return configs['typescript'];
  return undefined;
}

// ─── Real file URI from tab ────────────────────────────────────────────────────

/**
 * Build the real file:// URI for the active tab.
 * tabStore.Tab has filePath (the actual disk path) and id (which may itself
 * be a file:// URI for code tabs). Falls back to the model uri.
 */
function resolveFileUri(
  tab: { id: string; filePath?: string; title?: string } | undefined,
  model: monaco.editor.ITextModel,
): string {
  // 1. Prefer explicit filePath on the tab
  if (tab?.filePath) {
    const p = tab.filePath;
    return p.startsWith('file://') ? p : `file://${p}`;
  }
  // 2. Tab id might already be a file:// URI
  if (tab?.id && tab.id.startsWith('file://')) return tab.id;
  // 3. Model uri (works for real file models, not inmemory)
  const mu = model.uri.toString();
  if (!mu.startsWith('inmemory')) return mu;
  // 4. Give up — use a synthetic path based on title
  return `file:///sdcard/${tab?.title ?? 'untitled'}`;
}

/** Silence Monaco TS/JS worker when external typescript-language-server is active. */
function disableMonacoTsDiagnostics(langId: string) {
  const monacoLangs = monaco.languages as any;
  if (!monacoLangs?.typescript) return;
  const defaults =
    langId === 'javascript' || langId === 'javascriptreact'
      ? monacoLangs.typescript.javascriptDefaults
      : monacoLangs.typescript.typescriptDefaults;
  if (!defaults?.setDiagnosticsOptions) return;
  defaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
    diagnosticCodesToIgnore: [],
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLspSync(editorInstance: any, tabId: string) {
  const settings    = useSettingsStore(s => s.settings);
  const activeTabId = useTabStore(s => s.activeTabId);
  const tabs        = useTabStore(s => s.tabs);
  const bootingRef  = useRef(false);  // prevents double-boot during async startup

  // Register status-bar slot once
  useEffect(() => {
    useStatusBarStore.getState().registerItem({
      id: 'lsp-status', alignment: 'right', priority: 55,
      label: 'LSP: Off', icon: 'check',
    });
  }, []);

  useEffect(() => {
    if (tabId !== activeTabId || !editorInstance) return;

    const model = editorInstance.getModel();
    if (!model) return;

    const langId    = model.getLanguageId();
    const notifId   = `lsp-boot-${langId}`;
    const isEnabled = settings[`lsp.${langId}.enabled`]
      ?? settings[`lsp.${langId === 'typescriptreact' ? 'typescript' : langId === 'javascriptreact' ? 'javascript' : langId}.enabled`]
      ?? true;

    const dynamicConfig = getDynamicConfig(langId);
    // External extension registered a server → do NOT treat as Monaco-only
    const preferExternal = !!dynamicConfig && isEnabled;
    const isMonacoOnly =
      MONACO_ONLY_LANGS.has(langId) ||
      (MONACO_FALLBACK_LANGS.has(langId) && !preferExternal);

    // ── Active tab's real file path ────────────────────────────────────────
    const activeTab  = tabs.find(t => t.id === activeTabId);
    const fileUri    = resolveFileUri(activeTab, model);

    // Always register the per-model URI so _getDocUri() works correctly
    // This must happen BEFORE any LSP call (connect, notifyDocumentOpen, etc.)
    if (!isMonacoOnly) {
      activeLspService.registerModelUri(model, fileUri);
    }

    // 1. MONACO BUILT-IN ONLY (json/html/css, or ts/js without extension)
    if (isMonacoOnly) {
      const monacoLangs = monaco.languages as any;

      if (langId === 'javascript' || langId === 'typescript'
          || langId === 'javascriptreact' || langId === 'typescriptreact') {
        const defaults = (langId === 'javascript' || langId === 'javascriptreact')
          ? monacoLangs.typescript.javascriptDefaults
          : monacoLangs.typescript.typescriptDefaults;

        const baseLang = (langId === 'javascriptreact') ? 'javascript'
          : (langId === 'typescriptreact') ? 'typescript' : langId;
        const isLinting = settings[`lsp.${baseLang}.linting`] ?? true;
        defaults.setDiagnosticsOptions({
          noSemanticValidation: !isEnabled || !isLinting,
          noSyntaxValidation:   !isEnabled || !isLinting,
          diagnosticCodesToIgnore: settings['lsp.javascript.ignoreCodes'] || [],
        });

        const currentOpts = defaults.getCompilerOptions() || {};
        if (baseLang === 'javascript') {
          defaults.setCompilerOptions({
            ...currentOpts,
            allowNonTsExtensions: true,
            noImplicitAny:    !!settings['lsp.javascript.implicitAny'],
            strictNullChecks: !!settings['lsp.javascript.strictNullChecks'],
            target: monacoLangs.typescript.ScriptTarget.ESNext,
            jsx: monacoLangs.typescript.JsxEmit?.ReactJSX
              ?? monacoLangs.typescript.JsxEmit?.React
              ?? currentOpts.jsx,
          });
        } else {
          defaults.setCompilerOptions({
            ...currentOpts,
            allowNonTsExtensions: true,
            strict:             !!settings['lsp.typescript.strictMode'],
            noUnusedLocals:     !!settings['lsp.typescript.unusedLocals'],
            noUnusedParameters: !!settings['lsp.typescript.unusedParameters'],
            target: monacoLangs.typescript.ScriptTarget.ESNext,
            jsx: monacoLangs.typescript.JsxEmit?.ReactJSX
              ?? monacoLangs.typescript.JsxEmit?.React
              ?? currentOpts.jsx,
          });
        }
        defaults.setEagerModelSync(true);
      }

      else if (langId === 'json') {
        monacoLangs.json.jsonDefaults.setDiagnosticsOptions({
          validate:         isEnabled && settings['lsp.json.schemaValidation'] !== false,
          allowComments:    true,
          schemaValidation: isEnabled ? 'error' : 'ignore',
        });
      }

      else if (langId === 'html') {
        monacoLangs.html.htmlDefaults.setOptions({
          format: {
            enable:       true,
            insertSpaces: settings['editor.insertSpaces'] ?? true,
            tabSize:      settings['editor.tabSize'] ?? 4,
          },
          suggest: { html5: true },
        });
        editorInstance.updateOptions({
          matchBrackets:       settings['lsp.html.tagMatching'] !== false ? 'always' : 'never',
          autoClosingBrackets: settings['lsp.html.autoCloseTag']   !== false ? 'always' : 'never',
        });
      }

      else if (['css', 'scss', 'less'].includes(langId)) {
        const cssOpts = {
          validate: isEnabled && (settings[`lsp.${langId}.linting`] ?? true),
          lint: {
            unknownProperties: settings['lsp.css.lint.unknownProperties'] !== false ? 'warning' : 'ignore',
            emptyRules: 'warning',
          },
        };
        if (langId === 'css')  monacoLangs.css.cssDefaults.setOptions(cssOpts);
        if (langId === 'scss') monacoLangs.css.scssDefaults.setOptions(cssOpts);
        if (langId === 'less') monacoLangs.css.lessDefaults.setOptions(cssOpts);
        editorInstance.updateOptions({
          colorDecorators: settings['lsp.css.colorDecorators'] !== false,
        });
      }

      // Status bar + notification for built-ins
      if (isEnabled) {
        useStatusBarStore.getState().updateItem('lsp-status', {
          label: `{${refractorLangId(langId)}}`,
          icon: 'check', spin: false,
          color: 'var(--vscode-testing-iconPassed, #73c991)',
        });
        if (lastNotifiedLang !== langId) {
          lastNotifiedLang = langId;
          useNotificationStore.getState().addNotification({
            id: notifId, type: 'info',
            title: `${langId.toUpperCase()} Features Active`,
            source: 'Monaco Native',
            message: `Built-in language server for ${langId} is running.`,
          });
          setTimeout(() => useNotificationStore.getState().dismissToast(notifId), 2000);
        }
      } else {
        useStatusBarStore.getState().updateItem('lsp-status', {
          label: 'LSP: Off', icon: 'check', color: 'inherit',
        });
      }

      // Disconnect external LSP only when this language is truly Monaco-only
      // (e.g. switched from Python → JSON). Do not kill a TS external server
      // while viewing another Monaco-only tab of a different family — stopServer()
      // without args kills ALL; only stop if current external lang is unrelated.
      if (activeLspService.isConnected) {
        const currentLang = activeProcessManager.getActiveLanguage?.() ?? null;
        if (currentLang && !MONACO_FALLBACK_LANGS.has(currentLang)) {
          activeLspService.disconnect();
          activeProcessManager.stopServer(currentLang);
          lastNotifiedLang = null;
        }
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. EXTERNAL LANGUAGES (Python, C/C++, Rust, TypeScript extension, …)
    // ══════════════════════════════════════════════════════════════════════

    // Avoid double diagnostics: mute Monaco TS worker when external server owns TS/JS
    if (
      langId === 'typescript' || langId === 'javascript'
      || langId === 'typescriptreact' || langId === 'javascriptreact'
    ) {
      disableMonacoTsDiagnostics(langId);
    }

    const currentLang = activeProcessManager.getActiveLanguage?.() ?? null;

    if (!dynamicConfig || !isEnabled) {
      if (activeLspService.isConnected) {
        activeLspService.disconnect();
        activeProcessManager.stopServer(currentLang ?? undefined);
      }
      useStatusBarStore.getState().updateItem('lsp-status', {
        label: 'LSP: Off', icon: 'check', color: 'inherit',
      });
      return;
    }

    // Same language but WebSocket died (app backgrounded / Android killed process)
    // → drop stale port cache so startServer respawns instead of reconnecting dead port.
    if (currentLang === langId && !activeLspService.isConnected) {
      activeProcessManager.invalidatePort?.(langId);
      activeProcessManager.stopServer?.(langId);
    }

    // Same TS family (typescript ↔ javascript ↔ tsx) sharing one process
    const sameFamily = (a: string | null, b: string) => {
      if (!a) return false;
      if (a === b) return true;
      const tsFamily = new Set(['typescript', 'typescriptreact', 'javascript', 'javascriptreact']);
      return tsFamily.has(a) && tsFamily.has(b);
    };

    // ══════════════════════════════════════════════════════════════════════
    // SAME language / family, server process running, WebSocket connected
    // ══════════════════════════════════════════════════════════════════════
    if (
      sameFamily(currentLang, langId) &&
      activeLspService.isConnected
    ) {
      activeLspService.registerModelUri(model, fileUri);

      if (activeLspService.initialized) {
        activeLspService.notifyDocumentOpen(model);
        console.log(`[LSP] Tab switch within ${langId} — didOpen sent, no reconnect`);
      } else {
        console.log(`[LSP] Tab switch within ${langId} — waiting for handshake…`);
        activeLspService.waitUntilReady()
          .then(() => {
            activeLspService.notifyDocumentOpen(model);
            console.log(`[LSP] Tab switch within ${langId} — didOpen sent after handshake`);
          })
          .catch((e) => {
            console.warn(`[LSP] waitUntilReady rejected during tab switch:`, e);
          });
      }
      return;
    }

    // DIFFERENT language OR server not running → full boot
    if (currentLang && !sameFamily(currentLang, langId)) {
      activeLspService.disconnect();
      activeProcessManager.stopServer(currentLang);
    }

    // Output channel for this language server's logs
    const channelName   = `LSP: ${refractorLangId(langId)}`;
    useOutputStore.getState().createChannel(channelName);

    const outputChannel = {
      appendLine: (text: string) => {
        useOutputStore.getState().appendLog(channelName, `${text}\n`);
      },
      show: () => {
        useOutputStore.getState().setActiveChannel(channelName);
      }
    };

    useOutputStore.getState().registerKillHandler(channelName, () => {
      activeLspService.disconnect();
      activeProcessManager.stopServer(langId);
      useStatusBarStore.getState().updateItem('lsp-status', {
        label: 'LSP: Killed', icon: 'close', color: 'var(--ms-error)',
      });
    });

    if (bootingRef.current) return;
    bootingRef.current = true;

    const boot = async () => {
      try {
        outputChannel.appendLine(`[INFO] Starting ${langId} language server…`);
        if (preferExternal && MONACO_FALLBACK_LANGS.has(langId)) {
          outputChannel.appendLine(
            `[INFO] Extension registered external server — skipping Monaco Native for ${langId}.`,
          );
        }

        useStatusBarStore.getState().updateItem('lsp-status', {
          label: `Starting ${refractorLangId(langId)}…`, icon: 'sync', spin: true,
        });
        useNotificationStore.getState().addNotification({
          id: notifId, type: 'loading',
          title: `Initializing ${langId.toUpperCase()} Server`,
          source: 'MS Code LSP',
          message: 'Checking dependencies…',
        });

        // Prefer primary key the extension registered under
        const startKey =
          (activeProcessManager as any).dynamicConfigs?.[langId]
            ? langId
            : (langId === 'typescriptreact' || langId === 'javascript' || langId === 'javascriptreact')
              && (activeProcessManager as any).dynamicConfigs?.['typescript']
              ? 'typescript'
              : langId;

        // Native onLog → Output panel (no logcat needed — same path as terminal)
        let nativeLogHandle: { remove: () => void } | null = null;
        try {
          if (Capacitor.isNativePlatform()) {
            nativeLogHandle = await NativeTerminal.addListener(
              'onLog',
              (ev: { message?: string }) => {
                const line = ev?.message ?? '';
                if (!line) return;
                if (/\[LSP|typescript|tsserver|ProcessServer|node |PATH=|PREFIX=/i.test(line)) {
                  outputChannel.appendLine(line);
                }
              },
            );
          }
        } catch (e) {
          outputChannel.appendLine(`[DEBUG] onLog bridge unavailable: ${e}`);
        }

        const port = await activeProcessManager.startServer(startKey);
        if (!port) {
          outputChannel.appendLine(`[ERROR] Failed to start ${langId} server process.`);
          try { nativeLogHandle?.remove(); } catch (_) {}
          bootingRef.current = false;
          return;
        }

        // Share port across TS/JS family so tab switches reuse the process
        if (startKey === 'typescript' || startKey === 'javascript') {
          for (const sib of ['typescript', 'typescriptreact', 'javascript', 'javascriptreact']) {
            if (sib !== startKey) {
              activeProcessManager.sharePort?.(startKey, sib);
            }
          }
        }

        outputChannel.appendLine(`[INFO] Server process on port ${port}. Connecting…`);
        outputChannel.appendLine(`[DEBUG] Watch for [LSP-stderr] / process exited lines below`);

        // Compute rootUri from the file's directory
        const rootUri = (() => {
          const lspFileUri = fileUri.replace('file:///storage/emulated/0', 'file:///sdcard');
          const lastSlash  = lspFileUri.lastIndexOf('/');
          return lastSlash > 0 ? lspFileUri.substring(0, lastSlash) : 'file:///sdcard';
        })();

        const settingsLang =
          langId === 'typescriptreact' ? 'typescript'
            : langId === 'javascriptreact' ? 'javascript'
              : langId;

        let lspOptions: Record<string, any> = {
          hover:               settings[`lsp.${settingsLang}.hover`]               ?? true,
          completion:          settings[`lsp.${settingsLang}.completion`]          ?? true,
          linting:             settings[`lsp.${settingsLang}.linting`]             ?? true,
          references:          settings[`lsp.${settingsLang}.references`]          ?? true,
          documentHighlight:   settings[`lsp.${settingsLang}.documentHighlight`]   ?? true,
          documentSymbol:      settings[`lsp.${settingsLang}.documentSymbol`]      ?? true,
          codeActions:         settings[`lsp.${settingsLang}.codeActions`]         ?? true,
          codeLens:            settings[`lsp.${settingsLang}.codeLens`]            ?? false,
          foldingRange:        settings[`lsp.${settingsLang}.foldingRange`]        ?? true,
          inlayHints:          settings[`lsp.${settingsLang}.inlayHints`]
            ?? settings['typescript.inlayHints.enabled']
            ?? true,
          semanticTokens:      settings[`lsp.${settingsLang}.semanticHighlighting`] ?? true,
          onTypeFormatting:    settings[`lsp.${settingsLang}.formatOnType`]        ?? false,
          colorProvider:       true,
          rootUri,
        };

        if (typeof dynamicConfig.resolveOptions === 'function') {
          lspOptions = { ...lspOptions, ...dynamicConfig.resolveOptions(settings) };
        }

        // typescript-language-server v4.1+ dropped CLI --tsserver-path.
        // Workspace is under /sdcard while TS lives under $PREFIX — must set
        // initializationOptions.tsserver.path explicitly.
        if (
          ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(langId) &&
          Capacitor.isNativePlatform() &&
          !settings['typescript.tsdk']
        ) {
          try {
            const setup = await NativeTerminal.checkSetup();
            const prefix = setup?.prefix as string | undefined;
            if (prefix) {
              const tsLib = `${prefix}/lib/node_modules/typescript/lib`;
              const tsFile = `${tsLib}/tsserver.js`;
              const prevTs = lspOptions.initializationOptions?.tsserver || {};
              lspOptions.initializationOptions = {
                ...(lspOptions.initializationOptions || {}),
                tsserver: {
                  ...prevTs,
                  // Prefer file path; TLS accepts file or lib directory
                  path: tsFile,
                  // Mobile: 3072MB max often kills the child process
                  maxTsServerMemory: Math.min(Number(prevTs.maxTsServerMemory) || 512, 768),
                },
              };
              outputChannel.appendLine(`[DEBUG] tsserver.path → ${tsFile}`);
            }
          } catch (e) {
            outputChannel.appendLine(`[WARN] checkSetup() for tsserver.path failed: ${e}`);
          }
        }

        outputChannel.appendLine(`[DEBUG] rootUri=${rootUri}`);
        outputChannel.appendLine(
          `[DEBUG] initOptions.tsserver=${JSON.stringify(lspOptions.initializationOptions?.tsserver ?? null)}`,
        );

        // connect() opens WebSocket + does LSP initialize handshake
        activeLspService.connect(langId, `ws://127.0.0.1:${port}`, lspOptions);

        // Prefer waitUntilReady so real initialize errors surface (not only timeout)
        try {
          await Promise.race([
            activeLspService.waitUntilReady(),
            new Promise<void>((_, reject) =>
              setTimeout(
                () => reject(new Error(
                  'LSP initialize timeout (45s) — check [LSP-stderr] / process exited above',
                )),
                45_000,
              ),
            ),
          ]);
        } finally {
          // Keep native logs a bit longer so late stderr still appears
          setTimeout(() => {
            try { nativeLogHandle?.remove(); } catch (_) {}
          }, 2000);
        }

        activeLspService.registerModelUri(model, fileUri);
        activeLspService.notifyDocumentOpen(model);

        outputChannel.appendLine(`[INFO] ${refractorLangId(langId)} LSP ready.`);
        outputChannel.show();

        activeProcessManager.markAlive?.(startKey);
        activeProcessManager.markAlive?.(langId);

        useStatusBarStore.getState().updateItem('lsp-status', {
          label: `{${refractorLangId(langId)}}`,
          icon: 'check', spin: false,
          color: 'var(--vscode-testing-iconPassed, #73c991)',
        });
        useNotificationStore.getState().updateNotification(notifId, {
          type: 'info', title: 'LSP Connected',
          message: `${refractorLangId(langId)} Language Server is ready.`,
        });
        setTimeout(() => useNotificationStore.getState().dismissToast(notifId), 3000);
        lastNotifiedLang = langId;

      } catch (err: any) {
        const msg =
          err?.message ||
          err?.lspError?.message ||
          (typeof err === 'object' ? JSON.stringify(err) : String(err));
        outputChannel.appendLine(`[ERROR] ${msg}`);
        if (err?.lspError) {
          outputChannel.appendLine(`[ERROR] lspError: ${JSON.stringify(err.lspError)}`);
        }
        outputChannel.appendLine(
          `[DEBUG] Tips: look for [LSP-stderr] / process exited / rewritten cmd above`,
        );
        outputChannel.show();
        console.error(`[LSP-Sync] Boot error for ${langId}:`, err);

        // Stale port after background kill — clear cache and auto-retry once
        activeLspService.disconnect();
        activeProcessManager.stopServer(langId);
        activeProcessManager.invalidatePort?.(langId);

        if (!(boot as any)._retried) {
          (boot as any)._retried = true;
          outputChannel.appendLine(`[INFO] Retrying ${langId} language server (previous instance was dead)…`);
          bootingRef.current = false;
          setTimeout(() => {
            if (!bootingRef.current) {
              bootingRef.current = true;
              boot();
            }
          }, 400);
          return;
        }

        useStatusBarStore.getState().updateItem('lsp-status', {
          label: 'LSP Error', icon: 'error', spin: false,
          color: 'var(--vscode-errorForeground)',
        });
        useNotificationStore.getState().updateNotification(notifId, {
          type: 'error',
          message: `Boot failed: ${msg}`,
        });
      } finally {
        // Don't clear bootingRef if we scheduled a retry above
        if (!(boot as any)._retried || activeLspService.initialized) {
          bootingRef.current = false;
        }
      }
    };

    boot();

    return () => {
      // Cleanup
      activeLspService.unregisterModelUri(model);
      bootingRef.current = false;
    };

  }, [editorInstance, settings, activeTabId, tabId, tabs]);
}
