// src/features/git/core/modules/gitRepo.ts
//
// Repository lifecycle: prefer normal .git on disk.
// On shared-storage permission failure → ask user → optional virtual gitdir.

import { taskManager } from '@/core/extensionAPI/tasks/taskManager';
import {
  run,
  runVisible,
  isSharedStorage,
  askVirtualGitConsent,
  enableVirtualGit,
  GIT_REPOS_BASE,
} from './gitRunner';

async function applyCoreConfig(cwd: string): Promise<void> {
  await run('config core.fileMode false', cwd, true);
  await run('config core.symlinks false', cwd, true);
  await run('config core.ignorecase true', cwd, true);
}

function isPermissionError(msg: string): boolean {
  const m = (msg || '').toLowerCase();
  return (
    m.includes('permission denied') ||
    m.includes('operation not permitted') ||
    m.includes('read-only file system') ||
    m.includes('unable to create') ||
    m.includes('invalid path') ||
    m.includes('failed to create')
  );
}

/**
 * git init — always try a normal repo first.
 * If sdcard rejects .git, prompt for virtual separate-git-dir.
 */
export async function init(cwd: string, defaultBranch = 'main'): Promise<void> {
  try {
    await runVisible(`init -b ${defaultBranch}`, cwd);
    await applyCoreConfig(cwd);
    return;
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (!isSharedStorage(cwd) || !isPermissionError(msg)) {
      throw e;
    }

    const ok = await askVirtualGitConsent(
      cwd,
      'Cannot create .git on this shared folder. Use a virtual git directory inside app storage?',
    );
    if (!ok) throw e;

    await enableVirtualGit(cwd, { initBranch: defaultBranch });
    await applyCoreConfig(cwd);
  }
}

/**
 * git clone — try normal; on permission failure offer virtual separate-git-dir.
 */
export async function clone(url: string, parentDir: string): Promise<void> {
  const targetName = url.split('/').pop()?.replace('.git', '') || 'repo';

  try {
    await runVisible(`clone "${url}" "${targetName}"`, parentDir);
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (!isSharedStorage(parentDir) || !isPermissionError(msg)) {
      throw e;
    }

    const ok = await askVirtualGitConsent(
      parentDir,
      'Clone failed writing .git on shared storage. Retry with a virtual git directory?',
    );
    if (!ok) throw e;

    await taskManager.execute(`mkdir -p "${GIT_REPOS_BASE}"`, '/', () => {}).result;
    const uniqueHash = `repo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const internalGitDir = `${GIT_REPOS_BASE}/${uniqueHash}`;

    await runVisible(
      `clone --separate-git-dir="${internalGitDir}" "${url}" "${targetName}"`,
      parentDir,
    );
  }

  const repoCwd = `${parentDir}/${targetName}`;
  await applyCoreConfig(repoCwd);
}

export async function createGithubRepo(name: string, isPrivate: boolean, token: string): Promise<string> {
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization:  `token ${token}`,
      Accept:         'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, private: isPrivate, auto_init: false }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Failed to create GitHub repository');
  }

  const data = await res.json();
  return data.clone_url;
}
