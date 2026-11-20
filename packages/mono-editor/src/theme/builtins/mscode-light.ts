import type { MonoStandaloneThemeData } from '../types';

export const MSCODE_LIGHT_ID = 'mscode-light';
export const MSCODE_LIGHT_LABEL = 'MS Code Light';

export const mscodeLightThemeData: MonoStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
    'editor.selectionBackground': '#add6ff',
    'editor.lineHighlightBackground': '#f0f0f0',
    'editorCursor.foreground': '#000000',
    'editorLineNumber.foreground': '#999999',
    'editorLineNumber.activeForeground': '#333333',
    'editorGutter.background': '#f3f3f3',
    'editorIndentGuide.background': '#d3d3d3',
    'editorWhitespace.foreground': '#d3d3d3',
    'editorError.foreground': '#e51400',
    'editorWarning.foreground': '#bf8803',
    'editorInfo.foreground': '#1a85ff',
  },
  tokenColors: {
    plain: '#000000',
    comment: '#008000',
    string: '#a31515',
    keyword: '#0000ff',
    number: '#098658',
    regexp: '#811f3f',
    operator: '#000000',
    punctuation: '#000000',
    variable: '#001080',
    function: '#795e26',
    type: '#267f99',
    class: '#267f99',
    property: '#001080',
    tag: '#800000',
    attribute: '#ff0000',
    constant: '#0070c1',
    macro: '#af00db',
    invalid: '#cd3131',
  },
};
