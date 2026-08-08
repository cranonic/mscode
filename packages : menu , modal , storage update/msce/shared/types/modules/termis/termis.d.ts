// types/modules/termis/termis.d.ts

declare module '@mscode/api' {

  /**
   * The distinct sections available within the bottom Termis panel.
   */
  export type TermisView = 'terminal' | 'output' | 'problems';

  export namespace termis {
    
    /**
     * Returns `true` if the Termis panel is currently visible and open.
     */
    export const isVisible: boolean;

    /**
     * Returns the currently active section ('terminal', 'output', or 'problems').
     */
    export const activeView: TermisView;

    /**
     * Opens the Termis panel in the IDE.
     * * @param view Optional target view to display. If omitted, it opens to the last active view.
     * * @example
     * // Open directly to the problems tab
     * mscode.termis.openPanel('problems');
     */
    export function openPanel(view?: TermisView): void;

    /**
     * Hides the Termis panel from the layout.
     */
    export function closePanel(): void;

    /**
     * Switches the active view inside the Termis panel.
     * Automatically opens the panel if it is currently closed.
     * * @param view The target view identifier.
     * * @example
     * mscode.termis.setActiveView('output');
     */
    export function setActiveView(view: TermisView): void;

    // ── EVENT LISTENERS ──

    /**
     * Fired when the Termis panel is opened or becomes visible.
     * @param handler Callback executed on open.
     * @returns A disposable object to unregister the listener.
     */
    export function onDidOpenTermisPanel(handler: () => void): Disposable;

    /**
     * Fired when the Termis panel is closed or hidden.
     * @param handler Callback executed on close.
     * @returns A disposable object to unregister the listener.
     */
    export function onDidCloseTermisPanel(handler: () => void): Disposable;

    /**
     * Fired when the active view inside the Termis panel changes.
     * @param handler Callback receiving the new active view ('terminal' | 'output' | 'problems').
     * @returns A disposable object to unregister the listener.
     * * @example
     * mscode.termis.onDidChangeTermisActiveView((newView) => {
     * if (newView === 'problems') {
     * mscode.window.showInformationMessage("Checking for code errors...");
     * }
     * });
     */
    export function onDidChangeTermisActiveView(handler: (view: TermisView) => void): Disposable;
  }
}