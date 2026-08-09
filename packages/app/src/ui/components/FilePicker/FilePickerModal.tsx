// src/ui/components/FilePicker/FilePickerModal.tsx
import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Modal } from '../Modal/Modal';
import { useFilePickerStore } from '@/store/filePickerStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { useMenuStore } from '@/store/menuStore'; 
import { useRecentStore } from '@/store/recentStore';
import { useBackButtonStore } from '@/store/backButtonStore';
import { fs } from '@/core/fileSystem';
import type { FileStat } from '@/core/fileSystem/IFileSystem';
import { Icon } from '../Icon/IconRegistry'; 

import { FilePickerToolbar, type SortMode } from './FilePickerToolbar';
import { FilePickerList, type InlineEditState } from './FilePickerList';
import { FilePickerFooter } from './FilePickerFooter';
import './FilePicker.css';
import { CompressModal } from './compress';
import type { CompressSource } from './compress';

export const FilePickerModal: React.FC = () => {
  const { isOpen, options, closePicker } = useFilePickerStore();
  const openMode = useSettingsStore(s => s.settings['workbench.explorer.openMode']) ?? 'singleClick';
  const { openMenu } = useMenuStore(); 
  
  //  BOOKMARKS & RECENT STATE
  const { bookmarks, recentWorkspaces } = useRecentStore(); 

  // State
  const [currentPath, setCurrentPath] = useState<string>('ROOT');
  const [rootView, setRootView] = useState<'storage' | 'recent'>('storage'); //  Home Page Tab State
  const [allItems, setAllItems] = useState<FileStat[]>([]);
  const [rootStorages, setRootStorages] = useState<FileStat[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  
  // Advanced Features
  const [fileNameInput, setFileNameInput] = useState('');
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [clipboard, setClipboard] = useState<{ path: string, name: string, isCut: boolean } | null>(null);

  /** Navigation stack — reliable back for content:// SAF paths */
  const [navStack, setNavStack] = useState<string[]>(['ROOT']);
  const [showHidden, setShowHidden] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('type');
  const [searchQuery, setSearchQuery] = useState('');
  const [markMode, setMarkMode] = useState(false);
  const [compressOpen, setCompressOpen] = useState(false);
  const [compressSources, setCompressSources] = useState<CompressSource[]>([]);


  // ── 1. Init & Reset ──
  useEffect(() => {
    if (isOpen && options) {
      const start = options.defaultPath || 'ROOT';
      setCurrentPath(start);
      setNavStack(start === 'ROOT' ? ['ROOT'] : ['ROOT', start]);
      setFileNameInput(options.defaultName || '');
      setSelectedPaths(new Set());
      setActiveFilterIndex(0);
      setInlineEdit(null);
      setRootView('storage');
      setSearchQuery('');
      setMarkMode(false);
    }
  }, [isOpen, options]);


  const BUILTIN_ROOT_NAMES = new Set(['Internal Storage', 'MS Projects', 'MS System (Data)']);

  const isBuiltinRoot = (path: string, name?: string) => {
    if (name && BUILTIN_ROOT_NAMES.has(name)) return true;
    if (path === '/storage/emulated/0') return true;
    const norm = path.replace(/\/$/, '');
    if (/\/com\.editor\.mscode\/files$/.test(norm)) return true;
    if (/\/com\.editor\.mscode\/files\/projects$/.test(norm)) return true;
    return false;
  };

  /** Map content:// tree URIs to real paths when document id encodes one (e.g. Termux). */
  const resolveContentUri = (pathOrUri: string): string => {
    if (!pathOrUri.startsWith('content://')) return pathOrUri;
    try {
      const m = pathOrUri.match(/\/tree\/([^?#]+)/);
      if (!m) return pathOrUri;
      let docId = decodeURIComponent(m[1]);
      let rawPath: string | null = null;
      if (docId.startsWith('primary:')) {
        const rel = docId.slice('primary:'.length);
        return rel ? `/storage/emulated/0/${rel}` : '/storage/emulated/0';
      }
      if (docId.startsWith('raw:')) {
        rawPath = docId.slice(4);
      } else if (docId.startsWith('/')) {
        // Termux's own SAF provider hands back bare-path doc IDs like
        // '/data/data/com.termux/files/home' — no 'raw:' prefix at all.
        rawPath = docId;
      }
      if (rawPath) {
        // Foreign app-private storage (e.g. Termux's /data/data/com.termux/...)
        // is only reachable through SAF/DocumentsContract, never through the
        // regular Filesystem API — even with All Files Access granted. If we
        // strip this down to a plain path, readDir() stops routing through
        // listSafChildren() and Filesystem.readdir() fails as if the folder
        // doesn't exist. Keep the content:// URI in that case.
        const isForeignAppData =
          (rawPath.startsWith('/data/data/') || rawPath.startsWith('/data/user/')) &&
          !rawPath.includes('/com.editor.mscode/');
        return isForeignAppData ? pathOrUri : rawPath;
      }
    } catch { /* ignore */ }
    return pathOrUri;
  };

  // ── 2. Load Roots (internal + SAF document trees) ──
  const loadRoots = async () => {
    const roots: FileStat[] = [
      { name: 'Internal Storage', path: '/storage/emulated/0', isDirectory: true },
    ];
    try {
      const uriRes = await Filesystem.getUri({ directory: Directory.Data, path: '' });
      const dataPath = uriRes.uri.replace('file://', '');
      const projectsPath = dataPath + '/projects';
      try {
        await Filesystem.stat({ path: projectsPath });
      } catch {
        await Filesystem.mkdir({ path: projectsPath, recursive: true });
      }
      roots.push({ name: 'MS Projects', path: projectsPath, isDirectory: true });
      roots.push({ name: 'MS System (Data)', path: dataPath, isDirectory: true });
    } catch {
      roots.push({
        name: 'MS Projects',
        path: '/data/data/com.editor.mscode/files/projects',
        isDirectory: true,
      });
    }

    // User-added SAF trees (persistable). Prefer real path when Android resolves one.
    try {
      const trees =
        typeof (fs as any).listSafTrees === 'function'
          ? await (fs as any).listSafTrees()
          : [];
      for (const t of trees || []) {
        const useSaf = !!(t as any).useSaf || !t.path;
        let path = useSaf
          ? (t.uri || '')
          : (t.path || (t.uri ? resolveContentUri(t.uri) : ''));
        if (!path) continue;
        // Drop foreign absolute paths that cannot be read by Capacitor
        if (!path.startsWith('content://') && path.includes('/data/data/') && !path.includes('com.editor.mscode')) {
          path = t.uri || path;
        }
        if (!path) continue;
        if (roots.some((r) => r.path === path)) continue;
        roots.push({
          name: t.name || 'External Storage',
          path,
          isDirectory: true,
        });
      }
    } catch (e) {
      console.warn('[FilePicker] SAF list failed', e);
    }

    // Local bookmarks from previous Add Storage (path-only)
    try {
      const raw = localStorage.getItem('mscode.extraStorages');
      if (raw) {
        const extra = JSON.parse(raw) as Array<{ name: string; path: string }>;
        for (const e of extra) {
          if (!e?.path) continue;
          if (roots.some((r) => r.path === e.path)) continue;
          roots.push({ name: e.name || 'Storage', path: e.path, isDirectory: true });
        }
      }
    } catch {}

    setRootStorages(roots);
  };

  useEffect(() => {
    if (isOpen) loadRoots();
  }, [isOpen]);

  /** Open Android Document Tree picker and register the volume as a root. */
  const handleAddStorage = async () => {
    try {
      const res = await (fs as any).openFolder?.();
      if (!res?.success) return;
      // Foreign app data (Termux etc.) must keep content:// — plain path is sandboxed
      const useSaf = !!(res as any).useSaf || !res.path;
      const path = useSaf
        ? (res.uri as string)
        : (res.path || (res.uri ? resolveContentUri(res.uri) : ''));
      if (!path) {
        console.warn('[FilePicker] SAF returned nothing usable', res);
        return;
      }
      try {
        const raw = localStorage.getItem('mscode.extraStorages');
        const list: Array<{ name: string; path: string; uri?: string }> = raw ? JSON.parse(raw) : [];
        if (!list.some((x) => x.path === path || (res.uri && x.uri === res.uri))) {
          list.push({ name: res.name || 'Storage', path, uri: res.uri });
          localStorage.setItem('mscode.extraStorages', JSON.stringify(list));
        }
      } catch {}
      await loadRoots();
      navigateTo(path, 'reset');
    } catch (e) {
      console.error('[FilePicker] Add Storage failed', e);
    }
  };

  // ── 3. Read Files & Manage Root View ──
  const refreshFiles = () => {
    if (currentPath !== 'ROOT') {
      // content:// handled by AndroidFileSystem.listSafChildren
      fs.readDir(currentPath).then(res => setAllItems(res || [])).catch((err) => {
        console.warn('[FilePicker] readDir', currentPath, err);
        setAllItems([]);
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (currentPath === 'ROOT') {
      if (rootView === 'storage') {
        setAllItems(rootStorages);
      } else {
        const recentItems = recentWorkspaces.map(w => ({ name: w.name, path: w.path, isDirectory: true } as FileStat));
        setAllItems(recentItems);
      }
      setSelectedPaths(new Set());
    } else {
      refreshFiles();
    }
  }, [currentPath, isOpen, rootStorages, rootView, recentWorkspaces]);

  // ── 4. Filtering Logic ──
  const visibleItems = (() => {
    let list = allItems.filter((item) => {
      if (!options) return false;
      if (!showHidden && item.name.startsWith('.')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!item.name.toLowerCase().includes(q)) return false;
      }
      if (item.isDirectory) return true;
      if (options.filters && options.filters.length > 0) {
        const filter = options.filters[activeFilterIndex];
        if (filter && filter.extensions.length > 0) {
          const ext = item.name.split('.').pop() || '';
          return filter.extensions.includes(ext);
        }
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortMode === 'type') {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      if (sortMode === 'name-desc') {
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    return list;
  })();

  // ── 5. Navigation Handlers ──
  const navigateTo = (path: string, mode: 'push' | 'replace' | 'reset' = 'push') => {
    if (path === 'ROOT') {
      setNavStack(['ROOT']);
      setCurrentPath('ROOT');
      setSearchQuery('');
      setMarkMode(false);
      setSelectedPaths(new Set());
      return;
    }
    setSearchQuery('');
    if (mode === 'reset') {
      setNavStack(['ROOT', path]);
    } else if (mode === 'replace') {
      setNavStack((s) => {
        const next = s.length ? [...s.slice(0, -1), path] : ['ROOT', path];
        return next;
      });
    } else {
      setNavStack((s) => {
        if (s[s.length - 1] === path) return s;
        return [...s, path];
      });
    }
    setCurrentPath(path);
  };

  const handleGoUp = () => {
    if (currentPath === 'ROOT') return;

    // Prefer explicit navigation stack (works for content:// SAF)
    if (navStack.length > 1) {
      const next = navStack.slice(0, -1);
      setNavStack(next);
      setCurrentPath(next[next.length - 1]);
      setSearchQuery('');
      setSelectedPaths(new Set());
      return;
    }

    if (rootStorages.some((r) => r.path === currentPath)) {
      navigateTo('ROOT');
      return;
    }
    if (recentWorkspaces.some((r) => r.path === currentPath)) {
      navigateTo('ROOT');
      return;
    }

    if (!currentPath.startsWith('content://')) {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      navigateTo(parts.length ? '/' + parts.join('/') : 'ROOT', 'reset');
      return;
    }

    // content:// without stack: parent via document id
    try {
      const doc = currentPath.match(/^(content:\/\/[^/]+\/tree\/[^/]+)\/document\/(.+)$/);
      if (doc) {
        const treeBase = doc[1];
        const decoded = decodeURIComponent(doc[2]);
        const segs = decoded.split('/').filter(Boolean);
        if (segs.length <= 1) {
          navigateTo(treeBase, 'reset');
          return;
        }
        segs.pop();
        const parentDecoded = '/' + segs.join('/');
        const treeIdMatch = treeBase.match(/\/tree\/([^/?#]+)/);
        const treeRoot = treeIdMatch ? decodeURIComponent(treeIdMatch[1]) : '';
        if (parentDecoded === treeRoot || parentDecoded.replace(/\/$/, '') === treeRoot.replace(/\/$/, '')) {
          navigateTo(treeBase, 'reset');
        } else {
          navigateTo(treeBase + '/document/' + encodeURIComponent(parentDecoded), 'reset');
        }
        return;
      }
      navigateTo('ROOT');
    } catch {
      navigateTo('ROOT');
    }
  };

  const handleItemClick = (item: FileStat) => {
    if (options!.mode === 'multiFile') {
      const newSet = new Set(selectedPaths);
      if (newSet.has(item.path)) newSet.delete(item.path);
      else newSet.add(item.path);
      setSelectedPaths(newSet);
    } else {
      setSelectedPaths(new Set([item.path]));
      if (options!.mode === 'saveAs' && !item.isDirectory) {
        setFileNameInput(item.name);
      }
    }

    if (openMode === 'singleClick') {
      if (item.isDirectory) {
        navigateTo(item.path.startsWith('content://') ? item.path : resolveContentUri(item.path));
        setSelectedPaths(new Set());
      } else if (options!.mode === 'file') {
        closePicker(item.path); 
      }
    }
  };

  const handleItemDoubleClick = (item: FileStat) => {
    if (openMode === 'doubleClick') {
      if (item.isDirectory) {
        navigateTo(item.path.startsWith('content://') ? item.path : resolveContentUri(item.path));
        setSelectedPaths(new Set());
      } else if (options!.mode === 'file') {
        closePicker(item.path);
      }
    }
  };

  // ── 6. Inline Edit Handlers ──
  const handleInlineSubmit = async (newName: string) => {
    if (!inlineEdit || !newName.trim()) return setInlineEdit(null);
    try {
      if (inlineEdit.isNew) {
        const target = `${inlineEdit.targetPath}/${newName.trim()}`;
        if (inlineEdit.isFolder) await fs.mkdir(target);
        else await fs.writeFile(target, '');
      } else {
        const parentPath = inlineEdit.targetPath.substring(0, inlineEdit.targetPath.lastIndexOf('/'));
        const newPath = `${parentPath}/${newName.trim()}`;
        await fs.rename(inlineEdit.targetPath, newPath);
      }
    } catch (e) {
      console.error("FS Error", e);
    }
    setInlineEdit(null);
    refreshFiles();
  };

  // ── 6b. Android Open With (system chooser) ──
  const openWithExternal = async (item: FileStat) => {
    try {
      const { registerPlugin } = await import('@capacitor/core');
      const SafStorage = registerPlugin<{
        openWith: (opts: { path?: string; uri?: string }) => Promise<void>;
      }>('SafStorage');
      if (item.path.startsWith('content://')) {
        await SafStorage.openWith({ uri: item.path });
      } else {
        await SafStorage.openWith({ path: item.path });
      }
    } catch (e) {
      console.warn('[FilePicker] openWith failed', e);
      window.alert('Open With is not available on this device.');
    }
  };

  // ── 7. Context Menu ──
  const handleContextMenu = (
    e: React.MouseEvent | { clientX: number; clientY: number; preventDefault: () => void },
    item?: FileStat,
  ) => {
    e.preventDefault();

    if (currentPath === 'ROOT') {
      if (!item || isBuiltinRoot(item.path, item.name)) return;
      openMenu('filepicker/storage-root', e.clientX, e.clientY, [
        {
          id: 'rename-storage',
          label: 'Rename',
          icon: 'edit',
          onClick: () => {
            const next = window.prompt('Rename storage', item.name);
            if (!next || !next.trim()) return;
            try {
              const raw = localStorage.getItem('mscode.extraStorages');
              const list: Array<{ name: string; path: string }> = raw ? JSON.parse(raw) : [];
              const i = list.findIndex((x) => x.path === item.path);
              if (i >= 0) {
                list[i].name = next.trim();
                localStorage.setItem('mscode.extraStorages', JSON.stringify(list));
              }
            } catch {}
            setRootStorages((prev) =>
              prev.map((r) => (r.path === item.path ? { ...r, name: next.trim() } : r)),
            );
          },
        },
        {
          id: 'remove-storage',
          label: 'Remove',
          icon: 'trash',
          onClick: () => {
            try {
              const raw = localStorage.getItem('mscode.extraStorages');
              const list: Array<{ name: string; path: string }> = raw ? JSON.parse(raw) : [];
              localStorage.setItem(
                'mscode.extraStorages',
                JSON.stringify(list.filter((x) => x.path !== item.path)),
              );
            } catch {}
            setRootStorages((prev) => prev.filter((r) => r.path !== item.path));
          },
        },
      ]);
      return;
    }

    if (!item) {
      openMenu('filepicker/bg', e.clientX, e.clientY, [
        { id: 'nf', label: 'New File', icon: 'new-file', onClick: () => setInlineEdit({ isNew: true, isFolder: false, initialName: 'NewFile.txt', targetPath: currentPath }) },
        { id: 'nd', label: 'New Folder', icon: 'new-folder', onClick: () => setInlineEdit({ isNew: true, isFolder: true, initialName: 'NewFolder', targetPath: currentPath }) },
        { type: 'separator', id: 's1' },
        { id: 'p', label: 'Paste', icon: 'folder', disabled: !clipboard, onClick: () => doPaste(currentPath) }
      ]);
    } else {
      const itemsMenu: any[] = [];
      if (item.isDirectory) {
        itemsMenu.push({ id: 'o', label: 'Open Folder', icon: 'folder', onClick: () => navigateTo(item.path.startsWith('content://') ? item.path : resolveContentUri(item.path)) });
        itemsMenu.push({ id: 'pi', label: 'Paste inside', icon: 'folder', disabled: !clipboard, onClick: () => doPaste(item.path) });
        itemsMenu.push({ type: 'separator', id: 's1' });

        const { addBookmark, removeBookmark } = useRecentStore.getState();
        const isBookmarked = bookmarks.some(b => b.path === item.path);

        if (isBookmarked) {
          itemsMenu.push({ id: 'remove-bm', label: 'Remove Bookmark', icon: 'close', onClick: () => removeBookmark(item.path) });
        } else {
          itemsMenu.push({ id: 'add-bm', label: 'Add to Bookmarks', icon: 'star', onClick: () => addBookmark(item.name, item.path) });
        }
      }
      const canCompress = markMode && selectedPaths.size > 0;

      itemsMenu.push(
        { id: 'mark-this', label: markMode ? 'Unmark this' : 'Mark this', icon: 'check', onClick: () => {
          setMarkMode(true);
          setSelectedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(item.path)) next.delete(item.path);
            else next.add(item.path);
            return next;
          });
        }},
        { id: 'mark-all', label: 'Mark all', icon: 'checklist', onClick: () => {
          setMarkMode(true);
          setSelectedPaths(new Set(visibleItems.map((i) => i.path)));
        }},
        {
          id: 'compress',
          label: 'Compress…',
          icon: 'file-zip',
          disabled: !canCompress,
          onClick: () => {
            if (!canCompress) return;
            const srcs: CompressSource[] = visibleItems
              .filter((i) => selectedPaths.has(i.path))
              .map((i) => ({ path: i.path, name: i.name, isDirectory: i.isDirectory }));
            setCompressSources(srcs);
            setCompressOpen(true);
          },
        },
        { type: 'separator', id: 's-mark' },
        { id: 'c', label: 'Copy', icon: 'files', onClick: () => setClipboard({ path: item.path, name: item.name, isCut: false }) },
        { id: 'x', label: 'Cut', icon: 'close', onClick: () => setClipboard({ path: item.path, name: item.name, isCut: true }) },
        { type: 'separator', id: 's2' },
      );
      // Open With — files only (not folders)
      if (!item.isDirectory) {
        itemsMenu.push({
          id: 'open-with',
          label: 'Open With…',
          icon: 'link-external',
          onClick: () => void openWithExternal(item),
        });
      }
      itemsMenu.push(
        { id: 'r', label: 'Rename', icon: 'edit', onClick: () => setInlineEdit({ isNew: false, isFolder: item.isDirectory, initialName: item.name, targetPath: item.path }) },
        { id: 'd', label: 'Delete', icon: 'trash', onClick: async () => { if(confirm(`Delete ${item.name}?`)) { await fs.delete(item.path); refreshFiles(); } } }
      );
      openMenu('filepicker/item', e.clientX, e.clientY, itemsMenu);
    }
  };

  const doPaste = async (targetFolder: string) => {
    if (!clipboard) return;
    const newPath = `${targetFolder}/${clipboard.name}`;
    try {
      if (clipboard.isCut) { 
        await fs.rename(clipboard.path, newPath); 
        setClipboard(null); 
      } else { 
        await (fs as any).copy(clipboard.path, newPath); 
      }
      refreshFiles();
    } catch (e) { alert("Paste failed!"); }
  };

  // ── 8. MAGIC: Auto Swap Extension ──
  useEffect(() => {
    if (options?.mode === 'saveAs' && fileNameInput) {
      const filter = options.filters?.[activeFilterIndex];
      if (filter && filter.extensions.length > 0) {
        const newExt = filter.extensions[0];
        const parts = fileNameInput.split('.');
        if (parts.length > 1) {
          parts.pop(); 
          setFileNameInput(`${parts.join('.')}.${newExt}`);
        } else {
          setFileNameInput(`${fileNameInput}.${newExt}`); 
        }
      }
    }
  }, [activeFilterIndex]);

  // ── 9. Footer Confirmation Logic ──
  const handleConfirm = () => {
    if (options!.mode === 'saveAs') {
      let finalName = fileNameInput.trim();
      const activeFilter = options!.filters?.[activeFilterIndex];
      if (activeFilter && activeFilter.extensions.length > 0) {
        const hasExt = activeFilter.extensions.some(ext => finalName.endsWith(`.${ext}`));
        if (!hasExt) finalName += `.${activeFilter.extensions[0]}`;
      }
      closePicker(`${currentPath}/${finalName}`);
    } 
    else if (options!.mode === 'multiFile') {
      closePicker(Array.from(selectedPaths));
    } 
    else if (options!.mode === 'folder') {
      const sel = Array.from(selectedPaths)[0];
      closePicker(sel ? sel : currentPath);
    } 
    else {
      closePicker(Array.from(selectedPaths)[0]);
    }
  };

  // ── 10. Hardware Back Button Handling ──
  useEffect(() => {
    if (isOpen) {
      useBackButtonStore.getState().push('ms-file-picker', () => {
        if (inlineEdit) {
          setInlineEdit(null);
          return true;
        }
        if (markMode) {
          setMarkMode(false);
          setSelectedPaths(new Set());
          return true;
        }
        if (currentPath === 'ROOT') {
          closePicker(null);
          return true;
        }
        handleGoUp();
        return true;
      });
    }
    return () => {
      useBackButtonStore.getState().remove('ms-file-picker');
    };
  }, [isOpen, currentPath, rootStorages, inlineEdit, markMode]);


  if (!isOpen || !options) return null;

  let isConfirmDisabled = false;
  if (options.mode === 'saveAs') isConfirmDisabled = !fileNameInput.trim();
  else if (options.mode === 'multiFile') isConfirmDisabled = selectedPaths.size === 0;
  else if (options.mode === 'file') isConfirmDisabled = selectedPaths.size === 0;
  else if (options.mode === 'folder' && options.requiredFiles?.length) {
    const hasRequired = allItems.some(i => !i.isDirectory && options.requiredFiles!.includes(i.name));
    isConfirmDisabled = !hasRequired;
  }

  return (
    <>
      <Modal 
      isOpen={isOpen}
      type="page" 
      title={options.title || (options.mode === 'saveAs' ? 'Save As...' : 'Select File')} 
      iconName={options.icon || 'folder'}
      onClose={() => closePicker(null)}
    >
      <div className="ms-filepicker-layout">
        
        {/* TOP TOOLBAR */}
        <FilePickerToolbar
          currentPath={currentPath}
          allowCreate={options.mode !== 'file'}
          onGoUp={handleGoUp}
          onCreateFile={() => setInlineEdit({ isNew: true, isFolder: false, initialName: 'NewFile.txt', targetPath: currentPath })}
          onCreateFolder={() => setInlineEdit({ isNew: true, isFolder: true, initialName: 'NewFolder', targetPath: currentPath })}
          onRefresh={refreshFiles}
          onAddStorage={handleAddStorage}
          pathSegments={3}
          showHidden={showHidden}
          onToggleHidden={() => setShowHidden((v) => !v)}
          sortMode={sortMode}
          onSortMode={setSortMode}
          searchQuery={searchQuery}
          onSearchQuery={setSearchQuery}
          selectedCount={selectedPaths.size}
          totalCount={visibleItems.length}
          onSelectAll={() => { setMarkMode(true); setSelectedPaths(new Set(visibleItems.map((i) => i.path))); }}
          onClearSelection={() => { setSelectedPaths(new Set()); setMarkMode(false); }}
          maxOverflow={4}
          markMode={markMode}
          onCancelMark={() => {
            setMarkMode(false);
            setSelectedPaths(new Set());
          }}
          onCompress={() => {
            const srcs: CompressSource[] = visibleItems
              .filter((i) => selectedPaths.has(i.path))
              .map((i) => ({ path: i.path, name: i.name, isDirectory: i.isDirectory }));
            if (!srcs.length) return;
            setCompressSources(srcs);
            setCompressOpen(true);
          }}
        />

        {/*  BOOKMARKS BAR */}
        {bookmarks.length > 0 && (
          <div style={{ 
            display: 'flex', alignItems: 'center', overflowX: 'auto', gap: '6px', 
            padding: '0', backgroundColor: 'var(--ms-bg-base)', borderBottom: '1px solid var(--ms-border-light)'
          }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              <style>{`.ms-filepicker-bookmarks::-webkit-scrollbar { display: none; }`}</style>
              <div className="ms-filepicker-bookmarks" style={{ display: 'flex', gap: '6px' }}>
                {bookmarks.map((bm, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigateTo(bm.path, 'reset')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '0px 8px',
                      backgroundColor: currentPath === bm.path ? 'var(--ms-bg-active)' : 'var(--ms-bg-main)',
                      border: '1px solid var(--ms-border-light)', borderRadius: '1px',
                      cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap', userSelect: 'none',
                      color: currentPath === bm.path ? 'var(--ms-text-bright)' : 'var(--ms-text-main)',
                      transition: 'background 0.2s'
                    }}
                    title={bm.path}
                  >
                    <Icon name="star" size={12} color="#dcb67a" />
                    {bm.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HOME ROOT TABS (Storage | Recent) */}
        {currentPath === 'ROOT' && (
          <div style={{ 
            display: 'flex', background: 'var(--ms-bg-side)', borderBottom: '1px solid var(--ms-border-light)', padding: '0 8px' 
          }}>
            <div 
              onClick={() => setRootView('storage')}
              style={{
                padding: '2px 12px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', cursor: 'pointer',
                color: rootView === 'storage' ? 'var(--ms-text-bright)' : 'var(--ms-text-faded)',
                borderBottom: rootView === 'storage' ? '2px solid var(--ms-accent-color)' : '2px solid transparent'
              }}
            >
              Storage Locations
            </div>
            <div 
              onClick={() => setRootView('recent')}
              style={{
                padding: '2px 12px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', cursor: 'pointer',
                color: rootView === 'recent' ? 'var(--ms-text-bright)' : 'var(--ms-text-faded)',
                borderBottom: rootView === 'recent' ? '2px solid var(--ms-accent-color)' : '2px solid transparent'
              }}
            >
              Recent Workspaces
            </div>
          </div>
        )}

        {/* MAIN LIST */}
        <FilePickerList 
          items={visibleItems}
          currentPath={currentPath}
          mode={options.mode}
          selectedPaths={selectedPaths}
          inlineEdit={inlineEdit}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleItemDoubleClick}
          onContextMenu={handleContextMenu}
          markMode={markMode}
          onToggleSelect={(item) => {
            setMarkMode(true);
            setSelectedPaths((prev) => {
              const next = new Set(prev);
              if (next.has(item.path)) next.delete(item.path);
              else next.add(item.path);
              return next;
            });
          }}
          onInlineEditSubmit={handleInlineSubmit}
          onInlineEditCancel={() => setInlineEdit(null)}
        />

        {/* FOOTER */}
        <FilePickerFooter 
          options={options}
          fileName={fileNameInput}
          setFileName={setFileNameInput}
          activeFilterIndex={activeFilterIndex}
          setActiveFilterIndex={setActiveFilterIndex}
          onCancel={() => closePicker(null)}
          onConfirm={handleConfirm}
          isConfirmDisabled={isConfirmDisabled}
        />
      </div>
    </Modal>

      <CompressModal
        isOpen={compressOpen}
        sources={compressSources}
        outputDir={currentPath === 'ROOT' ? '/storage/emulated/0' : currentPath}
        onClose={() => setCompressOpen(false)}
        onConfirm={async (plan) => {
          console.log('[Compress]', plan.summary, plan.shellCommand);
          // Host can run plan.shellCommand via terminal later
          try {
            window.alert(`${plan.summary}\n\nCommand prepared. Run from terminal when ready.`);
          } catch {}
        }}
      />
    </>
  );
};
