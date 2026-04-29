const vscode = require('vscode');
const {
  getGlobalRoot, getItems, toggleItem, copyFromGlobal, pushToGlobal,
  getProfiles, saveProfiles, renameProfile, reorderProfiles,
  updateProfileItems, duplicateProfile,
} = require('../data');
const { buildInitialData }                                                   = require('./snapshot');
const { getSettings, saveSettings }                                          = require('./settings-host');
const { DEFAULT_REGISTRY_URL }                                               = require('./constants');
const { ALLOWED_ITEM_TYPES, isSafeName, isSafeArray, isAllowedExternalUrl } = require('./validators');
const { checkRegistryStatus, runUpdateScript, parseUpdateOutput }            = require('./registry');

const NO_ROOT_OK = new Set(['ready', 'updateSettings', 'openExternal', 'revealCatalog', 'testRegistry']);

function handleMessage(msg, refresh, postToWebview, root, storePath) {
  if (!root && !NO_ROOT_OK.has(msg.command)) {
    postToWebview({ command: 'notify', level: 'warn', text: 'Open a folder to use this feature' });
    return;
  }

  switch (msg.command) {
    case 'ready':
      postToWebview({ command: 'initialData', data: buildInitialData(root, storePath) });
      break;

    case 'refresh':
      refresh();
      break;

    case 'toggle':
      if (!ALLOWED_ITEM_TYPES.has(msg.type) || !isSafeName(msg.file)) return;
      toggleItem(root, storePath, msg.type, msg.file, msg.wasActive);
      refresh();
      break;

    case 'bulkToggle': {
      if (!Array.isArray(msg.items)) return;
      for (const item of msg.items) {
        if (!ALLOWED_ITEM_TYPES.has(item.type) || !isSafeName(item.file)) continue;
        toggleItem(root, storePath, item.type, item.file, item.wasActive);
      }
      refresh();
      break;
    }

    case 'addFromGlobal':
      if (!ALLOWED_ITEM_TYPES.has(msg.itemType) || !isSafeName(msg.file)) return;
      copyFromGlobal(getGlobalRoot(), root, msg.itemType, msg.file);
      refresh();
      break;

    case 'pushToGlobal':
      if (!ALLOWED_ITEM_TYPES.has(msg.itemType) || !isSafeName(msg.file)) return;
      pushToGlobal(getGlobalRoot(), root, storePath, msg.itemType, msg.file);
      refresh();
      vscode.window.showInformationMessage(`Promoted "${msg.file}" to catalog`);
      break;

    case 'saveProfile': {
      const name = msg.name?.trim();
      if (!isSafeName(name)) return;
      const profiles = getProfiles(storePath);
      const existing = profiles[name] || {};
      profiles[name] = {
        agents:    getItems(root, storePath, 'agents').filter(a => a.active).map(a => a.file),
        skills:    getItems(root, storePath, 'skills').filter(s => s.active).map(s => s.file),
        commands:  getItems(root, storePath, 'commands').filter(c => c.active).map(c => c.file),
        createdAt: existing.createdAt || new Date().toISOString(),
        order:     existing.order ?? Object.keys(profiles).length,
      };
      saveProfiles(storePath, profiles);
      refresh();
      break;
    }

    case 'applyProfile': {
      if (!isSafeName(msg.name)) return;
      const profiles = getProfiles(storePath);
      const profile  = profiles[msg.name];
      if (!profile) return;
      for (const a of getItems(root, storePath, 'agents')) {
        if (a.active !== profile.agents.includes(a.file))
          toggleItem(root, storePath, 'agents', a.file, a.active);
      }
      for (const s of getItems(root, storePath, 'skills')) {
        if (s.active !== profile.skills.includes(s.file))
          toggleItem(root, storePath, 'skills', s.file, s.active);
      }
      for (const c of getItems(root, storePath, 'commands')) {
        if (c.active !== (profile.commands ?? []).includes(c.file))
          toggleItem(root, storePath, 'commands', c.file, c.active);
      }
      refresh();
      if (!msg.silent) vscode.window.showInformationMessage(`Loadout "${msg.name}" applied`);
      break;
    }

    case 'deleteProfile': {
      if (!isSafeName(msg.name)) return;
      const profiles = getProfiles(storePath);
      delete profiles[msg.name];
      saveProfiles(storePath, profiles);
      refresh();
      break;
    }

    case 'renameProfile':
      if (!isSafeName(msg.from) || !isSafeName(msg.to)) return;
      renameProfile(storePath, msg.from, msg.to);
      refresh();
      break;

    case 'reorderProfiles':
      if (!isSafeArray(msg.order)) return;
      reorderProfiles(storePath, msg.order);
      refresh();
      break;

    case 'updateProfileItems':
      if (!isSafeName(msg.name) || !isSafeArray(msg.agents) || !isSafeArray(msg.skills) || !isSafeArray(msg.commands ?? [])) return;
      updateProfileItems(storePath, msg.name, { agents: msg.agents, skills: msg.skills, commands: msg.commands ?? [] });
      refresh();
      break;

    case 'duplicateProfile':
      if (!isSafeName(msg.from) || !isSafeName(msg.to)) return;
      duplicateProfile(storePath, msg.from, msg.to);
      refresh();
      break;

    case 'updateSettings':
      saveSettings(storePath, msg.settings || {});
      refresh();
      break;

    case 'revealCatalog':
      vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(getGlobalRoot()))
        .then(undefined, () =>
          postToWebview({ command: 'notify', level: 'warn', text: 'Reveal not available in this environment' })
        );
      break;

    case 'testRegistry': {
      const url = (msg.url || DEFAULT_REGISTRY_URL).trim();
      if (!isAllowedExternalUrl(url)) return;
      fetch(url)
        .then(res => postToWebview({ command: 'testRegistryResult', ok: res.ok, status: res.status }))
        .catch(err => postToWebview({ command: 'testRegistryResult', ok: false, error: err.message }));
      break;
    }

    case 'checkRegistry': {
      const url = getSettings(storePath).registryUrl || DEFAULT_REGISTRY_URL;
      checkRegistryStatus(root, storePath, url)
        .then(items => postToWebview({ command: 'registryStatus', items }))
        .catch(err  => postToWebview({ command: 'registryStatus', items: [], error: err.message }));
      break;
    }

    case 'runUpdate':
      postToWebview({ command: 'updateStarted' });
      runUpdateScript(root).then(({ code, out }) => {
        const result = parseUpdateOutput(out);
        if (code !== 0 && result.updated.length === 0 && result.skipped.length === 0 && result.failed.length === 0) {
          result.failed.push('Script error — check extension logs');
        }
        postToWebview({ command: 'updateDone', result });
        if (result.updated.length > 0) refresh();
      });
      break;

    case 'openExternal':
      if (isAllowedExternalUrl(msg.url)) vscode.env.openExternal(vscode.Uri.parse(msg.url));
      break;
  }
}

module.exports = { handleMessage };
