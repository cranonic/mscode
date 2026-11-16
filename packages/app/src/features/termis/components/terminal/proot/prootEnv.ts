// src/features/termis/components/terminal/proot/prootEnv.ts
//
// Alpine-via-proot environment. Rootfs is fetched from the network
// (dl-cdn.alpinelinux.org or project mirror) — not bundled in APK assets.

export const PROOT_ENV = {
  /** Relative dir under app filesDir for Alpine rootfs. */
  rootfsDirName: 'alpine',
  /**
   * Alpine minirootfs download template.
   * {arch} → aarch64 | armv7 | x86_64 | x86
   * Version is chosen by Java RootfsManager at bootstrap time.
   */
  alpineUrlTemplate:
    'https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/{arch}/alpine-minirootfs-3.20.3-{arch}.tar.gz',
  guestHome: '/root',
  guestShell: '/bin/sh',
} as const;

export function alpineUrlForArch(arch: string): string {
  const map: Record<string, string> = {
    aarch64: 'aarch64',
    arm64: 'aarch64',
    arm: 'armhf',
    armv7: 'armhf',
    armv7l: 'armhf',
    x86_64: 'x86_64',
    amd64: 'x86_64',
    i686: 'x86',
    x86: 'x86',
  };
  const a = map[arch] || 'aarch64';
  return PROOT_ENV.alpineUrlTemplate.replace(/\{arch\}/g, a);
}
