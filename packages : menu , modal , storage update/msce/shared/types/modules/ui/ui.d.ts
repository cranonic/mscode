// types/modules/ui/ui.d.ts

import type { FC, ReactNode, ChangeEvent, ButtonHTMLAttributes , MouseEvent , CSSProperties } from 'react';


export type IconName = string;


// declare module '@mscode/api' {
  

// ─── Component Prop Interfaces ──────────────────────────────────────────

  export interface CollapsibleProps {
    /** The text or custom element to display in the header. */
    title: string | ReactNode;
    
    /** Initial expansion state if uncontrolled. @default true */
    defaultExpanded?: boolean;
    
    /** Forces the expansion state (Controlled mode managed by parent). */
    expanded?: boolean; 
    
    /** Callback fired when the header is clicked and isCollapsible is true. */
    onToggle?: (expanded: boolean) => void; 
    
    /** If false, clicking the header will NOT toggle the content, and default chevrons are hidden. @default true */
    isCollapsible?: boolean;
    
    /** Custom icon name (Codicon) or React node when expanded. @default 'chevron-down' */
    iconExpanded?: string | ReactNode;
    
    /** Custom icon name (Codicon) or React node when collapsed. @default 'chevron-right' */
    iconCollapsed?: string | ReactNode;

    /** Allows the content area to consume remaining flex space in a flex container. */
    fillHeight?: boolean; 
    
    /** Shows a vertical line on the left side of the content for visual grouping. */
    showGuideLine?: boolean; 
    
    // ── Sticky Header Props ──
    /** Makes the header stick to the top during scrolling. */
    makeSticky?: boolean;
    /** The top offset when sticky. @default 0 */
    stickyTop?: number;
    /** The Z-Index when sticky. @default 10 */
    stickyZIndex?: number;
    /** The left offset when sticky. */
    stickyLeft?: number | string; 
    
    // ── Styling ──
    /** Custom inline styles for the outermost container. */
    style?: CSSProperties; 
    /** Custom inline styles specifically for the header row. */
    headerStyle?: CSSProperties;
    /** Custom inline styles specifically for the title text wrapper. */
    titleStyle?: CSSProperties; 
    
    /** The internal content revealed when expanded. */
    children: ReactNode;
    
    // ── Actions ──
    /** * Dynamic MS Code MenuItems to render on the right side. 
     * Automatically integrates with the IDE's SidebarActions engine. 
     */
    actions?: any[]; // Accepts MenuItem[] from menus module
    
    /** Custom ID for the action menu registration and overflow tracking. */
    actionMenuId?: string;
    
    /** Maximum number of inline actions to show before collapsing the rest into a '...' dropdown. */
    maxOverflow?: number;
    
    /** Legacy support for rendering arbitrary React elements as actions on the right side. */
    rightActions?: ReactNode;
    
    // ── Events ──
    /** Callback fired when the header row is clicked. */
    onHeaderClick?: (e: any) => void;
    /** Callback fired when the user right-clicks the header row. */
    onHeaderContextMenu?: (e: any) => void;
  }

  /** Configuration for individual segments within a split-layout Button. */
  export interface ButtonSplitProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
    /** Optional Codicon name or React element to display inside this specific split segment. */
    icon?: ReactNode;
    /** Position of the icon relative to the label. @default 'left' */
    iconPosition?: 'left' | 'right';
    /** Text label or content for this specific segment. */
    label?: ReactNode;
    /** Custom CSS class for this segment. */
    className?: string;
    /** Inline style overrides for this segment. */
    style?: CSSProperties;
  }

  /** Configuration interface for the MS Code Native Button component. */
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** * Visual style variant of the button matching native IDE tokens. 
     * @default 'type2' 
     */
    variant?: 'type1' | 'type2';
    /** Optional Codicon name or React element to display. */
    icon?: ReactNode;
    /** Position of the icon relative to the children/label. @default 'left' */
    iconPosition?: 'left' | 'right';
    /** Forces the button to span 100% of its container width. @default false */
    fullWidth?: boolean;
    /** Reduces the vertical and horizontal padding for tighter layouts. @default false */
    narrow?: boolean;
    /** Custom border-radius override (e.g., '4px'). */
    radius?: string;
    /** Custom inline styles applied to the outer button container. */
    customStyle?: CSSProperties;
    
    // ── Dynamic Split Support ──
    /** * Array of configuration objects to render a multi-segment "Split" button.
     * If provided, the standard `children` prop is ignored.
     */
    splits?: ButtonSplitProps[];
    /** * CSS Grid fractional ratios determining the width of each split segment.
     * @example [6, 1] // First segment gets 6fr, second gets 1fr
     */
    splitRatios?: number[];
    /** The gap between split segments. @default '1px' */
    splitGap?: string | number;
  }

  /** Represents a single dropdown option within a SplitButton menu. */
  export interface SplitButtonOption {
    /** The display text of the menu option. */
    label: string;
    /** Callback executed when this specific option is selected. */
    onClick: () => void;
    /** Disables this specific option, preventing interaction. */
    disabled?: boolean;
  }

  /** Configuration interface for the MS Code Native SplitButton component. */
  export interface SplitButtonProps {
    /** The text label displayed on the main (primary) section of the button. */
    label: string;
    /** Callback executed when the main (primary) section of the button is clicked. */
    onClick: () => void;
    /** Array of selectable options rendered in the dropdown menu when the chevron is clicked. */
    options: SplitButtonOption[];
    /** Disables the entire component (both main button and chevron). @default false */
    disabled?: boolean;
    /** Forces the component to span 100% of its container width. @default false */
    fullWidth?: boolean;
    /** Custom inline styles applied to the outer container. */
    style?: CSSProperties;
    /** Optional CSS class appended to the outer container. */
    className?: string;
  }

  export interface IconProps {
  /** * Name of the target asset. Supports 3 configurations:
   * 1. A recognized internal token (e.g., `'save'`, `'search'`).
   * 2. A remote direct HTTP/HTTPS link or standalone Base64 DataURI.
   * 3. A fallback standard fallback Codicon system string (e.g., `'bell'`, `'git-compare'`).
   */
  name: IconName | string;

  /** Edge bounding box size width and height scale in pixels. Defaults to `16`. */
  size?: number;

  /** CSS hex, rgb, or variable color injected directly into the graphic instance. */
  color?: string;

  /** Standard optional wrapper layout class styling descriptor. */
  className?: string;

  /** Optional event hook capturing user cursor touch or click frames. */
  onClick?: (e: MouseEvent<HTMLElement>) => void;

  /** Fallback raw CSS structural style matrix properties. */
  style?: CSSProperties;

  /** Optional HTML browser descriptive hovering caption text. */
  title?: string;
}

  export interface InputBoxProps {
  /** The current controlled string value of the input field. */
  value: string;

  /**
   * Callback triggered immediately when the input text changes.
   * @param val The updated string value from the element.
   */
  onChange: (val: string) => void;

  /** Ghost placeholder text displayed when the input value is empty. */
  placeholder?: string;

  /** * Specifies the HTML input type (e.g., 'text', 'password', 'email', 'number').
   * @default 'text'
   */
  type?: string;

  /** * Disables the input field, preventing user interaction and applying a dimmed visual state.
   * @default false
   */
  disabled?: boolean;

  /** * Optional CSS class appended to the outermost container for custom layout targeting.
   */
  className?: string;
  
  /** * **Zone 1:** Icon rendered outside the input block on the far-left side.
   * Ideal for section anchors or structural labels.
   */
  leftOutsideIcon?: ReactNode;

  /** * **Zone 2:** Action or descriptive icon embedded inside the input frame on the left.
   * @example <Icon name="search" />
   */
  leftInsideIcon?: ReactNode;

  /** * **Zone 3:** Icons layout stacked inside the input frame on the far-right side.
   * Perfect for control triggers like Regex toggles, Match Case, or Clear actions.
   */
  rightInsideIcons?: ReactNode;

  /** * **Zone 4:** Icon layout positioned completely outside the input wrapper on the far-right.
   * Recommended for action triggers like "Go", "Submit", or return buttons.
   */
  rightOutsideIcons?: ReactNode;
  
  // ------------------------------------------------------
  // ------------------------------------------------------
  
  /** @deprecated Legacy fallback prop. Use `leftOutsideIcon` instead. */
  leftIcon?: ReactNode;
  /** @deprecated Legacy fallback prop. Use `rightInsideIcons` instead. */
  insideIcons?: ReactNode;
  /** @deprecated Legacy fallback prop. Use `rightOutsideIcons` instead. */
  outsideIcons?: ReactNode;
}

/**
 * Configuration schema for the MS Code Native Modal Component.
 */
export interface ModalProps {
  /** Controls the visibility state of the modal viewport overlay. */
  isOpen: boolean;

  /** Primary header title string displayed at the top left of the modal wrapper. */
  title: string;

  /** * Optional icon token from the Codicon registry to be positioned right before the header title.
   * @example 'info', 'gear', 'warning'
   */
  iconName?: IconName | string; 

  /** * Triggers immediately when clicking the close (X) icon button or hitting the `Escape` key.
   * Use this boundary frame callback to revert the `isOpen` state flag to false.
   */
  onClose: () => void;

  /** Inside markup nodes rendered straight within the scrollable content container body view layer. */
  children: ReactNode;

  /** * Target action components (like Buttons) to append sequentially inside the sticky lower bottom panel zone.
   * @example 
   * ```tsx
   * <div style={{ display: 'flex', gap: '8px' }}>
   * <Button label="Cancel" variant="secondary" onClick={onClose} />
   * <Button label="Save Changes" onClick={handleSave} />
   * </div>
   * ```
   */
  footerActions?: ReactNode;
}

/**
 * Defines the structure for an individual option inside the Select component.
 */
export interface SelectOption {
  /** The technical value associated with the option */
  value: string;
  /** The display label shown to the user */
  label: string;
  /** Optional secondary details shown alongside the label */
  description?: string;
  /** Optional element rendered on the left side of the option */
  leftIcon?: ReactNode; 
  /** Optional element rendered on the right side of the option */
  rightIcon?: ReactNode; 
  /** Determines if the individual option is interactive */
  disabled?: boolean;
}


/**
 * Properties configuration for the Select component.
 */
interface SelectProps {
  /** List of options to be rendered inside the dropdown */
  options: SelectOption[];
  /** The currently selected value */
  value: string;
  /** Callback triggered when a new option is selected */
  onChange: (value: string) => void;
  /** Inline styles applied directly to the outer container */
  style?: CSSProperties;
  /** Custom class names to append to the outer container */
  className?: string; 
  /** If true, wraps long text labels instead of truncating them */
  wrapOptions?: boolean; 
  /** Controls where the dropdown menu opens relative to the trigger button */
  placement?: 'top' | 'bottom';
  /** If true, disables the entire component and prevents interaction */
  disabled?: boolean;
}

/**
 * Properties configuration for the RichText component.
 */
export interface RichTextProps {
  /** The raw markdown text to be rendered. */
  text?: string;
  /** Callback fired when an internal link (e.g., #setting-id) is clicked. */
  onLinkClick?: (target: string) => void;
  /** Custom CSS class names to append to the outer markdown container. */
  className?: string;
}



// ─── UI Module Namespace ────────────────────────────────────────────────

  export namespace ui {
    /**
     * MS Code Native React Components.
     * These components use the IDE's exact CSS variables and design tokens, ensuring 
     * that any Webview or Custom Panel built by an extension looks 100% native.
     */
    export namespace components {
      /** Highly flexible Collapsible/Accordion component. */
      export const Collapsible: FC<CollapsibleProps>;
      
      /** Standard MS Code Button. Supports variants and icons. */
      export const Button: FC<ButtonProps>;
      
      export const SplitButton: FC<SplitButtonProps>;
      
      /** Standard MS Code Icon component leveraging the Codicon library. */
      export const Icon: FC<IconProps>;
      
      /** Native Input Box for text entry with optional inside-icons. */
      export const InputBox: FC<InputBoxProps>;
      
      /** Native MS Code Modal component for building custom dialogs. */
      export const Modal: FC<ModalProps>;
      
      /** Native MS Code Select Dropdown. */
      export const Select: FC<SelectProps>;
      
      /** Native RichText component to render Markdown content (supports `#setting#` links). */
      export const RichText: FC<RichTextProps>;
    }
    
    // Tabs (Custom Webview API equivalent)
    export namespace tabs {
      /**
       * Registers a custom React component to be rendered when a specific tab `type` is opened.
       * This is the equivalent of VS Code's Custom Webview API, but powered natively by React!
       * * @param type The unique type identifier of the tab (e.g., 'git-graph', 'database-viewer').
       * @param component The React component that will be rendered inside the tab.
       * * @example
       * import { tabs } from '@mscode/ui';
       * * const MyCustomView = () => <div>Hello from Custom Tab!</div>;
       * tabs.registerTab('my-custom-view', MyCustomView);
       * * // Later, open it using the Window API:
       * // mscode.window.openTab({ id: 'view-1', title: 'My View', type: 'my-custom-view' });
       */
      export function registerTab(type: string, component: React.ComponentType<any>): void;
    }
    
    
  } 

  

  declare module '@mscode/ui' {
  import type { FC } from 'react';
  // Note: These interfaces are automatically picked up from the exports above.
  
  export const Button: FC<ButtonProps>;
  export const SplitButton: FC<SplitButtonProps>;
  export const Collapsible: FC<CollapsibleProps>;
  export const Icon: FC<IconProps>;
  export const InputBox: FC<InputBoxProps>;
  export const Modal: FC<ModalProps>;
  export const Select: FC<SelectProps>;
  export const RichText: FC<RichTextProps>;
  
  export const tabs: typeof ui.tabs;
}