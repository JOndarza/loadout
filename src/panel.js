const vscode = require('vscode');
const path   = require('path');
const { getWorkspaceRoot, getGlobalRoot } = require('../data');
const { loadWebviewHtml, WEBVIEW_DIST }   = require('./webview-loader');
const { detectVscodeThemeKind }           = require('./theme');
const { buildInitialData }                = require('./snapshot');
const { handleMessage }                   = require('./message-handler');
const { log }                             = require('./logger');

function setupFileWatcher(refresh) {
  const disposables = [];
  let timer;
  const debounced = () => { clearTimeout(timer); timer = setTimeout(refresh, 400); };

  for (const base of [getWorkspaceRoot(), getGlobalRoot()].filter(Boolean)) {
    try {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(vscode.Uri.file(base), '.claude/**'),
      );
      disposables.push(
        watcher.onDidCreate(debounced),
        watcher.onDidDelete(debounced),
        watcher.onDidChange(debounced),
        watcher,
      );
    } catch (e) {
      log.warn(`File watcher setup failed for ${base}: ${e.message}`);
    }
  }

  return { dispose: () => { clearTimeout(timer); disposables.forEach((d) => d.dispose()); } };
}

function attachWebview(webview, context, storePath, onRefresh) {
  webview.options = {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, WEBVIEW_DIST)],
  };

  const refresh = () => {
    const data = buildInitialData(getWorkspaceRoot(), storePath);
    webview.postMessage({ command: 'dataUpdate', data });
    if (onRefresh) onRefresh(data);
  };

  webview.html = loadWebviewHtml({ webview }, context);

  const sub1 = webview.onDidReceiveMessage((msg) =>
    handleMessage(msg, refresh, (m) => webview.postMessage(m), getWorkspaceRoot(), storePath),
  );
  const sub2 = vscode.window.onDidChangeActiveColorTheme(() => {
    webview.postMessage({ command: 'vscodeThemeChanged', kind: detectVscodeThemeKind() });
  });
  const watcher = setupFileWatcher(refresh);

  return { subs: [sub1, sub2, watcher], refresh };
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
    const { subs } = attachWebview(panel.webview, context, storePath);
    this._disposables = subs;
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
    this._refresh   = null;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;

    const { subs, refresh } = attachWebview(
      webviewView.webview,
      this._context,
      this._storePath,
      (data) => {
        const count = [...data.catalogAgents, ...data.catalogSkills, ...data.catalogCommands]
          .filter((i) => i.syncStatus === 'sharedUpdated').length;
        webviewView.badge = count > 0
          ? { value: count, tooltip: `${count} catalog update${count !== 1 ? 's' : ''} available` }
          : undefined;
      },
    );

    this._refresh = refresh;

    webviewView.onDidDispose(() => {
      this._view    = undefined;
      this._refresh = null;
      subs.forEach((d) => d.dispose());
    });
  }

  refresh() {
    this._refresh?.();
  }
}

module.exports = { attachWebview, LoadoutPanel, LoadoutSidebarProvider };
