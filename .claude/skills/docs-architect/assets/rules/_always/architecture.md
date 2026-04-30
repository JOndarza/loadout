<!-- Always-loaded rule. Copy to .claude/rules/architecture.md (no subfolder). -->

# Architecture — key patterns

- **Style**: [e.g. "Clean Architecture: Domain ← Application ← Infrastructure ← Api"]
- **Dependency rule**: [e.g. "Domain has zero dependencies. Never skip layers."]
- **Patterns used**: [top 3-5, e.g. "CQRS via Mediator, Repository, Pipeline, Value Objects"]
- **Error handling**: [e.g. "Problem Details RFC 7807, ExceptionHandlingMiddleware maps to HTTP"]
- **Session / auth**: [e.g. "ISessionContext injected, never read HttpContext directly"]
- **External failures**: [e.g. "ExternalServiceException → 502, never 500"]
- **Soft delete**: [e.g. "Active = false, global query filter, never DbSet.Remove()"]
- **DTOs**: [e.g. "prefix Dto, always record, IDs are Guid"]

Full diagrams, flows, and layer details: `docs/architecture.md`.
