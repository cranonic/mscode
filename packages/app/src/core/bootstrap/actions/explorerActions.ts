// src/core/bootstrap/actions/explorerActions.ts
// New file/folder, refresh, open/close folder, remote
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { useTabStore } from '@/store/tabStore';
import { useEditorViewStateStore } from '@/features/editor/store/editorViewStateStore';
import { useExplorerStore } from '@/features/explorer/store/exploreStore';
import { useFilePickerStore } from '@/store/filePickerStore';
import { usePaletteStore } from '@/store/paletteStore';

const resolveCreateTarget = (type: 'newFile' | 'newFolder'): void => {
  const {
    workspacePath,
    selectedItem,
    expandedFolders,
    setInlineAction,
    toggleFolder,
  } = useExplorerStore.getState();

  let targetParentPath = workspacePath || '/';

  if (selectedItem) {
    targetParentPath = selectedItem.isDirectory
      ? selectedItem.path
      : selectedItem.path.substring(0, selectedItem.path.lastIndexOf('/')) ||
        workspacePath ||
        '/';
  }

  setInlineAction({ type, parentPath: targetParentPath, initialValue: '' });

  if (
    targetParentPath !== workspacePath &&
    !expandedFolders.includes(targetParentPath)
  ) {
    toggleFolder(targetParentPath, true);
  }
};

export function registerExplorerActions(): void {
  commands.registerCommand(
    'explorer.newFile',
    () => resolveCreateTarget('newFile'),
    { title: 'Explorer: New File', category: 'File', icon: 'new-file' },
  );

  commands.registerCommand(
    'explorer.newFolder',
    () => resolveCreateTarget('newFolder'),
    { title: 'Explorer: New Folder', category: 'File', icon: 'new-folder' },
  );

  commands.registerCommand(
    'workbench.files.action.refreshFilesExplorer',
    () => useExplorerStore.getState().triggerRefresh(),
    { title: 'Explorer: Refresh', category: 'File', icon: 'refresh' },
  );

  commands.registerCommand(
    'workbench.action.files.openFolder',
    async () => {
      const selectedPath = await useFilePickerStore.getState().showPicker({
        mode: 'folder',
        title: 'Select Workspace Folder',
        icon: 'folder',
        buttonText: 'Open Workspace',
      });
      if (!selectedPath) return;

      const folderName = selectedPath.split('/').pop() || 'PROJECT';
      useExplorerStore.getState().setWorkspace(folderName, selectedPath);
      await useTabStore.getState().initTabs(selectedPath);
      await useEditorViewStateStore.getState().initViewStates(selectedPath);
      useExplorerStore.getState().triggerRefresh();
    },
    {
      title: 'File: Open Folder...',
      category: 'File',
      icon: 'folder',
      shortcut: 'Ctrl+K Ctrl+O',
    },
  );

  commands.registerCommand(
    'workbench.action.closeFolder',
    async () => {
      useExplorerStore.getState().setWorkspace(null, null);
      await useTabStore.getState().initTabs(null);
      await useEditorViewStateStore.getState().initViewStates(null);
      useExplorerStore.getState().triggerRefresh();
    },
    { title: 'File: Close Folder', category: 'File', icon: 'close', shortcut: 'Ctrl+K F' },
  );

  commands.registerCommand(
    'workbench.action.connectRemote',
    () => {
      usePaletteStore.getState().openQuickPick(
        'Connect to Cloud Workspace...',
        [
          {
            id: 'gh',
            label: 'GitHub',
            description: 'Open a remote GitHub repository',
            leftIcon: 'extensions' as const,
            onSelect: () => console.log('GitHub Connected'),
          },
        ],
        sel => sel.onSelect?.(),
      );
    },
    { title: 'Remote: Connect to Cloud...', category: 'Remote' },
  );
}
