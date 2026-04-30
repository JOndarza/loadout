---
paths:
  - "backend/**/*.cs"
  - "backend/**/*.ts"
  - "backend/**/*.py"
  - "src/backend/**"
  - "**/*.csproj"
---

# Backend rules (auto-load on backend/ file match)

- **Layer rules**: never skip layers. Api → Application → Domain. Infrastructure references Domain but never the reverse
- **Mediator**: use `IMediator.Send()` only from the Api layer. Handlers live in Application
- **DTOs**: prefix `Dto`, always `record`, IDs are `Guid`
- **Soft delete**: set `Active = false`. Never call `DbSet.Remove()` outside explicit hard-delete commands
- **Session**: inject `ISessionContext`. Never read `HttpContext.User` directly
- **Errors**: throw typed domain exceptions. `ExceptionHandlingMiddleware` maps to HTTP. External failures → `ExternalServiceException` → 502
- **Async**: `async Task` everywhere, `ConfigureAwait(false)` in libraries, cancellation tokens on all IO
- **Logging**: structured with named placeholders, never string interpolation in log calls
- **Validation**: FluentValidation in Application layer, registered via pipeline behavior
- **Migrations**: generated only, never hand-edited. Name them `YYYYMMDD_<Intent>`

Full reference: `docs/architecture.md`, `docs/coding-rules.md`.
