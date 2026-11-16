// src/features/editor/store/editorViewStateStore.ts
import { create } from 'zustand';
import { saveEditorViewState, loadEditorViewState } from '@/core/services/storageService';

export interface EditorViewState {
  content?: string;      
  isDirty?: boolean;     
  selection?: any;       
  scrollPos?: number;    
  folds?: Array<{from: number, to: number}>; 
  cursorLine?: number;
  cursorColumn?: number;
  languageId?: string;
  encoding?: string;
  tabSize?: number;
  insertSpaces?: boolean;
}

interface EditorViewStateStore {
  currentWorkspacePath: string | null;
  viewStates: Record<string, EditorViewState>; 
  initViewStates: (workspacePath: string | null) => Promise<void>;
  updateViewState: (id: string, state: Partial<EditorViewState>) => void;
  setTabDirty: (id: string, isDirty: boolean) => void;
  /** Move view-state cache from one tab id to another (e.g. untitled → real path). */
  migrateViewState: (oldId: string, newId: string, extra?: Partial<EditorViewState>) => void;
  saveToStorage: () => Promise<void>;
  clearViewStates: () => void;
}

export const useEditorViewStateStore = create<EditorViewStateStore>((set, get) => ({
  currentWorkspacePath: null,
  viewStates: {},

  initViewStates: async (workspacePath) => {
    const data = await loadEditorViewState(workspacePath);
    if (data && data.viewStates) {
      set({ currentWorkspacePath: workspacePath, viewStates: data.viewStates });
    } else {
      set({ currentWorkspacePath: workspacePath, viewStates: {} });
    }
  },

  updateViewState: (id, state) => {
    set((prev) => ({
      viewStates: {
        ...prev.viewStates,
        [id]: { ...(prev.viewStates[id] || {}), ...state }
      }
    }));
  },

  setTabDirty: (id, isDirty) => {
    get().updateViewState(id, { isDirty });
  },

  migrateViewState: (oldId, newId, extra) => {
    if (!oldId || !newId || oldId === newId) return;
    set((prev) => {
      const next = { ...prev.viewStates };
      const prevState = next[oldId] || {};
      next[newId] = { ...prevState, ...extra };
      delete next[oldId];
      return { viewStates: next };
    });
  },

  saveToStorage: async () => {
    const { currentWorkspacePath, viewStates } = get();
    if (!currentWorkspacePath) return; // Don't Save if path doesn't exist
    await saveEditorViewState(currentWorkspacePath, { viewStates });
  },

  clearViewStates: () => set({ viewStates: {} })
}));