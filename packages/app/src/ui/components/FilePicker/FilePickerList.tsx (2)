// src/ui/components/FilePicker/FilePickerList.tsx
import React, { useRef, useEffect } from 'react';
import { Icon, type IconName } from '@/ui/components/Icon/IconRegistry';
import { FileIcon } from '../FileIcon/DefaultIconTheme';
import type { FileStat } from '@/core/fileSystem/IFileSystem';

export interface InlineEditState {
  isNew: boolean;
  isFolder: boolean;
  initialName: string;
  targetPath: string;
}

interface FileListProps {
  items: FileStat[];
  currentPath: string;
  mode: 'file' | 'folder' | 'saveAs' | 'multiFile';
  selectedPaths: Set<string>;
  inlineEdit: InlineEditState | null;
  onItemClick: (item: FileStat) => void;
  onItemDoubleClick: (item: FileStat) => void;
  onContextMenu: (e: React.MouseEvent | { clientX: number; clientY: number; preventDefault: () => void }, item?: FileStat) => void;
  onInlineEditSubmit: (newName: string) => void;
  onInlineEditCancel: () => void;
  /** Toggle selection without opening folder (checkbox / mark). */
  onToggleSelect?: (item: FileStat) => void;
  /** When true, show mark checkboxes. */
  markMode?: boolean;
}

const LONG_PRESS_MS = 480;

export const FilePickerList: React.FC<FileListProps> = ({
  items,
  currentPath,
  mode,
  selectedPaths,
  inlineEdit,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
  onInlineEditSubmit,
  onInlineEditCancel,
  onToggleSelect,
  markMode = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const touchPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (inlineEdit && inputRef.current) {
      inputRef.current.focus();
      const dotIndex = inlineEdit.initialName.lastIndexOf('.');
      if (dotIndex > 0 && !inlineEdit.isFolder) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [inlineEdit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onInlineEditSubmit(e.currentTarget.value);
    if (e.key === 'Escape') onInlineEditCancel();
  };

  const getRootIcon = (name: string): IconName => {
    if (name.includes('Internal')) return 'folder-android';
    if (name.includes('MS Projects')) return 'folder-active';
    if (name.includes('MS System')) return 'settings';
    if (name.includes('Termux')) return 'folder-linux';
    return 'folder';
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = (item: FileStat, x: number, y: number) => {
    longPressFired.current = false;
    touchPos.current = { x, y };
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      window.navigator.vibrate?.(12);
      onContextMenu(
        {
          clientX: x,
          clientY: y,
          preventDefault: () => {},
        },
        item,
      );
    }, LONG_PRESS_MS);
  };

  return (
    <div
      className="ms-filepicker-list"
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e);
      }}
    >
      {inlineEdit?.isNew && (
        <div className="ms-filepicker-item">
          <FileIcon name={inlineEdit.isFolder ? 'folder' : 'file.txt'} isDir={inlineEdit.isFolder} />
          <div className="ms-filepicker-inline-edit">
            <input
              ref={inputRef}
              className="ms-filepicker-inline-input"
              defaultValue={inlineEdit.initialName}
              onKeyDown={handleKeyDown}
              onBlur={(e) => onInlineEditSubmit(e.target.value)}
            />
          </div>
        </div>
      )}

      {items.map((item, idx) => {
        const isEditing = inlineEdit && !inlineEdit.isNew && inlineEdit.targetPath === item.path;
        const isSelected = selectedPaths.has(item.path);

        // Folder-picker mode: files cannot be *confirmed*, but still allow long-press actions
        let isDisabled = false;
        if (mode === 'folder' && !item.isDirectory) isDisabled = true;

        const showCheck = markMode && currentPath !== 'ROOT';

        return (
          <div
            key={item.path || idx}
            onClick={() => {
              if (longPressFired.current) {
                longPressFired.current = false;
                return;
              }
              if (!isDisabled) onItemClick(item);
            }}
            onDoubleClick={() => !isDisabled && onItemDoubleClick(item)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Always allow context menu inside a directory (even for files in folder mode)
              if (currentPath === 'ROOT') return;
              onContextMenu(e, item);
            }}
            onTouchStart={(e) => {
              if (currentPath === 'ROOT') return;
              const t = e.touches[0];
              if (t) startLongPress(item, t.clientX, t.clientY);
            }}
            onTouchMove={() => clearLongPress()}
            onTouchEnd={() => clearLongPress()}
            onTouchCancel={() => clearLongPress()}
            className={`ms-filepicker-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
          >
            {showCheck && (
              <button
                type="button"
                className={`ms-filepicker-check ${isSelected ? 'checked' : ''}`}
                title={isSelected ? 'Unmark' : 'Mark'}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSelect) onToggleSelect(item);
                }}
              >
                {isSelected ? <Icon name="check" size={14} /> : <span className="ms-filepicker-check-box" />}
              </button>
            )}

            {currentPath === 'ROOT' ? (
              <Icon
                name={getRootIcon(item.name)}
                size={18}
                color={item.isDirectory ? '#dcb67a' : 'var(--ms-text-main)'}
              />
            ) : (
              <FileIcon name={item.name} isDir={item.isDirectory} isOpen={isSelected && item.isDirectory} />
            )}

            {isEditing ? (
              <div className="ms-filepicker-inline-edit">
                <input
                  ref={inputRef}
                  className="ms-filepicker-inline-input"
                  defaultValue={item.name}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => onInlineEditSubmit(e.target.value)}
                />
              </div>
            ) : (
              <span className="ms-filepicker-item-name">{item.name}</span>
            )}
          </div>
        );
      })}

      {items.length === 0 && !inlineEdit?.isNew && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--ms-text-faded)',
            marginTop: '40px',
            fontSize: '12px',
          }}
        >
          No files found
        </div>
      )}
    </div>
  );
};
