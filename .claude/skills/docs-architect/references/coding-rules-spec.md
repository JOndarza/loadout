# coding-rules.md Spec

Must include these sections:
- **Language rules** — code language vs documentation language vs commit language. Specify what language identifiers in code that appear in docs should use (e.g., English class names stay in English even in Spanish docs)
- **Naming conventions** — for each type, include correct AND incorrect examples:
  - DTOs (prefix, suffix, or pattern — e.g., `DtoUser` vs `UserDto` vs `UserResponse`)
  - Enums (explicit values or implicit, starting index)
  - Records vs classes (when to use each)
  - Value Objects (immutability, normalization, factory methods, equality)
  - Aggregate Roots (which entities are roots, who can modify children)
  - Interfaces (prefix `I` or not, where they live)
  - Constants and configuration keys
- **Architecture rules** — what can reference what (dependency direction), where business logic lives (never in controllers), where interfaces vs implementations live
- **CQRS structure** (if applicable) — folder layout for Commands/Queries/Handlers/Validators, which mediator library, one handler per operation, sealed classes
- **Validation rules** — which library, where validators live, how they execute (pipeline behavior or manual), what gets validated (all commands/queries or only some)
- **Repository rules** — where interfaces live, where implementations live, no IQueryable exposure, bulk operations strategy
- **API conventions** — versioning strategy (URL segment, header, both), auth filters/attributes and which endpoints use which, Problem Details (RFC 7807) format, error code conventions, response envelope (if any)
- **Controller rules** — no business logic in controllers, only dispatch to mediator/service, how to return responses (IActionResult vs typed), how to handle file uploads
- **Error handling** — exception hierarchy, which layer throws which exception type, how exceptions map to HTTP status codes, error codes naming convention
- **Soft delete** (if applicable) — base class, interceptor behavior, query filters, how to restore
- **Frontend conventions** (if applicable) — state management (signals vs observables vs stores), component type (standalone vs modules), path aliases, HTTP interceptors, environment config, lazy loading strategy
- **SCSS/styles conventions** (if applicable) — variables file location, breakpoints and mixins, partial structure, naming convention (BEM, utility-first, etc.), dark mode strategy, responsive approach (mobile-first or desktop-first)
- **Testing conventions** — framework, assertion library, mocking library, integration test strategy (in-memory vs containers), naming pattern (`Method_Scenario_Expected`), coverage target, what to test vs what not to test
- **Package management** — central version file and its location, rule about not specifying versions in project files, process to add new packages (approval required or not)
- **Git conventions** — branching strategy (GitFlow, trunk-based, etc.), commit message format (Conventional Commits, etc.), PR rules, merge strategy (squash, rebase, merge commit)
- **Prohibited patterns** — explicit "do NOT use" list (e.g., "NOT MediatR — use Mediator", "NOT Swagger UI — use Scalar"). This prevents AI assistants from introducing wrong dependencies
