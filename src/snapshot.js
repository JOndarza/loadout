const { getGlobalRoot, getItems, getCatalogItems, getProfiles } = require('../data');
const { getSettings }           = require('./settings-host');
const { detectVscodeThemeKind } = require('./theme');
const { version: EXT_VERSION }  = require('../package.json');

function buildInitialData(root, storePath) {
  const globalRoot = getGlobalRoot();
  return {
    root:             root || '',
    agents:           root ? getItems(root, storePath, 'agents') : [],
    skills:           root ? getItems(root, storePath, 'skills') : [],
    commands:         root ? getItems(root, storePath, 'commands') : [],
    profiles:         getProfiles(storePath),
    catalogAgents:    root ? getCatalogItems('agents', root, storePath, globalRoot) : [],
    catalogSkills:    root ? getCatalogItems('skills', root, storePath, globalRoot) : [],
    catalogCommands:  root ? getCatalogItems('commands', root, storePath, globalRoot) : [],
    globalRoot,
    settings:         getSettings(storePath),
    vscodeThemeKind:  detectVscodeThemeKind(),
    extensionVersion: EXT_VERSION,
  };
}

module.exports = { buildInitialData };
