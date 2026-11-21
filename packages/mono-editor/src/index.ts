export { createMonoEditor, MonoEditor } from './api/MonoEditor';
export type {
  IPosition,
  ISelection,
  ICursorPositionChangedEvent,
  ICursorSelectionChangedEvent,
  IScrollEvent,
  IIdentifiedSingleEditOperation,
  IMonoTextModel,
  IMonoEditorAction,
  IMonoEditor,
  MonoEditorOptions,
  MonoEditorTheme,
  MonoContentChangeEvent,
  MonoDisposable,
  MonoLineNumbers,
} from './api/types';
export { DEFAULT_THEME } from './api/types';

// Syntax highlighting (expandable API)
export {
  languages,
  createRegexTokensProvider,
  registerDefaultLanguages,
  DEFAULT_TOKEN_COLORS,
} from './language';
export type {
  MonoToken,
  MonoTokenType,
  MonoTokenTheme,
  MonoTokensProvider,
  RegexRule,
  RegexProviderOptions,
} from './language';

export type { MonoStickyScrollOptions, StickyLine, StickyRenderLine } from './view/StickyScroll';
export { DEFAULT_STICKY_SCROLL } from './view/StickyScroll';

export type { MonoMenuItem, MonoMenuItemId, MonoMenuStyle, MonoMenuContext } from './menu/types';
export { MENU_ICONS, DEFAULT_MENU_STYLE } from './menu/types';

export { KeybindingService, MonoCommands } from './keybindings/KeybindingService';
export type { MonoKeybinding } from './keybindings/KeybindingService';


// Commands + palette engine (UI stays in app)
export {
  CommandService,
  CommandsRegistry,
  ContextKeyService,
} from './commands';
export type {
  MonoAction,
  MonoCommand,
  MonoCommandHandler,
  MonoPaletteCommandItem,
  MonoPaletteItem,
  MonoPaletteProvider,
  MonoPaletteProvideContext,
  MonoRegisteredCommand,
} from './commands';
export { PaletteService } from './palette';


// Find / Replace (in-editor widget + engine)
export { FindController, findMatches } from './find';
export type { FindMatch, FindOptions, FindState } from './find';

export { codicon, registerExtraIcon, hasIcon, listCodicons, FIND_ICON_SVG, FIND_ICONS } from './icons';
export type { CodiconId } from './icons';

export { haptic, attachPressFeedback } from './util/haptic';

// Theme (Monaco-level defineTheme / setTheme)
export {
  monoThemeService,
  MonoThemeService,
  registerBuiltinThemes,
  BUILTIN_THEME_IDS,
  MSCODE_DARK_ID,
  MSCODE_LIGHT_ID,
  MSCODE_AMOLED_ID,
  SOLARIZED_DARK_ID,
  SOLARIZED_LIGHT_ID,
} from './theme';
export type {
  MonoStandaloneThemeData,
  MonoColorTheme,
  MonoThemeBase,
  MonoThemeRule,
  ResolvedMonoEditorTheme,
} from './theme';


// Decorations / markers (diagnostics)
export {
  DecorationsCollection,
  MarkerService,
  MarkerSeverity,
} from './decorations';
export type {
  IMarker,
  IMarkerData,
  IModelDeltaDecoration,
  IModelDecorationOptions,
  IRange,
} from './decorations';
