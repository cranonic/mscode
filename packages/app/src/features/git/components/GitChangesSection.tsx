// src/features/git/components/GitChangesSection.tsx
//
// Content-only component — sidebarRegistry owns the "CHANGES" header + actions.
// This file renders: CommitBox → Staged subsection → Unstaged subsection
// Changed paths are shown as a collapsible folder tree (VS Code SCM style).

import React, { useMemo, useState } from 'react';
import { Collapsible }          from '@/ui/components/Collapsible/Collapsible';
import { Icon }                 from '@/ui/components/Icon/IconRegistry';
import { FileIcon }             from '@/ui/components/FileIcon/DefaultIconTheme';
import { useNotificationStore } from '@/store/notificationStore';
import { useSettingsStore }     from '@/features/settings/store/settingsStore';
import { useMenuStore }         from '@/store/menuStore';
import { useGitStore, GIT_STATUS_META } from '../store/gitStore';
import { CommitBox }            from './CommitBox';
import { ChangedFileItem }      from './ChangedFileItem';
import { GitBackend }           from '../core/GitBackend';
import { getCwd }               from '../store/_helpers';
import { useTabStore }          from '@/store/tabStore';
import type { GitChangedFile }  from '../store/gitStore';
import {
  buildChangeTree,
  collectFilePaths,
  collectFolderPaths,
  collectAllFolderPaths,
  type ChangeTreeNode,
} from './changeTree';
// Reuse explorer tree row styles so SCM Changes matches the FileTree theme
import '@/features/explorer/components/FileTree/FileTree.css';

// ─── Collapse / expand context menu (long-press or right-click on headers) ───

type CollapseTarget =
  | { kind: 'section'; section: 'staged' | 'unstaged' }
  | { kind: 'folder'; path: string; node: ChangeTreeNode };

function openCollapseContextMenu(e: React.MouseEvent, target: CollapseTarget) {
  e.preventDefault();
  e.stopPropagation();

  const store = useGitStore.getState();
  const stagedTree = buildChangeTree(store.stagedFiles, getCwd() || '');
  const unstagedTree = buildChangeTree(store.unstagedFiles, getCwd() || '');
  const allFolderPaths = [
    ...collectAllFolderPaths(stagedTree),
    ...collectAllFolderPaths(unstagedTree),
  ];

  const collapseThis = () => {
    if (target.kind === 'section') {
      if (target.section === 'staged') store.setStagedSectionExpanded(false);
      else store.setUnstagedSectionExpanded(false);
    } else {
      store.setChangeFolderExpanded(target.path, false);
    }
  };
  const expandThis = () => {
    if (target.kind === 'section') {
      if (target.section === 'staged') store.setStagedSectionExpanded(true);
      else store.setUnstagedSectionExpanded(true);
    } else {
      store.setChangeFolderExpanded(target.path, true);
    }
  };
  const collapseChildren = () => {
    if (target.kind === 'section') {
      const roots = target.section === 'staged' ? stagedTree : unstagedTree;
      store.setCollapsedChangeFolders(collectAllFolderPaths(roots), true);
    } else {
      const kids = collectFolderPaths(target.node).filter(p => p !== target.path);
      store.setCollapsedChangeFolders(kids, true);
    }
  };
  const expandChildren = () => {
    if (target.kind === 'section') {
      const roots = target.section === 'staged' ? stagedTree : unstagedTree;
      store.setCollapsedChangeFolders(collectAllFolderPaths(roots), false);
    } else {
      const kids = collectFolderPaths(target.node).filter(p => p !== target.path);
      store.setCollapsedChangeFolders(kids, false);
    }
  };
  const collapseAll = () => {
    store.setStagedSectionExpanded(false);
    store.setUnstagedSectionExpanded(false);
    const map: Record<string, true> = {};
    for (const p of allFolderPaths) map[p] = true;
    store.replaceCollapsedChangeFolders(map);
  };
  const expandAll = () => {
    store.setStagedSectionExpanded(true);
    store.setUnstagedSectionExpanded(true);
    store.replaceCollapsedChangeFolders({});
  };

  useMenuStore.getState().openMenuDirect(e.clientX, e.clientY, [
    {
      id: 'collapse',
      label: 'Collapse',
      icon: 'chevron-right',
      children: [
        { id: 'collapse-this', label: 'Collapse This', onClick: collapseThis },
        { id: 'collapse-children', label: 'Collapse Children', onClick: collapseChildren },
        { id: 'collapse-all', label: 'Collapse All', onClick: collapseAll },
      ],
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: 'chevron-down',
      children: [
        { id: 'expand-this', label: 'Expand This', onClick: expandThis },
        { id: 'expand-children', label: 'Expand Children', onClick: expandChildren },
        { id: 'expand-all', label: 'Expand All', onClick: expandAll },
      ],
    },
  ], 'top-left');
}

type IconMode = 'sameAsExplorer' | 'show' | 'hide';

function resolveIconVisibility(
  mode: IconMode | undefined,
  explorerDefault: boolean,
): boolean {
  if (mode === 'show') return true;
  if (mode === 'hide') return false;
  return explorerDefault; // sameAsExplorer / undefined
}

// ─── VS Code–style diff open (files only) ─────────────────────────────────────

export const openGitDiff = async (file: GitChangedFile, isStaged: boolean) => {
  const cwd = getCwd();
  if (!cwd) return;

  // Directories must never open a file diff — readFile fails on dirs
  if (file.isDirectory || file.path.endsWith('/')) {
    useNotificationStore.getState().addNotification({
      type: 'info', title: 'Git', source: 'Git',
      message: 'Expand the folder to open individual file diffs.',
    });
    return;
  }

  try {
    const originalContent = await GitBackend.getFileContent(
      cwd,
      isStaged ? 'HEAD' : 'INDEX',
      file.path,
    );
    const modifiedContent = isStaged
      ? await GitBackend.getFileContent(cwd, 'INDEX', file.path)
      : null;

    useTabStore.getState().addTab({
      id:       `diff-${isStaged ? 'staged' : 'unstaged'}-${file.path}`,
      type:     'diff' as any,
      title:    `${file.name} (${isStaged ? 'Index' : 'Working Tree'})`,
      icon:     'git-compare',
      filePath: file.path,
      diffData: { originalContent, modifiedContent, readOnly: isStaged, filePath: file.path },
    } as any);
  } catch (e: any) {
    console.error('[openGitDiff]', e);
    useNotificationStore.getState().addNotification({
      type: 'error', title: 'Git Diff', source: 'Git',
      message: e?.message ?? 'Could not open diff',
    });
  }
};

// ─── Tree row — mirrors explorer FileTree TreeNode (Collapsible + ms-file-item) ─

const TreeNodeRow: React.FC<{
  node: ChangeTreeNode;
  depth: number;
  isStaged: boolean;
  showFileIcon: boolean;
  showFolderIcon: boolean;
  actionIcon: string;
  actionTitle: string;
  onAction: (path: string) => void;
  action2Icon?: string;
  action2Title?: string;
  onAction2?: (path: string) => void;
}> = ({
  node, depth, isStaged,
  showFileIcon, showFolderIcon,
  actionIcon, actionTitle, onAction,
  action2Icon, action2Title, onAction2,
}) => {
  const [hovered, setHovered] = useState(false);
  // Persist folder expand/collapse in git store (survives activity-tab switches)
  const collapsedChangeFolders = useGitStore(s => s.collapsedChangeFolders);
  const setChangeFolderExpanded = useGitStore(s => s.setChangeFolderExpanded);
  const expanded = !collapsedChangeFolders[node.path];

  if (node.isDirectory) {
    const childFiles = collectFilePaths(node);
    const meta = node.status ? GIT_STATUS_META[node.status] : null;

    return (
      <Collapsible
        expanded={expanded}
        onToggle={() => setChangeFolderExpanded(node.path, !expanded)}
        showGuideLine={true}
        titleStyle={{ fontWeight: 'normal' }}
        onHeaderContextMenu={e => openCollapseContextMenu(e, { kind: 'folder', path: node.path, node })}
        title={
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', width: '100%' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {showFolderIcon && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <FileIcon name={node.name} isDir={true} isOpen={expanded} />
              </div>
            )}
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {node.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--ms-text-faded)', flexShrink: 0 }}>
              {childFiles.length}
            </span>
            <div
              style={{
                display: 'flex',
                gap: 2,
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.1s',
                flexShrink: 0,
              }}
              onClick={e => e.stopPropagation()}
            >
              {action2Icon && onAction2 && (
                <span
                  title={`${action2Title} folder`}
                  onClick={() => childFiles.forEach(p => onAction2(p))}
                  style={{ display: 'flex', padding: 2, color: 'var(--ms-text-faded)' }}
                >
                  <Icon name={action2Icon as any} size={14} />
                </span>
              )}
              <span
                title={`${actionTitle} folder`}
                onClick={() => childFiles.forEach(p => onAction(p))}
                style={{ display: 'flex', padding: 2, color: 'var(--ms-text-faded)' }}
              >
                <Icon name={actionIcon as any} size={14} />
              </span>
            </div>
            {meta && (
              <span
                title={meta.label}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: meta.color,
                  minWidth: 12,
                  textAlign: 'right',
                  flexShrink: 0,
                  paddingRight: 4,
                }}
              >
                {meta.badge}
              </span>
            )}
          </div>
        }
      >
        {(node.children || []).map(child => (
          <TreeNodeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            isStaged={isStaged}
            showFileIcon={showFileIcon}
            showFolderIcon={showFolderIcon}
            actionIcon={actionIcon}
            actionTitle={actionTitle}
            onAction={onAction}
            action2Icon={action2Icon}
            action2Title={action2Title}
            onAction2={onAction2}
          />
        ))}
      </Collapsible>
    );
  }

  if (!node.file) return null;
  return (
    <ChangedFileItem
      file={node.file}
      depth={depth}
      showFileIcon={showFileIcon}
      actionIcon={actionIcon}
      actionTitle={actionTitle}
      onAction={onAction}
      action2Icon={action2Icon}
      action2Title={action2Title}
      onAction2={onAction2}
      onClick={() => openGitDiff(node.file!, isStaged)}
    />
  );
};

const ChangeTreeList: React.FC<{
  files: GitChangedFile[];
  isStaged: boolean;
  actionIcon: string;
  actionTitle: string;
  onAction: (path: string) => void;
  action2Icon?: string;
  action2Title?: string;
  onAction2?: (path: string) => void;
}> = ({ files, isStaged, actionIcon, actionTitle, onAction, action2Icon, action2Title, onAction2 }) => {
  const cwd = getCwd() || '';
  const tree = useMemo(() => buildChangeTree(files, cwd), [files, cwd]);
  const settings = useSettingsStore(s => s.settings);

  const showFileIcon = resolveIconVisibility(
    settings['git.changes.showFileIcons'] as IconMode | undefined,
    settings['workbench.explorer.showFileIcons'] ?? true,
  );
  const showFolderIcon = resolveIconVisibility(
    settings['git.changes.showFolderIcons'] as IconMode | undefined,
    settings['workbench.explorer.showFolderIcons'] ?? false,
  );

  return (
    <div
      className="ms-file-tree-container"
      style={{
        position: 'relative',
        width: 'max-content',
        minWidth: '100%',
        padding: 0,
      }}
    >
      {tree.map(node => (
        <TreeNodeRow
          key={node.path}
          node={node}
          depth={0}
          isStaged={isStaged}
          showFileIcon={showFileIcon}
          showFolderIcon={showFolderIcon}
          actionIcon={actionIcon}
          actionTitle={actionTitle}
          onAction={onAction}
          action2Icon={action2Icon}
          action2Title={action2Title}
          onAction2={onAction2}
        />
      ))}
    </div>
  );
};

// ─── Staged subsection ────────────────────────────────────────────────────────

const StagedSection: React.FC = () => {
  const stagedFiles = useGitStore(s => s.stagedFiles);
  const unstageFile = useGitStore(s => s.unstageFile);
  const unstageAll = useGitStore(s => s.unstageAll);
  const expanded = useGitStore(s => s.stagedSectionExpanded);
  const setExpanded = useGitStore(s => s.setStagedSectionExpanded);
  if (stagedFiles.length === 0) return null;

  return (
    <Collapsible
      title={
        <span style={{ fontSize: '11px', fontWeight: 600 }}>
          Staged Changes&nbsp;
          <span style={{
            background: 'var(--ms-bg-activity)', borderRadius: '10px',
            padding: '0 5px', fontSize: '10px', color: 'var(--ms-text-faded)',
          }}>
            {stagedFiles.length}
          </span>
        </span>
      }
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      showGuideLine={true}
      onHeaderContextMenu={e => openCollapseContextMenu(e, { kind: 'section', section: 'staged' })}
      rightActions={
        <span
          onClick={e => { e.stopPropagation(); unstageAll(); }}
          title="Unstage All"
          style={{ display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer', color: 'var(--ms-text-faded)' }}
        >
          <Icon name="remove" size={13} />
        </span>
      }
    >
      <ChangeTreeList
        files={stagedFiles}
        isStaged={true}
        actionIcon="remove"
        actionTitle="Unstage"
        onAction={unstageFile}
      />
    </Collapsible>
  );
};

// ─── Unstaged subsection ──────────────────────────────────────────────────────

const UnstagedSection: React.FC = () => {
  const unstagedFiles = useGitStore(s => s.unstagedFiles);
  const stageFile = useGitStore(s => s.stageFile);
  const stageAll = useGitStore(s => s.stageAll);
  const discardFile = useGitStore(s => s.discardFile);
  const expanded = useGitStore(s => s.unstagedSectionExpanded);
  const setExpanded = useGitStore(s => s.setUnstagedSectionExpanded);
  if (unstagedFiles.length === 0) return null;

  const handleDiscardAll = () => {
    const notif = useNotificationStore.getState();
    let nid = '';
    nid = notif.addNotification({
      type: 'confirmation', title: 'Discard All Changes', source: 'Git',
      message: 'Discard ALL unstaged changes? This cannot be undone.',
      actions: [
        {
          label: 'Discard All', variant: 'type1',
          customStyle: { backgroundColor: '#d32f2f', color: '#fff', borderColor: '#d32f2f' },
          onClick: async () => {
            notif.removeNotification(nid);
            unstagedFiles.forEach(f => {
              if (!f.isDirectory) discardFile(f.path);
            });
          },
        },
        { label: 'Cancel', onClick: () => notif.removeNotification(nid) },
      ],
    });
  };

  return (
    <Collapsible
      title={
        <span style={{ fontSize: '11px', fontWeight: 600 }}>
          Changes&nbsp;
          <span style={{
            background: 'var(--ms-bg-activity)', borderRadius: '10px',
            padding: '0 5px', fontSize: '10px', color: 'var(--ms-text-faded)',
          }}>
            {unstagedFiles.length}
          </span>
        </span>
      }
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      showGuideLine={true}
      onHeaderContextMenu={e => openCollapseContextMenu(e, { kind: 'section', section: 'unstaged' })}
      rightActions={
        <div style={{ display: 'flex', gap: '2px' }}>
          <span
            onClick={e => { e.stopPropagation(); handleDiscardAll(); }}
            title="Discard All"
            style={{ display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer', color: 'var(--ms-text-faded)' }}
          >
            <Icon name="discard" size={13} />
          </span>
          <span
            onClick={e => { e.stopPropagation(); stageAll(); }}
            title="Stage All"
            style={{ display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer', color: 'var(--ms-text-faded)' }}
          >
            <Icon name="add" size={13} />
          </span>
        </div>
      }
    >
      <ChangeTreeList
        files={unstagedFiles}
        isStaged={false}
        actionIcon="add"
        actionTitle="Stage"
        onAction={stageFile}
        action2Icon="discard"
        action2Title="Discard Changes"
        onAction2={discardFile}
      />
    </Collapsible>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
// CommitBox is OUTSIDE the scroll region so it never moves (H or V).
// File lists scroll in the lower pane only.

export const GitChangesSection: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      // Prevent parent section from scrolling this whole block sideways
      width: '100%',
      maxWidth: '100%',
    }}
  >
    <div
      style={{
        flexShrink: 0,
        zIndex: 2,
        background: 'var(--ms-bg-side, var(--ms-bg-main, #1e1e1e))',
        boxShadow: '0 1px 0 var(--ms-border-color, #333)',
        width: '100%',
      }}
    >
      <CommitBox />
    </div>
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        // Tree can grow wider than the pane → horizontal scroll stays here
        width: '100%',
      }}
    >
      <StagedSection />
      <UnstagedSection />
    </div>
  </div>
);
