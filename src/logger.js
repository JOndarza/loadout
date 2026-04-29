const vscode = require('vscode');

let _out = null;

function init(context) {
  _out = vscode.window.createOutputChannel('Loadout', { log: true });
  context.subscriptions.push(_out);
}

const log = {
  info:  (msg) => _out?.info(msg),
  warn:  (msg) => _out?.warn(msg),
  error: (msg) => _out?.error(msg),
  debug: (msg) => _out?.debug(msg),
};

module.exports = { init, log };
