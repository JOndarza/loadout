# database-schema.md Spec

Structure: group tables by domain/aggregate. For **each table** include:
- **SQL table name** + ORM entity/model name + which aggregate it belongs to
- **Columns table** — columns: name, SQL type, nullable (yes/no), default value, constraints (unique, check, etc.), description
- **Primary key** — column(s), generation strategy (auto-increment, UUID, etc.)
- **Foreign keys** — column, references (table.column), on delete behavior (cascade, restrict, set null)
- **Indexes** — name, columns, unique (yes/no), type (btree, gin, etc.)
- **Relationships** — one-to-many, many-to-many, one-to-one with navigation properties
- **Enum mappings** — enum name, integer values with labels (e.g., `0=Active, 1=Suspended`)
- **Soft delete columns** (`is_deleted` bool default false, `deleted_at` nullable timestamp) if applicable
- **Audit columns** (`created_at`, `updated_at`) if applicable, who sets them (interceptor, trigger, application code)
- **Seed data** (if any) — what data is pre-populated and how

Also include at the top:
- **Database engine** — name, version, connection string format
- **ORM** — name, version, migration tool
- **Naming convention** — snake_case, PascalCase, etc. for tables and columns
- **Migrations list** — table: migration name, date, description of what it changes
- **Global conventions** — soft delete filter, audit interceptor, base entity columns
