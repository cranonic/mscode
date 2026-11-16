// src/core/bootstrap/actions/index.ts
//
// Registers all workbench commands. Import bootstrapAction from here
// (or keep using actionsRegistration.ts which re-exports this).

import { registerAppExitActions } from './appExitActions';
import { registerThemeActions } from './themeActions';
import { registerEditorEditActions } from './editorEditActions';
import { registerFileActions } from './fileActions';
import { registerViewLayoutActions } from './viewLayoutActions';
import { registerExplorerActions } from './explorerActions';
import { registerNavigationActions } from './navigationActions';
import { registerTermisActions } from './termisActions';
import { registerSnippetsActions } from './snippetsActions';
import { registerDevToolsActions } from './devToolsActions';

export function bootstrapAction(): void {
  registerAppExitActions();
  registerThemeActions();
  registerEditorEditActions();
  registerFileActions();
  registerViewLayoutActions();
  registerExplorerActions();
  registerNavigationActions();
  registerTermisActions();
  registerSnippetsActions();
  registerDevToolsActions();
}

export { getActiveMonacoEditor, triggerOnActiveEditor } from './getActiveMonacoEditor';
