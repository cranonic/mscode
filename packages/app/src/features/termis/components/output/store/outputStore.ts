// src/features/termis/components/output/store/outputStore.ts
//
// Models must share the same Monaco instance as CodeEditor (patched local
// node_modules). Import monacoSetup before monaco-editor.

import '@/features/editor/monaco/monacoSetup';

import { create } from 'zustand';
import * as monaco from 'monaco-editor';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { msEvents } from '@/core/extensionAPI/events/EventManager';

function getMonaco(): typeof monaco {
  const w = window as any;
  if (w.MONACO) return w.MONACO as typeof monaco;
  return monaco;
}

// ─── Monaco Model Registry ────────────────────────────────────────────────────

const channelModels = new Map<string, monaco.editor.ITextModel>();

export const getOrCreateModel = (channel: string): monaco.editor.ITextModel => {
  const m = getMonaco();
  if (!channelModels.has(channel)) {
    channelModels.set(channel, m.editor.createModel('', 'log'));
  }
  return channelModels.get(channel)!;
};

export const destroyModel = (channel: string): void => {
  channelModels.get(channel)?.dispose();
  channelModels.delete(channel);
};

// ─── State Interface ──────────────────────────────────────────────────────────

interface OutputState {
  channels: string[];
  activeChannel: string;
  killHandlers: Record<string, () => void>;

  createChannel: (name: string) => void;
  removeChannel: (name: string) => void;
  setActiveChannel: (name: string) => void;
  appendLog: (channel: string, text: string) => void;
  clearChannel: (channel: string) => void;
  registerKillHandler: (channel: string, handler: () => void) => void;
  unregisterKillHandler: (channel: string) => void;
  triggerKill: (channel: string) => void;

  /** Save the active channel's log to the Downloads folder (native) or trigger browser download (web). */
  saveLog: (channel?: string) => Promise<void>;
  /** Open the active channel's log as a read-only tab in the main editor. */
  openInEditor: (channel?: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOutputStore = create<OutputState>((set, get) => ({
  channels: ['Extension Host', 'Tasks'],
  activeChannel: 'Extension Host',
  killHandlers: {},

  createChannel: (name) => {
    if (!get().channels.includes(name)) {
      set(s => ({ channels: [...s.channels, name] }));
      msEvents.emit('onDidOpenOutputChannel', name);
    }
  },

  removeChannel: (name) => {
    destroyModel(name);
    let newActive = get().activeChannel;

    set(s => {
      const handlers = { ...s.killHandlers };
      delete handlers[name];
      const newChs = s.channels.filter(c => c !== name);
      newActive = s.activeChannel === name ? (newChs[0] ?? '') : s.activeChannel;
      return { channels: newChs, activeChannel: newActive, killHandlers: handlers };
    });

    msEvents.emit('onDidCloseOutputChannel', name);
    if (get().activeChannel !== newActive) {
      msEvents.emit('onDidChangeActiveOutputChannel', newActive);
    }
  },

  setActiveChannel: (name) => {
    if (!get().channels.includes(name)) return;
    if (get().activeChannel !== name) {
      set({ activeChannel: name });
      msEvents.emit('onDidChangeActiveOutputChannel', name);
    }
  },

  appendLog: (channel, text) => {
    if (!get().channels.includes(channel)) get().createChannel(channel);

    const m = getMonaco();
    const model = getOrCreateModel(channel);
    const lineCount = model.getLineCount();
    const lastCol = model.getLineMaxColumn(lineCount);

    model.applyEdits([
      {
        range: new m.Range(lineCount, lastCol, lineCount, lastCol),
        text: (lineCount === 1 && model.getValue() === '' ? '' : '\n') + text,
      },
    ]);
  },

  clearChannel: (channel) => {
    getOrCreateModel(channel).setValue('');
  },

  registerKillHandler: (channel, handler) =>
    set(s => ({ killHandlers: { ...s.killHandlers, [channel]: handler } })),

  unregisterKillHandler: (channel) =>
    set(s => {
      const c = { ...s.killHandlers };
      delete c[channel];
      return { killHandlers: c };
    }),

  triggerKill: (channel) => {
    const handler = get().killHandlers[channel];
    if (handler) {
      handler();
      get().appendLog(channel, '\n[WARN] 🛑 Process killed by user.');
    }
  },

  saveLog: async (channel) => {
    const ch = channel ?? get().activeChannel;
    const content = getOrCreateModel(ch).getValue();

    if (!content.trim()) {
      const { useNotificationStore } = await import('@/store/notificationStore');
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Output',
        source: 'Output',
        message: `Channel "${ch}" is empty — nothing to save.`,
      });
      return;
    }

    const safeName = ch.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${safeName}_${timestamp}.log`;

    try {
      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          path: `Download/${filename}`,
          data: content,
          directory: Directory.ExternalStorage,
          encoding: Encoding.UTF8,
          recursive: true,
        });

        const { useNotificationStore } = await import('@/store/notificationStore');
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Output Saved',
          source: 'Output',
          message: `Log saved to Downloads/${filename}`,
        });
      } else {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      const { useNotificationStore } = await import('@/store/notificationStore');
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Save Failed',
        source: 'Output',
        message: e?.message ?? 'Could not save log file.',
      });
    }
  },

  openInEditor: (channel) => {
    const ch = channel ?? get().activeChannel;
    const content = getOrCreateModel(ch).getValue();
    const virtualPath = `output://${ch.replace(/\s+/g, '_')}`;
    const m = getMonaco();

    try {
      const uri = m.Uri.parse(virtualPath);
      let existingModel = m.editor.getModel(uri);
      if (!existingModel) {
        existingModel = m.editor.createModel(content, 'log', uri);
      } else {
        existingModel.setValue(content);
      }

      const { useTabStore } = require('@/store/tabStore');
      useTabStore.getState().addTab({
        id: virtualPath,
        type: 'code',
        title: `Output: ${ch}`,
        filePath: virtualPath,
        icon: 'output',
        showStatusBar: false,
        showBreadcrumb: false,
      });
    } catch (e) {
      console.error('[OutputStore] openInEditor failed:', e);
    }
  },
}));
