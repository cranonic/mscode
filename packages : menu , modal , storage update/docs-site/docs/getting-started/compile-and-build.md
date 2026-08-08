
# Compile, Build & Publish

Once your extension is ready, you need to compile the source code and package it into a distributable format. Mono Studio provides a dedicated command-line engine, **MSCE** (Mono Studio Compiler Engine), to handle validation, compilation, bundling, and cloud deployment automatically.

<hr style={{ border: 'none', borderTop: '1px solid var(--ifm-color-emphasis-200)', margin: '2rem 0' }} />

## The MSCE CLI

The `msce` tool is a high-performance bundler powered by `esbuild`. It provides four primary pipelines for your development workflow. You can run these commands directly from your terminal in the extension's root directory:

### 1. Watch Mode (Development)
During active development, use the watch command. It monitors your `src/` directory and automatically recompiles your code in milliseconds whenever a change is detected.

```bash
npx msce watch

```

### 2. Build Mode

If you only need to compile your TypeScript/JavaScript into a standardized ECMAScript Module (ESM) without creating a final archive, use the build command.

```bash
npx msce build

```

### 3. Package Mode (Local Production)

When you want to locally install your extension, run the package command. This pipeline executes full asset validation, minifies the code, and creates the final compressed `.zip` archive.

```bash
npx msce package

```

### 4. Publish Mode (Cloud Deployment)

When you are ready to share your extension with the world, use the publish command. This pipeline automatically validates, bundles, and securely uploads your extension directly to the Mono Studio Registry via API.

```bash
npx msce publish --token <YOUR_PERSONAL_ACCESS_TOKEN>

```

*Note: You can generate your secure Personal Access Token (PAT) directly from the Mono Publisher Dashboard under the "CLI Access Tokens" settings tab.*

## The Packaging Pipeline Explained

When you execute an MSCE build protocol, the compiler engine performs several sophisticated operations in the background:

### Expected Publish Output

Upon successful packaging and authentication, MSCE securely transmits the payload to the registry:

```text
 Mono Compiler: Synthesizing asset tree...
 Inspecting manifest blueprints for absolute path compliance...
 Bundling script workspace using esbuild engine matrix...
  JS Compilation Complete → dist/main.js
  Packaging distribution build...
  ↳ Packed Assets Context: assets/icon.png
  ↳ Packed Assets Context: config/settings.json

 SUCCESS: Extracted bundle package ready!
  File: your-extension-v1.0.0.zip (23.5 KB)

  Initiating secure uplink to Mono Registry...
 Authenticating via Personal Access Token (PAT)...

 ✅ PUBLISH SUCCESSFUL!
 ID:      cranonic.your-extension
 Version: 1.0.0

```

## Sideloading & Testing Locally

Before publishing your extension to the global registry, you can test it directly inside your local Mono Studio environment.

1. Open **Mono Studio**.
2. Navigate to the **Extensions Panel** via the Activity Bar.
3. Click the **More Actions** (`...`) menu at the top right of the panel.
4. Select **"Install from Local Archive..."**.
5. Browse and select your newly generated `.zip` archive (created via `msce package`).

Mono Studio will instantly inflate the package, synchronize the declarative UI contributions from your `manifest.json`, and activate the extension dynamically in the background sandbox.
