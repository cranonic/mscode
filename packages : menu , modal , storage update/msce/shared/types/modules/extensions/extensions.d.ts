// types/modules/extensions/extensions.d.ts

declare module '@mscode/api' {

  /**
   * Represents an extension that is installed in the IDE environment.
   */
  export interface ExtensionInfo {
    /** * The globally unique identifier of the extension. 
     * Formatted as `publisher.name` (e.g., 'mscode.python-tools').
     */
    readonly id: string;
    
    /** The human-readable display name of the extension. */
    readonly name: string;
    
    /** The currently installed version of the extension (e.g., '1.4.2'). */
    readonly version: string;
    
    /** * Indicates whether the extension is currently active and running in the Extension Host. 
     * Lazy-loaded extensions will show `false` until their activation events are triggered.
     */
    readonly isActive: boolean;
    
    /** * The parsed contents of the extension's `manifest.json` file. 
     * Contains metadata, contributions, and configuration schema details.
     */
    readonly manifestJSON: any;
  }

  export namespace extensions {
    
    /**
     * Retrieves an array of all extensions currently installed in the IDE environment.
     * This includes both built-in extensions and those downloaded from the marketplace.
     * * @returns An array of extension metadata objects.
     * * @example
     * const installedExts = extensions.all();
     * console.log(`There are ${installedExts.length} extensions installed.`);
     */
    export function all(): ExtensionInfo[];

    /**
     * Retrieves an extension by its unique identifier.
     * * @param extensionId The full ID of the target extension (e.g., `mscode.git`).
     * @returns The extension metadata, or `undefined` if it is not installed.
     * * @example
     * const gitExt = extensions.getExtension('mscode.git');
     * if (!gitExt?.isActive) {
     * window.showWarningMessage("Git extension is currently sleeping!");
     * }
     */
    export function getExtension(extensionId: string): ExtensionInfo | undefined;

    /**
     * Programmatically installs an extension directly from the Cloud Marketplace.
     * Useful for building "Extension Packs" that download multiple dependencies automatically.
     * * @param extensionId The unique ID of the extension to download and install.
     * @returns A promise that resolves to `true` if the installation succeeded, or `false` on failure.
     * * @example
     * window.showInformationMessage("Installing Python backend...");
     * const success = await extensions.installExtension('ms.python');
     * if (success) window.showInformationMessage("Python installed!");
     */
    export function installExtension(extensionId: string): Promise<boolean>;

    /**
     * Opens the internal Extensions Sidebar View (Marketplace) and optionally applies a search filter.
     * * @param searchQuery Optional text to inject into the marketplace search bar.
     * * @example
     * // Redirect user to find themes
     * extensions.showMarketplace('@category:themes dark');
     */
    export function showMarketplace(searchQuery?: string): void;

    /**
     * An event that fires when an extension is installed, uninstalled, enabled, or disabled.
     * Allows your extension to react dynamically to changes in the IDE ecosystem.
     * * @param handler A callback function triggered upon any extension state mutation.
     * @returns A disposable object to unregister the listener.
     * * @example
     * extensions.onDidChange(() => {
     * const target = extensions.getExtension('my.dependency');
     * if (target) {
     * console.log("Dependency was just installed!");
     * }
     * });
     */
    export function onDidChange(handler: () => void): Disposable;

  }
}