# Extension Ready Structure

Once you generate or manually set up your extension, your workspace should look like this:

```text
my-extension/
 ├── assets/
 │    └── logo.png         // Extension icon displayed in the marketplace
 ├── src/
 │    └── main.js         // The core runtime entry point of your extension (or main.jsx , main.ts, main.tsx)
 ├── manifest.json         // The heart of your extension (Configurations, Menus, etc.)
 ├── package.json          // Standard npm dependencies and devDependencies
 ├── CHANGELOG.md          // Version history and release notes
 ├── README.md             // Documentation for your users
 └── LICENSE.txt           // Legal distribution license

```

### Key Files Explained

* **`manifest.json`**: This is the most critical file. It acts as the blueprint for Mono Studio, declaring what your extension does, where it adds menus, and what settings it requires—without running a single line of JavaScript.
* **`src/main.js`**: This is where your actual logic lives. Mono Studio will call the `activate(context)` function inside this file when your extension triggers its activation events. Note: If you chose TypeScript during generation, this will be `src/main.ts`.
* **`package.json`**: Used purely for managing your npm packages and build scripts. Mono Studio *does not* read this file for UI contributions.

In the next section, we will deeply explore the power of `manifest.json`.