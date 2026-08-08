# Mono Studio Extension Creator (MSCE)

The official command-line interface for scaffolding, building, packaging, and publishing extensions for the Mono Studio IDE. 

MSCE provides an integrated toolchain that simplifies the extension development lifecycle. It includes a built-in bundler (powered by esbuild), a packaging engine for `.msxt` files, and a direct publishing pipeline to the Mono Studio Registry.

## Features

* **Interactive Scaffolding:** Generate ready-to-use extension templates with standard directory structures and configuration files.
* **Project Initialization:** Seamlessly convert existing projects or migrate extensions to the Mono Studio build system without overwriting your source code.
* **TypeScript & JavaScript Support:** Native support for both languages with zero-configuration build pipelines.
* **High-Performance Bundling:** Fast compilation and minification using esbuild.
* **Watch Mode:** Automatic recompilation upon file changes for streamlined development.
* **Automated Packaging:** Validates the extension manifest and generates optimized `.msxt` distribution archives.
* **Integrated Publishing:** Direct upload to the Mono Studio Registry with interactive semantic version bumping.

## Website

[Mono Studio Website](https://monostudio-code.vercel.app)

## Installation

You do not need to install the package globally to create a new project. You can use `npx` to execute the latest version directly:
```bash
npx @monostudio/msce

```

If you prefer to install the CLI globally on your system:

```bash
npm install -g @monostudio/msce

```

## Quick Start

### 1. Scaffold a New Extension

Run the CLI tool and follow the interactive prompts to define your extension ID, publisher name, and preferred language.

```bash
npx @monostudio/msce

```

Navigate to the generated directory, install dependencies, and compile:

```bash
cd my-extension
npm install
npm run build

```

### 2. Initialize an Existing Project

If you already have a project or are migrating an extension from another IDE, navigate to your project folder and run the `init` command:

```bash
cd my-existing-extension
npx @monostudio/msce init
npm install

```

## Directory Structure

A generated extension project follows this standard structure:

```text
my-extension/
├── .mscode/
│   ├── types/            # Mono Studio API typings for IntelliSense
│   └── msce.js           # Local CLI execution engine
├── assets/
│   └── logo.png          # Extension icon
├── src/
│   └── main.ts           # Extension entry point
├── CHANGELOG.md          # Release history
├── LICENSE.txt           # Open source license
├── manifest.json         # Mono Studio extension configuration
├── package.json          # Node.js dependencies and scripts
└── README.md             # Extension documentation

```

## Command Reference

The project includes standard npm scripts that execute the local `.mscode/msce.js` engine.

### `msce init` (via `npx @monostudio/msce init`)

Initializes the MSCE toolchain in an existing project directory.

* Safely merges required build scripts and `devDependencies` into your `package.json` without overwriting existing data.
* Injects the local `.mscode` compiler engine and API typings.
* Auto-generates `jsconfig.json` or `tsconfig.json` for full `@mscode/api` IntelliSense and auto-completion.
* Updates `.gitignore` and smartly validates the icon path in your `manifest.json`.

### `npm run build`

Compiles the source code from `src/main.ts` (or `.js`) into a single, minified ES module format at `dist/main.js`. It performs tree-shaking and excludes the `mscode` core API from the bundle.

### `npm run watch`

Initiates a file watcher on the `src/` and `assets/` directories. It automatically triggers an incremental build whenever a file mutation is detected, allowing for real-time development.

### `npm run package`

Executes the bundler and packages the extension into a compressed distribution file.

* Validates `manifest.json` to ensure all declared assets (icons, readmes, themes, snippets) exist.
* Injects the compiled source code.
* Outputs an archive named `<publisher>.<extension-id>-v<version>.msxt`.

### `npm run publish`

Packages the extension and uploads it directly to the Mono Studio Registry.

* Prompts for an interactive semantic version bump (Patch, Custom, or Keep Current).
* Requires a Personal Access Token (PAT) for authentication.

## Publishing Configuration

To publish an extension, you must provide an authentication token. You can pass this token in two ways:

**Option 1: Using the CLI argument**

```bash
npm run publish --token YOUR_PERSONAL_ACCESS_TOKEN

```

*(Note: If running directly globally, use `msce publish --token YOUR_PAT`)*

**Option 2: Using an Environment Variable (Recommended)**
Export the token in your terminal profile or CI/CD environment:

```bash
export MSCE_TOKEN="YOUR_PERSONAL_ACCESS_TOKEN"
npm run publish

```

## Contributing

For guidelines on contributing to the Mono Studio IDE or the MSCE CLI, please refer to the official documentation site.

## License

This project is licensed under the MIT License.