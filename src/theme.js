const vscode = require('vscode');

function detectVscodeThemeKind() {
  const k = vscode.window.activeColorTheme?.kind ?? 2;
  return k === 1 || k === 4 ? 'light' : 'dark';
}

module.exports = { detectVscodeThemeKind };
