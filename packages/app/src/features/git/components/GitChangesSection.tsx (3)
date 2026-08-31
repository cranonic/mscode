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
import { useGitStore, GIT_STATUS_META } from '../store/gitStore';
import { CommitBox }            from './CommitBox';
import { ChangedFileItem }      from './ChangedFileItem';
import { GitBackend }           from '../core/GitBackend';
import { getCwd }               from '../store/_helpers';
import { useTabStore }          from '@/store/tabStore';
import type { GitChangedFile }  from '../store/gitStore';
import { buildChangeTree, collectFilePaths, type ChangeTreeNode } from './changeTree';

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

// ─── Tree row (folder or file) ────────────────────────────────────────────────

const TreeNodeRow: React.FC<{
  node: ChangeTreeNode;
  depth: number;
  isStaged: boolean;
  actionIcon: string;
  actionTitle: string;
  onAction: (path: string) => void;
  action2Icon?: string;
  action2Title?: string;
  onAction2?: (path: string) => void;
}> = ({
  node, depth, isStaged,
  actionIcon, actionTitle, onAction,
  action2Icon, action2Title, onAction2,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const pad = 12 + depth * 12;

  if (node.isDirectory) {
    const childFiles = collectFilePaths(node);
    const meta = node.status ? GIT_STATUS_META[node.status] : null;

    return (
      <div>
        <div
          onClick={() => setExpanded(v => !v)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: `3px 8px 3px ${pad}px`,
            cursor: 'pointer',
            backgroundColor: hovered ? 'var(--ms-menu-hover-bg)' : 'transparent',
            userSelect: 'none',
            minHeight: 26,
          }}
        >
          <Icon
            name={expanded ? 'chevron-down' : 'chevron-right'}
            size={14}
            style={{ flexShrink: 0, opacity: 0.7 }}
          />
          <FileIcon name={node.name} isDir={true} isOpen={expanded} />
          <span style={{
            flex: 1,
            fontSize: 13,
            color: 'var(--ms-text-main)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {node.name}
          </span>
          <span style={{
            fontSize: 10,
            color: 'var(--ms-text-faded)',
            marginRight: 4,
          }}>
            {childFiles.length}
          </span>
          {/* Stage/unstage whole folder */}
          <div style={{
            display: 'flex',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.1s',
            gap: 2,
          }}>
            {action2Icon && onAction2 && (
              <span
                title={`${action2Title} folder`}
                onClick={e => {
                  e.stopPropagation();
                  childFiles.forEach(p => onAction2(p));
                }}
                style={{ display: 'flex', padding: 2, color: 'var(--ms-text-faded)' }}
              >
                <Icon name={action2Icon as any} size={14} />
              </span>
            )}
            <span
              title={`${actionTitle} folder`}
              onClick={e => {
                e.stopPropagation();
                childFiles.forEach(p => onAction(p));
              }}
              style={{ display: 'flex', padding: 2, color: 'var(--ms-text-faded)' }}
            >
              <Icon name={actionIcon as any} size={14} />
            </span>
          </div>
          {meta && (
            <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, minWidth: 12, textAlign: 'right' }}>
              {meta.badge}
            </span>
          )}
        </div>
        {expanded && (node.children || []).map(child => (
          <TreeNodeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            isStaged={isStaged}
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
  }

  // File leaf
  if (!node.file) return null;
  return (
    <ChangedFileItem
      file={node.file}
      depth={depth}
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

  return (
    <>
      {tree.map(node => (
        <TreeNodeRow
          key={node.path}
          node={node}
          depth={0}
          isStaged={isStaged}
          actionIcon={actionIcon}
          actionTitle={actionTitle}
          onAction={onAction}
          action2Icon={action2Icon}
          action2Title={action2Title}
          onAction2={onAction2}
        />
      ))}
    </>
  );
};

// ─── Staged subsection ────────────────────────────────────────────────────────

const StagedSection: React.FC = () => {
  const { stagedFiles, unstageFile, unstageAll } = useGitStore();
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
      defaultExpanded={true}
      showGuideLine={true}
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
  const { unstagedFiles, stageFile, stageAll, discardFile } = useGitStore();
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
      defaultExpanded={true}
      showGuideLine={true}
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

export const GitChangesSection: React.FC = () => (
  <>
    <CommitBox />
    <StagedSection />
    <UnstagedSection />
  </>
);
