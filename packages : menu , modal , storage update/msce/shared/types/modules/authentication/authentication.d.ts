// types/modules/authentication/authentication.d.ts

declare module '@mscode/api' {

  /**
   * Represents the currently authenticated GitHub user profile.
   */
  export interface GitHubUser {
    /** The user's GitHub username (e.g., 'torvalds'). */
    login: string;
    /** The user's display name. */
    name: string;
    /** The user's primary public email address. */
    email: string;   
    /** URL pointing to the user's GitHub avatar. */
    avatar_url: string;
  }

  export namespace authentication {
    
    /**
     * Requests a GitHub authentication session (Token) for the current user.
     * * **Security Behavior (Gatekeeper):**
     * - If the user has already granted access to this extension, it returns the token instantly.
     * - If the user has previously denied access, it returns `null`.
     * - If this is the first time, it suspends execution and prompts the user with a secure dialog.
     * * @returns A promise resolving to the GitHub Personal Access Token (or OAuth token), or `null` if denied/not logged in.
     * * @example
     * ```typescript
     * const token = await mscode.authentication.getSession();
     * if (token) {
     * // Use the token to fetch private GitHub data
     * const res = await fetch('[https://api.github.com/user/repos](https://api.github.com/user/repos)', {
     * headers: { Authorization: `token ${token}` }
     * });
     * } else {
     * mscode.window.showErrorMessage("GitHub access is required!");
     * }
     * ```
     */
    export function getSession(): Promise<string | null>;

    /**
     * Synchronously checks if the extension has already been granted GitHub access.
     * This method is completely silent and will **never** prompt the user.
     * * @returns `true` if the user is authenticated globally AND has authorized this specific extension.
     * * @example
     * ```typescript
     * if (mscode.authentication.hasAccess()) {
     * // Show repository view
     * renderRepoView();
     * } else {
     * // Show "Sign in with GitHub" button
     * renderSignInButton();
     * }
     * ```
     */
    export function hasAccess(): boolean;

    /**
     * Retrieves the currently authenticated GitHub user's public profile information.
     * This acts as a convenience method to avoid making a manual API fetch.
     * * **Note:** This will return `null` if the extension has not been granted access via `getSession()`,
     * even if the user is logged into the IDE globally.
     * * @returns The user profile object, or `null`.
     */
    export function getUser(): GitHubUser | null;

    /**
     * An event that fires when the authentication state changes.
     * This triggers if the user logs in/out globally, OR if they manually revoke/grant 
     * access to your specific extension from the IDE settings.
     * * @param handler A callback function receiving the new access state (true/false).
     * @returns A disposable object to unregister the listener.
     * * @example
     * ```typescript
     * mscode.authentication.onDidChangeSessions((hasAccess) => {
     * if (hasAccess) {
     * mscode.window.showInformationMessage("GitHub connected!");
     * refreshData();
     * } else {
     * showLoggedOutView();
     * }
     * });
     * ```
     */
    export function onDidChangeSessions(handler: (accessGranted: boolean) => void): Disposable;

  }
}