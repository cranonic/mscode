/**
 * Registry for custom media backends.
 * Default remains Html5Backend; extensions can register higher-priority
 * factories for specific MIME types or all media.
 */
import type { MediaBackend } from '../engine/types';

export type MediaKind = 'audio' | 'video';

export interface BackendFactory {
  /** Unique id, e.g. "myext.ffmpeg-backend" */
  id: string;
  /**
   * Higher wins. Built-in Html5 is priority 0.
   * Extension backends should use >= 10 to override.
   */
  priority: number;
  /**
   * Optional filter. Return true if this factory can handle the file.
   * If omitted, factory is eligible for all files of the requested kind.
   */
  canHandle?: (filePath: string, kind: MediaKind) => boolean;
  /**
   * Create a backend instance. Must implement MediaBackend.
   */
  create: (kind: MediaKind) => MediaBackend;
}

const factories: BackendFactory[] = [];

export function registerBackend(factory: BackendFactory): () => void {
  // Replace same id
  const idx = factories.findIndex((f) => f.id === factory.id);
  if (idx >= 0) factories.splice(idx, 1);
  factories.push(factory);
  factories.sort((a, b) => b.priority - a.priority);
  return () => {
    const i = factories.findIndex((f) => f.id === factory.id);
    if (i >= 0) factories.splice(i, 1);
  };
}

export function unregisterBackend(id: string): void {
  const i = factories.findIndex((f) => f.id === id);
  if (i >= 0) factories.splice(i, 1);
}

/**
 * Pick the highest-priority factory that accepts this path/kind.
 * Returns null → caller should use built-in Html5Backend.
 */
export function resolveBackendFactory(
  filePath: string,
  kind: MediaKind,
): BackendFactory | null {
  for (const f of factories) {
    try {
      if (!f.canHandle || f.canHandle(filePath, kind)) return f;
    } catch {
      /* skip broken canHandle */
    }
  }
  return null;
}

export function listBackends(): ReadonlyArray<BackendFactory> {
  return factories.slice();
}
