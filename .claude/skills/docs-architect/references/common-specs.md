# Common Doc Specs

Specs for smaller doc files, plus the shared segmentation patterns table. For larger docs see their individual spec files.

---

## Segmentation patterns

Any `docs/*.md` file over 150 lines should be segmented. Preserve the original as the full reference and add subtopic files under `docs/<name>/`.

| Doc | Segment by |
|---|---|
| `architecture.md` | layers, patterns, flows, error handling |
| `coding-rules.md` | backend, frontend, styles, testing |
| `deployment.md` | dev environment, production, CI/CD |
| `api-contracts.md` | domain module (auth, users, payments, etc.) |
| `database-schema.md` | aggregate/domain (users, orders, inventory, etc.) |

**Segmented file header**:
```markdown
# [Topic] — [Parent Doc Name]
Source: docs/[parent].md
```

**Segmented folder README.md**:
```markdown
# [Parent Doc Name] — Segmented Index

Full reference: [../parent.md](../parent.md)

| File | Content |
|---|---|
| [topic1.md](topic1.md) | One-line description |
```

**Sync rule**: the full doc is the source of truth. Never edit a segment without also editing the full doc. Segments are derived views.

---

## backlog.md

Registry of all user stories. Format:
```markdown
# Backlog

| ID | Title | Priority | Status | File |
|---|---|---|---|---|
| US-00001 | [title] | [priority] | [status] | [link](stories/{NNNNN}-{slug}.story.md) |
```
- One row per story, sorted by ID
- File column: link only when individual file exists (created at `In progress`)

---

## bugs.md

Registry of all bugs. Format:
```markdown
# Bugs

| ID | Title | Severity | Status | File |
|---|---|---|---|---|
| BUG-00001 | [title] | [severity] | [status] | [link](bugs/{NNNNN}-{slug}.bug.md) |
```

---

## tech-stack.md

Must include:
- **Backend framework** — language, framework, version (e.g., ".NET 10 / ASP.NET Core 10 / C# latest")
- **Backend packages** — table with columns: package name, exact version, purpose. Read versions from the central package file (e.g., `Directory.Packages.props`, `Cargo.toml`, `requirements.txt`). Group by layer (Domain, Application, Infrastructure, API, Testing)
- **Frontend framework** — framework, version, language (e.g., "Angular 21 / TypeScript 5.x")
- **Frontend packages** — table with columns: package name, exact version, purpose. Read from `package.json`. Group by category (core, UI, state, testing, dev)
- **Infrastructure** — database engine + version, cache engine + version, message broker + version, Docker base images with tags
- **Dev tools** — SDK version, CLI tools (dotnet, ng, npm), IDE plugins or extensions required
- **Version management** — where package versions are centralized, rule for updating (e.g., "all versions in Directory.Packages.props, .csproj files never specify version")
- **Prohibited alternatives** — table: "Use X" → "NOT Y". Prevents AI from suggesting wrong packages (e.g., "Use Mediator" → "NOT MediatR")

---

## deployment.md

Must include:
- **Development environment** — docker-compose services table (columns: service, port, image, health check, restart policy), all env vars per service with descriptions, volumes and mounts, how to start (`docker compose up`), how to rebuild (`--build`), how to view logs
- **Development credentials** — default usernames/passwords for local dev (DB, API keys, etc.). Mark clearly as "DEV ONLY — never use in production"
- **Production environment** — production compose/config, env files location and naming convention, secrets management strategy (env files, vault, CI/CD variables), which values change between environments
- **IIS/Nginx/other** (if applicable) — site structure, web.config or nginx.conf, reverse proxy rules, URL rewrite rules (e.g., SPA fallback), excluded paths (e.g., `/api/` not rewritten), SSL/TLS configuration
- **Migration strategy** — how DB migrations run (dedicated migrator service, CLI command, CI/CD step), order of startup (migrator before API), rollback strategy, how to create a new migration
- **Health checks** — which endpoints, what they check (DB connectivity, external services), how orchestrators use them (liveness vs readiness)
- **Useful commands** — table with columns: action, command. Include: build, test, run, migrate, logs, stop, clean rebuild, connect to DB, run specific test
- **Troubleshooting** — common issues and solutions (e.g., "port already in use", "migration failed", "container can't reach host", "secret mismatch between services")

---

## roadmap.md

Must include:
- **Product description** — what the product is, what problem it solves, who are the end users (2-3 paragraphs, written for someone who knows nothing about the project)
- **Scope** — what's explicitly in scope, what's explicitly out of scope. Include boundaries (e.g., "we handle X but NOT Y")
- **Ecosystem/stakeholders** — table: component/actor name, role, how it integrates. Include external systems, APIs, teams, and end users
- **Phases** — numbered phases with: description, key deliverables, status (Completed/In progress/Planned), target date (if any)
- **KPIs/metrics** — measurable goals with targets (e.g., "p95 response time < 500ms", "85% test coverage", "zero downtime deployments")
- **Current status** — what's done (with dates), what's actively being worked on, what's next, known blockers
- **Decisions log** — key architectural or product decisions made and why (e.g., "chose PostgreSQL over MySQL because...", "dropped feature X because..."). This is historical context that helps future contributors understand trade-offs
- **Risks** — known risks and their mitigation strategies

**CRITICAL**: Never remove or alter existing business content in roadmap.md. This is the product owner's document. Only add or update status — never delete history.

---

## dev-testing.md

Development testing reference — everything a developer needs to manually test the system locally.
- **Environment URLs** — table: environment (local, dev, staging), base URL, port per service
- **Credentials per environment** — table: key/secret name, value, which service uses it. Mark clearly as "DEV ONLY — never use in production"
- **Test data** — pre-generated tokens, seed data, test payloads, sample files. Include what data they contain and expiration (if applicable)
- **How to generate test data** — step-by-step with commands (curl, scripts, CLI tools), including payload formats and expected responses
- **Test accounts** (if applicable) — usernames, passwords, roles for local testing
- **API testing tools** — Postman/Insomnia collection location, how to import, environment variables to configure. Or curl/httpie command examples for each key endpoint
- **Common test scenarios** — table: scenario description, steps, expected result. Cover happy path and key error cases
- **External service mocks** (if applicable) — how to mock external APIs for local testing (stubs, fake servers, feature flags)
