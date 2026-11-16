// src/features/git/components/ChangedFileItem.tsx
// Styled like explorer FileTree leaf rows (ms-file-item + ROW_HEIGHT).

import React, { useState } from 'react';
import { Icon }       from '@/ui/components/Icon/IconRegistry';
import { FileIcon }   from '@/ui/components/FileIcon/DefaultIconTheme';
import { GIT_STATUS_META } from '../store/gitStore';
import type { GitChangedFile } from '../store/gitStore';
import { ROW_HEIGHT } from '@/features/explorer/components/FileTree/constant/constants';

interface ChangedFileItemProps {
  file:        GitChangedFile;
  /** Nesting depth when rendered inside a folder tree (0 = root). */
  depth?:      number;
  /** Honour git / explorer icon settings. Default true. */
  showFileIcon?: boolean;
  actionIcon:  string;
  actionTitle: string;
  onAction:    (path: string) => void;
  action2Icon?:  string;
  action2Title?: string;
  onAction2?:    (path: string) => void;
  onClick?:    (file: GitChangedFile) => void;
}

export const ChangedFileItem: React.FC<ChangedFileItemProps> = ({
  file,
  depth = 0,
  showFileIcon = true,
  actionIcon, actionTitle, onAction,
  action2Icon, action2Title, onAction2,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const meta = GIT_STATUS_META[file.status];

  // Nested under Collapsible guide-line — only flat (depth 0) shows path hint
  const showPathLabel = depth === 0;
  const parts      = file.path.split('/');
  const folderPath = parts.slice(1, -1).join('/');

  return (
    <div
      className="ms-file-item"
      onClick={() => onClick?.(file)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height:      `${ROW_HEIGHT}px`,
        display:     'flex',
        alignItems:  'center',
        gap:         '6px',
        paddingLeft: '4px',
        paddingRight: '8px',
        cursor:      'pointer',
        backgroundColor: hovered ? 'var(--ms-menu-hover-bg)' : 'transparent',
        userSelect:  'none',
        width:       '100%',
        boxSizing:   'border-box',
      }}
    >
      {showFileIcon && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <FileIcon name={file.name} isDir={!!file.isDirectory} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, lineHeight: 1.15 }}>
        <span style={{
          fontSize:       '13px',
          whiteSpace:     'nowrap',
          overflow:       'hidden',
          textOverflow:   'ellipsis',
          color:          meta.color,
          textDecoration: meta.decoration,
          fontStyle:      meta.style,
        }}>
          {file.name}
        </span>
        {showPathLabel && folderPath ? (
          <span style={{
            fontSize:     '9px',
            color:        'var(--ms-text-faded)',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            fontStyle:    'italic',
          }}>
            {folderPath}
          </span>
        ) : null}
      </div>

      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '2px',
        flexShrink: 0,
        opacity:    hovered ? 1 : 0,
        transition: 'opacity 0.1s',
      }}>
        {action2Icon && onAction2 && (
          <span
            title={action2Title}
            onClick={e => { e.stopPropagation(); onAction2(file.path); }}
            style={{ display: 'flex', alignItems: 'center', padding: '2px', color: 'var(--ms-text-faded)' }}
          >
            <Icon name={action2Icon as any} size={14} />
          </span>
        )}
        <span
          title={actionTitle}
          onClick={e => { e.stopPropagation(); onAction(file.path); }}
          style={{ display: 'flex', alignItems: 'center', padding: '2px', color: 'var(--ms-text-faded)' }}
        >
          <Icon name={actionIcon as any} size={14} />
        </span>
      </div>

      <span
        title={meta.label}
        style={{
          fontSize:   '11px',
          fontWeight: 700,
          color:      meta.color,
          flexShrink: 0,
          minWidth:   '12px',
          textAlign:  'right',
        }}
      >
        {meta.badge}
      </span>
    </div>
  );
};