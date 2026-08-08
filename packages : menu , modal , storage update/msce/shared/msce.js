#!/usr/bin/env node

import { build } from "esbuild";
import fs from "fs";
import archiver from "archiver";
import path from "path";
import prompts from "prompts";
import semver from "semver";

const color = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  underline: "\x1b[4m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

const args = process.argv.slice(2);
const command = args[0] || "build";

const MANIFEST_FILE = "manifest.json";

// ─── 1. VALIDATION : FILES & PATHS ───────────────────────────────────────────
function assertFileExists(filePath, contextName) {
  if (!filePath) return null;
  const sanitizedPath = path.normalize(filePath).replace(/^(\.\.\/|\.\/)+/, "");
  if (!fs.existsSync(sanitizedPath)) {
    console.error(`\n${color.red}${color.bold}❌ VALIDATION ERROR:${color.reset}`);
    console.error(`Missing required asset declared in manifest under [${color.cyan}${contextName}${color.reset}]:`);
    console.error(`Path not found: ${color.yellow}${color.underline}${sanitizedPath}${color.reset}\n`);
    process.exit(1);
  }
  return sanitizedPath;
}

// ─── 2. EXTRACTING : MANIFEST RULES ──────────────────────────────────────────
function parseManifestAndCollectFiles() {
  if (!fs.existsSync(MANIFEST_FILE)) {
    console.error(`${color.red}❌ Error: manifest.json not found in the root directory!${color.reset}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
  const filesToPack = new Set();

  console.log(`${color.dim}Inspecting manifest blueprints for absolute path compliance...${color.reset}`);

  if (manifest.icon) { const p = assertFileExists(manifest.icon, "icon"); if (p) filesToPack.add(p); }
  if (manifest.readme) { const p = assertFileExists(manifest.readme, "readme"); if (p) filesToPack.add(p); }
  if (manifest.changelog) { const p = assertFileExists(manifest.changelog, "changelog"); if (p) filesToPack.add(p); }
  if (manifest.license) { const p = assertFileExists(manifest.license, "license"); if (p) filesToPack.add(p); }

  const contributes = manifest.contributes || {};

  if (contributes.configuration && typeof contributes.configuration === "string") {
    const p = assertFileExists(contributes.configuration, "contributes.configuration");
    if (p) filesToPack.add(p);
  }

  if (Array.isArray(contributes.themes)) {
    contributes.themes.forEach((theme, index) => {
      if (theme.path) {
        const p = assertFileExists(theme.path, `contributes.themes[${index}].path`);
        if (p) filesToPack.add(p);
      }
    });
  }

  if (Array.isArray(contributes.iconThemes)) {
    contributes.iconThemes.forEach((iconTheme, index) => {
      if (iconTheme.path) {
        const p = assertFileExists(iconTheme.path, `contributes.iconThemes[${index}].path`);
        if (p) filesToPack.add(p);
      }
    });
  }

  if (Array.isArray(contributes.snippets)) {
    contributes.snippets.forEach((snippet, index) => {
      if (snippet.path) {
        const p = assertFileExists(snippet.path, `contributes.snippets[${index}].path`);
        if (p) filesToPack.add(p);
      }
    });
  }

  return { manifest, files: Array.from(filesToPack) };
}

// ─── NEW: INTERACTIVE VERSION BUMP ───────────────────────────────────────────
async function promptVersionUpgrade() {
  if (!fs.existsSync(MANIFEST_FILE)) return;

  const manifestRaw = fs.readFileSync(MANIFEST_FILE, "utf-8");
  const manifest = JSON.parse(manifestRaw);
  const currentVersion = manifest.version || "1.0.0";
  const nextPatch = semver.inc(currentVersion, "patch");

  console.log(`\n${color.cyan}ℹ Preparing to publish: ${color.bold}${manifest.id}${color.reset}`);

  const { upgradeType } = await prompts({
    type: 'select',
    name: 'upgradeType',
    message: `Current version is ${color.yellow}${currentVersion}${color.reset}. Select version for this release:`,
    choices: [
      { title: `Auto-bump Patch (${color.green}${nextPatch}${color.reset})`, value: nextPatch },
      { title: `Custom Version`, value: 'custom' },
      { title: `Keep Current (${currentVersion})`, value: currentVersion, description: 'May fail if already published' }
    ],
    initial: 0
  });

  // User pressed Ctrl+C
  if (!upgradeType) {
    console.log(`\n${color.red}Publish cancelled.${color.reset}`);
    process.exit(1);
  }

  let finalVersion = upgradeType;

  if (upgradeType === 'custom') {
    const { customVersion } = await prompts({
      type: 'text',
      name: 'customVersion',
      message: 'Enter new version (e.g., 2.0.0):',
      validate: value => semver.valid(value) ? true : 'Invalid semver format! Try again (e.g. 1.0.5)'
    });
    
    if (!customVersion) process.exit(1);
    finalVersion = customVersion;
  }

  // Update manifest.json automatically if version changed
  if (finalVersion !== currentVersion) {
    manifest.version = finalVersion;
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`${color.green}✔ Updated manifest.json to version ${color.bold}${finalVersion}${color.reset}\n`);
  } else {
    console.log(`${color.dim}Proceeding with current version: ${currentVersion}${color.reset}\n`);
  }
}

// ─── 3. BUNDLER PACKAGING ENGINE ─────────────────────────────────────────────
async function executeBundle(isPackageMode = false) {
  console.log(`${color.cyan} Mono Compiler: Synthesizing asset tree...${color.reset}`);

  const { manifest, files: manifestAssets } = parseManifestAndCollectFiles();
  
  const pkgInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const publisher = pkgInfo.publisher || "unknown";
  
  const extId = manifest.id || "mono-extension";
  const version = manifest.version || "1.0.0";
  const zipName = `${publisher}.${extId}-v${version}.msxt`;

  let sourceEntry = manifest.source;
  if (!sourceEntry) {
    if (fs.existsSync("src/main.tsx")) sourceEntry = "src/main.tsx";
    else if (fs.existsSync("src/main.ts")) sourceEntry = "src/main.ts";
    else if (fs.existsSync("src/main.jsx")) sourceEntry = "src/main.jsx";
    else if (fs.existsSync("src/main.js")) sourceEntry = "src/main.js";
  }

  const hasCode = !!sourceEntry;

  if (manifest.source && !fs.existsSync(manifest.source)) {
    console.error(`\n${color.red}${color.bold}❌ VALIDATION ERROR:${color.reset} Explicit source entry point '${manifest.source}' not found.`);
    process.exit(1);
  }

  const mainEntry = manifest.main || "dist/main.js";
  const mainEntryClean = path.normalize(mainEntry).replace(/^(\.\.\/|\.\/)+/, "");

  if (hasCode) {
    const mscodeApiPlugin = {
      name: 'mscode-api',
      setup(build) {
        build.onResolve({ filter: /^@mscode\/api$/ }, args => ({
          path: args.path,
          namespace: 'mscode-api-ns',
        }));
        build.onLoad({ filter: /.*/, namespace: 'mscode-api-ns' }, () => ({
          contents: 'module.exports = mscode;', 
        }));
      },
    };
    
    console.log(`📦 Bundling script workspace using esbuild engine matrix...`);
    try {
      await build({
        entryPoints: [sourceEntry],
        outfile: mainEntryClean,
        bundle: true,
        platform: "node",
        format: "cjs",
        minify: true,
        legalComments: "none",
        treeShaking: true,
        sourcemap: false,
        external: ["mscode", "react", "react-dom", "react/jsx-runtime" , "@mscode/ui" , "child_process"],
        loader: {
              '.woff': 'dataurl',
              '.woff2': 'dataurl',
              '.ttf': 'dataurl',
              '.eot': 'dataurl',
              '.svg': 'dataurl'
            },
        plugins: [mscodeApiPlugin]
      });
      console.log(`${color.green} JS Compilation Complete → ${mainEntryClean}${color.reset}`);
    } catch (err) {
      console.error(`${color.magenta}❌ Process Termination due to compilation failure: ${err.message}${color.reset}`);
      process.exit(1);
    }
  } else {
    console.log(`${color.yellow}ℹ Pure Asset/Theme Extension Detected (No JS/TS source found). Skipping compilation.${color.reset}`);
  }

  if (!isPackageMode) return;

  console.log(`${color.cyan}📦 Packaging distribution build...${color.reset}`);
  if (fs.existsSync(zipName)) fs.unlinkSync(zipName);

  const outputStream = fs.createWriteStream(zipName);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(outputStream);

  if (hasCode) {
    archive.file(mainEntryClean, { name: mainEntryClean });
    
    const cssFile = mainEntryClean.replace(/\.js$/, '.css');
    if (fs.existsSync(cssFile)) {
      archive.file(cssFile, { name: cssFile });
      console.log(`${color.dim}  ↳ Packed Generated Stylesheet: ${cssFile}${color.reset}`);
    }
  }
  
  const productionManifest = { ...manifest };
  
  if (hasCode) {
    productionManifest.main = mainEntryClean;
  } else {
    delete productionManifest.main;
  }
  delete productionManifest.source;
  
  archive.append(JSON.stringify(productionManifest, null, 2), { name: "manifest.json" });

  if (fs.existsSync("package.json")) {
    archive.file("package.json", { name: "package.json" });
  }

  for (const filePath of manifestAssets) {
    if (hasCode && filePath === sourceEntry) continue;
    archive.file(filePath, { name: filePath });
    console.log(`${color.dim}  ↳ Packed Assets Context: ${filePath}${color.reset}`);
  }

  await new Promise((resolve, reject) => {
    outputStream.on("close", resolve);
    archive.on("error", reject);
    archive.finalize().catch(reject);
  });

  const sizeKB = (fs.statSync(zipName).size / 1024).toFixed(1);
  console.log(`\n ${color.green}${color.bold}SUCCESS:${color.reset} Extracted bundle package ready!`);
  console.log(`📦 File: ${color.yellow}${color.underline}${color.bold}${zipName}${color.reset} (${sizeKB} KB)\n`);
  
  return zipName ;
}

// ─── 4. PUBLISH ENGINE ───────────────────────────────────────────────────────
async function publishExtension(zipName, token) {
  console.log(`${color.cyan} Initiating secure uplink to Mono Registry...${color.reset}`);
  
  const REGISTRY_URL = process.env.MSCE_REGISTRY_URL || "https://monostudio-code.vercel.app/api/publish";

  try {
    const fileBuffer = fs.readFileSync(zipName);
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    const formData = new FormData();
    formData.append('file', blob, zipName);

    console.log(`${color.dim}Authenticating via Personal Access Token (PAT)...${color.reset}`);
    
    const response = await fetch(REGISTRY_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status} - ${response.statusText}`);
    }

    console.log(`\n${color.green}${color.bold}✅ PUBLISH SUCCESSFUL!${color.reset}`);
    console.log(`ID:      ${color.bold}${result.extension.id}${color.reset}`);
    console.log(`Version: ${color.bold}${result.extension.version}${color.reset}\n`);

  } catch (err) {
    console.error(`\n${color.red}${color.bold}❌ PUBLISH FAILED:${color.reset} ${err.message}\n`);
    process.exit(1);
  }
}

// ─── CLI ROUTER ──────────────────────────────────────────────────────────────
(async () => {
  if (command === "build") {
    await executeBundle(false);
    process.exit(0);
  } 
  else if (command === "package" || command === "release") {
    await executeBundle(true);
    process.exit(0);
  }
  else if (command === "publish") {
    const tokenIndex = args.indexOf("--token");
    const token = tokenIndex !== -1 ? args[tokenIndex + 1] : process.env.MSCE_TOKEN;

    if (!token) {
      console.error(`\n${color.red}${color.bold}❌ AUTH ERROR:${color.reset} CLI token missing.`);
      console.error(`Use: ${color.cyan}npx msce publish --token <your_pat_token>${color.reset}\n`);
      process.exit(1);
    }

    // Interactive Version Bumper
    await promptVersionUpgrade();

    const zipName = await executeBundle(true); 
    await publishExtension(zipName, token);
  }
  else if (command === "watch") {
    await executeBundle(false);
    console.log(`${color.dim}Watching for real-time changes in src/ and assets/...${color.reset}`);
    
    let debounceTimer;
    fs.watch("src", { recursive: true }, (event, filename) => {
      if (!filename || !/\.(js|json|md|ts)$/i.test(filename)) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        console.log(`\n${color.bold} Mutation detected in ${filename}. Recompiling...${color.reset}`);
        await executeBundle(false);
      }, 500);
    });
  }
  else {
    console.error(`${color.red}Unknown command: '${command}'. Supported pipelines: build, watch, package , publish${color.reset}`);
    process.exit(1);
  }
})();