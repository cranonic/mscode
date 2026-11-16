// src/features/termis/components/terminal/common/pathTranslator.ts
//
// Bidirectional path mapping between Android host paths and guest (proot) paths.
// Native mode is identity. Proot mode maps under Alpine rootfs when available.

import type { ExecMode } from './config';

export interface PathTranslateContext {
  execMode: ExecMode;
  /** Alpine / proot rootfs absolute path on the host, e.g. …/files/alpine */
  rootfsPath?: string;
  /** Host paths always visible inside proot (bind mounts). */
  hostBinds?: string[];
}

const DEFAULT_BINDS = [
  '/storage',
  '/sdcard',
  '/data',
  '/system',
  '/dev',
  '/proc',
  '/sys',
];

/**
 * Host (Android) path → path as seen inside the session.
 * Native: unchanged. Proot: unchanged for binds; otherwise relative to rootfs if under it.
 */
export function translatePathToGuest(
  hostPath: string,
  ctx: PathTranslateContext,
): string {
  if (!hostPath) return hostPath;
  if (ctx.execMode === 'native') return hostPath;

  const root = (ctx.rootfsPath || '').replace(/\/+$/, '');
  if (root && hostPath.startsWith(root + '/')) {
    const rel = hostPath.slice(root.length);
    return rel.startsWith('/') ? rel : '/' + rel;
  }

  const binds = ctx.hostBinds?.length ? ctx.hostBinds : DEFAULT_BINDS;
  for (const b of binds) {
    if (hostPath === b || hostPath.startsWith(b + '/')) return hostPath;
  }

  // Outside binds: keep host path (proot -b / will still see it if bound at session level)
  return hostPath;
}

/**
 * Guest path → host path for file pickers / editor open.
 */
export function translatePathToHost(
  guestPath: string,
  ctx: PathTranslateContext,
): string {
  if (!guestPath) return guestPath;
  if (ctx.execMode === 'native') return guestPath;

  const root = (ctx.rootfsPath || '').replace(/\/+$/, '');
  if (!root) return guestPath;

  // Absolute FHS paths inside Alpine → rootfs + path
  if (guestPath.startsWith('/') && !isLikelyHostBind(guestPath, ctx)) {
    return root + guestPath;
  }
  return guestPath;
}

function isLikelyHostBind(path: string, ctx: PathTranslateContext): boolean {
  const binds = ctx.hostBinds?.length ? ctx.hostBinds : DEFAULT_BINDS;
  return binds.some(b => path === b || path.startsWith(b + '/'));
}
