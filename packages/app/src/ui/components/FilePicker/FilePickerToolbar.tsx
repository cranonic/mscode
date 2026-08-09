// src/ui/components/FilePicker/FilePickerToolbar.tsx
import React, { useMemo, useState } from 'react';
import { Icon } from '../Icon/IconRegistry';
import { InputAction } from '../InputBox/InputBox';
import { useMenuStore, type MenuItem } from '@/store/menuStore';

/** Decode SAF / normal paths for display — last `maxSegments` parts only. */
export function formatPickerPath(path: string, maxSegments = 3): string {
  if (!path || path === 'ROOT') return 'Computer / Workspaces';

  let raw = path;
  if (path.startsWith('content://')) {
    try {
      const doc = path.match(/\/document\/([^?#]+)/);
      if (doc) {
        raw = decodeURIComponent(doc[1]);
      } else {
        const tree = path.match(/\/tree\/([^/?#]+)/);
        if (tree) raw = decodeURIComponent(tree[1]);
      }
    } catch {
      raw = path;
    }
  }

  // Strip leading noise
  const parts = raw.split('/').filter(Boolean);
  if (parts.length === 0) return raw;
  if (parts.length <= maxSegments) return parts.join('/');
  return parts.slice(-maxSegments).join('/');
}

export type SortMode = 'name-asc' | 'name-desc' | 'type';

interface ToolbarProps {
  currentPath: string;
  allowCreate: boolean;
  onGoUp: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onRefresh: () => void;
  onAddStorage?: () => void;
  /** Breadcrumb segment limit (default 3). */
  pathSegments?: number;
  showHidden: boolean;
  onToggleHidden: () => void;
  sortMode: SortMode;
  onSortMode: (m: SortMode) => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  /** Mark mode active — show Cancel mark. */
  markMode?: boolean;
  onCancelMark?: () => void;
  /** Max icons before overflow into ⋮ menu (default 4). */
  maxOverflow?: number;
}

type ActionDef = {
  id: string;
  icon: string;
  title: string;
  onClick: (e?: React.MouseEvent) => void;
  show: boolean;
};

export const FilePickerToolbar: React.FC<ToolbarProps> = ({
  currentPath,
  allowCreate,
  onGoUp,
  onCreateFile,
  onCreateFolder,
  onRefresh,
  onAddStorage,
  pathSegments = 3,
  showHidden,
  onToggleHidden,
  sortMode,
  onSortMode,
  searchQuery,
  onSearchQuery,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  markMode = false,
  onCancelMark,
  maxOverflow = 4,
}) => {
  const openMenu = useMenuStore((s) => s.openMenuDirect);
  const [searchOpen, setSearchOpen] = useState(false);

  const breadcrumb = formatPickerPath(currentPath, pathSegments);

  const openSortMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const items: MenuItem[] = [
      {
        id: 'sort-name-asc',
        label: 'Name (A → Z)',
        icon: sortMode === 'name-asc' ? 'check' : undefined,
        onClick: () => onSortMode('name-asc'),
      },
      {
        id: 'sort-name-desc',
        label: 'Name (Z → A)',
        icon: sortMode === 'name-desc' ? 'check' : undefined,
        onClick: () => onSortMode('name-desc'),
      },
      {
        id: 'sort-type',
        label: 'Type (folders first)',
        icon: sortMode === 'type' ? 'check' : undefined,
        onClick: () => onSortMode('type'),
      },
    ];
    openMenu(e.clientX, e.clientY, items);
  };

  const actions: ActionDef[] = useMemo(() => {
    const list: ActionDef[] = [];
    if (markMode && onCancelMark) {
      list.push({
        id: 'cancel-mark',
        icon: 'close',
        title: 'Cancel mark',
        onClick: () => onCancelMark(),
        show: true,
      });
    }
    if (currentPath === 'ROOT' && onAddStorage) {
      list.push({
        id: 'add-storage',
        icon: 'root-folder-opened',
        title: 'Add Storage',
        onClick: () => onAddStorage(),
        show: true,
      });
    }
    if (allowCreate && currentPath !== 'ROOT') {
      list.push(
        {
          id: 'new-file',
          icon: 'new-file',
          title: 'New File',
          onClick: () => onCreateFile(),
          show: true,
        },
        {
          id: 'new-folder',
          icon: 'new-folder',
          title: 'New Folder',
          onClick: () => onCreateFolder(),
          show: true,
        },
      );
    }
    if (currentPath !== 'ROOT') {
      list.push(
        {
          id: 'search',
          icon: 'search',
          title: 'Search in list',
          onClick: () => setSearchOpen((v) => !v),
          show: true,
        },
        {
          id: 'select-all',
          icon: 'checklist',
          title: selectedCount > 0 && selectedCount === totalCount ? 'Clear selection' : 'Select all',
          onClick: () => {
            if (selectedCount > 0 && selectedCount === totalCount) onClearSelection();
            else onSelectAll();
          },
          show: totalCount > 0,
        },
        {
          id: 'toggle-hidden',
          icon: showHidden ? 'eye' : 'eye-closed',
          title: showHidden ? 'Hide hidden files' : 'Show hidden files',
          onClick: () => onToggleHidden(),
          show: true,
        },
        {
          id: 'sort',
          icon: 'filter',
          title: 'Sort',
          onClick: (e) => openSortMenu(e as React.MouseEvent),
          show: true,
        },
      );
    }
    list.push({
      id: 'refresh',
      icon: 'refresh',
      title: 'Refresh',
      onClick: () => onRefresh(),
      show: true,
    });
    return list.filter((a) => a.show);
  }, [
    currentPath,
    allowCreate,
    onAddStorage,
    selectedCount,
    totalCount,
    showHidden,
    sortMode,
    markMode,
  ]);

  // Primary icons (maxOverflow) + overflow ⋮ for the rest
  // Keep refresh always visible at the end of primary when possible
  const primary = actions.slice(0, maxOverflow);
  const overflow = actions.slice(maxOverflow);

  const openOverflow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!overflow.length) return;
    const items: MenuItem[] = overflow.map((a) => ({
      id: a.id,
      label: a.title,
      icon: a.icon,
      onClick: () => a.onClick(e),
    }));
    openMenu(e.clientX, e.clientY, items);
  };

  return (
    <div className="ms-filepicker-toolbar-wrap">
      <div className="ms-filepicker-toolbar">
        <div
          onClick={onGoUp}
          style={{
            cursor: currentPath === 'ROOT' ? 'not-allowed' : 'pointer',
            opacity: currentPath === 'ROOT' ? 0.4 : 1,
            padding: '4px',
            borderRadius: '4px',
            flexShrink: 0,
          }}
          title="Go Up"
        >
          <Icon name="arrow-up" size={16} />
        </div>

        <div className="ms-filepicker-breadcrumb" title={currentPath === 'ROOT' ? '' : currentPath}>
          {breadcrumb}
        </div>

        <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
          {primary.map((a) => (
            <div key={a.id} title={a.title} style={{ display: 'inline-flex' }}>
              <InputAction
                icon={<Icon name={a.icon as any} size={16} />}
                onClick={(e) => a.onClick(e as any)}
              />
            </div>
          ))}
          {overflow.length > 0 && (
            <div title="More" style={{ display: 'inline-flex' }}>
              <InputAction
                icon={<Icon name="ellipsis" size={16} />}
                onClick={(e) => openOverflow(e as any)}
              />
            </div>
          )}
        </div>
      </div>

      {searchOpen && currentPath !== 'ROOT' && (
        <div className="ms-filepicker-search">
          <Icon name="search" size={14} />
          <input
            className="ms-filepicker-search-input"
            placeholder="Filter files…"
            value={searchQuery}
            autoFocus
            onChange={(e) => onSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span
              className="ms-filepicker-search-clear"
              onClick={() => onSearchQuery('')}
              title="Clear"
            >
              <Icon name="close" size={12} />
            </span>
          )}
        </div>
      )}
    </div>
  );
};
