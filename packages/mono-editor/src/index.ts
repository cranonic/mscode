export { createMonoEditor, MonoEditor } from './api/MonoEditor';
export type {
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
