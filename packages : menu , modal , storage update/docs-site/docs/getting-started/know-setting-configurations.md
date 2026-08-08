# Know Setting Configurations

This guide explains how to declare, register, and read settings for your extension. The configuration registry supports a wide variety of input types, rich markdown descriptions, validation constraints, and UI grouping.

## 1. Declaring Settings (Manifest)

The standard way to add settings to the IDE is by contributing them via your extension's `manifest.json` (or `package.json`). You can either provide the configuration object directly or point to an external JSON file.

**Option A: External JSON File (Recommended)**
Keep your manifest clean by pointing to an external schema file:
```json
{
  "name": "my-extension",
  "contributes": {
    "commands": [ ... ],
    "configuration": "config/settings.json"
  }
}

```

**Option B: Direct Object**
You can also write the configuration directly inside the manifest:

```json
{
  "name": "my-extension",
  "contributes": {
    "configuration": {
      "id": "myExtension",
      "title": "My Extension Settings",
      "properties": {
        "myExtension.enabled": {
          "type": "boolean",
          "default": true,
          "title": "Enable Extension"
        }
      }
    }
  }
}

```

---

## 2. Reading Settings in Code

To read the user's configured settings inside your extension's logic, use the `getConfiguration` method provided by the Workspace API.

```typescript
import { workspace } from '@mscode/api';

// 1. Target the specific configuration section (e.g., 'myExtension')
const config = workspace.getConfiguration('myExtension');

// 2. Get a specific key. The second parameter is the fallback default value.
const isEnabled = config.get<boolean>('enabled', true);
const fontSize = config.get<number>('fontSize', 14);

if (isEnabled) {
  console.log(`Extension active with font size: ${fontSize}`);
}

```

---

## 3. Registering Settings Dynamically (Programmatic)

If your extension needs to inject settings dynamically at runtime (e.g., based on a network response or workspace state) instead of using the static manifest, you can use `registerConfiguration`.

:::info 
**Auto-Cleanup Magic:**
When you register settings dynamically, the API automatically tags them with your **Extension ID**. When your extension is deactivated or the returned disposable is called, those settings are automatically purged from the registry to keep the IDE clean!
:::

```typescript
import { workspace } from '@mscode/api';

export function activate() {
  // Register a dynamic setting schema
  const dynamicSettings = workspace.registerConfiguration({
    id: 'myExtension.dynamic',
    title: 'Dynamic Settings',
    properties: {
      'myExtension.dynamicTheme': {
        type: 'string',
        default: 'dark',
        title: 'Dynamic Theme'
      }
    }
  });

  // To remove/unregister the settings manually later:
  // dynamicSettings.dispose();
}

```

---

## Configuration Section Architecture

Every configuration block belongs to a **Configuration Section** (`IConfigurationSection`). This defines the top-level grouping (e.g., in the settings sidebar) and houses the individual setting properties.

```typescript
{
  id: 'myExtension',
  title: 'My Extension Settings',
  order: 1,
  properties: {
    // Setting definitions go here...
  }
}

```

---

## Adding Different Types of Settings

Below are practical examples of how to implement every supported `SettingType` within the `properties` object.

### 1. Basic Text (`string`)

Used for single-line text inputs like names, paths, or API keys. You can also enforce regex validation using the `pattern` property.

```json
"myExtension.apiKey": {
  "type": "string",
  "title": "API Key",
  "description": "Enter your authentication token.",
  "default": "",
  "pattern": "^[A-Za-z0-9_]{10,50}$",
  "patternErrorMessage": "Invalid API Key format."
}

```

### 2. Multi-line Text (`textarea`)

Perfect for longer text inputs like custom CSS, JSON snippets, or scripts.

```json
"myExtension.customCSS": {
  "type": "textarea",
  "title": "Custom CSS",
  "markdownDescription": "Inject custom CSS styles into the editor. Use `body { ... }`",
  "default": "/* Write your CSS here */\nbody {\n  background: #000;\n}"
}

```

### 3. Numeric Values (`number`)

Used for numeric configurations. You can optionally restrict the input range using `minimum` and `maximum`.

```json
"myExtension.fontSize": {
  "type": "number",
  "title": "Font Size",
  "description": "Set the default editor font size in pixels.",
  "default": 14,
  "minimum": 8,
  "maximum": 32,
  "order": 2
}

```

### 4. Checkboxes (`boolean`)

Used for simple On/Off toggles.

```json
"myExtension.autoSave": {
  "type": "boolean",
  "title": "Auto Save",
  "description": "Automatically save files after a delay.",
  "default": true,
  "category": "Files"
}

```

### 5. Dropdown Menus (`select`)

When you want to restrict users to a specific set of choices, use the `select` type. You can define options using the detailed `options` array.

```json
"myExtension.theme": {
  "type": "select",
  "title": "Editor Theme",
  "description": "Choose your preferred color theme.",
  "default": "github-dark",
  "options": [
    { 
      "value": "github-dark", 
      "label": "GitHub Dark",
      "markdownDescription": "The classic dark theme for night owls." 
    },
    { 
      "value": "solarized-light", 
      "label": "Solarized Light",
      "description": "Easy on the eyes during daytime." 
    }
  ]
}

```

:::tip Quick Enum Shorthand
For simpler dropdowns without complex labels, you can just use the `enum` array:

```json
"myExtension.logLevel": {
  "type": "select",
  "title": "Log Level",
  "default": "info",
  "enum": ["error", "warn", "info", "debug"],
  "enumItemLabels": ["Errors Only", "Warnings", "Information", "Verbose Debug"]
}

```

:::

### 6. Complex Data (`object` & `array`)

For advanced configurations, you can store structured JSON objects or arrays.

```json
"myExtension.keybindings": {
  "type": "object",
  "title": "Custom Keybindings",
  "markdownDescription": "Map specific commands to keyboard shortcuts. E.g., `{\"ctrl+s\": \"save\"}`",
  "default": {
    "ctrl+b": "toggleSidebar",
    "ctrl+p": "quickOpen"
  }
}

```

---

## Advanced UI & Developer Features

The `SettingDefinition` interface provides several advanced flags to control how settings behave and render in the UI.

### Markdown Support

Always prefer `markdownDescription` over `description` if you want to include code blocks (`inline code`), **bold text**, or [links](https://example.com) in your setting descriptions.

### Experimental Flags

Mark a setting as unstable or beta. This will render a visual badge in the settings UI.

```json
"myExtension.aiAutocomplete": {
  "type": "boolean",
  "title": "AI Autocomplete",
  "default": false,
  "experimental": true
}

```

### Deprecation Warnings

If you are replacing or removing an old setting, you can softly disable it and guide the user to the new one.

```json
"myExtension.oldThemeKey": {
  "type": "string",
  "title": "Legacy Theme (Deprecated)",
  "default": "dark",
  "deprecationMessage": "This setting is deprecated.",
  "markdownDeprecationMessage": "Please use `#myExtension.theme#` instead."
}

```

:::info 
**Configuration Scopes**
Settings can be scoped to different runtime environments using the `scope` property:

* `application`: Global settings applied across all windows.
* `window`: Settings applied to the current active window.
* `workspace`: Project-specific settings saved in `.vscode/settings.json`.
:::