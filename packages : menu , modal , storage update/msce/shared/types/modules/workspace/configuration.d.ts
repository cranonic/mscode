// types/modules/workspace/configuration.d.ts

declare module '@mscode/api' {
  
  /** 
   * Valid runtime scalar and complex primitive types supported by the setting definitions. 
   */
  export type SettingType = 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'object' | 'array' | 'null';

  /** 
   * Structural definition for individual selections used in bounded 'select' schema varieties. 
   */
  export interface SettingOption {
    value: string;
    label: string;
    description?: string;
    markdownDescription?: string;
  }

  /**
   * Structural validation and metadata profile configuration for a single key-value setting.
   */
  export interface ConfigurationProperty {
    /** Structural scalar configuration primitive target validation blueprint type. */
    type: SettingType;
    
    /** 
     * Baseline fallback configuration state. 
     * Note: Depending on the specific IDE engine parsing the JSON, this is sometimes keyed as `defaultValue`. 
     */
    default?: any;
    defaultValue?: any;
    
    /** Visual header title caption label rendered on structural elements. */
    title?: string;
    
    /**
     * Description shown under the setting. Always rendered as markdown
     * (same as markdownDescription). Prefer this field; markdownDescription
     * still wins when both are set.
     */
    description?: string;
    
    /** Optional rich markdown; takes precedence over description when set. */
    markdownDescription?: string;

    /** 
     * Top-level grouping category in the settings UI.
     * @example "Highlighting"
     */
    category?: string;

    /** 
     * Nested grouping in the settings UI. You can use `>` to create deeper nesting.
     * @example "Highlighting > Semantic Highlighting"
     */
    subCategory?: string;

    /** 
     * Array of searchable keywords to help users find this setting easily.
     * @example ['display', 'highlight', 'color']
     */
    tags?: string[];

    /** Explicit array objects binding key indices directly into dynamic rendering selectors. */
    options?: SettingOption[];
    
    /** Shorthand arrays declaring primitive acceptable fallback constraints natively. */
    enum?: (string | number | boolean | null)[];
    
    /** Plain description names associated with structural positions inside alternative enum paths. */
    enumItemLabels?: string[];
    
    /** Enforces numeric minimum evaluation parameters. */
    minimum?: number;
    
    /** Enforces numeric maximum evaluation parameters. */
    maximum?: number;
    
    /** Regular expression validation string used to verify structure strings before saving. */
    pattern?: string;
    
    /** Context error notification displayed when standard regular expression patterns fail. */
    patternErrorMessage?: string;
    
    /** Positional arrangement sort criteria. Lower numbers appear first. */
    order?: number;
  }

  /**
   * Top-level structure mapping configurations into contextual groups.
   */
  export interface IConfigurationSection {
    id: string;
    title: string;
    order?: number;
    properties: Record<string, ConfigurationProperty>;
  }

  export interface WorkspaceConfiguration {
    /**
     * Retrieves a configuration value.
     * @param key The configuration key (e.g., 'port').
     * @param defaultValue The fallback value if the key is not found in user settings.
     * @returns The value from settings or the provided default.
     */
    get<T>(key: string, defaultValue?: T): T;
    
    /**
     * Updates a configuration value globally.
     * @param key The configuration key (e.g., 'fontSize').
     * @param value The new value to set.
     */
    update(key: string, value: any): void;
  }

  /**
   * @description
   * **Mono Studio Configuration API & Manifest Guide**
   * 
   * You can define your extension settings in `manifest.json` in two ways:
   * 
   * **Method 1: Direct Object Definition (Good for small settings)**
   * ```json
   * // manifest.json
   * {
   *   "name": "my-extension",
   *   "configuration": {
   *     "my-extension.enable": {
   *       "type": "boolean",
   *       "defaultValue": true,
   *       "title": "Enable Extension"
   *     }
   *   }
   * }
   * ```
   * 
   * **Method 2: External JSON File Reference (Recommended for large settings)**
   * ```json
   * // manifest.json
   * {
   *   "name": "my-extension",
   *   "configuration": "./config/settings.json"
   * }
   * ```
   * 
   * **Usage Example in Code:**
   * ```javascript
   * import { workspace } from '@mscode/api';
   * 
   * // Read the settings
   * const config = workspace.getConfiguration('my-extension');
   * const isEnabled = config.get('enable', true);
   * 
   * // Listen for changes
   * workspace.onDidChangeConfiguration(() => {
   *   const updatedConfig = workspace.getConfiguration('my-extension');
   *   console.log("Setting changed:", updatedConfig.get('enable'));
   * });
   * ```
   */
  export namespace workspace {
    export function getConfiguration(section?: string): WorkspaceConfiguration;
    export function registerConfiguration(schema: IConfigurationSection): any;
    
    /**
     * Fires when the user modifies their settings.json or changes a setting via the UI.
     */
    export const onDidChangeConfiguration: (listener: () => void) => { dispose: () => void };
  }
}