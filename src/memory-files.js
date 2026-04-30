const fs   = require('fs');
const path = require('path');
const os   = require('os');

function readPathsGlob(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').slice(0, 4096);
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return null;
    const m = fm[1].match(/^paths:\s*(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

function getMemoryFiles(root) {
  const files = [];

  const candidates = [
    { filePath: path.join(os.homedir(), '.claude', 'CLAUDE.md'), scope: 'user' },
  ];
  if (root) {
    candidates.push(
      { filePath: path.join(root, 'CLAUDE.md'),            scope: 'project' },
      { filePath: path.join(root, 'CLAUDE.local.md'),      scope: 'local'   },
      { filePath: path.join(root, '.claude', 'CLAUDE.md'), scope: 'project' },
    );
  }

  for (const { filePath, scope } of candidates) {
    if (fs.existsSync(filePath)) files.push({ path: filePath, scope, pathsGlob: null });
  }

  if (root) {
    const rulesDir = path.join(root, '.claude', 'rules');
    if (fs.existsSync(rulesDir)) {
      for (const entry of fs.readdirSync(rulesDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        const fp = path.join(rulesDir, entry.name);
        files.push({ path: fp, scope: 'rules', pathsGlob: readPathsGlob(fp) });
      }
    }
  }

  return files;
}

module.exports = { getMemoryFiles };
