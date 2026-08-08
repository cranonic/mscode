// types/modules/themes/themes.d.ts

declare module '@mscode/api' {

  // COLOR THEMES INTERFACES

  /**
   * Structural interface matching the exact layout variables tracked across the 
   * document application interface (`theme.css`). 
   */
  export interface MSCodeUIColors {
    'ms-bg-main':         string;
    'ms-bg-side':         string;
    'ms-bg-activity':     string;
    'ms-activity-hover':  string;
    'ms-tab-inactive-bg': string;
    'ms-tab-active-bg':   string;
    
    'ms-text-main':       string;
    'ms-text-side':       string;
    'ms-text-activity':   string;
    'ms-text-faded':      string;
    'ms-text-bright':     string;
    
    'ms-border-light':    string;
    'ms-border-dark':     string;
    'ms-menu-border':     string;
    'ms-separator':       string;
    'ms-accent':          string;
    'ms-icon-hover-bg':   string;
    'ms-menu-hover-bg':   string;
    'ms-shadow':          string;
    'ms-settings-bg':             string;
    'ms-settings-category-color': string;
    'ms-settings-title-color':    string;
    'ms-settings-desc-color':     string;
    'ms-settings-link-color':     string;
    'ms-input-bg':                string;
    'ms-input-fg':                string;
    'ms-input-border':            string;
    'ms-input-focus-border':      string;
    'ms-code-bg':                 string;
    'ms-code-fg':                 string;
  }

  /**
   * Token compilation rule modeling standard syntax categorization parameters 
   * mirroring VS Code and TextMate grammars.
   */
  export interface TokenColor {
    /** Target text parsing descriptor string or sequence of matching context scopes. */
    scope: string | string[];
    /** Applied lexical parsing style attributes. */
    settings: {
      /** Target Hex color identifier tracking token typography layouts. */
      foreground?: string;
      /** Background box highlight tracking single token entities. */
      background?: string;
      /** Typographical style flags: "bold" | "italic" | "underline" | "bold italic" | "" */
      fontStyle?: string;
    };
  }

  /**
   * Complete Theme Definition Matrix.
   * Serves as the public contract interface consumed by system expansion module developer packages.
   */
  export interface ThemeDefinition {
    /** Unique identifying token. Recommended format: "publisher-namespace.theme-name" */
    id:   string;
    /** Public user-facing display label for selectors and option inputs. */
    name: string;
    /** Primary systemic styling base architecture. */
    type: 'dark' | 'light' | 'high-contrast';
    /** Application UI layout maps. */
    uiColors: Partial<MSCodeUIColors>;
    /** Monaco Editor syntax tokenizer tree. */
    tokenColors: TokenColor[];
    /** Optional specialized overrides mapping native parameters inside Monaco Editor Viewports. */
    editorColors?: Record<string, string>;
  }

  // ICON THEMES INTERFACES

  /**
   * Structure defining the mapping rules between file names, extensions, and their visual icons.
   */
  export interface IconThemeMap {
    /** Default icon for files that don't match any specific rule. */
    file?: string;
    /** Default icon for folders. */
    folder?: string;
    /** Default icon for expanded/open folders. */
    folderExpanded?: string;
    /** Default icon for the root workspace folder. */
    rootFolder?: string;
    /** Default icon for an expanded root workspace folder. */
    rootFolderExpanded?: string;
    /** Mapping of explicit folder names to icon names (e.g., 'node_modules': 'folder-node'). */
    folderNames?: Record<string, string>;
    /** Mapping of explicit expanded folder names to icon names. */
    folderNamesExpanded?: Record<string, string>;
    /** Mapping of exact file names to icon names (e.g., 'package.json': 'npm'). */
    fileNames?: Record<string, string>;
    /** Mapping of file extensions to icon names (e.g., 'ts': 'typescript'). */
    fileExtensions?: Record<string, string>;
    /** Mapping of programming language IDs to icon names (e.g., 'javascript': 'javascript'). */
    languageIds?: Record<string, string>;
  }

  /**
   * Complete blueprint defining an installable Icon Theme.
   */
  export interface IconThemeDefinition {
    /** Universally unique identifier for the theme (e.g., 'my-material-icons'). */
    id: string;
    /** Human-readable display name rendered in the Settings UI drop-down. */
    name: string;
    /** The mapping rules connecting file types to specific Codicon or SVG names. */
    themeMap: Partial<IconThemeMap>;
  }

  /**
   * Represents a resolved icon asset ready for UI rendering.
   */
  export interface ResolvedIcon {
    /** The type of icon rendering ('class' for icon fonts, 'image' for direct SVG/PNG paths). */
    type: 'class' | 'image';
    /** The actual CSS class name or image source URL. */
    value: string;
  }

  // MAIN THEMES NAMESPACE

  export namespace themes {
    
    // ─── COLOR THEMES ──────────────────────────────────────────────────────────
    export namespace color {
      /**
       * Registers a pre-defined TypeScript/JavaScript color theme object.
       * 
       * @param def The theme definition object.
       * @returns A disposable object to unregister the theme on deactivation.
       * 
       * @example
       * import { themes } from '@mscode/api';
       * 
       * const oceanTheme = {
       *   id: 'my-studio.ocean-blue',
       *   name: 'Ocean Blue',
       *   type: 'dark',
       *   uiColors: { 'ms-bg-main': '#0f172a' },
       *   tokenColors: []
       * };
       * const disposable = themes.color.register(oceanTheme);
       */
      export function register(def: ThemeDefinition): Disposable;

      /**
       * Registers a theme from a raw JSON string or object.
       * Ideal for fetching themes dynamically from a remote database/API or file system.
       * 
       * @param json A valid theme JSON string or object.
       * @returns A disposable object to unregister the theme.
       */
      export function registerFromJson(json: string | object): Disposable;

      /**
       * Returns the unique ID of the currently active color theme.
       * 
       * @returns {string} The active theme ID (e.g., 'mscode-dark').
       */
      export function getActiveThemeId(): string;

      /**
       * Retrieves a list of all registered color themes (both built-in and extension-contributed).
       * 
       * @returns Array of full theme definition structures.
       */
      export function getAll(): { definition: ThemeDefinition; source: string; extensionId?: string }[];

      /**
       * Programmatically switches the editor to a registered color theme.
       * This will instantly update the DOM CSS variables and the Monaco Editor syntax colors.
       * 
       * @param id The unique ID of the theme to apply.
       */
      export function setTheme(id: string): void;

      /**
       * Fires whenever the active color theme changes (via API or user settings).
       * 
       * @param callback Function that receives the new active theme ID.
       * @returns A disposable object to unregister the listener.
       * 
       * @example
       * import { themes } from '@mscode/api';
       * 
       * themes.color.onDidChangeColorTheme((newThemeId) => {
       *   console.log("Color theme changed to:", newThemeId);
       * });
       */
      export function onDidChangeColorTheme(callback: (themeId: string) => void): Disposable;
    }

    // ─── ICON THEMES ───────────────────────────────────────────────────────────
    export namespace icon {
      /**
       * Registers a new Type-Safe JavaScript/TypeScript icon theme into the IDE environment.
       * Instantly makes the theme available in the user's `workbench.iconTheme` settings.
       * 
       * @param def The structured icon theme definition.
       * @returns A disposable object to safely unregister the theme upon extension deactivation.
       * 
       * @example
       * import { themes } from '@mscode/api';
       * 
       * const dispose = themes.icon.register({
       *   id: 'my-custom-icons',
       *   name: 'Awesome Custom Icons',
       *   themeMap: {
       *     fileExtensions: { 'tsx': 'react-ts', 'rs': 'rust' },
       *     folderNames: { 'src': 'folder-src' }
       *   }
       * });
       */
      export function register(def: IconThemeDefinition): Disposable;

      /**
       * Registers an icon theme parsed from a raw JSON string or object payload.
       * Useful for porting existing VS Code icon theme JSON files directly.
       * 
       * @param json The JSON string or parsed object representing the theme definition.
       * @returns A disposable object to unregister the theme.
       */
      export function registerFromJson(json: string | object): Disposable;

      /**
       * Retrieves the universally unique identifier of the currently active icon theme.
       * 
       * @returns {string} The active theme ID (e.g., 'mscode-icons').
       */
      export function getActiveThemeId(): string;

      /**
       * Retrieves a list of all currently registered and available icon themes.
       */
      export function getAll(): IconThemeDefinition[];

      /**
       * Programmatically forces the IDE to switch to a specific registered icon theme.
       * 
       * @param id The unique identifier of the theme to apply.
       */
      export function setTheme(id: string): void;
      
      /**
       * Resolves the visual icon asset for a specific file or folder based on the currently active theme.
       * Extremely useful for rendering correct icons in custom Tree Views or Quick Picks.
       * 
       * @param fileName The raw base filename (e.g., 'package.json', 'src').
       * @param isDirectory Flag specifying if the current node is a folder.
       * @param isOpen Optional flag for folders to get their expanded icon state.
       * @returns A payload specifying whether to render a CSS class or an `<img>` tag.
       * 
       * @example
       * import { themes } from '@mscode/api';
       * 
       * const icon = themes.icon.getFileIcon('package.json', false);
       * if (icon.type === 'image') {
       *   return `<img src="${icon.value}" width="16" />`;
       * } else {
       *   return `<i class="${icon.value}"></i>`;
       * }
       */
      export function getFileIcon(fileName: string, isDirectory: boolean, isOpen?: boolean): ResolvedIcon;

      /**
       * Resolves the icon associated with a specific programming language identifier.
       * 
       * @param langId Target language tracking key (e.g., 'typescript', 'python').
       * @returns The resolved icon asset configuration.
       */
      export function getLanguageIcon(langId: string): ResolvedIcon;

      /**
       * Fires whenever the active icon theme changes (either programmatically or via user settings).
       * 
       * @param callback Function receiving the newly applied theme ID.
       * @returns A disposable object to detach the listener.
       * 
       * @example
       * import { themes } from '@mscode/api';
       * 
       * themes.icon.onDidChangeIconTheme((themeId) => {
       *   console.log(`The IDE is now using ${themeId}`);
       * });
       */
      export function onDidChangeIconTheme(callback: (themeId: string) => void): Disposable;
    }

  }
}