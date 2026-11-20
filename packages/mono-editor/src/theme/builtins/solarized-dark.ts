import type { MonoStandaloneThemeData } from '../types';

export const SOLARIZED_DARK_ID = 'solarized-dark';
export const SOLARIZED_DARK_LABEL = 'Solarized Dark';

/** Official Solarized palette (Ethan Schoonover) */
export const solarizedDarkThemeData: MonoStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  colors: {
    'editor.background': '#002b36',
    'editor.foreground': '#839496',
    'editor.selectionBackground': '#073642',
    'editor.lineHighlightBackground': '#073642',
    'editorCursor.foreground': '#839496',
    'editorLineNumber.foreground': '#586e75',
    'editorLineNumber.activeForeground': '#93a1a1',
    'editorGutter.background': '#002b36',
    'editorIndentGuide.background': '#073642',
    'editorWhitespace.foreground': '#073642',
    'editorError.foreground': '#dc322f',
    'editorWarning.foreground': '#b58900',
    'editorInfo.foreground': '#268bd2',
  },
  tokenColors: {
    plain: '#839496',
    comment: '#586e75',
    string: '#2aa198',
    keyword: '#859900',
    number: '#d33682',
    regexp: '#dc322f',
    operator: '#839496',
    punctuation: '#839496',
    variable: '#268bd2',
    function: '#268bd2',
    type: '#b58900',
    class: '#b58900',
    property: '#268bd2',
    tag: '#268bd2',
    attribute: '#b58900',
    constant: '#cb4b16',
    macro: '#cb4b16',
    invalid: '#dc322f',
  },
};
