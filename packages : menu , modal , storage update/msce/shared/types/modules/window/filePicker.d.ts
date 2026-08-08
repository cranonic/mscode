// types/modules/window/filePicker.d.ts

declare module '@mscode/api' {

  /**
   * A named group of file extensions for the type-filter dropdown.
   * Use an empty `extensions` array to mean "All Files".
   */
  export interface FileFilter {
    /** Label shown in the filter Select, e.g. "TypeScript Files" */
    label: string;
    /** Extensions without the leading dot, e.g. ['ts', 'tsx']. Empty = all files. */
    extensions: string[];
  }

  export interface PickerOptions {
    /**
     * Interaction mode:
     * - `file`      → pick one existing file
     * - `folder`    → navigate then confirm
     * - `saveAs`    → choose directory + name
     */
    mode: 'file' | 'folder' | 'saveAs';

    /** Modal title (auto-derived from mode when omitted). */
    title?: string;
    /** Header icon name from IconRegistry. */
    icon?: string;
    /** Override the confirm-button label. */
    buttonText?: string;

    /** File-type filters rendered as a Select in the footer. First entry is selected by default. */
    filters?: FileFilter[];
    /** Folder-mode gate: folder is only selectable when it contains every one of these filenames. */
    requiredFiles?: string[];

    /** Starting directory. Defaults to 'ROOT'. */
    defaultPath?: string;
    /** Pre-filled filename for saveAs mode. */
    defaultName?: string;
    /** Placeholder text for the saveAs filename input. */
    fileNamePlaceholder?: string;

    /**
     * Show the "New File" and "New Folder" toolbar buttons.
     * Defaults to true; set false to hide them.
     */
    allowCreate?: boolean;
    /** Show dotfiles (names starting with '.'). Defaults to false. */
    showHidden?: boolean;
  }

  export interface MultiPickerOptions extends Omit<PickerOptions, 'mode'> {
    /** * Interaction mode is strictly locked to `multiFile`.
     */
    mode: 'multiFile';
  }

  export namespace window {
    
    /**
     * Shows a file, folder, or save-as dialog to the user.
     * * @param options Configuration for the picker (e.g., mode, title, filters).
     * @returns A promise that resolves to the selected path as a string, or `null` if cancelled.
     * * @example
     * const selectedPath = await mscode.window.showOpenDialog({
     * mode: 'file',
     * title: 'Select a config file',
     * filters: [{ label: 'JSON Files', extensions: ['json'] }]
     * });
     */
    export function showOpenDialog(options: PickerOptions): Promise<string | null>;

    /**
     * Shows a file picker dialog that allows selecting multiple files.
     * * @param options Configuration for the multi-picker.
     * @returns A promise that resolves to an array of selected file paths, or `null` if cancelled.
     */
    export function showOpenDialog(options: MultiPickerOptions): Promise<string[] | null>;

    /**
     * Fired when the file/folder picker dialog is opened.
     * * @param handler Callback function receiving the `PickerOptions` used to open the dialog.
     * @returns A disposable object to unregister the listener.
     */
    export function onDidOpenFilePicker(handler: (options: PickerOptions | MultiPickerOptions) => void): Disposable;

    /**
     * Fired when the file/folder picker dialog is closed.
     * * @param handler Callback function receiving the selected path(s), or `null` if cancelled.
     * @returns A disposable object to unregister the listener.
     */
    export function onDidCloseFilePicker(handler: (selectedPath: string | string[] | null) => void): Disposable;
  }
}