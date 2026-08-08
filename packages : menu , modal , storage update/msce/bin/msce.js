#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { runScaffolder, runInit } from '../lib/generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));

const args = process.argv.slice(2);
const command = args[0];

if (args.includes('--version') || args.includes('-v')) {
  console.log(`msce v${packageJson.version}`);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  Usage: msce [command] [options]

  Commands:
    (empty)    Start interactive extension generator
    init       Initialize msce toolchain in an existing project
    build      Compile the extension
    watch      Compile and watch for changes
    package    Bundle extension into .msxt file
    publish    Publish extension to Mono Registry

  Options:
    -v, --version    Show version number
    -h, --help       Show this help menu
  `);
  process.exit(0);
}

// ─── INIT: Inject toolchain into an existing project ───────────────────────
if (command === 'init') {
  runInit().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
  });
}
// ─── SMART ROUTER: Proxy commands to local .mscode/msce.js ─────────────────
else if (['build', 'watch', 'package', 'publish', 'release'].includes(command)) {
  const localScript = path.join(process.cwd(), '.mscode', 'msce.js');

  if (!fs.existsSync(localScript)) {
    console.error(`\n❌ Error: Not a valid Mono Studio extension project!`);
    console.error(`Could not find '.mscode/msce.js' in the current directory.\n`);
    process.exit(1);
  }

  const child = spawn('node', [localScript, ...args], { stdio: 'inherit' });
  child.on('exit', code => process.exit(code));
}
// ─── GENERATOR: If no command, run interactive scaffolder ──────────────────
else {
  runScaffolder().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
  });
}