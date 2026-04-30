# Business context

<!-- auto-generated from codebase scan -->

- **Product**: Loadout — a VSCode extension that lets developers manage Claude Code agents, skills, commands, and profiles as swappable equipment loadouts
- **Core value**: Replaces manual file-shuffling in `~/.claude/` with a polished GUI panel; one-click profile switching instead of copying files around
- **Ecosystem actors**:
  - **Extension host** — Node.js process with full filesystem access; owns all reads/writes to `.claude/` dirs
  - **Webview** — Angular 21 sandboxed UI; zero direct filesystem access, communicates only via `postMessage`
  - **Claude Code** — reads `~/.claude/agents/`, `~/.claude/skills/`, and `~/.claude/commands/` at session start; Loadout controls what lands there
  - **Global catalog** — `~/.claude/` (or a custom path); shared across all workspaces
- **Main user flow**: Open panel → toggle agents/skills/commands on/off in the Workspace tab → snapshot current state as a named Profile → switch between profiles with one click
- **Hard business rules**:
  - Items in `.claude/agents/`, `.claude/skills/`, and `.claude/commands/` are "active"; toggling moves them to a managed store path inside `context.storageUri`
  - Profile snapshots store lists of agent, skill, and command filenames, not file content — the actual files always live in the catalog or workspace store
  - Hash-based sync detects catalog updates without round-tripping content
- **Out of scope**: cloud sync, marketplace publishing, multi-user collaboration, editing agent/skill/command file content within Loadout
