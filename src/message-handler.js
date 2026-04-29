const vscode = require('vscode');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const {
  getGlobalRoot, getItems, toggleItem, copyFromGlobal, pushToGlobal,
  getProfiles, saveProfiles, renameProfile, reorderProfiles,
  updateProfileItems, duplicateProfile, updateProfileDescription,
  getUiState, saveUiState,
} = require('../data');
const { buildInitialData }                                                   = require('./snapshot');
const { getSettings, saveSettings }                                          = require('./settings-host');
const { DEFAULT_REGISTRY_URL }                                               = require('./constants');
const { ALLOWED_ITEM_TYPES, isSafeName, isSafeArray, isAllowedExternalUrl } = require('./validators');
const { checkRegistryStatus, runUpdateScript, parseUpdateOutput }            = require('./registry');
const { log }                                                                = require('./logger');
const { setClaudeSettingKey, addEnvVar, removeEnvVar }                      = require('./claude-settings');

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
      log.info(`Applying profile "${msg.name}"`);
      if (!msg.skipRestorePoint) {
        profiles['__restore_point__'] = {
          agents:    getItems(root, storePath, 'agents').filter(a => a.active).map(a => a.file),
          skills:    getItems(root, storePath, 'skills').filter(s => s.active).map(s => s.file),
          commands:  getItems(root, storePath, 'commands').filter(c => c.active).map(c => c.file),
          createdAt: new Date().toISOString(),
          order:     -1,
        };
        saveProfiles(storePath, profiles);
      }
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
      profile.appliedCount  = (profile.appliedCount  ?? 0) + 1;
      profile.lastAppliedAt = new Date().toISOString();
      saveProfiles(storePath, profiles);
      saveUiState(storePath, { ...getUiState(storePath), lastApplied: msg.name });
      refresh();
      if (!msg.silent) vscode.window.withProgress(
        { location: vscode.ProgressLocation.Window, title: `Loadout "${msg.name}" applied` },
        () => new Promise((res) => setTimeout(res, 1200)),
      );
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
      log.info('Running catalog update');
      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Window, title: 'Updating catalog…', cancellable: false },
        () => runUpdateScript(root).then(({ code, out }) => {
          const result = parseUpdateOutput(out);
          if (code !== 0 && result.updated.length === 0 && result.skipped.length === 0 && result.failed.length === 0) {
            result.failed.push('Script error — check extension logs');
            log.error('Catalog update script exited with error');
          } else {
            log.info(`Catalog update done — updated: ${result.updated.length}, skipped: ${result.skipped.length}, failed: ${result.failed.length}`);
          }
          postToWebview({ command: 'updateDone', result });
          if (result.updated.length > 0) refresh();
        }),
      );
      break;

    case 'openExternal':
      if (isAllowedExternalUrl(msg.url)) vscode.env.openExternal(vscode.Uri.parse(msg.url));
      break;

    case 'updateProfileDescription':
      if (!isSafeName(msg.name) || typeof msg.description !== 'string') return;
      updateProfileDescription(storePath, msg.name, msg.description);
      refresh();
      break;

    case 'previewApplyProfile': {
      if (!isSafeName(msg.name)) return;
      const profiles = getProfiles(storePath);
      const profile  = profiles[msg.name];
      if (!profile) return;
      const profileAgents   = new Set(profile.agents   ?? []);
      const profileSkills   = new Set(profile.skills   ?? []);
      const profileCommands = new Set(profile.commands ?? []);
      const willActivate   = { agents: [], skills: [], commands: [] };
      const willDeactivate = { agents: [], skills: [], commands: [] };
      for (const a of getItems(root, storePath, 'agents')) {
        if (!a.active && profileAgents.has(a.file))   willActivate.agents.push(a.file);
        if (a.active  && !profileAgents.has(a.file))  willDeactivate.agents.push(a.file);
      }
      for (const s of getItems(root, storePath, 'skills')) {
        if (!s.active && profileSkills.has(s.file))   willActivate.skills.push(s.file);
        if (s.active  && !profileSkills.has(s.file))  willDeactivate.skills.push(s.file);
      }
      for (const c of getItems(root, storePath, 'commands')) {
        if (!c.active && profileCommands.has(c.file))  willActivate.commands.push(c.file);
        if (c.active  && !profileCommands.has(c.file)) willDeactivate.commands.push(c.file);
      }
      postToWebview({ command: 'applyProfilePreview', name: msg.name, willActivate, willDeactivate });
      break;
    }

    case 'exportProfile': {
      if (!isSafeName(msg.name)) return;
      const profiles = getProfiles(storePath);
      const profile  = profiles[msg.name];
      if (!profile) return;
      const payload = JSON.stringify({
        name:        msg.name,
        agents:      profile.agents      ?? [],
        skills:      profile.skills      ?? [],
        commands:    profile.commands    ?? [],
        description: profile.description ?? '',
        exportedAt:  new Date().toISOString(),
      }, null, 2);
      vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(os.homedir(), `${msg.name}.loadout.json`)),
        filters: { 'Loadout profile': ['json'] },
      }).then(uri => {
        if (!uri) return;
        fs.writeFileSync(uri.fsPath, payload, 'utf8');
        vscode.window.showInformationMessage(`Profile "${msg.name}" exported`);
      });
      break;
    }

    case 'importProfileRequest': {
      vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'Loadout profile': ['json'] },
      }).then(uris => {
        if (!uris || !uris[0]) return;
        let parsed;
        try { parsed = JSON.parse(fs.readFileSync(uris[0].fsPath, 'utf8')); }
        catch { postToWebview({ command: 'notify', level: 'error', text: 'Invalid profile file' }); return; }
        const agents   = Array.isArray(parsed.agents)   ? parsed.agents.filter(f => typeof f === 'string')   : [];
        const skills   = Array.isArray(parsed.skills)   ? parsed.skills.filter(f => typeof f === 'string')   : [];
        const commands = Array.isArray(parsed.commands) ? parsed.commands.filter(f => typeof f === 'string') : [];
        const desc     = typeof parsed.description === 'string' ? parsed.description : '';
        const allAgents   = new Set(getItems(root, storePath, 'agents').map(i => i.file));
        const allSkills   = new Set(getItems(root, storePath, 'skills').map(i => i.file));
        const allCommands = new Set(getItems(root, storePath, 'commands').map(i => i.file));
        const found   = {
          agents:   agents.filter(f => allAgents.has(f)),
          skills:   skills.filter(f => allSkills.has(f)),
          commands: commands.filter(f => allCommands.has(f)),
        };
        const missing = {
          agents:   agents.filter(f => !allAgents.has(f)),
          skills:   skills.filter(f => !allSkills.has(f)),
          commands: commands.filter(f => !allCommands.has(f)),
        };
        postToWebview({ command: 'profileImportPreview', originalName: parsed.name ?? 'Imported', profile: { agents, skills, commands, description: desc }, found, missing });
      });
      break;
    }

    case 'importProfileConfirm': {
      const name = msg.name?.trim();
      if (!isSafeName(name)) return;
      if (!Array.isArray(msg.profile?.agents) || !Array.isArray(msg.profile?.skills)) return;
      const profiles = getProfiles(storePath);
      const hasMissing = msg.missing && (msg.missing.agents?.length || msg.missing.skills?.length || msg.missing.commands?.length);
      profiles[name] = {
        agents:      msg.profile.agents,
        skills:      msg.profile.skills,
        commands:    msg.profile.commands ?? [],
        description: msg.profile.description ?? '',
        createdAt:   new Date().toISOString(),
        order:       Object.keys(profiles).length,
        ...(hasMissing ? { pendingItems: msg.missing } : {}),
      };
      saveProfiles(storePath, profiles);
      refresh();
      break;
    }

    case 'updateClaudeSetting':
      if (typeof msg.key !== 'string') return;
      setClaudeSettingKey(msg.key, msg.value ?? null);
      refresh();
      break;

    case 'openMemoryFile':
      if (typeof msg.path !== 'string') return;
      vscode.workspace.openTextDocument(msg.path)
        .then((doc) => vscode.window.showTextDocument(doc))
        .catch(() => postToWebview({ command: 'notify', level: 'warn', text: `Could not open: ${msg.path}` }));
      break;

    case 'addEnvVar':
      if (typeof msg.key !== 'string' || typeof msg.value !== 'string') return;
      if (!msg.key.trim()) return;
      addEnvVar(msg.key.trim(), msg.value);
      refresh();
      break;

    case 'removeEnvVar':
      if (typeof msg.key !== 'string') return;
      removeEnvVar(msg.key);
      refresh();
      break;

    case 'clearRestorePoint': {
      const profiles = getProfiles(storePath);
      delete profiles['__restore_point__'];
      saveProfiles(storePath, profiles);
      refresh();
      break;
    }

    case 'bulkAddFromGlobal': {
      if (!Array.isArray(msg.items)) return;
      for (const item of msg.items) {
        if (!ALLOWED_ITEM_TYPES.has(item.itemType) || !isSafeName(item.file)) continue;
        copyFromGlobal(getGlobalRoot(), root, item.itemType, item.file);
      }
      refresh();
      break;
    }
  }
}

module.exports = { handleMessage };
