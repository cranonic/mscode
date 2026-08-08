# Menu Module (@mscode/api)
The Menu Module allows extensions to contribute dynamic interface items—such as action items, submenu drop-downs, and layout splitters—to targeted panels within the application workbench layout (such as the code editor header toolbar or file directory explorer contextual menus).
Rather than executing absolute runtime overwrites when configuration collisions happen, the application layer triggers a structural **Deep-Merge and Auto-Flattening resolution algorithm**. This allows multiple independent extensions to collaboratively build out shared button contexts without breaking adjacent logic trees.
## Importing the Module
To access the menu registry interfaces, import the typed module explicitly from the framework dependency boundaries:
```typescript
import { menus } from '@mscode/api';
import type { MenuItem } from '@mscode/api';

```
## Core Engine Architecture Rules
To develop highly responsive and cooperative UI modules, you must structure operations around three engine-level compilation patterns:
### 1. The Deep-Merge Resolution Policy
When two or more distinct extension bundles execute configurations referencing the exact same menuPath and Anchor Option id, they do not blind-overwrite. The engine recursively computes changes. This structural safety mechanism enables developers to target an established third-party option node to mutate localized presentation values, such as altering a label or updating an icon, while leaving the foundational click triggers intact.
### 2. The Auto-Flattening Rule
The layout compiler dynamically alters the presentation state of an Option Anchor depending on the length of its parsed children list:
 * **Exactly One Child Node:** The parent option container completely flattens out. The inner layout engine surfaces the child item directly to the active interface layer, causing the child's icon, label, and layout position parameters to override parent properties.
 * **Multiple Child Nodes:** The parent option node immediately morphs into an interactive contextual **Sub-Menu Dropdown**, containing the child elements organized internally based on their defined weight rules.
### 3. Implicit Child Generation (Fallback Mode)
Providing execution logic directly via the parent onClick field without declaring a nested children array causes the engine to trigger its implicit child engine. During normalization, the parent node converts into a secure container, and its onClick function is safely packaged into a generated child element containing an automated reference key (such as parentAnchorId.children-1).
## Data Structure Interfaces
### MenuItem Definition
```typescript
export interface MenuItem {
  /** Unique identifier acting as the layout tree structural key. */
  id: string;
  
  /** Declares if this node is an interactive action item or a visual layout divider line. */
  type?: 'item' | 'separator';
  
  /** Presentation string rendered in text lists or triggered tooltips. */
  label?: string;
  
  /** System design token key reference pointing to the internal iconography collection. */
  icon?: string;
  
  /** Renders a persistent contextual toggle selection indicator alongside the node if true. */
  checked?: boolean;
  
  /** Toggles standard grey-out interactions and disables click execution loops when true. */
  disabled?: boolean;
  
  /** Textual label indicator informing desktop users of mapped hotkey shortcuts. */
  shortcut?: string;
  
  /** Secondary micro-copy rendered below or to the right of the primary display label. */
  description?: string;
  
  /** System context expression string evaluating user focus states before making the option visible. */
  when?: string | boolean;
  
  /** Hides the container node if the nested children collection is empty or hidden by context keys. */
  showOnlyWhenSubOptionAvailable?: boolean;
  
  /** Nested options array transforming the node context into an interactive sub-menu structure. */
  children?: MenuItem[];
  
  /** Runtime callback execution sequence fired when the element triggers an activated state. */
  onClick?: (data?: any) => void;
  
  /** Contextual database data or metadata parameters supplied into the activated execution block. */
  data?: any;
  
  /** Sorting calculation property determining absolute placement inside the target interface layer. */
  order?: number; 
  
  /** Explicit list arrays restricting this item layout representation to specified panel boundaries. */
  views?: string[]; 
  
  /** Forces the configuration tree logic to maintain a completely flat rendering strategy. */
  flat?: boolean | number; 
}

```
## API Execution Mechanics
### menus.registerItem
Appends an individual dynamic menu item element directly inside a specified interface position array.
```typescript
function registerItem(menuPath: string, item: MenuItem): Disposable;

```
### menus.registerItems
Appends an entire collection block of menu configuration objects or formatting separators to an interface panel location in a single transactional step.
```typescript
function registerItems(menuPath: string, items: MenuItem[]): Disposable;

```
### menus.openMenu
Programmatically invokes a context menu at specific coordinate boundaries. This is primarily utilized when building custom webviews, panels, or directory trees that require dynamic right-click menus populated with immediate default data blocks alongside registered third-party contributions.
```typescript
function openMenu(
  menuPath: string, 
  x: number, 
  y: number, 
  defaultItems?: MenuGroup[] | MenuItem[]
): void;

```
## Implementation Patterns & Use-Cases
### 1. Declarative Action Contribution (Single Child Pattern)
This is the recommended strategy for contributing a direct toolbar command. By declaring a single structural entry point within the children collection, the item utilizes the **Auto-Flattening** logic. The configuration displays as a single clickable action item inside the code editor header workspace, inheriting layout properties from its child target node.
```typescript
import { menus } from '@mscode/api';

export function activate(context: any) {
  const compilerAction = menus.registerItem('editor/title', {
    id: 'compiler.actions.container',
    label: 'Execute Compiler Options',
    icon: 'play',
    children: [
      {
        id: 'compiler.actions.run-binary',
        label: 'Compile and Execute Script Target',
        icon: 'zap',
        order: 100,
        onClick: () => {
          console.log('Compiling source code binaries...');
        }
      }
    ]
  });

  context.subscriptions.push(compilerAction);
}

```
### 2. Multi-Extension Menu Injection (Extending Existing Items)
To append sub-options to a button layout space managed by an adjacent extension suite, do not modify its source package. Instruct your module to register a clean child option targeting the existing parent Option Anchor ID. The internal layout resolution loop changes the representation, instantly converting a standalone functional icon button into an explicit interactive dropdown sub-menu panel.
```typescript
import { menus } from '@mscode/api';

export function activate(context: any) {
  const terminalOption = menus.registerItem('editor/title', {
    id: 'compiler.actions.container', // Targeting the identical core Anchor Option ID
    children: [
      {
        id: 'terminal-extension.run-in-shell',
        label: 'Execute Directly inside Sandbox Shell',
        icon: 'terminal',
        order: 150,
        onClick: () => {
          console.log('Redirecting program pipeline out to sandboxed terminal host...');
        }
      }
    ]
  });

  context.subscriptions.push(terminalOption);
}

```
### 3. Contextual Target Rendering with Layout Separators
Use registerItems to construct compound option groups separated by design dividers. This approach leverages conditional context strings (when) to ensure utility buttons only render when the user focuses on specific workspace states.
```typescript
import { menus } from '@mscode/api';

export function activate(context: any) {
  const operationsGroup = menus.registerItems('editor/context', [
    {
      id: 'git-utility.stage-changes',
      label: 'Stage Selected Document Targets',
      icon: 'git-compare',
      order: 10,
      when: 'editorHasChanges && fileLanguageId == typescript',
      onClick: () => console.log('Staging document mutations to git repository indexes...')
    },
    {
      id: 'git-utility.divider-line',
      type: 'separator',
      order: 15 
    },
    {
      id: 'git-utility.discard-changes',
      label: 'Purge Modified Buffers',
      icon: 'discard',
      order: 20,
      when: 'editorHasChanges',
      onClick: () => console.log('Reverting dynamic text buffer streams back to stable head...')
    }
  ]);

  context.subscriptions.push(operationsGroup);
}

```
### 4. Direct Node Target Modification (Safe Override Pattern)
If you must change specific design values or language translations of an active option element without altering its internal logic or underlying execution code paths, call registerItem targeting the exact child element identifier.
```typescript
import { menus } from '@mscode/api';

export function activate(context: any) {
  const customLabelOverride = menus.registerItem('editor/title', {
    id: 'compiler.actions.container',
    children: [
      {
        id: 'compiler.actions.run-binary', // Targets the unique Child ID explicitly
        label: 'Build Target System (Overridden Variant Title Name)' 
      }
    ]
  });

  context.subscriptions.push(customLabelOverride);
}

```
### 5. Programmatic Context Menu Invocation
When developing custom UI surfaces (like a database schema tree or a dedicated graphical panel), you must capture standard pointer events and invoke contextual layout menus dynamically. The menus.openMenu function merges your immediate contextual data blocks alongside any external extensions that target the identical menuPath.
```tsx
import React from 'react';
import { menus } from '@mscode/api';

export const DatabaseTableRow = ({ tableName, isLocked }) => {
  
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Inject custom contextual action blocks. 
    // Other extensions can append items to 'database/table/context' independently.
    menus.openMenu('database/table/context', e.clientX, e.clientY, [
      {
        options: [
          {
            id: 'db.table.export',
            label: 'Export Table Data',
            icon: 'export',
            showOnlyWhenSubOptionAvailable: true,
            children: [
              { 
                id: 'db.table.export.csv', 
                label: 'Export as CSV', 
                onClick: () => console.log(`Exporting ${tableName} to CSV...`) 
              },
              { 
                id: 'db.table.export.json', 
                label: 'Export as JSON', 
                onClick: () => console.log(`Exporting ${tableName} to JSON...`) 
              }
            ]
          },
          {
            id: 'db.table.truncate',
            label: 'Truncate Table Data',
            icon: 'trash',
            disabled: isLocked, // Contextually disable if the table is locked
            onClick: () => console.log(`Issuing TRUNCATE query for ${tableName}...`)
          }
        ]
      }
    ]);
  };

  return (
    <div onContextMenu={handleRightClick} className="db-table-row">
      <span className="icon">db</span>
      <span className="label">{tableName}</span>
    </div>
  );
};

```
