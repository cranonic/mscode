# Ready An Extension via CLI

To make extension development frictionless, Mono Studio provides a powerful scaffolding tool called **MSCE** (`@monostudio/msce`). You do not need to create folders and configuration files manually; our CLI generator sets up the perfect boilerplate tailored to your specific needs.

## Prerequisites

Before you begin, ensure you have **Node.js** (version 20.0 or higher) and **npm** installed on your system. You can verify this by running the following commands in your terminal:

```bash
node -v
npm -v

```

## Installation

If you plan to build extensions frequently, we highly recommend installing the CLI globally on your machine. Run the following command:

```bash
npm install -g @monostudio/msce

```

Once installed globally, you can launch the tool from anywhere using just the `msce` command.

## Initializing the Generator

Open your terminal and run the following command to start the interactive Mono Studio CLI Extension (MSCE) creator:

**If installed globally:**

```bash
msce

```

**If you prefer using npx (without global installation):**

```bash
npx @monostudio/msce

```

Once executed, the CLI will guide you through a series of configuration steps.

### Step 1: Choose a Template

The CLI offers multiple starter templates depending on what you want to build. It intelligently categorizes them into code-based extensions and data-only extensions:

* **Basic**: Hello World starter — minimal command extension.
* **Sidebar**: Custom sidebar panel with activity bar icon.
* **Color Theme**: Workbench color theme pack (data-only, no script).
* **Icon Theme**: File icon theme pack (data-only, no script).
* **Menu Option**: Add custom options in existing or custom menus.
* **Snippets**: Code snippet pack for any language (data-only).

### Step 2: Select a Language

*Note: This prompt only appears if you selected a template that requires a runtime script (like Basic or Sidebar).*

You can choose your preferred development language:

* **JavaScript** (Default)
* **TypeScript** (Automatically configures `tsconfig.json` and dev dependencies)

### Step 3: Extension Details

You will be prompted to provide metadata for your extension. This data automatically populates your `manifest.json` and `package.json`.

```text
[3] Extension details
? Extension ID (publisher.extension-name): mono.my-extension
? Display name: My Extension
? Short description: A Mono Studio extension.
? Author / publisher: mono
? Output folder name: my-extension

```

### Step 4: License Selection

Select an open-source or proprietary license for your project. The CLI will automatically generate the corresponding `LICENSE.txt` file.

* MIT
* Apache-2.0
* GPL-3.0
* ISC
* Proprietary

## Post-Generation Workflow

Once the CLI finishes generating your files, it will output a success message along with the commands needed to start developing.

```bash
✔ Created my-extension/

  cd my-extension
  npm install

  npm run build       # compile once
  npm run watch       # compile + watch
  npm run package     # validate + bundle → release/*.msxt

```

### Understanding the Build Scripts

Your generated `package.json` comes pre-configured with essential scripts:

1. **`npm run watch`**: Starts the compiler in watch mode. It listens for changes in your `src/` directory and automatically recompiles your code, which is highly recommended during active development.
2. **`npm run build`**: Compiles your source code into the `out/` directory for production readiness.
3. **`npm run package`**: The final step. It uses the CLI to bundle your code, assets, and `manifest.json` into a single `.msxt` (Mono Studio Extension) file, ready to be installed or published.