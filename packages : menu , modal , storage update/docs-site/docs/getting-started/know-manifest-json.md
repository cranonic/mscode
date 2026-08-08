# Anatomy of `manifest.json`

The `manifest.json` (or `manifest.jsonc`) file is the absolute core of your extension. It serves as the static blueprint for Mono Studio, declaring your extension's identity, activation events, and UI contributions—all without executing a single line of JavaScript.

:::tip 
JSONC Support :
Mono Studio fully supports **JSONC** (`manifest.jsonc`). You can safely use single-line (`//`) and multi-line (`/* */`) comments inside your manifest to document your configurations.
:::

Let's break down a complete, production-ready manifest for an **AI Chat Assistant** extension.

---

## 1. Core Metadata

These foundational keys define the identity, marketplace presentation, and branding of your extension.

```json
{
  "id": "openai-chat",
  "name": "Mono AI Chat",
  "publisher": "monostudio",
  "version": "1.0.0",
  "description": "Advanced AI coding companion powered by GPT-4o.",
  "category": "Other",
  "tags": ["ai", "copilot", "gpt", "refactor"],
  
  // Branding & Visuals
  "icon": "assets/icon.png",  // Relative path to your 256x256 logo
  "iconColor": "#10a37f",     // Accent background color for the extension card
  "iconLetter": "A",          // Fallback glyph if the icon image fails to load
  
  // Documentation
  "readme": "README.md",
  "changelog": "CHANGELOG.md",
  "license": "LICENSE.txt",

```

---

## 2. Execution & Lifecycle

Mono Studio is highly optimized. Extensions are strictly lazy-loaded and will only execute their `main` script when specific user actions match the `activates` array.

```json
  "main": "out/extension.js", // The compiled JavaScript entry point
  "activates": [              // System triggers that boot your extension
    "onLanguage:javascript",
    "onLanguage:typescript",
    "onLanguage:python",
    "onCommand:openai-chat.focusPanel"
  ],

```

---

## 3. The `contributes` Object (Declarative UI)

The `contributes` block is where the magic happens. It allows you to deeply integrate into the IDE's UI (Menus, Settings, Shortcuts) purely via JSON.

### Commands & Keybindings

Register global commands and bind them to specific keyboard combinations.

```json
  "contributes": {
    
    // Commands register metadata to the Command Palette (Ctrl+Shift+P)
    "commands": [
      {
        "id": "openai-chat.inlineSuggest",
        "title": "AI: Trigger Inline Suggestion",
        "icon": "sparkle"
      }
    ],

    // Bind keys to the commands. You can specify OS-specific overrides and focus constraints.
    "keybindings": [
      {
        "command": "openai-chat.inlineSuggest",
        "key": "ctrl+shift+a",
        "mac": "cmd+shift+a",
        "when": "editorTextFocus" // Only active when typing in the code editor
      }
    ],

```

### Context Menus & Actions

Inject items directly into the user's right-click menus or sidebar toolbars.

```json
    "menus": {
      // 1. Editor Context (Right-clicking inside the code editor)
      "editor/context": [
        {
          "command": "openai-chat.explainCodeSelection",
          "label": "Mono AI: Explain Selected Code",
          "icon": "sparkle",
          "when": "editorHasSelection == true", // Evaluated dynamically
          "order": 1
        },
        {
          "type": "separator", // Injects a visual divider line
          "order": 2
        }
      ],
      
      // 2. Tab Bar Context (Right-clicking a file tab at the top)
      "editor/title/context": [
        {
          "command": "openai-chat.documentFile",
          "label": "Generate JSDoc",
          "icon": "book",
          "shortcut": "Ctrl+Alt+D" // Visual hint (does not bind the actual key)
        }
      ],

      // 3. Explorer Context (Right-clicking files/folders in the sidebar)
      "sidebar/files/context": [
        {
          "command": "openai-chat.analyzeArchitecture",
          "label": "Analyze Architecture",
          "icon": "project",
          "when": "workspacePath != null"
        }
      ]
    },

```

### Settings Configuration

Expose user-customizable settings that automatically appear in the Mono Studio Settings UI.

```json
    // Alternatively, you could write: "configuration": "./config/settings.json"
    "configuration": {
      "monoAI.api.key": {
        "type": "string",
        "default": "",
        "description": "Your OpenAI secret API Key."
      },
      "monoAI.model.selection": {
        "type": "string",
        "default": "gpt-4o",
        "enum": ["gpt-4o", "gpt-4-turbo", "deepseek-coder"],
        "description": "Target LLM engine."
      }
    },

```

### Activity Bar & Theming

Inject UI entry points and aesthetic enhancements.

```json
    // Adds a permanent icon to the far-left Activity Bar
    "activityBar": [
      {
        "id": "mono-ai-assistant",
        "title": "AI Copilot",
        "icon": "sparkle",
        "position": "top",
        "priority": 90
      }
    ],

    // Registers custom Code Autocomplete snippet files
    "snippets": [
      { "language": "javascript", "path": "./snippets/js-prompts.json" }
    ],

    // Registers visual UI themes and File Icon packs
    "themes": [
      { "label": "Mono AI Dark", "uiTheme": "vs-dark", "path": "./themes/dark.json" }
    ],
    "iconThemes": [
      { "id": "ai-icons", "label": "Neural Icons", "path": "./icons/theme.json" }
    ]
  } // End of contributes
}

```

:::info 
Declarative Architecture :
By moving UI definitions to the `manifest.json`, Mono Studio drastically reduces extension boot times. The IDE constructs your Activity Bar, Command Palette, and Context Menus instantly on launch. Your `main.js` script is only invoked when a user actively clicks one of your registered commands.
:::