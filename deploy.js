#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const src  = __dirname;
const dest = path.join(process.env.HOME, '.vscode/extensions/loadout');

const files = ['extension.js', 'data.js', 'update-claude.mjs', 'package.json', 'icon-activity.svg'];

fs.mkdirSync(dest, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
  console.log(`  ✓ ${file}`);
}

// Copy src/ modules (split from extension.js)
fs.cpSync(path.join(src, 'src'), path.join(dest, 'src'), { recursive: true });
console.log('  ✓ src/');

// Copy pre-built webview bundle
fs.cpSync(path.join(src, 'webview-dist'), path.join(dest, 'webview-dist'), { recursive: true });
console.log('  ✓ webview-dist/');

console.log('\nDone. Reload VS Code (⌘⇧P → Developer: Reload Window)');
