const vscode = require('vscode');
const fs     = require('fs');
const path   = require('path');
const { getWorkspaceRoot, getGlobalRoot, migrateLegacyStore, copyFromGlobal } = require('./data');
const { LoadoutPanel, LoadoutSidebarProvider }                                 = require('./src/panel');
const { loadWebviewHtml }                                                      = require('./src/webview-loader');
const { init: initLogger, log }                                                = require('./src/logger');

const CATALOG_TYPES = ['agents', 'skills', 'commands'];

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
    vscode.window.registerWebviewViewProvider('loadout.sidebarView', sidebarProvider),
  );
}

function deactivate() {}
module.exports = { activate, deactivate };
