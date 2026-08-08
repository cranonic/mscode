// src/core/bootstrap/actions/fileActions.ts
// Save, New File, Rename File
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { useTabStore } from '@/store/tabStore';
import { useEditorViewStateStore } from '@/features/editor/store/editorViewStateStore';
import { useExplorerStore } from '@/features/explorer/store/exploreStore';
import { useFilePickerStore } from '@/store/filePickerStore';
import { fs } from '@/core/fileSystem';

export function registerFileActions(): void {
  commands.registerCommand(
    'workbench.action.files.save',
    async () => {
      const { activeTabId, tabs, updateTab } = useTabStore.getState();
      const { viewStates, setTabDirty } = useEditorViewStateStore.getState();
      if (!activeTabId) return;

      const activeTab = tabs.find(t => t.id === activeTabId);
      if (!activeTab?.filePath) return;

      const isUntitled =
        activeTab.filePath.startsWith('untitled') || activeTab.filePath.trim() === '';

      if (isUntitled) {
        const workspacePath = useExplorerStore.getState().workspacePath;
        const defaultFileName =
          activeTab.title === activeTabId ? 'untitled' : activeTab.title;

        const newPath = await useFilePickerStore.getState().showPicker({
          mode: 'saveAs',
          title: 'Save As...',
          defaultPath: workspacePath || 'ROOT',
          defaultName: defaultFileName,
          fileNamePlaceholder: 'Enter file name...',
          filters: [
            { label: 'All Files', extensions: [] },
            { label: 'Text File', extensions: ['txt'] },
            { label: 'JavaScript', extensions: ['js', 'jsx'] },
            { label: 'TypeScript', extensions: ['ts', 'tsx'] },
            { label: 'JSON', extensions: ['json'] },
            { label: 'HTML', extensions: ['html'] },
            { label: 'CSS', extensions: ['css'] },
          ],
        } as any);

        if (newPath && typeof newPath === 'string') {
          const editor = commands.getActiveEditor();
          let content = '';
          if (editor?.getModel()) content = editor.getModel()!.getValue();
          else content = viewStates[activeTabId]?.content || '';

          await fs.writeFile(newPath, content);

          if (updateTab) {
            const finalFileName = newPath.split('/').pop() || defaultFileName;
            updateTab(activeTabId, { filePath: newPath, title: finalFileName });
          }
          setTabDirty(activeTabId, false);
        }
        return;
      }

      const editor = commands.getActiveEditor();
      if (editor) {
        const saveAction = editor.getAction('editor.action.save');
        if (saveAction) {
          await saveAction.run();
          return;
        }
      }

      const content = viewStates[activeTabId]?.content;
      if (content !== undefined) {
        await fs.writeFile(activeTab.filePath, content);
        setTabDirty(activeTabId, false);
      }
    },
    { title: 'Save File', category: 'File', icon: 'save', shortcut: 'Ctrl+S' },
  );

  commands.registerCommand(
    'workbench.action.renameActiveFile',
    () => {
      window.dispatchEvent(new CustomEvent('ms-open-rename-modal'));
      commands.executeCommand('workbench.files.action.refreshFilesExplorer');
    },
    { title: 'File: Rename Active File', category: 'File', icon: 'edit' },
  );

  commands.registerCommand(
    'workbench.action.files.newUntitledFile',
    () => {
      const { tabs, addTab } = useTabStore.getState();
      let counter = 1;
      while (tabs.some(t => t.id === `untitled-${counter}`)) counter++;
      const tabId = `untitled-${counter}`;
      addTab({
        id: tabId,
        type: 'code',
        title: `Untitled-${counter}`,
        filePath: tabId,
        icon: 'new-file',
      });
    },
    { title: 'New File', category: 'File', icon: 'new-file', shortcut: 'Ctrl+N' },
  );
}
