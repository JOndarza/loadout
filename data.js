const vscode = require('vscode');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');

const CLAUDE_DIR    = '.claude';
const LEGACY_STORE  = '.claude-store';
const PROFILES_FILE = 'profiles.json';
const UI_STATE_FILE = 'ui-state.json';
const HASHES_FILE   = '.claude-hashes.json';
const MIGRATED_MARK = '.migrated';

// ─── Workspace ────────────────────────────────────────────────────────────────
function getWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  return folders ? folders[0].uri.fsPath : null;
}

function getGlobalRoot() {
  const cfg = vscode.workspace.getConfiguration('loadout').get('globalCatalogPath');
  return cfg?.trim() || path.join(os.homedir(), '.claude');
}

// ─── Hash helpers ─────────────────────────────────────────────────────────────
function getAllFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllFiles(full));
    else results.push(full);
  }
  return results;
}

function computeHash(filePath) {
  try {
    const hash = crypto.createHash('sha256');
    if (fs.statSync(filePath).isDirectory()) {
      for (const f of getAllFiles(filePath).sort()) {
        hash.update(path.relative(filePath, f));
        hash.update(fs.readFileSync(f));
      }
    } else {
      hash.update(fs.readFileSync(filePath));
    }
    return hash.digest('hex');
  } catch { return null; }
}

function getHashStore(globalRoot) {
  const p = path.join(globalRoot, HASHES_FILE);
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {}; }
  catch { return {}; }
}

function saveHashStore(globalRoot, store) {
  fs.writeFileSync(path.join(globalRoot, HASHES_FILE), JSON.stringify(store, null, 2));
}

function getSyncStatus(localHash, sharedHash, savedHash) {
  if (!savedHash) return localHash === sharedHash ? 'synced' : 'localModified';
  const localChanged  = localHash  !== savedHash;
  const sharedChanged = sharedHash !== savedHash;
  if (!localChanged && !sharedChanged) return 'synced';
  if (!localChanged &&  sharedChanged) return 'sharedUpdated';
  if ( localChanged && !sharedChanged) return 'localModified';
  return 'diverged';
}

// ─── Filesystem ───────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function estimateTokens(filePath) {
  try { return Math.ceil(fs.readFileSync(filePath, 'utf8').length / 4); }
  catch { return 0; }
}

// Mtime-based cache to avoid re-hashing unchanged files on every refresh
const hashCache = new Map();
function computeHashCached(filePath) {
  try {
    const st  = fs.statSync(filePath);
    const key = `${st.mtimeMs}:${st.size}:${filePath}`;
    if (hashCache.has(key)) return hashCache.get(key);
    const h = computeHash(filePath);
    hashCache.set(key, h);
    return h;
  } catch { return null; }
}

function readDescription(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.length > 16_384) content = content.slice(0, 16_384);
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return '';
    const m = fm[1].match(/^description:\s*"((?:[^"\\]|\\.)*?)"\s*$/m)
           || fm[1].match(/^description:\s*'((?:[^'\\]|\\.)*?)'\s*$/m)
           || fm[1].match(/^description:\s*(.+)$/m);
    if (!m) return '';
    const desc = m[1].replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    return desc.length > 110 ? desc.slice(0, 110) + '…' : desc;
  } catch { return ''; }
}

function readFrontmatterField(filePath, field) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').slice(0, 4096);
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return null;
    const m = fm[1].match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  } catch { return null; }
}

// ─── Legacy store migration ───────────────────────────────────────────────────
// One-time copy from <root>/.claude-store/ to the new storePath. The marker
// file ensures we never re-copy after the user has modified data in storePath.
function migrateLegacyStore(root, storePath) {
  ensureDir(storePath);
  const marker = path.join(storePath, MIGRATED_MARK);
  if (fs.existsSync(marker)) return;
  const legacy = path.join(root, LEGACY_STORE);
  if (fs.existsSync(legacy)) {
    fs.cpSync(legacy, storePath, { recursive: true });
  }
  fs.writeFileSync(marker, new Date().toISOString());
}

// ─── Project items ────────────────────────────────────────────────────────────
function getItems(root, storePath, type) {
  const activeDir = path.join(root, CLAUDE_DIR, type);
  const storeDir  = path.join(storePath, type);
  const items = [];

  function readFromDir(dir, active) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const fp = path.join(dir, entry.name);
        const item = { name: entry.name.replace('.md', ''), file: entry.name, active, tokens: estimateTokens(fp), description: readDescription(fp) };
        if (type === 'agents') item.memoryScope = readFrontmatterField(fp, 'memory');
        items.push(item);
      } else if (entry.isDirectory()) {
        const skillFile = path.join(dir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          items.push({ name: entry.name, file: entry.name, active, tokens: estimateTokens(skillFile), description: readDescription(skillFile) });
        }
      }
    }
  }

  readFromDir(activeDir, true);
  readFromDir(storeDir, false);
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

function toggleItem(root, storePath, type, file, currentlyActive) {
  const activeDir = path.join(root, CLAUDE_DIR, type);
  const storeDir  = path.join(storePath, type);
  ensureDir(activeDir);
  ensureDir(storeDir);
  const from = currentlyActive ? path.join(activeDir, file) : path.join(storeDir, file);
  const to   = currentlyActive ? path.join(storeDir,  file) : path.join(activeDir, file);
  if (!fs.existsSync(from)) {
    if (!fs.existsSync(to)) {
      console.warn(`[loadout] toggleItem: ${type}/${file} not found in either location`);
    }
    return;
  }
  try {
    fs.renameSync(from, to);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.cpSync(from, to, { recursive: true });
      fs.rmSync(from, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

// ─── Global catalog ───────────────────────────────────────────────────────────
function getCatalogItems(type, projectRoot, storePath, globalRoot) {
  const globalDir     = path.join(globalRoot, type);
  const projectActive = path.join(projectRoot, CLAUDE_DIR, type);
  const projectStore  = path.join(storePath, type);
  const hashes        = getHashStore(globalRoot);
  const items = [];

  if (!fs.existsSync(globalDir)) return items;

  for (const entry of fs.readdirSync(globalDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const fp        = path.join(globalDir, entry.name);
      const localPath = fs.existsSync(path.join(projectActive, entry.name)) ? path.join(projectActive, entry.name)
                      : fs.existsSync(path.join(projectStore,  entry.name)) ? path.join(projectStore,  entry.name) : null;
      const inProject  = localPath !== null;
      const syncStatus = inProject
        ? getSyncStatus(computeHashCached(localPath), computeHashCached(fp), hashes[`${type}/${entry.name}`] ?? null)
        : null;
      items.push({ name: entry.name.replace('.md', ''), file: entry.name, tokens: estimateTokens(fp), description: readDescription(fp), inProject, syncStatus });
    } else if (entry.isDirectory()) {
      const skillFile = path.join(globalDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;
      const localPath = fs.existsSync(path.join(projectActive, entry.name)) ? path.join(projectActive, entry.name)
                      : fs.existsSync(path.join(projectStore,  entry.name)) ? path.join(projectStore,  entry.name) : null;
      const inProject  = localPath !== null;
      const syncStatus = inProject
        ? getSyncStatus(computeHashCached(localPath), computeHashCached(path.join(globalDir, entry.name)), hashes[`${type}/${entry.name}`] ?? null)
        : null;
      items.push({ name: entry.name, file: entry.name, tokens: estimateTokens(skillFile), description: readDescription(skillFile), inProject, syncStatus });
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

function copyFromGlobal(globalRoot, projectRoot, type, file) {
  const src  = path.join(globalRoot, type, file);
  const dest = path.join(projectRoot, CLAUDE_DIR, type, file);
  ensureDir(path.join(projectRoot, CLAUDE_DIR, type));
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
  const store = getHashStore(globalRoot);
  store[`${type}/${file}`] = computeHash(src);
  saveHashStore(globalRoot, store);
}

function pushToGlobal(globalRoot, projectRoot, storePath, type, file) {
  const globalDir = path.join(globalRoot, type);
  ensureDir(globalDir);
  const activeSrc = path.join(projectRoot, CLAUDE_DIR, type, file);
  const storeSrc  = path.join(storePath, type, file);
  const src = fs.existsSync(activeSrc) ? activeSrc : storeSrc;
  if (!fs.existsSync(src)) return;
  const dest = path.join(globalDir, file);
  fs.cpSync(src, dest, { recursive: true });
  const store = getHashStore(globalRoot);
  store[`${type}/${file}`] = computeHash(dest);
  saveHashStore(globalRoot, store);
}

function getGlobalFileSet(globalRoot, type) {
  const dir = path.join(globalRoot, type);
  try { return fs.existsSync(dir) ? new Set(fs.readdirSync(dir)) : new Set(); }
  catch { return new Set(); }
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
function getProfiles(storePath) {
  const pp = path.join(storePath, PROFILES_FILE);
  try { return fs.existsSync(pp) ? JSON.parse(fs.readFileSync(pp, 'utf8')) : {}; }
  catch { return {}; }
}

function saveProfiles(storePath, profiles) {
  ensureDir(storePath);
  fs.writeFileSync(path.join(storePath, PROFILES_FILE), JSON.stringify(profiles, null, 2));
}

function renameProfile(storePath, from, to) {
  if (!from || !to || from === to) return;
  const profiles = getProfiles(storePath);
  if (!profiles[from] || profiles[to]) return;
  profiles[to] = profiles[from];
  delete profiles[from];
  saveProfiles(storePath, profiles);
}

function reorderProfiles(storePath, names) {
  const profiles = getProfiles(storePath);
  names.forEach((name, idx) => {
    if (profiles[name]) profiles[name].order = idx;
  });
  saveProfiles(storePath, profiles);
}

function updateProfileItems(storePath, name, { agents, skills, commands }) {
  const profiles = getProfiles(storePath);
  if (!profiles[name]) return;
  if (Array.isArray(agents))   profiles[name].agents   = agents;
  if (Array.isArray(skills))   profiles[name].skills   = skills;
  if (Array.isArray(commands)) profiles[name].commands = commands;
  saveProfiles(storePath, profiles);
}

function duplicateProfile(storePath, from, to) {
  const profiles = getProfiles(storePath);
  if (!profiles[from] || profiles[to]) return;
  profiles[to] = {
    agents:    [...(profiles[from].agents   || [])],
    skills:    [...(profiles[from].skills   || [])],
    commands:  [...(profiles[from].commands || [])],
    createdAt: new Date().toISOString(),
    order:     Object.keys(profiles).length,
  };
  saveProfiles(storePath, profiles);
}

function updateProfileDescription(storePath, name, description) {
  const profiles = getProfiles(storePath);
  if (!profiles[name]) return;
  profiles[name].description = String(description).slice(0, 500);
  saveProfiles(storePath, profiles);
}

// ─── UI state ─────────────────────────────────────────────────────────────────
function getUiState(storePath) {
  const p = path.join(storePath, UI_STATE_FILE);
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {}; }
  catch { return {}; }
}

function saveUiState(storePath, state) {
  ensureDir(storePath);
  fs.writeFileSync(path.join(storePath, UI_STATE_FILE), JSON.stringify(state));
}

module.exports = {
  CLAUDE_DIR,
  getWorkspaceRoot, getGlobalRoot,
  ensureDir, estimateTokens, readDescription,
  migrateLegacyStore,
  getItems, toggleItem,
  copyFromGlobal,
  getProfiles, saveProfiles,
  renameProfile, reorderProfiles, updateProfileItems, duplicateProfile, updateProfileDescription,
  getUiState, saveUiState,
  pushToGlobal, getCatalogItems,
};
