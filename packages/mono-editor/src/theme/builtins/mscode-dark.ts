import type { MonoStandaloneThemeData } from '../types';

export const MSCODE_DARK_ID = 'mscode-dark';
export const MSCODE_DARK_LABEL = 'MS Code Dark';

export const mscodeDarkThemeData: MonoStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#cccccc',
    'editor.selectionBackground': '#264f78',
    'editor.lineHighlightBackground': '#2a2d2e',
    'editorCursor.foreground': '#aeafad',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
    'editorGutter.background': '#1e1e1e',
    'editorIndentGuide.background': '#404040',
    'editorWhitespace.foreground': '#3b3b3b',
    'editorError.foreground': '#f48771',
    'editorWarning.foreground': '#cca700',
    'editorInfo.foreground': '#75beff',
  },
  tokenColors: {
    plain: '#cccccc',
    comment: '#6a9955',
    string: '#ce9178',
    keyword: '#569cd6',
    number: '#b5cea8',
    regexp: '#d16969',
    operator: '#d4d4d4',
    punctuation: '#d4d4d4',
    variable: '#9cdcfe',
    function: '#dcdcaa',
    type: '#4ec9b0',
    class: '#4ec9b0',
    property: '#9cdcfe',
    tag: '#569cd6',
    attribute: '#9cdcfe',
    constant: '#4fc1ff',
    macro: '#c586c0',
    invalid: '#f44747',
  },
};
