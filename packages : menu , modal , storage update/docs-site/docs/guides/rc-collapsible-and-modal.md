# Modal & Collapsible (Basic to Pro)

In MSCode, building complex settings windows, forms, or confirmation dialogs is incredibly easy. Instead of writing custom CSS, you can use our native React UI components that perfectly match the IDE's theme.

In this guide, we will learn how to use the `<Modal>` component, recap the `<Collapsible>` component, and finally combine them to build a professional-grade Extension UI.

---

## Part 1: The Modal Component

The `<Modal>` component creates a native IDE overlay. It automatically handles background dimming, dark/light theme variables, and even closes natively when the user presses the `Escape` key[cite: 9].

### Props Overview
* `isOpen` (boolean): Controls the visibility of the modal[cite: 9].
* `title` (string): The header title[cite: 9].
* `iconName` (string): Optional icon for the header (e.g., `new-folder`, `gear`)[cite: 9].
* `onClose` (function): Triggered when the X button or Escape key is pressed[cite: 9].
* `footerActions` (ReactNode): Sticky action buttons at the bottom[cite: 9].

### Basic Modal Example
```tsx
import React, { useState } from 'react';

const { Modal, Button } = mscode.ui.components;

export const SimpleModalView = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick="{()"> setIsOpen(true)}>Open Settings</Button>
      
      <Modal iconName="gear" isOpen="{isOpen}" onClose="{()" title="Extension Settings"> setIsOpen(false)}
        footerActions={
          <Button onClick="{()"> setIsOpen(false)}>Save & Close</Button>
        }
      >
        <div style={{ padding: '16px' }}>
          <p>Toggle your preferences here.</p>
        </div>
      </Modal>
    </>
  );
};

```

---

## Part 2: The Collapsible Component (Quick Recap)

The `<Collapsible>` component allows you to group content into accordion-style sections. It is perfect for hiding advanced settings or large lists to keep your UI clean.

```tsx
const { Collapsible } = mscode.ui.components;

<Collapsible defaultExpanded="{false}" title="Advanced Options">
  <div style={{ padding: '10px' }}>
    <p>Only pro users should touch this!</p>
  </div>
</Collapsible>

```

---

## Part 3: The Combo (Modal + Collapsible)

When building a real extension, you rarely use just one component. Let's combine them! We will create a robust Settings Modal where different categories are grouped using `Collapsible` sections.

```tsx
import React, { useState } from 'react';

const { Modal, Collapsible, Button } = mscode.ui.components;

export const AdvancedSettingsModal = ({ isOpen, onClose }) => {
  return (
    <Modal < footerActions="{" iconName="server" isOpen="{isOpen}" onClose="{onClose}" title="Deployment Configuration">
          <Button label="Cancel" onClick="{onClose}" variant="secondary"/>
          <Button label="Deploy Now" onClick="{()"> alert('Deploying...')} />
        </>
      }
    >
      
      <Collapsible defaultExpanded="{true}" title="General Settings">
        <div style={{ padding: '10px 16px' }}>
          <label>Environment Name:</label>
          <input type="text" defaultValue="Production" style={{ width: '100%' }} />
        </div>
      </Collapsible>

      
      <Collapsible defaultExpanded="{false}" iconCollapsed="warning" iconExpanded="warning" title="Danger Zone">
        <div style={{ padding: '10px 16px', color: 'red' }}>
          <p>Warning: Changing these settings might break your deployment.</p>
          <Button label="Purge Cache" onClick="{()"> console.log('Purged!')} />
        </div>
      </Button></Collapsible>
    </Button></Modal>
  );
};

```

---

## Part 4: Mini Extension Project (Zero to Hero)

To write clean and maintainable extensions, we should **never** put all our code inside the `activate` function. A professional extension keeps the UI, feature registration, and lifecycle management separated.

Let's tie everything together in a production-ready `main.jsx`:

```javascript
// src/main.jsx

const { Collapsible, Modal, Button } = mscode.ui.components;
const React = mscode.ui.React; 
const { useState } = React;

// ─── 1. Separate UI Component ──────────────────────────────────────────────
const SuperPluginUI = () => {
  const [showModal, setShowModal] = useState(false);

  // Expose a global method to open the modal from the command palette
  window.openSuperPluginModal = () => setShowModal(true);

  return (
    <Modal iconName="settings" isOpen={showModal} onClose={() => setShowModal(false)} title="Super Plugin Settings"
      footerActions={<Button onClick={() => setShowModal(false)}>Done</Button>}
    >
      <Collapsible defaultExpanded={true} title="User Preferences">
         <div style={{ padding: '15px' }}>Auto-save is ENABLED.</div>
      </Collapsible>
      
      <Collapsible defaultExpanded={false} title="Developer Tools">
         <div style={{ padding: '15px' }}>Debug mode is DISABLED.</div>
      </Collapsible>
    </Modal>
  );
};

// ─── 2. Separate Feature Registration ──────────────────────────────────────
function registerExtensionFeatures(context) {
  // Register a Command to open the Modal
  const command = mscode.commands.registerCommand('superPlugin.showSettings', () => {
    if (window.openSuperPluginModal) {
      window.openSuperPluginModal();
    }
  });

  // Register a Top Bar Menu Icon to trigger the command
  const menu = mscode.menus.registerMenuItem('editor/title', {
    id: 'superPlugin.btn',
    label: 'Super Plugin',
    icon: 'gear',
    onClick: () => mscode.commands.executeCommand('superPlugin.showSettings')
  });

  // Push to subscriptions for automatic cleanup on uninstall/disable
  context.subscriptions.push(command, menu);
}

// ─── 3. The Clean Entry Point (Lifecycle) ──────────────────────────────────
function activate(context) {
  console.log("[Super Plugin] Booting up...");

  // Render the UI silently in the background
  mscode.window.renderExtensionView(SuperPluginUI);

  // Register commands, menus, and events
  registerExtensionFeatures(context);
  
  console.log("[Super Plugin] Activated successfully!");
}

function deactivate() {
  // Clean up any loose memory (if required)
  console.log("[Super Plugin] Deactivated.");
}

module.exports = { activate, deactivate };

```

### What did we just build?

1. We created a custom React Component containing our **Modal** and **Collapsible**.
2. We registered a background command `superPlugin.showSettings`.
3. We added a button to the Editor Title bar.
4. When the user clicks the icon, the native Modal pops up with beautifully grouped Collapsible sections!

Happy coding!