---
paths:
  - "**/Entities/**"
  - "**/Migrations/**"
  - "**/migrations/**"
  - "**/*.sql"
  - "**/DbContext*.cs"
  - "**/schema/**"
---

# Database rules (auto-load on entity/migration/schema files)

- **Naming**: table names snake_case plural, columns snake_case, PKs named `id`
- **IDs**: `Guid` (uuid in PG), never auto-increment integers
- **Soft delete**: every aggregate root has `active boolean not null default true`. Apply global query filter in DbContext
- **Audit**: every table has `created_at`, `updated_at`, `created_by`, `updated_by` (nullable FKs to users)
- **FKs**: explicit FK constraints, ON DELETE RESTRICT by default, cascade only with domain justification
- **Indexes**: add indexes for all FK columns and frequently-filtered columns. Name them `ix_<table>_<columns>`
- **Migrations**: one migration per logical change. Never edit a migration after it's merged to main
- **Seeding**: reference/lookup data in migrations. User data never seeded in prod
- **Text fields**: `varchar(N)` with explicit limits, never unbounded `text` unless truly unlimited
- **Timestamps**: always `timestamptz` (PG) or `datetime2` (SQL Server), never naive

Full reference: `docs/database-schema.md`.
