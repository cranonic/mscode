# authentication

## Functions

### getSession()

> **getSession**(): `Promise`\<`string` \| `null`\>

Defined in: modules/authentication/authentication.d.ts:41

Requests a GitHub authentication session (Token) for the current user.
* **Security Behavior (Gatekeeper):**
- If the user has already granted access to this extension, it returns the token instantly.
- If the user has previously denied access, it returns `null`.
- If this is the first time, it suspends execution and prompts the user with a secure dialog.
*

#### Returns

`Promise`\<`string` \| `null`\>

A promise resolving to the GitHub Personal Access Token (or OAuth token), or `null` if denied/not logged in.
*

#### Example

```typescript
const token = await mscode.authentication.getSession();
if (token) {
// Use the token to fetch private GitHub data
const res = await fetch('[https://api.github.com/user/repos](https://api.github.com/user/repos)', {
headers: { Authorization: `token ${token}` }
});
} else {
mscode.window.showErrorMessage("GitHub access is required!");
}
```

***

### getUser()

> **getUser**(): [`GitHubUser`](../index.md#githubuser) \| `null`

Defined in: modules/authentication/authentication.d.ts:67

Retrieves the currently authenticated GitHub user's public profile information.
This acts as a convenience method to avoid making a manual API fetch.
* **Note:** This will return `null` if the extension has not been granted access via `getSession()`,
even if the user is logged into the IDE globally.
*

#### Returns

[`GitHubUser`](../index.md#githubuser) \| `null`

The user profile object, or `null`.

***

### hasAccess()

> **hasAccess**(): `boolean`

Defined in: modules/authentication/authentication.d.ts:58

Synchronously checks if the extension has already been granted GitHub access.
This method is completely silent and will **never** prompt the user.
*

#### Returns

`boolean`

`true` if the user is authenticated globally AND has authorized this specific extension.
*

#### Example

```typescript
if (mscode.authentication.hasAccess()) {
// Show repository view
renderRepoView();
} else {
// Show "Sign in with GitHub" button
renderSignInButton();
}
```

***

### onDidChangeSessions()

> **onDidChangeSessions**(`handler`): [`Disposable`](../../../../core/globals/index.md#disposable)

Defined in: modules/authentication/authentication.d.ts:87

An event that fires when the authentication state changes.
This triggers if the user logs in/out globally, OR if they manually revoke/grant 
access to your specific extension from the IDE settings.
*

#### Parameters

##### handler

(`accessGranted`) => `void`

A callback function receiving the new access state (true/false).

#### Returns

[`Disposable`](../../../../core/globals/index.md#disposable)

A disposable object to unregister the listener.
*

#### Example

```typescript
mscode.authentication.onDidChangeSessions((hasAccess) => {
if (hasAccess) {
mscode.window.showInformationMessage("GitHub connected!");
refreshData();
} else {
showLoggedOutView();
}
});
```
