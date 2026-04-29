const fs   = require('fs');
const path = require('path');
const os   = require('os');

const CLAUDE_DIR      = path.join(os.homedir(), '.claude');
const SETTINGS_PATH   = path.join(CLAUDE_DIR, 'settings.json');

function read() {
  try {
    return fs.existsSync(SETTINGS_PATH)
      ? JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
      : {};
  } catch { return {}; }
}

function write(data) {
  if (!fs.existsSync(CLAUDE_DIR)) fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
}

function getClaudeSettings() {
  const s = read();
  return {
    model:              s.model              ?? null,
    effortLevel:        s.effortLevel        ?? null,
    autoMemoryEnabled:  s.autoMemoryEnabled  ?? null,
    env:                s.env                ?? {},
  };
}

function setClaudeSettingKey(key, value) {
  const s = read();
  if (value === null || value === undefined) {
    delete s[key];
  } else {
    s[key] = value;
  }
  write(s);
}

function addEnvVar(key, value) {
  const s = read();
  s.env = { ...(s.env ?? {}), [key]: value };
  write(s);
}

function removeEnvVar(key) {
  const s = read();
  if (s.env) delete s.env[key];
  write(s);
}

module.exports = { getClaudeSettings, setClaudeSettingKey, addEnvVar, removeEnvVar };
