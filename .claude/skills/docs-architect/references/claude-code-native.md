# Claude Code Native Mechanisms Reference

On-demand reference for the Claude Code features docs-architect v2 rides on. Load only when you need exact syntax, precedence rules, or decision guidance beyond what SKILL.md provides.

## Table of contents

1. [.claude/rules/ format and loading](#claude-rules-format-and-loading)
2. [CLAUDE.md loading and precedence](#claudemd-loading-and-precedence)
3. [Settings precedence](#settings-precedence)
4. [Monorepos: claudeMdExcludes](#monorepos-claudemdexcludes)
5. [Subdirectory CLAUDE.md lazy loading](#subdirectory-claudemd-lazy-loading)
6. [Hook events catalogue](#hook-events-catalogue)
7. [Subagent frontmatter](#subagent-frontmatter)
8. [Built-in commands for context](#built-in-commands-for-context)
9. [Skill frontmatter optional fields](#skill-frontmatter-optional-fields)
10. [@import syntax (reference only)](#import-syntax-reference-only)

---

## `.claude/rules/` format and loading

**Location**: `.claude/rules/*.md` — flat folder at the project root. Claude Code does NOT recurse into subdirectories of `rules/`; all files must be at the top level.

**Two loading modes** controlled by frontmatter:

### Mode A: always-loaded (no frontmatter)

```markdown
# Coding rules — global

- rule 1
- rule 2
```

No frontmatter → the file loads at session start, in the same context slot as `CLAUDE.md`. Use for content the AI needs on every turn (business context, global conventions, stack constraints, core architecture).

### Mode B: path-scoped (with `paths:` frontmatter)

```markdown
---
paths:
  - "backend/**/*.cs"
  - "src/api/**/*.ts"
---

# Backend rules

- rule 1
- rule 2
```

The file loads **only** when Claude reads a file matching any of the glob patterns. Startup context cost: zero. Use for subsystem-specific rules that would be noise in unrelated sessions.

**Glob rules**: standard globs, `**` for recursive, `{a,b,c}` for alternation, file extensions as literal strings. Relative to the repo root.

**Per-file budget**: target ≤40 lines, ≤12 bullets. Rules files are distillations, not narrative docs.

---

## CLAUDE.md loading and precedence

Claude Code loads CLAUDE.md files from multiple scopes and concatenates them:

1. **Managed** — `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS), `/etc/claude-code/CLAUDE.md` (Linux), `C:\Program Files\ClaudeCode\CLAUDE.md` (Windows). Deployed by IT, cannot be excluded.
2. **Project root** — `./CLAUDE.md` or `./.claude/CLAUDE.md`. Shared with the team, checked in.
3. **User** — `~/.claude/CLAUDE.md`. Personal, not synced.
4. **Local** — `./.claude.local.md`. Personal project overrides, gitignored.

All files **concatenate** — no overriding. Target each file **≤200 lines** (official). v2 docs-architect targets `./CLAUDE.md` **≤100 lines** because `.claude/rules/_always/*.md` now carries the bulk.

---

## Settings precedence

From highest to lowest (higher wins on conflict):

1. **Managed** (`/Library/Application Support/ClaudeCode/managed-settings.json`, etc.) — cannot be overridden
2. **CLI args** (`claude --<flag>`)
3. **Local project** (`.claude/settings.local.json`) — gitignored
4. **Shared project** (`.claude/settings.json`) — checked in
5. **User** (`~/.claude/settings.json`)

Relevant keys for context optimization:
- `autoMemoryEnabled`: disable auto-memory to save ~500 tokens/session
- `claudeMdExcludes`: array of glob patterns to exclude ancestor CLAUDE.md files (monorepo use case)
- `disableSkillShellExecution`: disable `` !`command` `` execution in skills

---

## Monorepos: claudeMdExcludes

In a monorepo where `/monorepo/frontend/CLAUDE.md` exists alongside `/monorepo/backend/CLAUDE.md`, Claude Code loads **both** when you start a session from a deep subdirectory — leading to context bloat.

Fix: add `claudeMdExcludes` to `.claude/settings.json`:

```json
{
  "claudeMdExcludes": [
    "frontend/CLAUDE.md",
    "other-service/CLAUDE.md"
  ]
}
```

Now starting a session in `backend/` excludes the irrelevant sibling CLAUDE.md files.

---

## Subdirectory CLAUDE.md lazy loading

`CLAUDE.md` files in subdirectories under the cwd do **not** load at startup. They load **on-demand when Claude reads a file in that directory**.

Example: `backend/CLAUDE.md` is ignored at session start, but the moment Claude opens `backend/Controllers/UsersController.cs`, that CLAUDE.md loads.

Practical use: push subsystem-specific instructions into `backend/CLAUDE.md` so the main `./CLAUDE.md` stays lean and they only activate when relevant. Note: `.claude/rules/*.md` with `paths:` gives you the same behavior with more flexibility (multiple path patterns, easier to organize).

---

## Hook events catalogue

Configured in `.claude/settings.json` under the `hooks` key. Each event can have multiple matchers, each matcher has multiple commands.

| Event | Fires when | Use case for docs-architect |
|---|---|---|
| `SessionStart` | New session starts | Warn if CLAUDE.md >100 lines; audit `.claude/rules/` for stale path patterns |
| `UserPromptSubmit` | User submits a prompt | Inject reminder if legacy `_lite/` present |
| `PreToolUse` | Before any tool runs | Block edits to `.claude/rules/*.md` if the mirrored full doc is newer (stale rule) |
| `PostToolUse` | After a tool runs successfully | After Write/Edit on `docs/*.md`, check if the mirrored `.claude/rules/*.md` needs update |
| `InstructionsLoaded` | After CLAUDE.md and rules are loaded | Log total instruction tokens for audit |
| `FileChanged` | File on disk changes (filesystem watcher) | Regenerate `.claude/rules/*.md` when `docs/*.md` changes |

**Matcher syntax**: regex-like tool name matcher. Examples:
- `"startup"` — matches only SessionStart startup case
- `"Write|Edit"` — matches Write or Edit tools
- `"Bash"` — matches Bash tool only

**Command format**: shell command string, access to tool input/output via env vars in newer versions.

**Example**: SessionStart hook that warns on bloated CLAUDE.md.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "awk 'END { if (NR > 100) print \"[warn] CLAUDE.md is \" NR \" lines\" }' CLAUDE.md"
          }
        ]
      }
    ]
  }
}
```

---

## Subagent frontmatter

Files in `.claude/agents/*.md` or `~/.claude/agents/*.md`. Frontmatter fields:

| Field | Purpose |
|---|---|
| `name` | Identifier for invocation |
| `description` | Shown to main Claude; used for auto-delegation. Be specific about *when* to use the agent |
| `tools` | Comma-separated or list of tools the subagent can use (e.g. `Read, Grep, Glob, Bash`) |
| `model` | Model override — use `haiku` for cheap research agents, `opus` for reasoning |
| `isolation: worktree` | Run in a git worktree — cleaned up if no changes made |
| `context: fork` | Alternative to worktree; sends task to a fresh context fork |

**Token benefit**: the subagent runs in its own context window. Its reads, greps, and bash output never touch the main session. Only the summary returned via the subagent's final message lands in main context.

Use subagents for audit, sync, coverage scans, and doc research — anything that involves reading many files to answer one question.

---

## Built-in commands for context

| Command | Use |
|---|---|
| `/memory` | List all loaded CLAUDE.md, rules, auto-memory files. Edit from here |
| `/context` | Visualize current context usage (colored grid), shows token budget and what's using space |
| `/compact [focus]` | Summarize conversation. Pass `focus` to preserve specific topics (e.g. `/compact focus on API changes`) |
| `/clear` | Wipe conversation history, reset context |
| `/init` | Auto-generate a starter CLAUDE.md by analyzing the current codebase |
| `/effort low\|medium\|high\|max` | Adjust thinking depth. Lower = faster, fewer reasoning tokens |
| `/model <name>` | Switch model (e.g. `/model sonnet-4-6[1m]` for 1M context window) |

Docs-architect audit mode should recommend `/context` to the user for a token-usage reality check.

---

## Skill frontmatter optional fields

Beyond `name` and `description`, skills can declare:

| Field | Purpose |
|---|---|
| `allowed-tools` | Tools the skill is pre-permitted to use without per-call approval |
| `paths` | Glob patterns — skill auto-activates only when user reads matching files |
| `disable-model-invocation: true` | Description NOT in context. Only loads when user manually invokes `/<skill-name>` |
| `context: fork` | Skill body runs in an isolated subagent context — results return as summary |
| `model` | Override model for the skill execution |
| `effort` | Override thinking effort |

Docs-architect v2 keeps only `name` + `description` per skill-creator guidance. The optional fields are documented here so projects can add them if needed.

---

## @import syntax (reference only)

v2 does NOT recommend `@imports` because `.claude/rules/` is the better mechanism. Reference for existing projects:

Syntax inside any CLAUDE.md or rules file:

```markdown
@path/to/file.md
@~/.claude/snippets/global.md
```

Rules:
- Relative paths resolve from the importing file, not cwd
- `~/` expands to home
- Max recursion depth: **5 hops**
- Imported files are fully expanded inline (no lazy loading)
- Symlinks supported

**Why v2 avoids it**: `.claude/rules/*.md` provides the same always-load behavior (no frontmatter) plus a path-scoped mode (`paths:` frontmatter) that imports cannot express. `@imports` also silently chain without feedback — it's easy to blow past the 5-hop limit.
