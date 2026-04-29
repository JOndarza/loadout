# architecture.md Spec

Must include these sections:
- **Architecture overview** — which architecture style (Clean Architecture, Hexagonal, N-tier, etc.), why it was chosen, ASCII diagram showing layers and their boundaries
- **Layer responsibilities** — for each layer: what it contains, what it can reference, what it CANNOT reference. Include concrete examples of classes in each layer
- **Project/module structure** — list of all projects/modules with one-line descriptions, namespace conventions, how they map to layers
- **Dependency graph** — which project references which (text diagram or arrow list). Explicitly state the direction rule (e.g., "Domain has zero dependencies", "Infrastructure references Domain but never the reverse")
- **Design patterns** — table with columns: pattern name, where applied, concrete implementation classes. Include all patterns actually used (CQRS, Pipeline, Strategy, Repository, UoW, Value Object, Aggregate Root, Domain Events, Factory Method, Interceptor, etc.)
- **Key flows** — step-by-step numbered flows for the main use cases (e.g., "user creates order", "patient consults prescription"). Show which layers/classes participate in each step
- **Error handling** — exception hierarchy as a tree (base → domain/application/infrastructure → concrete), how `ExceptionHandlingMiddleware` or equivalent translates exceptions to HTTP responses, table mapping each exception to its HTTP status code
- **Cross-cutting concerns** — logging strategy (which library, what gets logged, structured logging fields), validation pipeline, audit trail, caching strategy
- **Soft delete** (if applicable) — base class with `IsDeleted`/`DeletedAt`, interceptor that converts Delete to Modified, global query filters, how to restore
- **Security architecture** — authentication method (JWT, API keys, OAuth), authorization model, which middleware/filters protect which endpoints, CORS policy, rate limiting configuration
