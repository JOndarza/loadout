const { getGlobalRoot, getItems, getCatalogItems, getProfiles, getUiState } = require('../data');
const { getSettings }           = require('./settings-host');
const { detectVscodeThemeKind } = require('./theme');
const { version: EXT_VERSION }  = require('../package.json');
const { getClaudeSettings }     = require('./claude-settings');
const { getMemoryFiles }        = require('./memory-files');
const { getMcpServers }         = require('./mcp-host');

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
    lastApplied:      getUiState(storePath).lastApplied ?? null,
    claudeSettings:   getClaudeSettings(),
    memoryFiles:      getMemoryFiles(root),
    mcpServers:       getMcpServers(root),
  };
}

module.exports = { buildInitialData };
