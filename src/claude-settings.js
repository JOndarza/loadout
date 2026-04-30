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
    model:             s.model             ?? null,
    effortLevel:       s.effortLevel       ?? null,
    autoMemoryEnabled: s.autoMemoryEnabled ?? null,
    env:               s.env               ?? {},
    permissions: {
      allow:                s.permissions?.allow                ?? [],
      deny:                 s.permissions?.deny                 ?? [],
      ask:                  s.permissions?.ask                  ?? [],
      additionalDirectories: s.permissions?.additionalDirectories ?? [],
    },
    hooks:         _flattenHooks(s.hooks ?? {}),
    sandboxEnabled: s.sandbox?.enabled ?? null,
  };
}

function _flattenHooks(hooks) {
  const flat = [];
  for (const [event, groups] of Object.entries(hooks)) {
    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      for (let hi = 0; hi < (group.hooks ?? []).length; hi++) {
        const h = group.hooks[hi];
        flat.push({
          event,
          matcher:    group.matcher ?? '',
          type:       h.type ?? 'command',
          command:    h.command ?? null,
          url:        h.url    ?? null,
          disabled:   h.disabled ?? false,
          groupIndex: gi,
          hookIndex:  hi,
        });
      }
    }
  }
  return flat;
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

function addPermissionRule(ruleType, value) {
  const s = read();
  if (!s.permissions) s.permissions = {};
  if (!Array.isArray(s.permissions[ruleType])) s.permissions[ruleType] = [];
  if (!s.permissions[ruleType].includes(value)) s.permissions[ruleType].push(value);
  write(s);
}

function removePermissionRule(ruleType, value) {
  const s = read();
  if (!s.permissions?.[ruleType]) return;
  s.permissions[ruleType] = s.permissions[ruleType].filter((r) => r !== value);
  write(s);
}

function addDirectory(dirPath) {
  const s = read();
  if (!s.permissions) s.permissions = {};
  if (!Array.isArray(s.permissions.additionalDirectories)) s.permissions.additionalDirectories = [];
  if (!s.permissions.additionalDirectories.includes(dirPath))
    s.permissions.additionalDirectories.push(dirPath);
  write(s);
}

function removeDirectory(dirPath) {
  const s = read();
  if (!s.permissions?.additionalDirectories) return;
  s.permissions.additionalDirectories = s.permissions.additionalDirectories.filter((d) => d !== dirPath);
  write(s);
}

function toggleHook(event, groupIndex, hookIndex) {
  const s = read();
  const h = s.hooks?.[event]?.[groupIndex]?.hooks?.[hookIndex];
  if (!h) return;
  if (h.disabled) delete h.disabled;
  else h.disabled = true;
  write(s);
}

function setSandboxEnabled(enabled) {
  const s = read();
  if (!s.sandbox) s.sandbox = {};
  if (enabled === null) delete s.sandbox.enabled;
  else s.sandbox.enabled = enabled;
  write(s);
}

module.exports = {
  getClaudeSettings, setClaudeSettingKey, addEnvVar, removeEnvVar,
  addPermissionRule, removePermissionRule, addDirectory, removeDirectory,
  toggleHook, setSandboxEnabled,
};
