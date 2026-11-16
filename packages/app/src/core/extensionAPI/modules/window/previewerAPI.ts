/**
 * Public file-previewer API for extensions.
 * Heavy viewers (media, PDF, zip, SQL…) should register here instead of living in core.
 */
import React from 'react';
import {
  customPreviewerRegistry,
  type CustomPreviewerProps,
  type PreviewerContribution,
} from '../../registry/previewerRegistry';

export interface RegisterPreviewerOptions {
  /** Unique id — will be namespaced with extension id if not already */
  id: string;
  name: string;
  /** File extensions including the dot, e.g. ['.mp3', '.mp4'] */
  extensions: string[];
  /** React component receiving { tabId, filePath } */
  component: React.FC<CustomPreviewerProps>;
  /** Higher wins when multiple claim the same extension. Default 50. */
  priority?: number;
}

export const createPreviewerAPI = (extId: string) => ({
  /**
   * Register a custom file previewer (audio/video/PDF/zip/…).
   * Returns a disposable — push it onto context.subscriptions.
   *
   * @example
   * context.subscriptions.push(
   *   window.registerPreviewer({
   *     id: 'vlc',
   *     name: 'VLC Player',
   *     extensions: ['.mp3', '.mp4'],
   *     component: MediaTab,
   *     priority: 50,
   *   })
   * );
   */
  registerPreviewer: (opts: RegisterPreviewerOptions) => {
    const fullId = opts.id.includes('.') ? opts.id : `${extId}.${opts.id}`;
    const contribution: PreviewerContribution = {
      id: fullId,
      name: opts.name,
      extensions: opts.extensions.map((e) =>
        e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`,
      ),
      component: opts.component,
      priority: opts.priority ?? 50,
      extensionId: extId,
    };
    customPreviewerRegistry.registerPreviewer(contribution);
    return {
      dispose: () => customPreviewerRegistry.unregisterPreviewer(fullId),
    };
  },

  /** List registered previewers (debug / settings UI). */
  listPreviewers: () => customPreviewerRegistry.list(),
});
