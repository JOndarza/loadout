const path   = require('path');
const { spawn } = require('child_process');
const { getItems }             = require('../data');
const { DEFAULT_REGISTRY_URL } = require('./constants');

async function checkRegistryStatus(root, storePath, url) {
  const res = await fetch(url || DEFAULT_REGISTRY_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const registry = await res.json();
  const safeArr  = (v) => Array.isArray(v) ? v : [];
  const agentSet   = new Set(safeArr(registry.agents).map(a => a?.name).filter(Boolean));
  const commandSet = new Set(safeArr(registry.commands).map(c => c?.name).filter(Boolean));
  const skillSet   = new Set(safeArr(registry.skills).map(s => s?.name).filter(Boolean));
  return [
    ...getItems(root, storePath, 'agents').map(a => ({
      name: a.name, file: a.file, itemType: 'agents',
      status: agentSet.has(a.file.replace(/\.md$/, '')) ? 'updatable' : 'custom',
    })),
    ...getItems(root, storePath, 'commands').map(cmd => ({
      name: cmd.name, file: cmd.file, itemType: 'commands',
      status: commandSet.has(cmd.file.replace(/\.md$/, '')) ? 'updatable' : 'custom',
    })),
    ...getItems(root, storePath, 'skills').map(s => ({
      name: s.name, file: s.file, itemType: 'skills',
      status: skillSet.has(s.file) ? 'updatable' : 'custom',
    })),
  ];
}

function runUpdateScript(root) {
  return new Promise(resolve => {
    const scriptPath = path.join(__dirname, '..', 'update-claude.mjs');
    const proc = spawn(process.execPath, [scriptPath], {
      cwd: root,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    let out = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => out += d.toString());
    proc.on('close', code => resolve({ code, out }));
    proc.on('error', err  => resolve({ code: -1, out: err.message }));
  });
}

function parseUpdateOutput(out) {
  const clean   = out.replace(/\x1b\[[0-9;]*m/g, '');
  const updated = [], skipped = [], failed = [];
  for (const line of clean.split('\n')) {
    const t = line.trim();
    if (/^✓/.test(t))      { const m = t.match(/✓\s+(\S+)\s+—/); if (m) updated.push(m[1]); }
    else if (/^↷/.test(t)) { const m = t.match(/↷\s+(\S+)\s+—/); if (m) skipped.push(m[1]); }
    else if (/^✗/.test(t)) { const m = t.match(/✗\s+(\S+)\s+—/); if (m) failed.push(m[1]); }
  }
  return { updated, skipped, failed };
}

module.exports = { checkRegistryStatus, runUpdateScript, parseUpdateOutput };
