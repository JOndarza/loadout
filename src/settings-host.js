const { getUiState, saveUiState } = require('../data');
const { DEFAULT_REGISTRY_URL }    = require('./constants');

const DEFAULT_SETTINGS = {
  density:     'comfortable',
  theme:       'auto',
  defaultTab:  'workspace',
  registryUrl: DEFAULT_REGISTRY_URL,
};

function getSettings(storePath) {
  if (!storePath) return { ...DEFAULT_SETTINGS };
  const ui = getUiState(storePath) || {};
  return { ...DEFAULT_SETTINGS, ...(ui.settings || {}) };
}

function saveSettings(storePath, partial) {
  if (!storePath) return;
  const ui = getUiState(storePath) || {};
  ui.settings = { ...(ui.settings || DEFAULT_SETTINGS), ...partial };
  saveUiState(storePath, ui);
}

module.exports = { DEFAULT_SETTINGS, getSettings, saveSettings };
