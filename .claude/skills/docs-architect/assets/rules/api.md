---
paths:
  - "**/Controllers/**"
  - "**/Endpoints/**"
  - "**/routes/**"
  - "**/*Controller.cs"
  - "**/*Endpoint.cs"
  - "**/api/**/*.ts"
---

# API rules (auto-load on controller/endpoint/route files)

- **Route prefix**: all endpoints under `/api/v{N}/` — current version in `docs/api-contracts.md`
- **Verbs**: GET (read), POST (create), PUT (full update), PATCH (partial), DELETE (soft delete)
- **Responses**: use typed `ActionResult<Dto>` (ASP.NET) or typed response schemas (TS). Never return anonymous objects
- **Errors**: Problem Details RFC 7807 via `ExceptionHandlingMiddleware`. Never return plain strings
- **Auth**: `[Authorize]` by default, `[AllowAnonymous]` explicit when needed
- **Pagination**: `?page=N&size=M` with `{ items, total, page, size }` envelope
- **Filtering**: query params, validated via FluentValidation
- **IDs in URLs**: use `{id:guid}` route constraints
- **Body validation**: FluentValidation pipeline behavior, never manual in handlers
- **Versioning**: URL-based (`/api/v1/`, `/api/v2/`), never header-based

Full reference: `docs/api-contracts.md`.
