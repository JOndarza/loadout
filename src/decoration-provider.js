const vscode = require('vscode');
const path   = require('path');
const { getWorkspaceRoot, getGlobalRoot, getItems, getCatalogItems } = require('../data');

const CLAUDE_DIR = '.claude';

class LoadoutDecorationProvider {
  constructor() {
    this._map     = new Map(); // uri string → FileDecoration
    this._emitter = new vscode.EventEmitter();
    this.onDidChangeFileDecorations = this._emitter.event;
  }

  provideFileDecoration(uri) {
    return this._map.get(uri.toString());
  }

  update(storePath) {
    const root       = getWorkspaceRoot();
    const globalRoot = getGlobalRoot();
    this._map.clear();

    if (!root || !storePath) {
      this._emitter.fire(undefined);
      return;
    }

    for (const type of ['agents', 'skills', 'commands']) {
      const items   = getItems(root, storePath, type);
      const catalog = getCatalogItems(type, root, storePath, globalRoot);
      const updateSet = new Set(
        catalog.filter((i) => i.syncStatus === 'sharedUpdated').map((i) => i.file),
      );

      for (const item of items) {
        const filePath = path.join(root, CLAUDE_DIR, type, item.file);
        const uriStr   = vscode.Uri.file(filePath).toString();
        if (updateSet.has(item.file)) {
          this._map.set(uriStr, {
            badge:   '↑',
            tooltip: `Loadout: update available from catalog`,
            color:   new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'),
          });
        } else if (item.active) {
          this._map.set(uriStr, {
            badge:   'A',
            tooltip: 'Loadout: active',
            color:   new vscode.ThemeColor('gitDecoration.addedResourceForeground'),
          });
        } else {
          this._map.set(uriStr, {
            badge:   'S',
            tooltip: 'Loadout: stored (inactive)',
          });
        }
      }
    }

    this._emitter.fire(undefined);
  }

  dispose() {
    this._emitter.dispose();
  }
}

module.exports = { LoadoutDecorationProvider };
