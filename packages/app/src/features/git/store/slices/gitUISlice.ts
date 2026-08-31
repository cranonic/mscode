// src/features/git/store/slices/gitUISlice.ts

import type { StateCreator } from 'zustand';
import { useSettingsStore }  from '@/features/settings/store/settingsStore';
import type { GitState, UISlice, GitSortMode } from '../../types';

export const createUISlice: StateCreator<GitState, [], [], UISlice> = (set) => {
  // Read initial setting (to bind sortMode to settings later, we can)
  const initialSort = (useSettingsStore.getState().settings['git.defaultChangesSortOrder'] ?? 'discovery') as GitSortMode;

  return {
    commitMessage:    '',
    showRepositories: true,
    showChanges:      true,
    sortMode:         initialSort,

    stagedSectionExpanded:   true,
    unstagedSectionExpanded: true,
    collapsedChangeFolders:  {},

    setCommitMessage:   (msg)  => set({ commitMessage: msg }),
    toggleRepositories: ()     => set(s => ({ showRepositories: !s.showRepositories })),
    toggleChanges:      ()     => set(s => ({ showChanges: !s.showChanges })),
    setSortMode:        (mode: GitSortMode) => set({ sortMode: mode }),

    setStagedSectionExpanded:   (v) => set({ stagedSectionExpanded: v }),
    setUnstagedSectionExpanded: (v) => set({ unstagedSectionExpanded: v }),
    setChangeFolderExpanded: (path, expanded) => set(s => {
      const next = { ...s.collapsedChangeFolders };
      if (expanded) delete next[path];
      else next[path] = true;
      return { collapsedChangeFolders: next };
    }),
  };
};