const vscode = require('vscode');
const fs     = require('fs');
const { getWorkspaceRoot, migrateLegacyStore } = require('./data');
const { LoadoutPanel, LoadoutSidebarProvider } = require('./src/panel');
const { loadWebviewHtml }                      = require('./src/webview-loader');

function activate(context) {
  const storePath = context.storageUri?.fsPath ?? null;
  const root      = getWorkspaceRoot();

  if (storePath) {
    fs.mkdirSync(storePath, { recursive: true });
    if (root) migrateLegacyStore(root, storePath);
  }

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
    vscode.window.registerWebviewViewProvider(
      'loadout.sidebarView',
      new LoadoutSidebarProvider(context, storePath),
    ),
  );
}

function deactivate() {}
module.exports = { activate, deactivate };
