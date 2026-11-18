import { languages } from './TokensProvider';
import { createJavaScriptTokensProvider, createTypeScriptTokensProvider } from './providers/javascript';
import { createJsonTokensProvider } from './providers/json';
import { createCssTokensProvider } from './providers/css';
import { createHtmlTokensProvider } from './providers/html';
import { createPythonTokensProvider } from './providers/python';
import { createPlaintextTokensProvider } from './providers/plaintext';

let registered = false;

/** Idempotent — call once at app boot or from createMonoEditor. */
export function registerDefaultLanguages(): void {
  if (registered) return;
  registered = true;
  languages.registerTokensProvider(createPlaintextTokensProvider());
  languages.registerTokensProvider(createJavaScriptTokensProvider('javascript'));
  languages.registerTokensProvider(createJavaScriptTokensProvider('js'));
  languages.registerTokensProvider(createTypeScriptTokensProvider());
  languages.registerTokensProvider(createJavaScriptTokensProvider('tsx'));
  languages.registerTokensProvider(createJavaScriptTokensProvider('jsx'));
  languages.registerTokensProvider(createJsonTokensProvider());
  languages.registerTokensProvider(createCssTokensProvider());
  languages.registerTokensProvider(createHtmlTokensProvider());
  languages.registerTokensProvider(createPythonTokensProvider());
}
