/** Shim — @monaco-editor/react removed. */
import React from 'react';

export function useMonaco() {
  return null;
}

export function DiffEditor(_props: any) {
  return React.createElement('div', {
    'data-monaco-diff-shim': 'true',
    style: { height: '100%', width: '100%', background: '#1e1e1e' },
    children: React.createElement(
      'div',
      { style: { padding: 12, color: '#888', fontSize: 13 } },
      'Diff view (Mono Editor path — Monaco DiffEditor stub)',
    ),
  });
}

export default function Editor(_props: any) {
  return React.createElement('div', {
    'data-monaco-shim': 'true',
    style: { display: 'none' },
  });
}
