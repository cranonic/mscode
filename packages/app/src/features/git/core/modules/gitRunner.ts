// src/features/git/core/modules/gitRunner.ts

import { taskManager }          from '@/core/extensionAPI/tasks/taskManager';
import { createTasksModule }    from '@/core/extensionAPI/modules/tasksModule';
import { useNotificationStore } from '@/store/notificationStore';
import { useOutputStore }       from '@/features/termis/components/output/store/outputStore';
import { useTermisStore }       from '@/features/termis/store/termisStore';
import { gitAccess }            from '../../gitAccess';
import { logGit, openGitPanel } from './gitLogger';

/** Cache flag checking if the Git binary has been verified on the system file tree. */
let isGitVerified  = false;

/** Mutex promise tracker to prevent concurrent background Git binary installations. */
let installPromise: Promise<void> | null = null;

/**
 * App-private store for --separate-git-dir (fallback when sdcard blocks .git).
 * NOT /root — missing on unrooted Android.
 */
export const GIT_REPOS_BASE = '/data/data/com.editor.mscode/files/.mscode_git_repos';

/** Workspaces where the user already approved virtual-git. */
const virtualApproved = new Set<string>();

/** Workspaces where the user declined virtual-git (don't spam). */
const virtualDeclined = new Set<string>();

export function isSharedStorage(path: string): boolean {
  const n = path.replace('/storage/emulated/0', '/sdcard');
  return n.startsWith('/sdcard') || n.startsWith('/storage/');
}

function isPermissionError(msg: string): boolean {
  const m = (msg || '').toLowerCase();
  return (
    m.includes('permission denied') ||
    m.includes('operation not permitted') ||
    m.includes('read-only file system') ||
    m.includes('read only file system') ||
    m.includes('unable to create') ||
    m.includes('cannot mkdir') ||
    m.includes('failed to create') ||
    m.includes('invalid path') ||
    m.includes('not a directory') && m.includes('.git')
  );
}

async function ensureGitInstalled(): Promise<void> {
  if (isGitVerified)  return;
  if (installPromise) return installPromise;

  installPromise = new Promise<void>(async (resolve, reject) => {
    try {
      const check = taskManager.execute('git --version', '/', () => {});
      const res = await check.result;
      if (res.exitCode === 0) {
        isGitVerified = true;
        return resolve();
      }

      useNotificationStore.getState().addNotification({
        type: 'info', title: 'Git Setup', source: 'Git',
        message: 'Git is not installed. Installing in the background…',
      });

      useOutputStore.getState().createChannel('Git Setup');
      useOutputStore.getState().setActiveChannel('Git Setup');
      useTermisStore.getState().setActiveView('output');

      const tasks   = createTasksModule('system');
      const install = tasks.runInBackground(
        'pkg update; pkg install git; command -v git >/dev/null || ls "$PREFIX/bin/git"',
        { cwd: '/', outputChannel: 'Git Setup' },
      );

      const { exitCode: code } = await install.result;
      if (code === 0) {
        isGitVerified = true;
        useNotificationStore.getState().addNotification({
          type: 'success', title: 'Git Setup', source: 'Git',
          message: 'Git installed successfully!',
        });
        resolve();
      } else {
        useNotificationStore.getState().addNotification({
          type: 'error', title: 'Git Setup', source: 'Git',
          message: 'Failed to install Git. Check the Output panel.',
        });
        reject(new Error('Git installation failed.'));
      }
    } catch (e) {
      reject(e);
    } finally {
      installPromise = null;
    }
  });

  return installPromise;
}

// ─── Virtual Git (opt-in fallback) ───────────────────────────────────────────

/**
 * Only validates existing gitdir: links — does NOT auto-migrate.
 * Real .git on sdcard is preferred until permission fails + user confirms.
 */
async function validateVirtualGitLinks(cwd: string): Promise<void> {
  const gitFilePath = `${cwd}/.git`;

  let existsOut = '';
  await taskManager.execute(`[ -e "${gitFilePath}" ] && echo "yes" || echo "no"`, '/', (data) => { existsOut += data; }).result;
  if (existsOut.trim() !== 'yes') return;

  let dirOut = '';
  await taskManager.execute(`[ -d "${gitFilePath}" ] && echo "dir" || echo "file"`, '/', (data) => { dirOut += data; }).result;
  if (dirOut.trim() === 'dir') return; // real .git — leave alone

  let contentOut = '';
  await taskManager.execute(`cat "${gitFilePath}"`, '/', (data) => { contentOut += data; }).result;
  const content = contentOut.trim();

  if (!content.startsWith('gitdir: ')) return;

  const targetPath = content.replace('gitdir: ', '').trim();
  let targetExistsOut = '';
  await taskManager.execute(`[ -d "${targetPath}" ] && echo "yes" || echo "no"`, '/', (data) => { targetExistsOut += data; }).result;

  if (targetExistsOut.trim() === 'no') {
    await taskManager.execute(`rm -f "${gitFilePath}"`, '/', () => {}).result;
    logGit('Virtual Git', `Removed broken virtual link → ${targetPath}`);
    virtualApproved.delete(cwd);
  } else {
    // Already virtual — treat as approved so we don't re-prompt
    virtualApproved.add(cwd);
  }
}

/**
 * Ask user (notification actions) whether to use virtual gitdir on app storage.
 * Returns true if user taps "Use Virtual Git".
 */
export function askVirtualGitConsent(cwd: string, reason?: string): Promise<boolean> {
  if (virtualApproved.has(cwd)) return Promise.resolve(true);
  if (virtualDeclined.has(cwd)) return Promise.resolve(false);

  return new Promise((resolve) => {
    const notif = useNotificationStore.getState();
    const id = notif.addNotification({
      type: 'warning',
      title: 'Storage Permission',
      source: 'Git',
      message:
        reason ||
        'Git cannot write .git on this shared storage path. Use a virtual git directory inside app storage instead?',
      actions: [
        {
          label: 'Use Virtual Git',
          variant: 'type1',
          onClick: () => {
            notif.removeNotification(id);
            virtualApproved.add(cwd);
            virtualDeclined.delete(cwd);
            resolve(true);
          },
        },
        {
          label: 'Not Now',
          variant: 'type2',
          onClick: () => {
            notif.removeNotification(id);
            virtualDeclined.add(cwd);
            resolve(false);
          },
        },
      ],
    });
  });
}

/**
 * Migrate real .git directory → filesDir/.mscode_git_repos + gitdir: pointer.
 * Or create separate-git-dir for a fresh repo.
 */
export async function enableVirtualGit(cwd: string, opts?: { initBranch?: string }): Promise<string> {
  const gitFilePath = `${cwd}/.git`;
  const uniqueHash = `repo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const linuxRepoPath = `${GIT_REPOS_BASE}/${uniqueHash}`;

  await taskManager.execute(`mkdir -p "${GIT_REPOS_BASE}"`, '/', () => {}).result;

  let isDirOut = '';
  await taskManager.execute(`[ -d "${gitFilePath}" ] && echo "dir" || echo "no"`, '/', (data) => { isDirOut += data; }).result;

  if (isDirOut.trim() === 'dir') {
    await taskManager.execute(`mv "${gitFilePath}" "${linuxRepoPath}"`, '/', () => {}).result;
    await taskManager.execute(`echo "gitdir: ${linuxRepoPath}" > "${gitFilePath}"`, '/', () => {}).result;
    logGit('Virtual Git', `Migrated .git → ${linuxRepoPath}`);
  } else {
    // No .git or already a file — (re)init with separate-git-dir
    await taskManager.execute(`rm -rf "${gitFilePath}"`, '/', () => {}).result;
    const branch = opts?.initBranch || 'main';
    await taskManager.execute(
      `git -c safe.directory="*" init -b ${branch} --separate-git-dir="${linuxRepoPath}"`,
      cwd,
      () => {},
    ).result;
    logGit('Virtual Git', `Init with separate-git-dir → ${linuxRepoPath}`);
  }

  virtualApproved.add(cwd);
  return linuxRepoPath;
}

async function handleBrokenRepoRecovery(cwd: string, failedCommand: string, hideLog: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const notif = useNotificationStore.getState();

    const warningId = notif.addNotification({
      type: 'warning', title: 'Repository Error', source: 'Git',
      message: 'The repository link is broken or corrupted.',
      actions: [
        {
          label: 'Force Re-Initialize', variant: 'type1',
          onClick: async () => {
            notif.removeNotification(warningId);
            const loadingId = notif.addNotification({
              type: 'loading', title: 'Repairing...', source: 'Git',
              message: 'Re-initializing repository link...',
            });
            try {
              await enableVirtualGit(cwd);
              const result = await run(failedCommand, cwd, hideLog);
              notif.removeNotification(loadingId);
              notif.addNotification({
                type: 'success', title: 'Repaired', source: 'Git',
                message: 'Repository linked successfully!',
              });
              resolve(result);
            } catch (e: any) {
              notif.removeNotification(loadingId);
              notif.addNotification({
                type: 'error', title: 'Repair Failed', source: 'Git', message: e.message,
              });
              reject(e);
            }
          },
        },
        {
          label: 'Cancel', variant: 'type2',
          onClick: () => {
            notif.removeNotification(warningId);
            reject(new Error('fatal: not a git repository'));
          },
        },
      ],
    });
  });
}

async function handlePermissionWithVirtualOffer(
  cwd: string,
  failedCommand: string,
  hideLog: boolean,
  errMessage: string,
): Promise<string> {
  if (!isSharedStorage(cwd)) {
    throw new Error(errMessage);
  }

  const ok = await askVirtualGitConsent(
    cwd,
    'Permission denied writing Git data on shared storage. Use a virtual git directory in app storage?',
  );
  if (!ok) {
    throw new Error(errMessage + '\n(Virtual Git declined by user)');
  }

  await enableVirtualGit(cwd);
  return run(failedCommand, cwd, hideLog);
}

// ─── Main Execution Ops ─────────────────────────────────────────────────────

export async function run(command: string, cwd: string, hideLog = false): Promise<string> {
  await ensureGitInstalled();
  // Only validate existing virtual links — never auto-migrate
  await validateVirtualGitLinks(cwd);

  return new Promise((resolve, reject) => {
    let output = '';
    const safeCommand = `-c safe.directory="*" ${command}`;
    const safeCwd     = cwd.replace('/storage/emulated/0', '/sdcard');

    const execution = taskManager.execute(`git ${safeCommand}`, safeCwd, (data) => {
      output += data;
    });

    execution.result
      .then(async ({ exitCode }) => {
        const clean = output
          .split('\n')
          .filter(l => !l.startsWith('warning:'))
          .join('\n')
          .trimEnd();

        if (!hideLog) logGit(command, clean);

        if (exitCode !== 0) {
          const errMessage = clean || `git ${command} failed (exit ${exitCode})`;

          if (errMessage.includes('fatal: not a git repository')) {
            let existsOut = '';
            await taskManager.execute(
              `[ -e "${safeCwd}/.git" ] && echo "yes" || echo "no"`,
              '/',
              (data) => { existsOut += data; },
            ).result;

            if (existsOut.trim() === 'yes') {
              handleBrokenRepoRecovery(cwd, command, hideLog).then(resolve).catch(reject);
            } else {
              reject(new Error(errMessage));
            }
          } else if (
            errMessage.includes('divergent branches') ||
            errMessage.includes('Need to specify how to reconcile')
          ) {
            handleDivergentBranches(cwd, command, hideLog).then(resolve).catch(reject);
          } else if (isPermissionError(errMessage) && isSharedStorage(cwd)) {
            handlePermissionWithVirtualOffer(cwd, command, hideLog, errMessage)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error(errMessage));
          }
        } else {
          resolve(clean);
        }
      })
      .catch(reject);
  });
}

export async function runVisible(command: string, cwd: string): Promise<string> {
  openGitPanel();
  return run(command, cwd, false);
}

async function handleDivergentBranches(cwd: string, failedCommand: string, hideLog: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const notif = useNotificationStore.getState();

    const warningId = notif.addNotification({
      type: 'warning', title: 'Divergent Branches', source: 'Git',
      message: 'Your local and remote branches have diverged. How would you like to reconcile them?',
      actions: [
        {
          label: 'Merge (Default)', variant: 'type1',
          onClick: async () => {
            notif.removeNotification(warningId);
            const loadingId = notif.addNotification({
              type: 'loading', title: 'Merging...', source: 'Git',
              message: 'Configuring and pulling changes...',
            });
            try {
              await run(`config pull.rebase false`, cwd, true);
              let cmd = failedCommand;
              if (!cmd.includes('--no-edit')) cmd += ' --no-edit';
              const result = await run(cmd, cwd, hideLog);
              notif.removeNotification(loadingId);
              notif.addNotification({
                type: 'success', title: 'Pull Successful', source: 'Git',
                message: 'Branches merged successfully!',
              });
              resolve(result);
            } catch (e: any) {
              notif.removeNotification(loadingId);
              reject(e);
            }
          },
        },
        {
          label: 'Rebase', variant: 'type2',
          onClick: async () => {
            notif.removeNotification(warningId);
            const loadingId = notif.addNotification({
              type: 'loading', title: 'Rebasing...', source: 'Git',
              message: 'Configuring and rebasing changes...',
            });
            try {
              await run(`config pull.rebase true`, cwd, true);
              const result = await run(failedCommand, cwd, hideLog);
              notif.removeNotification(loadingId);
              notif.addNotification({
                type: 'success', title: 'Pull Successful', source: 'Git',
                message: 'Branches rebased successfully!',
              });
              resolve(result);
            } catch (e: any) {
              notif.removeNotification(loadingId);
              reject(e);
            }
          },
        },
        {
          label: 'Cancel', variant: 'type2',
          onClick: () => {
            notif.removeNotification(warningId);
            reject(new Error('Pull cancelled. Divergent branches need reconciliation.'));
          },
        },
      ],
    });
  });
}

export async function getAuthPrefix(): Promise<string> {
  const token = await gitAccess.requestToken();
  if (!token) throw new Error('GitHub Authentication required or access denied. Please grant permission.');
  return `-c http.extraHeader="Authorization: Basic ${window.btoa(`${token}:x-oauth-basic`)}"`;
}

export function getRelativePath(cwd: string, fullPath: string): string {
  if (fullPath.startsWith(cwd)) {
    let rel = fullPath.substring(cwd.length);
    if (rel.startsWith('/')) rel = rel.substring(1);
    return rel;
  }
  return fullPath;
}
