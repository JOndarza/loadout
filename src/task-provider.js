const vscode = require('vscode');
const { getProfiles } = require('../data');

const RESTORE_POINT_KEY = '__restore_point__';

class LoadoutTaskProvider {
  constructor(storePath, applyFn) {
    this._storePath = storePath;
    this._applyFn   = applyFn;
  }

  provideTasks() {
    const profiles = getProfiles(this._storePath);
    return Object.keys(profiles)
      .filter((n) => n !== RESTORE_POINT_KEY)
      .map((name) => this._makeTask(name));
  }

  resolveTask(task) {
    const name = task.definition?.profile;
    if (name) return this._makeTask(name);
    return undefined;
  }

  _makeTask(name) {
    const applyFn = this._applyFn;
    const task = new vscode.Task(
      { type: 'loadout', profile: name },
      vscode.TaskScope.Workspace,
      name,
      'Loadout',
      new vscode.CustomExecution(async () => {
        const writeEmitter = new vscode.EventEmitter();
        const closeEmitter = new vscode.EventEmitter();
        return {
          onDidWrite: writeEmitter.event,
          onDidClose: closeEmitter.event,
          open() {
            try {
              applyFn(name);
              writeEmitter.fire(`\x1b[32m✓ Applied loadout "${name}"\x1b[0m\r\n`);
            } catch (e) {
              writeEmitter.fire(`\x1b[31m✗ Failed: ${e.message}\x1b[0m\r\n`);
            }
            closeEmitter.fire(0);
          },
          close() {},
        };
      }),
    );
    task.group = vscode.TaskGroup.Build;
    return task;
  }
}

module.exports = { LoadoutTaskProvider };
