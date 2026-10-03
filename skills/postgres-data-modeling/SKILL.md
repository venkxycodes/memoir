---
name: postgres-data-modeling
description: Design or change relational schemas, Django models, PostgreSQL queries, constraints, indexes, and database migrations. Use when correctness, data integrity, query behavior, or production schema changes are central; do not introduce PostgreSQL-specific features without checking the actual server version and operational need.
---

# PostgreSQL Data Modeling

Design relational data that preserves domain invariants and supports measured access patterns.

## Modeling guidance

- Start from entities, lifecycle, relationships, invariants, and real queries. Prefer explicit tables and foreign keys for stable relationships; keep JSON/JSONB for genuinely flexible or source-preservation data, not as a substitute for relationships that need joins, constraints, or reporting.
- Use `DecimalField`/PostgreSQL `numeric` for exact business quantities such as gold weights, wastage, prices, and rates. Choose precision and scale from domain ranges and rounding rules; avoid binary floats for exact decimal arithmetic.
- Enforce durable invariants in the database with `NOT NULL`, foreign keys, unique constraints, and check constraints as appropriate. Application validation improves feedback but can race and is not a substitute for database integrity.
- Index from demonstrated filters, joins, ordering, and uniqueness. Avoid indexing every column. Check query plans and write overhead before adding specialized indexes or PostgreSQL-specific features.
- Make deletion behavior intentional: document whether related records cascade, restrict deletion, or become nullable. Preserve audit/history requirements.
- Use transactions for multi-row business operations. Define the concurrency invariant first, then select the lightest correct mechanism (atomic update, unique constraint, row lock, or serializable transaction); do not assume a read-then-write sequence is safe.

## Schema changes

1. Inspect current models, migrations, PostgreSQL version, data volume, and deployment process.
2. Change Django models and generate migrations. Review the migration graph and SQL; do not rewrite already-applied migrations as a shortcut.
3. For populated tables, plan defaults, nullability, backfill, validation, and constraint enforcement as separate safe steps when a single lock-heavy migration is risky.
4. Make data migrations deterministic and reversible where practical. In `RunPython`, use historical models and the migration database alias. For large tables, batch and checkpoint the work with a management command or operational job.
5. Verify on representative data: constraints, row counts, key aggregates, and `EXPLAIN` for changed high-value queries. Never run destructive schema commands against production without explicit authorization.

## References

- [Django model fields](https://docs.djangoproject.com/en/6.0/ref/models/fields/)
- [Django constraints](https://docs.djangoproject.com/en/6.0/ref/models/constraints/)
- [Django PostgreSQL notes](https://docs.djangoproject.com/en/6.0/ref/databases/)
- [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL indexes](https://www.postgresql.org/docs/current/indexes.html)
