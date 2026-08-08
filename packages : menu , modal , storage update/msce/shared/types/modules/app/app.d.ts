// types/modules/app/app.d.ts

declare module '@mscode/api' {

  /**
   * The App namespace contains APIs specific to the application's native environment,
   * such as handling hardware buttons and application lifecycle events.
   */
  export namespace app {
    
    /**
     * Registers a callback for the device's hardware back button (e.g., on Android).
     * * The callback function should return `true` if it handles the back button press 
     * (meaning it prevents the app from closing or going back globally). 
     * If it returns `false`, the event bubbles down to the next handler or exits the app.
     * * * @param callback A function that returns a boolean or a Promise resolving to a boolean.
     * @returns A disposable object to unregister the callback.
     * * * @example
     * const backSub = mscode.app.onBackButton(() => {
     * if (myCustomPopupIsOpen) {
     * closePopup();
     * return true; // We handled it! Don't exit the app.
     * }
     * return false; // Let it pass to the next handler/exit.
     * });
     * * // Clean up when no longer needed
     * // backSub.dispose();
     */
    export function onBackButton(callback: () => boolean | Promise<boolean>): Disposable;

    /**
     * Triggers the application exit confirmation sequence.
     * Internally executes the global `workbench.action.quit` command.
     * * * @example
     * // Add a custom "Quit" button inside your extension
     * myExitButton.onClick(() => {
     * mscode.app.exitApp();
     * });
     */
    export function exitApp(): void;

  }
}