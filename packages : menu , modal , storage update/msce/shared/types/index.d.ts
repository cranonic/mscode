// types/index.d.ts

/// <reference path="./core/globals.d.ts" />
/// <reference path="./modules/window/activityBar.d.ts" />
/// <reference path="./modules/window/editor.d.ts" /> 
/// <reference path="./modules/window/fileDecorations.d.ts" />
/// <reference path="./modules/window/filePicker.d.ts" />
/// <reference path="./modules/window/modal.d.ts" />    
/// <reference path="./modules/window/notification.d.ts" />
/// <reference path="./modules/window/quickPick.d.ts" />
/// <reference path="./modules/window/sidebar.d.ts" />
/// <reference path="./modules/window/statusBar.d.ts" />
/// <reference path="./modules/window/tab.d.ts" />
/// <reference path="./modules/window/output.d.ts" />
/// <reference path="./modules/window/terminal.d.ts" />
/// <reference path="./modules/languages/diagnostics.d.ts" />
/// <reference path="./modules/window/treeView.d.ts" />
/// <reference path="./modules/languages/formatter.d.ts" />
/// <reference path="./modules/languages/snippets.d.ts" />


// ─── Termis Sub-modules ───
/// <reference path="./modules/termis/termis.d.ts" />



// ─── Tasks Sub-modules ───
/// <reference path="./modules/tasks/tasks.d.ts" />



// ─── Search Sub-modules ───
/// <reference path="./modules/search/search.d.ts" />



// ─── Menus Sub-modules ───
/// <reference path="./modules/menus/menus.d.ts" />



// ─── LSP Sub-modules ───
/// <reference path="./modules/lsp/lsp.d.ts" />



// ─── Themes modules ───
/// <reference path="./modules/themes/themes.d.ts" />


// ─── FileSystem Sub-modules ───
/// <reference path="./modules/fs/filesystem.d.ts" />         



// ─── Extensions Sub-modules ───
/// <reference path="./modules/extensions/extensions.d.ts" />


// ─── Commands Sub-modules ───
/// <reference path="./modules/commands/commands.d.ts" />



// ─── Authentication Sub-modules ───
/// <reference path="./modules/authentication/authentication.d.ts" />



// ─── App Sub-modules ───
/// <reference path="./modules/app/app.d.ts" /> 



// ─── Workspace Sub-modules ───
/// <reference path="./modules/workspace/configuration.d.ts" />
/// <reference path="./modules/workspace/workspace.d.ts" />
/// <reference path="./modules/workspace/recent.d.ts" />



// ─── Languages Sub-modules ───
/// <reference path="./modules/languages/symbols.d.ts" />




// ─── UI Components ───
/// <reference path="./modules/ui/modal.d.ts" />
/// <reference path="./modules/ui/tab.d.ts" />



// Legacy global support
declare const mscode: any;


// declare module '@mscode/api' {
//   export * from './modules/ui/ui';
// }

// declare module '@mscode/ui' {
//   import type { FC } from 'react';
//   import type { 
//     ButtonProps, SplitButtonProps, CollapsibleProps, 
//     IconProps, InputBoxProps, ModalProps, SelectProps, RichTextProps 
//   } from './modules/ui/ui';

//   export const Button: FC<ButtonProps>;
//   export const SplitButton: FC<SplitButtonProps>;
//   export const Collapsible: FC<CollapsibleProps>;
//   export const Icon: FC<IconProps>;
//   export const InputBox: FC<InputBoxProps>;
//   export const Modal: FC<ModalProps>;
//   export const Select: FC<SelectProps>;
//   export const RichText: FC<RichTextProps>;
  
//   export const tabs: typeof import('./modules/ui/ui').ui.tabs;
// }