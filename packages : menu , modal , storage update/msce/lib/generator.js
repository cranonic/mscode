import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { askQuestions } from './prompts.js';
import { log, c } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR  = path.join(__dirname, '..');
const TEMPLATES = path.join(ROOT_DIR, 'templates');
const SHARED    = path.join(ROOT_DIR, 'shared');
const LICENSES  = path.join(ROOT_DIR, 'licenses');

function substitute(str, vars) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

async function copyTemplate(src, dest, vars) {
  await fs.ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyTemplate(srcPath, destPath, vars);
      continue;
    }
    const BIN_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf'];
    if (BIN_EXTS.includes(path.extname(entry.name).toLowerCase())) {
      await fs.copy(srcPath, destPath);
    } else {
      const content = await fs.readFile(srcPath, 'utf-8');
      await fs.outputFile(destPath, substitute(content, vars));
    }
  }
}

export async function runScaffolder() {
  log.blank();
  console.log(c.bold.magenta('  ◆ Mono Studio Extension Creator'));
  console.log(c.dim('    Scaffold a new extension project\n'));

  const choices = fs.readdirSync(TEMPLATES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => ({ title: e.name.toUpperCase(), value: e.name }));

  const { template, hasMain, language, meta, license } = await askQuestions(choices);

  const destDir = path.resolve(process.cwd(), meta.outDir);
  if (fs.existsSync(destDir)) {
    console.log(c.red(`\n  ✖ Directory "${meta.outDir}" already exists.\n`));
    process.exit(1);
  }

  log.blank(); log.info(`Generating ${c.bold(meta.outDir)}/…`);

  const vars = {
    EXT_ID: meta.extId, EXT_NAME: meta.extName, EXT_DESC: meta.extDesc,
    EXT_AUTHOR: meta.publisherName, CMD_PREFIX: meta.extId,
    ICON_LETTER: meta.extName.charAt(0).toUpperCase(),
    VERSION: '1.0.0', DATE: new Date().toISOString().slice(0, 10), YEAR: String(new Date().getFullYear()),
    LANG_EXT: language === 'typescript' ? 'ts' : 'js', LICENSE: license,
  };

  // 1. Copy Main Template
  await copyTemplate(path.join(TEMPLATES, template), destDir, vars);

  // 2. Handle JS/TS/JSX/TSX main file keeping
  if (hasMain) {
    const srcDir = path.join(destDir, 'src');
    const filesToRemove = language === 'typescript' 
      ? ['main.js', 'main.jsx'] 
      : ['main.ts', 'main.tsx'];

    for (const file of filesToRemove) {
      const filePath = path.join(srcDir, file);
      if (await fs.pathExists(filePath)) await fs.remove(filePath);
    }

    // Find which file actually survived (e.g., main.tsx) and explicitly update manifest.json
    const survivingFiles = await fs.readdir(srcDir);
    const actualMainFile = survivingFiles.find(f => f.startsWith('main.'));
    
    if (actualMainFile) {
      const manifestPath = path.join(destDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifestData = await fs.readJson(manifestPath);
        // Overwrite the templated 'src/main.ts' with the actual reality 'src/main.tsx'
        manifestData.source = `src/${actualMainFile}`;
        await fs.outputJson(manifestPath, manifestData, { spaces: 2 });
      }
    }
  }

  // 3. Inject Shared Files (Hidden .mscode, package.json, logo)
  await fs.ensureDir(path.join(destDir, '.mscode'));
  await fs.copy(path.join(SHARED, 'msce.js'), path.join(destDir, '.mscode', 'msce.js'));
  
  // Copy types folder for IntelliSense
  const sharedTypesPath = path.join(SHARED, 'types');
  if (fs.existsSync(sharedTypesPath)) {
    await fs.copy(sharedTypesPath, path.join(destDir, '.mscode', 'types'));
  }

  await fs.ensureDir(path.join(destDir, 'assets'));
  if (fs.existsSync(path.join(SHARED, 'logo.png'))) {
    await fs.copy(path.join(SHARED, 'logo.png'), path.join(destDir, 'assets', 'logo.png'));
  }

  // 4. Generate Dynamically: .gitignore, package.json, Docs, and CHANGELOG
  const gitignoreContent = `node_modules/\ndist/\n.mscode/\n*.msxt\n*.zip\n.DS_Store\n`;
  await fs.outputFile(path.join(destDir, '.gitignore'), gitignoreContent);

  const rawPkg = await fs.readFile(path.join(SHARED, '_package.json'), 'utf-8');
  const pkg = JSON.parse(substitute(rawPkg, vars));
  pkg.publisher = meta.publisherName;
  pkg.license = license;
  
  // Inject React typings for TS users
  if (language === 'typescript') {
    pkg.devDependencies.typescript = '^5.4.0';
    pkg.devDependencies['@types/react'] = '^18.2.0'; 
  }
  await fs.outputJson(path.join(destDir, 'package.json'), pkg, { spaces: 2 });
  
  if (hasMain) {
    const compilerOptions = {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "node",
      jsx: "react",
      baseUrl: ".",
      paths: {
        "@mscode/api": [".mscode/types/index.d.ts"]
      }
    };

    const configFileName = language === 'typescript' ? 'tsconfig.json' : 'jsconfig.json';
    const configContent = {
      compilerOptions,
      include: ["src/**/*", ".mscode/types/**/*"]
    };

    await fs.outputJson(path.join(destDir, configFileName), configContent, { spaces: 2 });
  }

  // README.md Generation
  await fs.outputFile(path.join(destDir, 'README.md'), `# ${vars.EXT_NAME}\n> ${vars.EXT_DESC}\n\n*Built with MSCE CLI*`);

  // CHANGELOG.md Generation
  const changelogContent = [
    `# Changelog`,
    ``,
    `All notable changes to **${vars.EXT_NAME}** are documented in this file.`,
    ``,
    `## [${vars.VERSION}] — ${vars.DATE}`,
    ``,
    `### 🎉 Initial Release`,
    ``,
    `- Project scaffolded with \`msce\``,
    `- Registered command \`${vars.CMD_PREFIX}.helloWorld\``,
    `- Basic extension structure in place`,
    ``,
    `---`,
    ``,
    `*Format based on [Keep a Changelog](https://keepachangelog.com)*`,
  ].join('\n');
  await fs.outputFile(path.join(destDir, 'CHANGELOG.md'), changelogContent);

  // License Generation
  let licenseText = `${license} License\n\nCopyright (c) ${vars.YEAR} ${vars.EXT_AUTHOR}\n`;
  if (fs.existsSync(path.join(LICENSES, `${license}.txt`))) {
    licenseText = substitute(fs.readFileSync(path.join(LICENSES, `${license}.txt`), 'utf-8'), vars);
  }
  await fs.outputFile(path.join(destDir, 'LICENSE.txt'), licenseText);
  

  // Done
  log.success(`Created  ${c.bold(meta.outDir)}/`);
  log.blank();
  console.log(c.dim(`  cd ${meta.outDir}\n  npm install\n\n  npm run build\n  npm run package\n  npm run publish\n`));
}

// ─── INIT: Initialize msce toolchain in an existing project ────────────────
export async function runInit() {
  log.blank();
  console.log(c.bold.magenta('  ◆ Mono Studio Extension Creator'));
  console.log(c.dim('    Initializing existing project...\n'));

  const targetDir = process.cwd();

  // ── Step 1: Inject .mscode/msce.js & API Typings ────────────────────────
  log.step(1, 'Injecting local compiler engine & API Types');

  const sharedMscePath = path.join(SHARED, 'msce.js');
  if (!fs.existsSync(sharedMscePath)) {
    console.log(c.red('\n  ✖ Could not find shared/msce.js. Please reinstall @monostudio/msce.\n'));
    process.exit(1);
  }

  const mscodeDir = path.join(targetDir, '.mscode');
  const mscodeTarget = path.join(mscodeDir, 'msce.js');
  const isUpdate = fs.existsSync(mscodeTarget);

  await fs.ensureDir(mscodeDir);
  await fs.copy(sharedMscePath, mscodeTarget);
  log.success(isUpdate ? 'Updated .mscode/msce.js' : 'Injected .mscode/msce.js');

  // Copy types folder for IntelliSense
  const sharedTypesPath = path.join(SHARED, 'types');
  if (fs.existsSync(sharedTypesPath)) {
    await fs.copy(sharedTypesPath, path.join(mscodeDir, 'types'));
    log.success('Injected MS Code API Typings (.mscode/types)');
  }

  // Check if TypeScript project
  const hasTSConfig = fs.existsSync(path.join(targetDir, 'tsconfig.json'));
  const hasJSConfig = fs.existsSync(path.join(targetDir, 'jsconfig.json'));
  const hasTSMain = fs.existsSync(path.join(targetDir, 'src', 'main.ts')) || fs.existsSync(path.join(targetDir, 'src', 'main.tsx'));
  const isTS = hasTSConfig || hasTSMain;

  // ── Step 2: Merge package.json ──────────────────────────────────────────
  log.step(2, 'Configuring package.json');

  const pkgPath = path.join(targetDir, 'package.json');
  let pkg = {};

  if (fs.existsSync(pkgPath)) {
    pkg = await fs.readJson(pkgPath);
    log.info('Found existing package.json — merging MSCE toolchain...');
  } else {
    pkg = {
      name: path.basename(targetDir).toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: 'A Mono Studio extension.',
      type: 'module',
      private: true,
    };
    log.info('No package.json found — creating one...');
  }

  // Inject npm scripts
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.build   = 'node .mscode/msce.js build';
  pkg.scripts.watch   = 'node .mscode/msce.js watch';
  pkg.scripts.package = 'node .mscode/msce.js package';
  pkg.scripts.publish = 'node .mscode/msce.js publish';

  // Inject missing devDependencies
  pkg.devDependencies = pkg.devDependencies || {};
  const requiredDeps = {
    'esbuild':  '^0.24.0', // Keeping your latest version
    'archiver': '^7.0.1',
    'prompts':  '^2.4.2',
    'semver':   '^7.6.0',
  };

  if (isTS) {
    requiredDeps['@types/react'] = '^18.2.0';
  }

  let depsAdded = 0;
  for (const [dep, version] of Object.entries(requiredDeps)) {
    if (!pkg.devDependencies[dep] && !pkg.dependencies?.[dep]) {
      pkg.devDependencies[dep] = version;
      depsAdded++;
    }
  }

  await fs.outputJson(pkgPath, pkg, { spaces: 2 });
  log.success(
    depsAdded > 0
      ? `Updated package.json (scripts set, ${depsAdded} dep${depsAdded > 1 ? 's' : ''} added)`
      : 'Updated package.json (scripts set, all deps already present)'
  );

  // ── Step 3: Update .gitignore ───────────────────────────────────────────
  log.step(3, 'Updating .gitignore');

  const gitignorePath = path.join(targetDir, '.gitignore');
  const ignoreEntries = ['node_modules/', 'dist/', '.mscode/', '*.msxt', '*.zip', '.DS_Store'];
  let currentIgnore = fs.existsSync(gitignorePath)
    ? await fs.readFile(gitignorePath, 'utf-8')
    : '';

  const toAdd = ignoreEntries.filter(entry => !currentIgnore.includes(entry));
  if (toAdd.length > 0) {
    currentIgnore = currentIgnore.trimEnd() + '\n' + toAdd.join('\n') + '\n';
    await fs.outputFile(gitignorePath, currentIgnore);
    log.success(`Updated .gitignore (${toAdd.length} entr${toAdd.length > 1 ? 'ies' : 'y'} added)`);
  } else {
    log.success('.gitignore already up to date');
  }

 // ── Step 4: Check Icon & Copy Default  ────────────
  log.step(4, 'Checking extension icon');

  const manifestPath = path.join(targetDir, 'manifest.json');
  let hasValidIcon = false;
  let manifestData = {};

  if (fs.existsSync(manifestPath)) {
    manifestData = await fs.readJson(manifestPath);
    
    if (manifestData.icon) {
      const iconPath = path.join(targetDir, manifestData.icon);
      if (fs.existsSync(iconPath)) {
        hasValidIcon = true;
        log.success(`Found valid icon from manifest: '${manifestData.icon}'`);
      } else {
        log.info(`Manifest icon '${manifestData.icon}' not found on disk. Fixing...`);
      }
    }
  }

  if (!hasValidIcon) {
    const logoSrc  = path.join(SHARED, 'logo.png');
    const logoDest = path.join(targetDir, 'assets', 'logo.png');
    
    if (fs.existsSync(logoSrc)) {
      if (!fs.existsSync(logoDest)) {
        await fs.ensureDir(path.join(targetDir, 'assets'));
        await fs.copy(logoSrc, logoDest);
        log.success('Copied default placeholder (assets/logo.png)');
      }
      
      if (fs.existsSync(manifestPath) && manifestData.icon !== 'assets/logo.png') {
        manifestData.icon = 'assets/logo.png';
        await fs.outputJson(manifestPath, manifestData, { spaces: 2 });
        log.success('Updated manifest.json to include default icon path');
      }
    }
  }

  // ── Step 5: Configure IntelliSense (jsconfig/tsconfig) ─────────────────
  log.step(5, 'Configuring Workspace IntelliSense');

  const configName = isTS ? 'tsconfig.json' : 'jsconfig.json';
  const configPath = path.join(targetDir, configName);

  if (!hasTSConfig && !hasJSConfig) {
    await fs.outputJson(configPath, {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "node",
        jsx: "react",
        baseUrl: ".",
        paths: {
          "@mscode/api": [".mscode/types/index.d.ts"]
        }
      },
      include: ["src/**/*", ".mscode/types/**/*"]
    }, { spaces: 2 });
    log.success(`Created ${configName} for @mscode/api auto-completion`);
  } else {
    log.info(`Found existing ${hasTSConfig ? 'tsconfig.json' : 'jsconfig.json'}.`);
    log.info(`Please ensure '"paths": { "@mscode/api": [".mscode/types/index.d.ts"] }' and '"jsx": "react"' are present.`);
  }

  // ── Done ────────────────────────────────────────────────────────────────
  log.blank();
  log.success(c.bold('Project successfully initialized!'));
  log.blank();
  console.log(c.dim('  Next steps:'));
  console.log(c.dim('  1. Run npm install to install bundler tools.'));
  console.log(c.dim('  2. Ensure your manifest.json is properly configured.'));
  console.log(c.dim('  3. Start writing code with full @mscode/api auto-completion!'));
  console.log(c.dim('  4. Run npm run build to compile your extension.\n'));
}