import type { MonoStandaloneThemeData } from '../types';

export const SOLARIZED_LIGHT_ID = 'solarized-light';
export const SOLARIZED_LIGHT_LABEL = 'Solarized Light';

export const solarizedLightThemeData: MonoStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  colors: {
    'editor.background': '#fdf6e3',
    'editor.foreground': '#657b83',
    'editor.selectionBackground': '#eee8d5',
    'editor.lineHighlightBackground': '#eee8d5',
    'editorCursor.foreground': '#657b83',
    'editorLineNumber.foreground': '#93a1a1',
    'editorLineNumber.activeForeground': '#586e75',
    'editorGutter.background': '#fdf6e3',
    'editorIndentGuide.background': '#eee8d5',
    'editorWhitespace.foreground': '#eee8d5',
    'editorError.foreground': '#dc322f',
    'editorWarning.foreground': '#b58900',
    'editorInfo.foreground': '#268bd2',
  },
  tokenColors: {
    plain: '#657b83',
    comment: '#93a1a1',
    string: '#2aa198',
    keyword: '#859900',
    number: '#d33682',
    regexp: '#dc322f',
    operator: '#657b83',
    punctuation: '#657b83',
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
