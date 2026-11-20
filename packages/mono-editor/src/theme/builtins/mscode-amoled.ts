import type { MonoStandaloneThemeData } from '../types';

export const MSCODE_AMOLED_ID = 'mscode-amoled';
export const MSCODE_AMOLED_LABEL = 'MS Code AMOLED';

export const mscodeAmoledThemeData: MonoStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  colors: {
    'editor.background': '#000000',
    'editor.foreground': '#d4d4d4',
    'editor.selectionBackground': '#1a3a5c',
    'editor.lineHighlightBackground': '#0d0d0d',
    'editorCursor.foreground': '#c8c8c8',
    'editorLineNumber.foreground': '#4a4a4a',
    'editorLineNumber.activeForeground': '#9e9e9e',
    'editorGutter.background': '#000000',
    'editorIndentGuide.background': '#1a1a1a',
    'editorWhitespace.foreground': '#222222',
    'editorError.foreground': '#f48771',
    'editorWarning.foreground': '#cca700',
    'editorInfo.foreground': '#75beff',
  },
  tokenColors: {
    plain: '#d4d4d4',
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
