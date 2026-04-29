# Governance Rules

Rules for tracking stories, bugs, plans, file naming, priority/severity, and status definitions.

## Stories and bugs tracking

**Stories:**
- Each user story lives in `docs/stories/` as an individual file
- `docs/backlog.md` is the registry — one line per story with status
- **Priority is mandatory** — every story must have a priority when created. If the user doesn't specify, ask before proceeding
- When a story changes status, update **both**: the individual file AND `backlog.md`. Never one without the other
- Only create the individual story file when work starts (`In progress`). While `Pending`, the registry entry in `backlog.md` is sufficient
- At the end of a session, review `backlog.md` and mark affected stories as `Completed`

**Bugs:**
- Each bug lives in `docs/bugs/` as an individual file
- `docs/bugs.md` is the registry — one line per bug with status
- **Severity is mandatory** — every bug must have a severity when reported. If the user doesn't specify, ask before proceeding
- When a bug changes status, update **both**: the individual file AND `bugs.md`. Never one without the other
- At the end of a session, review `bugs.md` and mark resolved bugs as `Resolved`

**Plans:**
- Each plan lives in `docs/plans/` as an individual file
- **Priority is mandatory** — every plan must have a priority when created. If the user doesn't specify, ask before proceeding

**Format for registries (`backlog.md` / `bugs.md`):**

Stories:
```markdown
| ID | Title | Priority | Status | File |
|---|---|---|---|---|
| US-00001 | Import provider directory | High | Completed | [story](stories/00001-import_directory.story.md) |
```

Bugs:
```markdown
| ID | Title | Severity | Status | File |
|---|---|---|---|---|
| BUG-00001 | Stock status always unknown | Medium | Resolved | [bug](bugs/00001-stock_status_unknown.bug.md) |
```

## File naming conventions

Consistent pattern: `{NNNNN}-{slug}.{type}.md` — sequential number, slug with underscores, type suffix before extension.

| Type | Pattern | Example |
|---|---|---|
| Story | `{NNNNN}-{slug}.story.md` | `00001-import_directory.story.md` |
| Bug | `{NNNNN}-{slug}.bug.md` | `00001-stock_status_unknown.bug.md` |
| Plan | `{YYYY-MM-DD}-{slug}.plan.md` | `2026-03-17-ux_improvements.plan.md` |
| Full doc | `{topic}.md` | `architecture.md` |
| Segmented doc | `{subtopic}.md` inside `{topic}/` folder | `architecture/layers.md` |
| Segmented index | `README.md` inside `{topic}/` folder | `architecture/README.md` |
| Summary | `{topic}.summary.md` inside `_lite/` | `_lite/architecture.summary.md` |
| Business context | `business-context.md` inside `_lite/` (standalone) | `_lite/business-context.md` |
| AI rules | `ai-rules.summary.md` inside `_lite/` (from README.md) | `_lite/ai-rules.summary.md` |

## Priority / Severity definitions

These definitions apply to stories (Priority), bugs (Severity), and plans (Priority). **Mandatory** — always specify when creating.

| Level | Meaning | Action |
|---|---|---|
| **ASAP** | Blocker — stops other work, affects production, or has an immovable deadline. Drop everything. | Start immediately, no other work until resolved |
| **Critical** | (Bugs only) Production is degraded or data integrity is at risk, but there's a workaround | Start within 24 hours |
| **High** | Important for current sprint/phase goals. Delivers significant value or unblocks others | Schedule in current sprint |
| **Medium** | Valuable but not urgent. Can wait for the next sprint without business impact | Schedule in next sprint |
| **Low** | Nice to have. Technical debt, minor polish, or improvements with no deadline | Schedule when capacity allows |

## Status definitions

| Status | Applies to | Meaning | Notes |
|---|---|---|---|
| **Pending** | Story | Defined, work not started. Registry only | Initial state |
| **Open** | Bug | Reported, work not started | Initial state |
| **Draft** | Plan | Being written, not reviewed | Initial state |
| **In progress** | All | Actively being worked on | Create individual file (story/bug) |
| **In review** | All | Done, waiting for review/QA/approval | PR created or testing |
| **Approved** | Plan | Accepted, ready to execute | Stakeholder approved |
| **Blocked** | All | Cannot continue — external dependency | **Add reason in file** |
| **On hold** | Story, Plan | Intentionally paused, deprioritized | **Add reason in file** |
| **Completed** | Story, Plan | Fully done, merged, verified | Terminal state |
| **Cancelled** | Story | Will not be implemented | **Add reason in file** |
| **Resolved** | Bug | Fix merged and verified | Terminal state |
| **Cannot reproduce** | Bug | Unable to replicate after investigation | Document steps tried |
| **Duplicate** | Bug | Same as another bug | **Link to original in file** |
| **Won't fix** | Bug | Acknowledged, won't be fixed | **Add reason in file** |
| **Rejected** | Plan | Not approved, needs rework or discarded | **Add reason in file** |
