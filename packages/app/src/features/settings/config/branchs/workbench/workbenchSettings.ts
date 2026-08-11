// src/features/settings/config/branchs/workbench/workbenchSettings.ts
import type { IConfigurationSection } from '@/core/extensionAPI/registry/configurationRegistry';

export const workbenchSection: IConfigurationSection = {
  id: 'workbench',
  title: 'Workbench',
  order: 20,
  properties: {
    
    // --- Appearance ---
    'workbench.theme': {
      title: 'Color Theme',
      subCategory: 'Appearance',
      type: 'select',
      defaultValue: 'mscode-dark',
      markdownDescription: 'Specifies the color theme used in the workbench and editor.',
      options: [
        { label: 'Mango Dark', value: 'mscode-dark' }
      ]
    },
    
    // File Icon Theme Setting
    'workbench.iconTheme': {
      title: 'File Icon Theme',
      subCategory: 'Appearance',
      type: 'select',
      defaultValue: 'mscode-icons',
      markdownDescription: 'Specifies the file icon theme used in the file explorer, activity bar, and editor tabs.\n\n> **Tip:** You can install more icon themes from the Extensions Marketplace.',
      options: [
        { label: 'MS Code Icons (Default)', value: 'mscode-icons' }
        // other themes from themeService
      ]
    },

    // --- Editor Management ---
    'workbench.editor.maxCachedTabs': {
      title: 'Max Cached Tabs',
      subCategory: 'Editor Management',
      type: 'number',
      defaultValue: 10,
      markdownDescription: 'Maximum number of tabs to keep alive in the background (DOM).\n\n> **Note:** Exceeding this limit will unmount the least recently used tabs to save RAM.'
    },
        // --- Performance (MS Code Core Optimization) ---
    'workbench.editor.lightweightScrollbar': {
      title: 'Lightweight Scrollbar',
      subCategory: 'Editor Management > Performance',
      type: 'boolean',
      defaultValue: true,
      markdownDescription: 'Disables heavy DOM listeners for the native scrollbar to save CPU and RAM. \n\n> **Note:** Recommended for mobile devices. Requires reopening the file.'
    },

    'workbench.editor.enableOverviewRuler': {
      title: 'Enable Overview Ruler',
      subCategory: 'Editor Management > Performance',
      type: 'boolean',
      defaultValue: false,
      markdownDescription: 'Shows the right-side overview ruler for decorations, errors, and warnings. \n\n> **Warning:** Consumes extra RAM. Keep disabled for best performance.'
    },

    // --- Sidebar & Layout ---
    'workbench.sidebar.hamburgerAction': {
      title: 'Hamburger Button Action',
      subCategory: 'Sidebar',
      type: 'select',
      defaultValue: 'toggle-remember',
      markdownDescription: 'Controls how the sidebar toggles when clicking the hamburger menu.',
      options: [
        { label: 'Remember state & Hide', value: 'toggle-remember' },
        { label: 'Expanded & Hide', value: 'toggle-expanded' },
        { label: 'Icon only & Hide', value: 'toggle-collapsed' }
      ]
    },

    'workbench.sidebar.clickOutsideAction': {
      title: 'Click Outside Action',
      subCategory: 'Sidebar',
      type: 'select',
      defaultValue: 'hide',
      markdownDescription: 'What happens when you click outside the sidebar in the editor area.',
      options: [
        { label: 'Hide sidebar', value: 'hide' },
        { label: 'Icon only sidebar', value: 'collapse' },
        { label: 'Nothing', value: 'none' }
      ]
    },

    'workbench.sidebar.overlayEnabled': {
      title: 'Sidebar Overlay',
      subCategory: 'Sidebar',
      type: 'boolean',
      defaultValue: false,
      markdownDescription: 'Keep an overlay on the editor when the sidebar is expanded.'
    }, 
    // ── Quick Keyboard (Mobile) ──────────────────────────────────────────────
   'workbench.editor.quickKeyboard.keys': {
    title: 'Quick Keyboard Keys',
    type: 'array',
    subCategory: 'Quick Bar',
    tags: ['keyboard', 'mobile'],
    markdownDescription: 'Customize the action keys shown in the mobile quick keyboard.',
    defaultValue: [
      { id: 'esc', label: 'Esc', action: 'esc' },
      // { id: 'ctrl', label: 'Ctrl', action: 'ctrl' }, 
      // { id: 'alt', label: 'Alt', action: 'alt' },   
      { id: 'tab', label: 'Tab', action: 'tab' },
      { id: 'left', icon: 'chevron-left', action: 'cursorLeft' },
      { id: 'right', icon: 'chevron-right', action: 'cursorRight' },
      { id: 'up', icon: 'chevron-up', action: 'cursorUp' },
      { id: 'down', icon: 'chevron-down', action: 'cursorDown' },
      { id: 'undo', icon: 'undo', action: 'editor.action.undo' },
      { id: 'redo', icon: 'redo', action: 'editor.action.redo' },
      { id: 'search', icon: 'search', action: 'actions.find' },
      { id: 'save', icon: 'save', action: 'workbench.action.files.save' },
      { id: 'bracket1', label: '{', action: 'type_{' },
      { id: 'bracket2', label: '}', action: 'type_}' },
      { id: 'tag1', label: '<', action: 'type_<' },
      { id: 'tag2', label: '>', action: 'type_>' },
    ]
  },
  
  'workbench.statusBar.visible': {
    title: 'Status Bar Visibility',
    subCategory: 'Status Bar',
    type: 'boolean',
    defaultValue: true,
    order: 1,
    tags: ['workbench', 'layout'],
    markdownDescription: 'Controls the visibility of the status bar of the workbench.',
  },

  'workbench.statusBar.position': {
    title: 'Status Bar Position',
    subCategory: 'Status Bar',
    type: 'select',
    defaultValue: 'bottom',
    enum: ['bottom', 'top'],
    enumItemLabels: ['Bottom', 'Top'],
    order: 2,
    tags: ['workbench', 'layout'],
    markdownDescription: 'Controls where the status bar should be displayed.',
  },

  'workbench.statusBar.overflow': {
    title: 'Status Bar Overflow',
    subCategory: 'Status Bar',
    type: 'select',
    defaultValue: 'scroll',
    enum: ['scroll', 'more'],
    enumItemLabels: ['Horizontal Scroll', 'Three Dot Menu (More)'],
    order: 3,
    tags: ['workbench', 'layout'],
    markdownDescription: 'Controls how overflowing status bar items are handled on small screens.',
  },
  'workbench.topBar.actions': {
    title: 'Top Bar Quick Actions',
    type: 'array',
    markdownDescription: `Controls items shown in the Top Bar action area.
 
Each entry can be:
- **A string** — a setting ID (e.g. \`"editor.wordWrap"\`) or command ID (e.g. \`"workbench.action.files.save"\`)
- **A separator** — \`{ "id": "sep1", "type": "separator", "order": 150 }\`
- **A full item** — \`{ "id": "myAction", "label": "Do Thing", "icon": "zap", "command": "myExt.doThing", "order": 50 }\`
  - \`command\` is resolved to an \`onClick\` via the command registry
  - \`children\` array supported for submenus (same structure, recursive)
 
Order numbers control position. Leave gaps (10, 20, 30 …) so other items can insert between.`,
    defaultValue: [
      // 'workbench.action.files.save',
      // 'termis.open.terminal',
      // 'editor.wordWrap', 
      // 'editor.stickyScroll.enabled',
      { "id": "title.actions.save_file", "label": "Save", "icon": "save", "command": "workbench.action.files.save", "order": 9 },
      { "id": "title.actions.rename_file", "label": "Rename", "edit": "edit", "command": "workbench.action.renameActiveFile", "order": 10 , "when": "activeTabType" },
      { "id": "title.actions.open_terminal", "label": "Terminal", "icon": "terminal", "command": "termis.open.terminal", "order": 11 },
      { "id": "title.actions.word_wrap", "label": "Word Wrap", "icon": "word-wrap", "setting": "editor.wordWrap", "order": 12 },
      { "id": "title.actions.sticky_scroll", "label": "Sticky Scroll", "icon": "", "setting": "editor.stickyScroll.enabled", "order": 13 },
      { "id": "sep1", "type": "separator", "order": 30 }
    ]
  },
  
  // --- Explorer ---
    'workbench.explorer.openMode': {
      title: 'Open Items Via',
      subCategory: 'Explorer',
      type: 'select',
      defaultValue: 'singleClick',
      enum: ['singleClick', 'doubleClick'],
      enumItemLabels: ['Single Click', 'Double Click'],
      markdownDescription: 'Controls how folders and files are opened in the explorer and file picker lists.'
    },
    
    'workbench.explorer.showFileIcons': {
      title: 'Show File Icons',
      subCategory: 'Explorer',
      type: 'boolean',
      defaultValue: true,
      markdownDescription: 'Controls whether file icons are shown in the explorer tree.'
    },
    'workbench.explorer.showFolderIcons': {
      title: 'Show Folder Icons',
      subCategory: 'Explorer',
      type: 'boolean',
      defaultValue: false,
      markdownDescription: 'Controls whether folder icons are shown in the explorer tree.'
    },
    
    // --- Search ---
    'workbench.search.exclude': {
      title: 'Search Exclude',
      type: 'array',
      defaultValue: [
        '**/.git',
        '**/.vscode',
        '**/node_modules',
        '**/build',
        '**/dist',
        '**/.*'
      ],
      markdownDescription: 'Configure glob patterns for excluding files and folders in fulltext searches.'
    },
    
    'workbench.editor.closeOverviewOnClick': {
      title: 'Close Tab Overview on Click',
      subCategory: 'Tab Management',
      type: 'boolean',
      defaultValue: true,
      markdownDescription: 'Automatically close the tab overview popup when you select a tab.'
    },
    // Reappear Mode (Experimental)
    'workbench.editor.tabPopupReappearMode': {
      title: 'Tab Popup Reappear Mode',
      subCategory: 'Tab Management',
      type: 'boolean',
      defaultValue: false,
      experimental: true,
      markdownDescription: 'If the tab overview is open, opening the virtual keyboard temporarily hides it. Closing the keyboard restores it. If manually closed, it stays closed.'
    },
    // Tab Icon Settings
    'workbench.editor.showTabsIcon': {
      title: 'Show Icons in Tabs',
      subCategory: 'Editor Management',
      type: 'boolean',
      defaultValue: true,
      markdownDescription: 'Shows file icons in the normal horizontal tab bar.'
    },
    'workbench.editor.showTabsIconOnPopup': {
      title: 'Show Icons in Tab Popup',
      subCategory: 'Editor Management',
      type: 'boolean',
      defaultValue: true,
      markdownDescription: 'Shows file icons in the open editors popup/overview mode.'
    },
    
  }
};