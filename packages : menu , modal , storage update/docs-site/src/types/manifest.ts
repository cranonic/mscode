// src/types/manifest.ts

// ─── 1. Basic Configuration Types ──────────────────────────────────────────

export interface ManifestCommand {
  id: string;
  title: string;
  icon?: string;
  category?: string;
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: any;
  description?: string;
  enum?: string[];
  enumDescriptions?: string[];
  minimum?: number;
  maximum?: number;
}

export interface ManifestConfiguration {
  title?: string;
  properties: Record<string, ConfigProperty>;
}

// ─── 2. Advanced Declarative UI Types (Synced from IDE Core) ───────────────

export interface ManifestKeybinding {
  command: string;
  key: string;
  mac?: string;
  when?: string;
  args?: any;
}

export interface ManifestActivityBar {
  id: string;
  title: string;
  icon: string;
  position?: 'top' | 'bottom';
  priority?: number;
}

export interface ManifestMenuItem {
  command?: string;
  id?: string;
  type?: 'item' | 'separator';
  order?: number;
  label?: string;
  icon?: string;
  when?: string;
  shortcut?: string;
  flat?: boolean | number;
  children?: ManifestMenuItem[];
}

export interface ExtensionContributions {
  /** Visual actions injected directly into the Global Command Palette */
  commands?: ManifestCommand[];
  
  /** Custom application runtime schema configurations */
  configuration?: string | Record<string, ConfigProperty>; 
  
  /** Grammar registries injecting syntactical definitions */
  languages?: Array<{ id: string; extensions: string[]; aliases: string[] }> | string;
  
  /** Autocomplete text templates mapping syntax blocks */
  snippets?: Array<{ language: string; path: string }>;
  
  /** Workbench color themes templates */
  themes?: Array<{ label: string; uiTheme: 'vs' | 'vs-dark' | 'hc-black'; path: string }>;
  
  /** File icon visualization mapping templates */
  iconThemes?: Array<{ id: string; label: string; path: string }>;
  
  /** Sidebar navigation panel visual launchers */
  activityBar?: ManifestActivityBar[];
  
  /** Keyboard shortcuts matching complex environmental focus conditions */
  keybindings?: ManifestKeybinding[];
  
  /** Declarative Context Menus (Right click, sidebar context, etc.) */
  menus?: Record<string, ManifestMenuItem[]>;
}

// ─── 3. Core Manifest Type ──────────────────────────────────────────────────

export interface ExtensionManifest {
  id: string;
  name: string;
  /** Optional during upload (UI side), strictly overridden by backend auth */
  publisher?: string; 
  description?: string;
  version: string;
  category?: string;
  tags?: string[];
  
  /** Visual Branding */
  icon?: string;
  iconColor?: string;
  iconLetter?: string;
  
  /** Execution Entry - Optional because Pure Theme extensions do not have a script */
  main?: string; 
  
  /** Documentation Paths */
  readme?: string;
  changelog?: string;
  license?: string;
  
  /** Activation Events */
  activates?: string[];
  
  /** The massive declarative payload */
  contributes?: ExtensionContributions; 
}

// ─── 4. Upload Pipeline Types (useExtractZip & Co.) ────────────────────────

export type IconSource =
  | { type: 'url';   value: string }   // remote http URL
  | { type: 'blob';  value: string }   // object URL from zip bytes
  | { type: 'none' };                  // placeholder

export interface ExtractedExtension {
  manifest:          ExtensionManifest;
  readmeContent?:    string;
  changelogContent?: string;
  licenseContent?:   string;
  configSchema?:     ManifestConfiguration;
  iconSource:        IconSource;
  /** The original File, possibly renamed to .msxt for upload */
  rawFile:           File;
}

// ─── 5. Version check API response ──────────────────────────────────────────

export interface VersionCheckResult {
  status: 'new' | 'ok' | 'conflict';
  existingVersion?: string;
  message: string;
}