import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const monacoShim = path.resolve(__dirname, './src/shims/monaco-editor.ts');
const monacoReactShim = path.resolve(__dirname, './src/shims/monaco-react.tsx');
const vscodeShim = path.resolve(__dirname, './src/shims/vscode.ts');
const emptyShim = path.resolve(__dirname, './src/shims/empty-module.ts');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@mono/editor', replacement: path.resolve(__dirname, '../mono-editor/src/index.ts') },
      // Exact + deep monaco paths → shim / empty (alias was swallowing esm/vs/* as subpaths of .ts file)
      { find: /^monaco-editor\/esm\/.*/, replacement: emptyShim },
      { find: 'monaco-editor', replacement: monacoShim },
      { find: '@monaco-editor/react', replacement: monacoReactShim },
      { find: 'vscode', replacement: vscodeShim },
      { find: '@codingame/monaco-vscode-api', replacement: vscodeShim },
    ],
  },
});
