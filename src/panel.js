const vscode = require('vscode');
const { getWorkspaceRoot }              = require('../data');
const { loadWebviewHtml, WEBVIEW_DIST } = require('./webview-loader');
const { detectVscodeThemeKind }         = require('./theme');
const { buildInitialData }              = require('./snapshot');
const { handleMessage }                 = require('./message-handler');

function attachWebview(webview, context, storePath) {
  webview.options = {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, WEBVIEW_DIST)],
  };

  const refresh = () => {
    webview.postMessage({
      command: 'dataUpdate',
      data: buildInitialData(getWorkspaceRoot(), storePath),
    });
  };

  webview.html = loadWebviewHtml({ webview }, context);

  const sub1 = webview.onDidReceiveMessage((msg) =>
    handleMessage(msg, refresh, (m) => webview.postMessage(m), getWorkspaceRoot(), storePath),
  );
  const sub2 = vscode.window.onDidChangeActiveColorTheme(() => {
    webview.postMessage({ command: 'vscodeThemeChanged', kind: detectVscodeThemeKind() });
  });

  return [sub1, sub2];
}

class LoadoutPanel {
  static currentPanel = undefined;

  static createOrShow(context, storePath) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
    if (LoadoutPanel.currentPanel) {
      LoadoutPanel.currentPanel._panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'loadout',
      'Loadout',
      column,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    LoadoutPanel.currentPanel = new LoadoutPanel(panel, context, storePath);
  }

  constructor(panel, context, storePath) {
    this._panel       = panel;
    this._disposed    = false;
    this._disposables = attachWebview(panel.webview, context, storePath);
    panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    LoadoutPanel.currentPanel = undefined;
    this._panel.dispose();
    this._disposables.forEach((d) => d.dispose());
  }
}

class LoadoutSidebarProvider {
  constructor(context, storePath) {
    this._context   = context;
    this._storePath = storePath;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    const subs = attachWebview(webviewView.webview, this._context, this._storePath);
    webviewView.onDidDispose(() => {
      this._view = undefined;
      subs.forEach((d) => d.dispose());
    });
  }
}

module.exports = { attachWebview, LoadoutPanel, LoadoutSidebarProvider };
