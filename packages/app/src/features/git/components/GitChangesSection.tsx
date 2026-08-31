// src/features/explorer/hooks/useExplorerActions.ts

import { useTabStore } from '@/store/tabStore';
import { useMenuStore } from '@/store/menuStore';
import { useExplorerStore } from '@/features/explorer/store/exploreStore';
import { fs } from '@/core/fileSystem';
import type { FileStat } from '@/core/fileSystem/IFileSystem';
import { useClipboardStore } from '@/store/clipboardStore';
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { contextKeyService } from '@/core/keybindings/contextKeyService';
import { useNotificationStore } from '@/store/notificationStore';
import { customPreviewerRegistry } from '@/core/extensionAPI/registry/previewerRegistry';
import { useFilePickerStore } from '@/store/filePickerStore';

export function useExplorerActions() {
  const { addTab } = useTabStore();
  const { openMenu } = useMenuStore();
  
  const {
    inlineAction, setInlineAction,
    triggerRefresh,
    workspacePath, 
    expandedFolders, toggleFolder
  } = useExplorerStore();

  const { clipboardFile, setClipboardFile, clearClipboard } = useClipboardStore();

  // ─── 1. FILE/WORKSPACE HANDLERS ───

  const handleFileClick = (file: FileStat) => {
    if (!file.isDirectory) {
      addTab({ id: file.path, type: 'code', title: file.name, filePath: file.path });
    }
  };

  // Force open as plain text (Fallback Editor)
  const handleOpenAsText = (file: FileStat) => {
    if (!file.isDirectory) {
      // We pass a special flag or change the type to force the fallback rendering
      addTab({ id: `text-${file.path}`, type: 'fallback_text', title: `(Text) ${file.name}`, filePath: file.path } as any);
    }
  };

  const handleDelete = (path: string) => {
    const fileName = path.split('/').pop() || path;
    const notifId = `delete_${Date.now()}`; 

    useNotificationStore.getState().addNotification({
      id: notifId,
      type: 'confirmation',
      title: 'Delete Permanently?',
      source: 'Explorer',
      message: `Are you sure you want to permanently delete '${fileName}'?`,
      actions: [
        {
          label: 'Delete',
          variant: 'type1',
          customStyle: { backgroundColor: '#d32f2f', color: '#ffffff', borderColor: '#d32f2f' },
          onClick: async () => {
            useNotificationStore.getState().removeNotification(notifId);
            try {
              await fs.delete(path);
              const { tabs, closeTab } = useTabStore.getState();
              tabs.forEach(t => {
                 if (t.id === path || t.id.startsWith(path + '/')) {
                    closeTab(t.id);
                 }
              });
              triggerRefresh();
            } catch (error) {
              useNotificationStore.getState().addNotification({
                type: 'error',
                title: 'Delete Failed',
                source: 'Explorer',
                message: `Failed to delete '${fileName}'.`
              });
            }
          }
        },
        {
          label: 'Cancel',
          variant: 'type2',
          onClick: () => useNotificationStore.getState().removeNotification(notifId)
        }
      ]
    });
  };

  const handleInlineSubmit = async (value: string) => {
    if (!value.trim() || !inlineAction) return setInlineAction(null);
    const targetPath = inlineAction.parentPath === '/' ? `/${value}` : `${inlineAction.parentPath}/${value}`;

    try {
      if (inlineAction.type === 'newFile')  await fs.writeFile(targetPath, '');
      else if (inlineAction.type === 'newFolder') await fs.mkdir(targetPath);
      else if (inlineAction.type === 'rename' && inlineAction.targetPath) {
        await fs.rename(inlineAction.targetPath, targetPath);
        useTabStore.getState().updateTabPaths(inlineAction.targetPath, targetPath);
      }
    } catch (err) {
      console.error(err);
    }
    setInlineAction(null);
    triggerRefresh();
  };
  
  const handleCopyPath = async (path: string) => {
    try { await navigator.clipboard.writeText(path); } catch (e) {}
  };

  const handleCopyRelativePath = async (path: string) => {
    if (!workspacePath) return;
    const relPath = path.startsWith(workspacePath) ? path.substring(workspacePath.length + 1) : path;
    try { await navigator.clipboard.writeText(relPath); } catch (e) {}
  };

  const handlePaste = async (targetParentPath: string) => {
    if (!clipboardFile) return;
    try {
      const fileName = clipboardFile.path.split('/').pop();
      const destPath = targetParentPath === '/' ? `/${fileName}` : `${targetParentPath}/${fileName}`;

      if (clipboardFile.action === 'copy') {
        if ((fs as any).copy) await (fs as any).copy(clipboardFile.path, destPath);
      } else if (clipboardFile.action === 'cut') {
        await fs.rename(clipboardFile.path, destPath);
        clearClipboard(); 
      }
      triggerRefresh();
    } catch (e) { console.error('Paste failed:', e); }
  };

  /** Unique dest path if name already exists: name → name (1) → name (2) … */
  const uniqueDestPath = async (parentPath: string, name: string): Promise<string> => {
    const join = (n: string) =>
      parentPath === '/' ? `/${n}` : `${parentPath.replace(/\/$/, '')}/${n}`;

    let existing = new Set<string>();
    try {
      const entries = await fs.readDir(parentPath);
      existing = new Set(entries.map(e => e.name));
    } catch { /* parent may not list; still try original name */ }

    if (!existing.has(name)) return join(name);

    const dot = name.lastIndexOf('.');
    const hasExt = dot > 0 && !name.startsWith('.');
    const base = hasExt ? name.slice(0, dot) : name;
    const ext = hasExt ? name.slice(dot) : '';

    for (let i = 1; i < 500; i++) {
      const n = `${base} (${i})${ext}`;
      if (!existing.has(n)) return join(n);
    }
    return join(`${base}-${Date.now()}${ext}`);
  };

  /**
   * Insert (copy) one or more external files/folders into targetParentPath.
   * Uses multi-select File Picker; confirm is disabled until something is marked.
   * Large batches show a cancellable progress toast with shine animation.
   */
  const handleInsert = async (targetParentPath: string) => {
    const picked = await useFilePickerStore.getState().showMultiPicker({
      title: 'Insert Files & Folders',
      icon: 'add',
      buttonText: 'Insert',
      allowCreate: false,
    });
    if (!picked || picked.length === 0) return;

    const notif = useNotificationStore.getState();
    const notifId = `insert_${Date.now()}`;
    let cancelled = false;

    notif.addNotification({
      id: notifId,
      type: 'loading',
      title: 'Inserting…',
      message: `0 / ${picked.length}`,
      source: 'Explorer',
      progress: 0,
      actions: [
        {
          label: 'Cancel',
          variant: 'type2',
          onClick: () => {
            cancelled = true;
            notif.updateNotification(notifId, {
              type: 'warning',
              title: 'Insert cancelled',
              message: 'Stopping after current item…',
              progress: undefined,
              actions: [],
            });
          },
        },
      ],
    });
    // Expand so Cancel is visible (addNotification omits `collapsed` from its input type)
    notif.updateNotification(notifId, { collapsed: false });

    let done = 0;
    let failed = 0;

    for (const src of picked) {
      if (cancelled) break;
      const name = src.split('/').filter(Boolean).pop() || 'item';
      try {
        const destPath = await uniqueDestPath(targetParentPath, name);
        if (typeof (fs as any).copy === 'function') {
          await (fs as any).copy(src, destPath);
        } else {
          // File-only fallback when copy() is unavailable
          const content = await fs.readFile(src);
          await fs.writeFile(destPath, content);
        }
      } catch (err) {
        console.error('Insert item failed:', src, err);
        failed++;
      }
      done++;
      const pct = Math.round((done / picked.length) * 100);
      if (!cancelled) {
        notif.updateNotification(notifId, {
          message: `${done} / ${picked.length}${failed ? ` (${failed} failed)` : ''}`,
          progress: pct,
        });
      }
    }

    triggerRefresh();

    if (cancelled) {
      notif.updateNotification(notifId, {
        type: 'warning',
        title: 'Insert cancelled',
        message: `${done} of ${picked.length} completed${failed ? `, ${failed} failed` : ''}.`,
        progress: undefined,
        actions: [],
      });
      // Drop toast after a moment; keep in center history
      setTimeout(() => notif.dismissToast(notifId), 2500);
      return;
    }

    notif.updateNotification(notifId, {
      type: failed === picked.length ? 'error' : failed > 0 ? 'warning' : 'success',
      title: failed === picked.length ? 'Insert failed' : failed > 0 ? 'Insert finished with errors' : 'Insert complete',
      message:
        failed === 0
          ? `${done} item${done === 1 ? '' : 's'} inserted.`
          : `${done - failed} inserted, ${failed} failed.`,
      progress: undefined,
      actions: [],
    });
    setTimeout(() => notif.dismissToast(notifId), 4000);
  };

  // ─── 3. THE ADVANCED CONTEXT MENU HANDLER ───

  const handleContextMenu = (e: React.MouseEvent, clickedFile?: FileStat, clickedParentPath: string = workspacePath || '/') => {
    e.preventDefault(); e.stopPropagation();
    if (!workspacePath) return;

    const targetParentPath = clickedFile ? (clickedFile.isDirectory ? clickedFile.path : clickedParentPath) : workspacePath;

    const ensureOpen = () => {
      if (targetParentPath !== workspacePath && !expandedFolders.includes(targetParentPath)) {
        toggleFolder(targetParentPath, true);
      }
    };
    
    const isRoot = clickedFile?.path === workspacePath;

    contextKeyService.setContext('explorerResourceIsFolder', clickedFile ? clickedFile.isDirectory : true);
    contextKeyService.setContext('explorerResourcePath', clickedFile?.path || workspacePath);
    contextKeyService.setContext('explorerResourceExt', clickedFile?.name.split('.').pop() || '');
    contextKeyService.setContext('clickedFile&isRoot', clickedFile && !isRoot);

    let hasCustomPreviewer = false;
    let previewerName = 'Preview';
    if (clickedFile && !clickedFile.isDirectory) {
       const previewer = customPreviewerRegistry.getPreviewerForExtension(clickedFile.name);
       if (previewer) {
         hasCustomPreviewer = true;
         previewerName = previewer.name;
       }
    }

    openMenu('sidebar/files/tree', e.clientX, e.clientY, [
      {
        options: hasCustomPreviewer && clickedFile ? [
          { id: 'open-preview', label: `Open in ${previewerName}`, icon: '', onClick: () => handleFileClick(clickedFile) },
          { id: 'open-text', label: 'Open as Text', icon: '', onClick: () => handleOpenAsText(clickedFile) }
        ] : []
      },
      {
        options: [
          {
            id: 'nf',
            label: 'New Folder',
            icon: 'new-folder',
            showOnlyWhenSubOptionAvailable: true,
            children: [
              { id: 'nf-new', label: 'New Folder...', onClick: () => { isRoot ? commands.executeCommand('explorer.newFolder') : setInlineAction({ type: 'newFolder', parentPath: targetParentPath, initialValue: '' }); ensureOpen(); } }
            ]
          },
          {
            id: 'nfile',
            label: 'New File',
            icon: 'new-file',
            showOnlyWhenSubOptionAvailable: true,
            children: [ 
              { id: 'nfile-new', label: 'New File...', onClick: () => { isRoot ? commands.executeCommand('explorer.newFile') : setInlineAction({ type: 'newFile', parentPath: targetParentPath, initialValue: '' }); ensureOpen(); } }
            ]
          },
          {
            id: 'insert',
            label: 'Insert…',
            icon: 'add',
            onClick: () => {
              ensureOpen();
              void handleInsert(targetParentPath);
            },
          },
        ]
      },
      {
        options: clickedFile && !isRoot ? [
          { id: 'cut',  label: 'Cut',  onClick: () => setClipboardFile(clickedFile.path, 'cut') },
          { id: 'copy', label: 'Copy', onClick: () => setClipboardFile(clickedFile.path, 'copy') },
        ] : []
      },
      {
        options: [
          { id: 'paste', label: 'Paste', disabled: !clipboardFile, onClick: () => { handlePaste(targetParentPath); ensureOpen(); } },
          ...(clipboardFile ? [{
            id: 'cancel-clipboard',
            label: clipboardFile.action === 'cut' ? 'Cancel Cut' : 'Cancel Copy',
            icon: 'close',
            onClick: () => clearClipboard()
          }] : [])
        ]
      },
      {
        options: clickedFile && !isRoot ? [
          { id: 'copypath', label: 'Copy Path', onClick: () => handleCopyPath(clickedFile.path) },
          { id: 'copyrel',  label: 'Copy Relative Path', onClick: () => handleCopyRelativePath(clickedFile.path) },
        ] : []
      },
      {
        options: isRoot ? [
          { id: 'of', label: 'Open Folder',  onClick: () => commands.executeCommand('workbench.action.files.openFolder') },
          { id: 'cf', label: 'Close Folder', onClick: () => commands.executeCommand('workbench.action.closeFolder') },
        ] : (clickedFile ? [
          { id: 'ren', label: 'Rename...',           shortcut: 'F2',  onClick: () => setInlineAction({ type: 'rename', targetPath: clickedFile.path, parentPath: clickedParentPath, initialValue: clickedFile.name }) },
          { id: 'del', label: 'Delete Permanently',  shortcut: 'Del', onClick: () => handleDelete(clickedFile.path) },
        ] : [])
      }
    ]);
  };

  return {
    handleFileClick, 
    handleDelete, 
    handleInlineSubmit, 
    handleContextMenu 
  };
}