<!-- Always-loaded rule. Copy to .claude/rules/coding-rules.md (no subfolder). -->

# Coding rules — global

- **Code language**: [english|spanish] — applies to identifiers, comments, and logs
- **Naming**: [camelCase JS/TS, PascalCase C#/types, snake_case DB] — mandatory
- **File size**: keep files focused; split when a single file exceeds ~400 lines
- **Error handling**: [project rule — e.g. "throw typed exceptions, never return null"]
- **Testing**: [framework + coverage target, e.g. "xUnit ≥80% on Application layer"]
- **Package management**: [rule — e.g. "versions centralized in Directory.Packages.props"]
- **Prohibited patterns**: [list hard NOs, e.g. "NEVER use MediatR, use Mediator by martinothamar"]
- **Comments**: only explain *why*, never *what* — the code shows what
- **Commits**: conventional format, imperative mood, no AI attribution
