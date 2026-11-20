// src/platforms/web/FileSystem.ts
import type { IFileSystem, FileStat } from '@/core/fileSystem/IFileSystem';

// Enhanced Fake Android File System with Rich Nested Structure
const mockStorage: Record<string, FileStat[]> = {
  'ROOT': [],
  
  '/storage/emulated/0': [
    { name: 'Download', path: '/storage/emulated/0/Download', isDirectory: true },
    { name: 'Documents', path: '/storage/emulated/0/Documents', isDirectory: true },
    { name: 'Android', path: '/storage/emulated/0/Android', isDirectory: true },
    { name: 'Pictures', path: '/storage/emulated/0/Pictures', isDirectory: true },
    { name: 'Music', path: '/storage/emulated/0/Music', isDirectory: true },
  ],

  '/storage/emulated/0/Documents': [
    { name: 'MSCodeProjects', path: '/storage/emulated/0/Documents/MSCodeProjects', isDirectory: true },
    { name: 'notes.txt', path: '/storage/emulated/0/Documents/notes.txt', isDirectory: false },
    { name: 'todo.md', path: '/storage/emulated/0/Documents/todo.md', isDirectory: false },
    { name: 'report.pdf', path: '/storage/emulated/0/Documents/report.pdf', isDirectory: false },
  ],

  // ==================== MSCodeProjects (Main Project) ====================
  '/storage/emulated/0/Documents/MSCodeProjects': [
    { name: 'index.html', path: '/storage/emulated/0/Documents/MSCodeProjects/index.html', isDirectory: false },
    { name: 'app.js', path: '/storage/emulated/0/Documents/MSCodeProjects/inlineDisplay.js', isDirectory: false },
    { name: 'style.css', path: '/storage/emulated/0/Documents/MSCodeProjects/style.css', isDirectory: false },
    { name: 'Main.java', path: '/storage/emulated/0/Documents/MSCodeProjects/Main.java', isDirectory: false },
    { name: 'machine.py', path: '/storage/emulated/0/Documents/MSCodeProjects/machine.py', isDirectory: false },
    { name: 'system.c', path: '/storage/emulated/0/Documents/MSCodeProjects/system.c', isDirectory: false },
    { name: 'systemp.cpp', path: '/storage/emulated/0/Documents/MSCodeProjects/systemp.cpp', isDirectory: false },
    { name: 'types.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/types.ts', isDirectory: false },
    { name: 'kino.rs', path: '/storage/emulated/0/Documents/MSCodeProjects/kino.rs', isDirectory: false },
    { name: 'README.md', path: '/storage/emulated/0/Documents/MSCodeProjects/README.md', isDirectory: false },
    { name: 'public', path: '/storage/emulated/0/Documents/MSCodeProjects/public', isDirectory: true },
    { name: 'src', path: '/storage/emulated/0/Documents/MSCodeProjects/src', isDirectory: true },
    { name: 'utils', path: '/storage/emulated/0/Documents/MSCodeProjects/utils', isDirectory: true },
  ],

  '/storage/emulated/0/Documents/MSCodeProjects/public': [
    { name: 'data.json', path: '/storage/emulated/0/Documents/MSCodeProjects/public/data.json', isDirectory: false },
    { name: 'logo.png', path: '/storage/emulated/0/Documents/MSCodeProjects/public/logo.png', isDirectory: false },
    { name: 'icon.svg', path: '/storage/emulated/0/Documents/MSCodeProjects/public/icon.svg', isDirectory: false },
  ],

  '/storage/emulated/0/Documents/MSCodeProjects/src': [
    { name: 'components', path: '/storage/emulated/0/Documents/MSCodeProjects/src/components', isDirectory: true },
    { name: 'utils', path: '/storage/emulated/0/Documents/MSCodeProjects/src/utils', isDirectory: true },
    { name: 'modules', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules', isDirectory: true },
    { name: 'App.tsx', path: '/storage/emulated/0/Documents/MSCodeProjects/src/App.tsx', isDirectory: false },
  ],

  '/storage/emulated/0/Documents/MSCodeProjects/src/components': [
    { name: 'Header.tsx', path: '/storage/emulated/0/Documents/MSCodeProjects/src/components/Header.tsx', isDirectory: false },
    { name: 'Footer.tsx', path: '/storage/emulated/0/Documents/MSCodeProjects/src/components/Footer.tsx', isDirectory: false },
  ],

  '/storage/emulated/0/Documents/MSCodeProjects/utils': [
    { name: 'helper.py', path: '/storage/emulated/0/Documents/MSCodeProjects/utils/helper.py', isDirectory: false },
    { name: 'maths.js', path: '/storage/emulated/0/Documents/MSCodeProjects/utils/maths.js', isDirectory: false },
  ],

  // ==================== 8-Level Deep Nesting (Inside src/modules) ====================
  // Level 1: modules
  '/storage/emulated/0/Documents/MSCodeProjects/src/modules': [
    { name: 'core', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core', isDirectory: true },
    { name: 'index.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/index.ts', isDirectory: false },
  ],

  // Level 2: core
  '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core': [
    { name: 'services', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services', isDirectory: true },
    { name: 'core.module.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/core.module.ts', isDirectory: false },
  ],

  // Level 3: services
  '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services': [
    { name: 'api', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api', isDirectory: true },
    { name: 'logger.service.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/logger.service.ts', isDirectory: false },
  ],

  // Level 4: api
  '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api': [
    { name: 'v1', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1', isDirectory: true },
    { name: 'api.config.json', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/api.config.json', isDirectory: false },
  ],

  // Level 5: v1
  '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1': [
    { name: 'handlers', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers', isDirectory: true },
    { name: 'routes.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/routes.ts', isDirectory: false },
  ],

  // Level 6: handlers
  '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers': [
    { name: 'middlewares', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/middlewares', isDirectory: true },
    { name: 'auth.handler.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/auth.handler.ts', isDirectory: false },
    { name: 'user.handler.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/user.handler.ts', isDirectory: false },
  ],

  // Level 7: middlewares
  '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/middlewares': [
    { name: 'helpers', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/middlewares/helpers', isDirectory: true },
    { name: 'rateLimiter.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/middlewares/rateLimiter.ts', isDirectory: false },
  ],

  // Level 8: helpers
  '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/middlewares/helpers': [
    { name: 'tokenValidator.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/middlewares/helpers/tokenValidator.ts', isDirectory: false },
    { name: 'passwordHasher.ts', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/middlewares/helpers/passwordHasher.ts', isDirectory: false },
    { name: 'constants.json', path: '/storage/emulated/0/Documents/MSCodeProjects/src/modules/core/services/api/v1/handlers/middlewares/helpers/constants.json', isDirectory: false },
  ],

  // ==================== Termux Home ====================
  '/data/data/com.termux/files/home': [
    { name: 'my-project', path: '/data/data/com.termux/files/home/my-project', isDirectory: true },
    { name: '.bashrc', path: '/data/data/com.termux/files/home/.bashrc', isDirectory: false },
    { name: 'setup.sh', path: '/data/data/com.termux/files/home/setup.sh', isDirectory: false },
  ],

  '/data/data/com.termux/files/home/my-project': [
    { name: 'server.py', path: '/data/data/com.termux/files/home/my-project/server.py', isDirectory: false },
    { name: 'README.md', path: '/data/data/com.termux/files/home/my-project/README.md', isDirectory: false },
  ],
};


const mockFileContents: Record<string, string> = {
  '/storage/emulated/0/Documents/MSCodeProjects/index.html': 
`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MS Code - Modern IDE</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>MS Code Projects</h1>
    </header>
    <main>
        <h2>Welcome to the Multi-Language Editor</h2>
        <p>This is a demo project with multiple language support.</p>
    </main>
    <script src="app.js"></script>
</body>
</html>`,

  '/storage/emulated/0/Documents/MSCodeProjects/inlineDisplay.js': 
`// src/inlineDisplay.js
import { getSettings } from './settings.js';
console.log("MS Code Editor Started");

let popupElement = null;
function createPopupElement() {
    if (popupElement) return popupElement;
    popupElement = document.createElement('div');
    popupElement.className = 'acode-c-inline-popup'; 
    popupElement.style.cssText = \`
        position: fixed;
        z-index: 999;
        background: rgba(30, 30, 30, 0.55);
        color: #ff5252;
        padding: 5px 10px;
        border-radius: 4px 4px 4px 0px;
        font-family: monospace;
        font-size: 0.65em;
        pointer-events: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        border: 1px solid #444;
        white-space: pre-wrap;
        max-width: 80vw;
    \`;
    document.body.appendChild(popupElement);
    return popupElement;
}

export function hidePopup() {
    if (popupElement && popupElement.style.display !== 'none') {
        popupElement.style.display = 'none';
    }
}

let currentLogMap = new Map();
let renderTimeout = null;

export function updateLogMap(newLogMap) {
    currentLogMap = newLogMap;
    requestRenderLogs();
}

function requestRenderLogs() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => {
        const editor = editorManager.editor;
        if (editor) {
            insertVisibleLogs(editor, currentLogMap);
        }
    }, 150);
}

// =======================================
// 🎨 CM6 NATIVE GUTTER BACKGROUND COLORING
// =======================================
function clearGutterBackgrounds() {
    const lineGutterElements = document.querySelectorAll('.cm-lineNumbers .cm-gutterElement');
    if (lineGutterElements.length === 0) return; // Safely ignore in Ace
    lineGutterElements.forEach(el => {
        el.style.backgroundColor = '';
        el.style.color = '';
        el.style.borderRight = '';
        el.style.fontWeight = '';
    });
}

function applyGutterBackgrounds(logMap) {
    clearGutterBackgrounds();
    const lineGutterElements = document.querySelectorAll('.cm-lineNumbers .cm-gutterElement');
    if (lineGutterElements.length === 0) return;
    
    lineGutterElements.forEach(el => {
        const lineNum = parseInt(el.textContent);
        if (!isNaN(lineNum)) {
            const zeroBasedLine = lineNum - 1;
            
            if (logMap.has(zeroBasedLine)) {
                const logs = logMap.get(zeroBasedLine);
                const isError = logs.some(l => l.type === 'error');
                
                el.style.backgroundColor = isError ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 202, 40, 0.2)';
                el.style.color = isError ? '#ff5252' : '#ffca28';
                el.style.borderRight = \`3px solid \${isError ? '#ff5252' : '#ffca28'}\`;
                el.style.fontWeight = 'bold';
            }
        }
    });
}
// =======================================

function clearPreviousLogs() {
    document.querySelectorAll('.acode-c-inline-log').forEach(el => el.remove());
    hidePopup();
    clearGutterBackgrounds(); 
}

function applyColors(element, logType) {
    const type = logType || 'default';
    let textColor = "#fff3cd"; 
    let bgColor = "#856404b0";

    if (type === "error") {
        textColor = "#f8d7da";
        bgColor = "#721c24b0";
    }
    
    element.style.color = textColor;
    element.style.backgroundColor = bgColor;
}

function insertVisibleLogs(editor, logMap) {
    clearPreviousLogs();
    if (!editor || !logMap || logMap.size === 0) {
        return;
    }

    const isCM6 = typeof editor.dispatch === 'function';

    // 🚀 CM6 এর জন্য শুধুমাত্র Gutter Background
    if (isCM6) {
        applyGutterBackgrounds(logMap);
        return;
    }

    // 🐢 Ace Editor এর জন্য ভাসমান বক্স এবং পপআপ
    const renderer = editor.renderer;
    if (!renderer) return;

    let firstVisibleRow = renderer.getFirstVisibleRow();
    let lastVisibleRow = renderer.getLastVisibleRow();
    let cursorPos = editor.getCursorPosition();

    let showPopupForLine = -1;
    let popupScreenPos = { pageX: 0, pageY: 0 };

    for (let lineNo = firstVisibleRow; lineNo <= lastVisibleRow; lineNo++) {
        const logs = logMap.get(lineNo);
        if (!Array.isArray(logs) || logs.length === 0) continue;

        const lineContent = editor.session.getLine(lineNo) || "";
        const isCursorAtEnd = (lineNo === cursorPos.row && cursorPos.column >= lineContent.trimEnd().length);

        if (isCursorAtEnd) {
            const coords = renderer.textToScreenCoordinates(lineNo, cursorPos.column);
            popupScreenPos = { pageX: coords.pageX, pageY: coords.pageY };
            showPopupForLine = lineNo;
            continue;
        }

        const coords = renderer.textToScreenCoordinates(lineNo, lineContent.length);
        const wrapper = document.createElement("span");
        wrapper.className = "acode-c-inline-log";
        wrapper.style.cssText = \`
          pointer-events: none; user-select: none;
          font-style: italic; opacity: 0.85;
          border-radius: 3px; padding: 2px 6px;
          position: fixed; z-index: 50; font-size: 0.5em;
        \`;

        const firstLog = logs[0];
        let msg = String(firstLog.output).replace(/[\r\n]+/g, ' ↵ ').trim();
        if (msg.length > 80) msg = msg.substring(0, 80) + '...';
        wrapper.textContent = \` \${msg} \`;

        applyColors(wrapper, firstLog.type);

        const charWidth = renderer.characterWidth || 8;
        wrapper.style.top = \`\${coords.pageY}px\`;
        wrapper.style.left = \`\${coords.pageX + charWidth + 10}px\`;
        document.body.appendChild(wrapper);
    }

    if (showPopupForLine !== -1) {
        const logsForPopup = logMap.get(showPopupForLine);
        if (logsForPopup && logsForPopup.length > 0) {
            const popup = createPopupElement();
            const fullContent = logsForPopup.map(log => \`[\${log.type || 'log'}] \${log.output}\`).join("\n");
            
            const isWarning = logsForPopup[0].type === 'warning';
            popup.style.color = isWarning ? '#ffca28' : '#ff5252';
            popup.style.borderColor = isWarning ? '#ffca28' : '#ff5252';

            popup.textContent = fullContent;
            popup.style.display = 'block'; 
            
            let top = popupScreenPos.pageY - 35;
            let left = popupScreenPos.pageX + 10;
            popup.style.top = \`\${top}px\`;
            popup.style.left = \`\${left}px\`;
        } else {
            hidePopup();
        }
    } else {
        hidePopup();
    }
}

export function handleEditorUpdate() { requestRenderLogs(); }
export function clearAllLogs() {
    currentLogMap = new Map();
    clearPreviousLogs();
}
`,

  '/storage/emulated/0/Documents/MSCodeProjects/Main.java': 
`// Main.java - ~80 lines of Java code
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from MS Code Java Compiler!");
        
        for(int i = 0; i < 30; i++) {
            System.out.println("Iteration: " + i);
        }
        
        Calculator calc = new Calculator();
        System.out.println("Sum: " + calc.add(45, 55));
    }
}

class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public int multiply(int a, int b) {
        return a * b;
    }
    
    // More methods...
    public double power(double base, int exp) {
        return Math.pow(base, exp);
    }
}

// Additional classes and utilities would continue here...
`,

  '/storage/emulated/0/Documents/MSCodeProjects/machine.py': 
`# machine.py - ~80 lines Python ML demo
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

print("MS Code Python Environment")

class NeuralNetwork:
    def __init__(self):
        self.weights = np.random.randn(10, 5)
        print("Neural Network initialized")
    
    def forward(self, x):
        return np.dot(x, self.weights)
    
    def train(self, epochs=100):
        for epoch in range(epochs):
            if epoch % 20 == 0:
                print(f"Epoch {epoch} completed")

nn = NeuralNetwork()
nn.train(80)

# More code...
for i in range(60):
    print(f"Processing batch {i}")
`,

  '/storage/emulated/0/Documents/MSCodeProjects/system.c': 
`// system.c - C language demo
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("MS Code C Compiler\\n");
    
    for(int i = 0; i < 40; i++) {
        printf("Memory block %d allocated\\n", i);
    }
    
    // More system level code
    return 0;
}
`,

  '/storage/emulated/0/Documents/MSCodeProjects/README.md': 
`# MS Code Projects

A powerful multi-language code editor.

## Features
- Java, Python, C/C++, TypeScript, Rust support
- Built-in terminal
- File system explorer
- Syntax highlighting

## Current Files
- \`Main.java\`
- \`machine.py\`
- \`app.js\`
- etc.

**Total files simulated: 25+**
`,

  '/storage/emulated/0/Documents/notes.txt': "This is a sample text file from MS Code.",
  '/storage/emulated/0/Documents/todo.md': "# TODO\n\n- Add more languages\n- Improve performance",
  // ==================== IMAGE & SVG MOCKS ====================
  
  // A simple Red 1x1 pixel PNG image encoded in Base64
  '/storage/emulated/0/Documents/MSCodeProjects/public/logo.png': 
`iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`,

  // A beautiful MS Code Logo SVG encoded in Base64
  // Original SVG: <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1E1E1E" rx="20"/><path d="M50 150 L100 50 L150 150" fill="none" stroke="#3794FF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>
  '/storage/emulated/0/Documents/MSCodeProjects/public/icon.svg': 
`PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxRTFFMUUiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik01MCAxNTAgTDEwMCA1MCBMMTUwIDE1MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzc5NEZGIiBzdHJva2Utd2lkdGg9IjEyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=`,
  
  
};

export class WebFileSystem implements IFileSystem {
  async readDir(path: string): Promise<FileStat[]> {
    console.log(`[Mock FS] Reading Directory: ${path}`);
    return mockStorage[path] || [];
  }

  async readFile(path: string): Promise<string> {
    console.log(`[Mock FS] Reading File: ${path}`);
    return mockFileContents[path] || `// File: ${path}\n// Content not available in mock yet.`;
  }

  async writeFile(path: string, _content: string): Promise<void> {
    console.log(`[Mock FS] Writing File: ${path}`);
    // In real implementation, you would update mockFileContents here
  }

  async mkdir(path: string): Promise<void> {
    console.log(`[Mock FS] Creating Folder: ${path}`);
  }

  async delete(path: string): Promise<void> {
    console.log(`[Mock FS] Deleting: ${path}`);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    console.log(`[Mock FS] Renaming ${oldPath} to ${newPath}`);
  }
}

