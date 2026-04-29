const vscode = require('vscode');
const fs     = require('fs');
const path   = require('path');
const { getWorkspaceRoot, getGlobalRoot, getProfiles, getItems, toggleItem, migrateLegacyStore, copyFromGlobal } = require('./data');
const { LoadoutPanel, LoadoutSidebarProvider }                                                                  = require('./src/panel');
const { loadWebviewHtml }                                                                                       = require('./src/webview-loader');
const { init: initLogger, log }                                                                                 = require('./src/logger');
const { LoadoutTaskProvider }                                                                                   = require('./src/task-provider');

const CATALOG_TYPES      = ['agents', 'skills', 'commands'];
const RESTORE_POINT_KEY  = '__restore_point__';

function applyProfileItems(root, storePath, name) {
  const profiles = getProfiles(storePath);
  const profile  = profiles[name];
  if (!profile || !root) return false;
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
  return true;
}

function activate(context) {
  initLogger(context);

  const storePath = context.storageUri?.fsPath ?? null;
  const root      = getWorkspaceRoot();

  if (storePath) {
    fs.mkdirSync(storePath, { recursive: true });
    if (root) migrateLegacyStore(root, storePath);
  }

  const sidebarProvider = new LoadoutSidebarProvider(context, storePath);

  context.subscriptions.push(
    vscode.commands.registerCommand('loadout.openPanel', () =>
      LoadoutPanel.createOrShow(context, storePath),
    ),
    vscode.commands.registerCommand('loadout.refresh', () => {
      if (LoadoutPanel.currentPanel) {
        LoadoutPanel.currentPanel._panel.webview.html = loadWebviewHtml(
          { webview: LoadoutPanel.currentPanel._panel.webview },
          context,
        );
      }
    }),
    vscode.commands.registerCommand('loadout.adoptFile', (uri) => {
      if (!uri?.fsPath) return;
      const filePath   = uri.fsPath;
      const globalRoot = getGlobalRoot();
      const itemType   = CATALOG_TYPES.find((t) =>
        filePath.startsWith(path.join(globalRoot, t) + path.sep) ||
        filePath.startsWith(path.join(globalRoot, t) + '/'),
      );
      if (!itemType) {
        vscode.window.showWarningMessage('This file is not in the Loadout global catalog.');
        return;
      }
      const currentRoot = getWorkspaceRoot();
      if (!currentRoot) {
        vscode.window.showWarningMessage('Open a folder to adopt catalog items.');
        return;
      }
      const file = path.basename(filePath);
      copyFromGlobal(globalRoot, currentRoot, itemType, file);
      log.info(`Adopted "${file}" (${itemType}) into workspace`);
      vscode.window.showInformationMessage(`Adopted "${file}" into workspace`);
      sidebarProvider.refresh();
    }),
    vscode.commands.registerCommand('loadout.applyProfile', () => {
      const currentRoot = getWorkspaceRoot();
      if (!storePath) return;
      const profiles = getProfiles(storePath);
      const names = Object.keys(profiles).filter((n) => n !== RESTORE_POINT_KEY);
      if (!names.length) {
        vscode.window.showInformationMessage('No loadout profiles saved yet.');
        return;
      }
      vscode.window.showQuickPick(names, { placeHolder: 'Apply a loadout profile' }).then((selected) => {
        if (!selected) return;
        if (!currentRoot) { vscode.window.showWarningMessage('Open a folder to apply profiles.'); return; }
        if (applyProfileItems(currentRoot, storePath, selected)) {
          log.info(`Applied profile "${selected}" from QuickPick`);
          vscode.window.showInformationMessage(`Loadout "${selected}" applied`);
          sidebarProvider.refresh();
        }
      });
    }),
    vscode.tasks.registerTaskProvider(
      'loadout',
      new LoadoutTaskProvider(storePath, (name) => {
        const r = getWorkspaceRoot();
        if (applyProfileItems(r, storePath, name)) {
          log.info(`Applied profile "${name}" via task`);
          sidebarProvider.refresh();
        }
      }),
    ),
    vscode.window.registerWebviewViewProvider('loadout.sidebarView', sidebarProvider),
  );
}

function deactivate() {}
module.exports = { activate, deactivate };
