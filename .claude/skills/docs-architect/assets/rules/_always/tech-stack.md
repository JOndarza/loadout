<!-- Always-loaded rule. Copy to .claude/rules/tech-stack.md (no subfolder). -->

# Tech stack — hard constraints

- **Backend**: [framework + version, e.g. ".NET 10 / ASP.NET Core 10"]
- **Frontend**: [framework + version, e.g. "Angular 21 / TypeScript 5.x"]
- **Database**: [engine + version, e.g. "PostgreSQL 17"]
- **Cache / queue** (if applicable): [e.g. "Redis 7", "RabbitMQ 3.13"]
- **Mediator / DI**: [exact package, e.g. "martinothamar/Mediator — NOT MediatR"]
- **Auth**: [strategy, e.g. "JWT in localStorage, custom API keys for satellites"]
- **Package source**: [e.g. "NuGet centralized in Directory.Packages.props"]
- **Prohibited alternatives**: [list — e.g. "MediatR, NodaTime, Newtonsoft.Json"]
- **Dev tooling**: [SDK versions, CLI tools that must be installed]

Full package tables and versions: `docs/tech-stack.md`.
