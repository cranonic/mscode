import { monoThemeService } from '../ThemeService';
import {
  MSCODE_AMOLED_ID,
  MSCODE_AMOLED_LABEL,
  mscodeAmoledThemeData,
} from './mscode-amoled';
import {
  MSCODE_DARK_ID,
  MSCODE_DARK_LABEL,
  mscodeDarkThemeData,
} from './mscode-dark';
import {
  MSCODE_LIGHT_ID,
  MSCODE_LIGHT_LABEL,
  mscodeLightThemeData,
} from './mscode-light';
import {
  SOLARIZED_DARK_ID,
  SOLARIZED_DARK_LABEL,
  solarizedDarkThemeData,
} from './solarized-dark';
import {
  SOLARIZED_LIGHT_ID,
  SOLARIZED_LIGHT_LABEL,
  solarizedLightThemeData,
} from './solarized-light';

let registered = false;

/** Idempotent — safe to call from createMonoEditor and app bootstrap. */
export function registerBuiltinThemes(): void {
  if (registered) return;
  registered = true;
  monoThemeService.defineTheme(MSCODE_DARK_ID, mscodeDarkThemeData, {
    label: MSCODE_DARK_LABEL,
    type: 'dark',
  });
  monoThemeService.defineTheme(MSCODE_LIGHT_ID, mscodeLightThemeData, {
    label: MSCODE_LIGHT_LABEL,
    type: 'light',
  });
  monoThemeService.defineTheme(MSCODE_AMOLED_ID, mscodeAmoledThemeData, {
    label: MSCODE_AMOLED_LABEL,
    type: 'dark',
  });
  monoThemeService.defineTheme(SOLARIZED_DARK_ID, solarizedDarkThemeData, {
    label: SOLARIZED_DARK_LABEL,
    type: 'dark',
  });
  monoThemeService.defineTheme(SOLARIZED_LIGHT_ID, solarizedLightThemeData, {
    label: SOLARIZED_LIGHT_LABEL,
    type: 'light',
  });
  // Default active
  monoThemeService.setTheme(MSCODE_DARK_ID);
}

export const BUILTIN_THEME_IDS = [
  MSCODE_DARK_ID,
  MSCODE_LIGHT_ID,
  MSCODE_AMOLED_ID,
  SOLARIZED_DARK_ID,
  SOLARIZED_LIGHT_ID,
] as const;
