const fs   = require('fs');
const path = require('path');
const os   = require('os');

const CLAUDE_JSON = path.join(os.homedir(), '.claude.json');

function readClaudeJson() {
  try {
    return fs.existsSync(CLAUDE_JSON)
      ? JSON.parse(fs.readFileSync(CLAUDE_JSON, 'utf8'))
      : {};
  } catch { return {}; }
}

function writeClaudeJson(data) {
  fs.writeFileSync(CLAUDE_JSON, JSON.stringify(data, null, 2));
}

function _serversFromMap(map, scope, disabled) {
  return Object.entries(map ?? {}).map(([name, cfg]) => ({
    name,
    scope,
    disabled,
    type:    cfg.type    ?? null,
    url:     cfg.url     ?? null,
    command: cfg.command ?? null,
  }));
}

function getMcpServers(root) {
  const data = readClaudeJson();
  const servers = [
    ..._serversFromMap(data.mcpServers,          'user', false),
    ..._serversFromMap(data._disabledMcpServers, 'user', true),
  ];

  if (root) {
    const mcpJsonPath = path.join(root, '.mcp.json');
    try {
      if (fs.existsSync(mcpJsonPath)) {
        const mcp = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
        servers.push(..._serversFromMap(mcp.mcpServers, 'project', false));
      }
    } catch {}
  }

  return servers;
}

function toggleMcpServer(name) {
  const data = readClaudeJson();
  if (data.mcpServers?.[name]) {
    if (!data._disabledMcpServers) data._disabledMcpServers = {};
    data._disabledMcpServers[name] = data.mcpServers[name];
    delete data.mcpServers[name];
  } else if (data._disabledMcpServers?.[name]) {
    if (!data.mcpServers) data.mcpServers = {};
    data.mcpServers[name] = data._disabledMcpServers[name];
    delete data._disabledMcpServers[name];
    if (!Object.keys(data._disabledMcpServers).length) delete data._disabledMcpServers;
  }
  writeClaudeJson(data);
}

module.exports = { getMcpServers, toggleMcpServer };
