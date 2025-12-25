# Supabase migration playbook

This folder stores the SQL migrations that evolve the PipeDesk database schema.

## Folder structure and naming

- Preferred pattern: `YYYYMMDDHHMMSS_description.sql` (timestamp + short slug).
- Legacy migrations may use incremental prefixes such as `001_...`—keep their existing names.
- Reversible changes should ship with a paired `*_DOWN.sql` file that cleanly rolls back the same scope.
- When multiple files share the same date, the timestamp component enforces order; if you must add a manual sequence, suffix the slug with `_step1`, `_step2`, etc.

## Creating a new migration

1. Create the SQL in this directory following the naming rules above.
2. Make operations idempotent (`IF [NOT] EXISTS`) and add `COMMENT ON` statements for new entities.
3. Use the right types: UUID primary keys, `TIMESTAMPTZ` for datetimes, and explicit `CHECK` constraints for enums.
4. Enable and test RLS for user-facing tables; add policies and necessary `GRANT`s.
5. Index columns used in filters/joins and document rationale inline.
6. Add a DOWN file when practical (e.g., `20250101_example.sql` + `20250101_example_DOWN.sql`).
7. Document anything non-obvious in `/docs/data/*.md` (e.g., verification queries or feature notes).

## Executing migrations

### Development (Supabase CLI)
```bash
# Apply all pending migrations to your local instance
supabase db push

# Apply a single file (useful for hotfixes)
supabase db execute --file supabase/migrations/<filename>.sql
```

### Production / staging (Supabase Dashboard)
1. Open **SQL Editor** in the target project.
2. Run the migrations in order (see “Pinned execution order” below when applicable).
3. Confirm success before proceeding to the next file.

## Pinned execution order

Some feature sets must stay ordered even with timestamps:

- **Notification system expansion (2025-12-23)**
  1. `20251223_expand_notifications_table.sql`
  2. `20251223_create_user_notification_preferences.sql`
  3. `20251223_rls_user_notification_preferences.sql`
  4. `20251223_create_notification_with_preferences.sql`
  5. `20251223_add_delete_policy_notifications.sql`

📖 Detailed context and verification queries: `/docs/data/notification-system-migrations.md`.

## Validation checklist

- Apply on a local Supabase instance first.
- Inspect schema changes with `\d <table>` and validate constraints/indexes.
- Exercise RLS paths with the expected roles.
- Run any companion verification queries documented for the feature.
- Review EXPLAIN plans for new indexes on large tables if performance-sensitive.

## Rollback guidance

1. Prefer the dedicated `*_DOWN.sql` file when it exists.
2. If absent, craft a reversible script and test on staging before production.
3. Capture any expected data loss or side-effects in the feature docs.
4. Re-run validation checks after rollback.

## Troubleshooting quick answers

- **"relation/column already exists":** use `CREATE ... IF NOT EXISTS` or `ADD COLUMN IF NOT EXISTS`.
- **Constraint violations:** clean or migrate existing data before tightening constraints.
- **Permission or RLS issues:** verify policies, grants, and whether a function needs `SECURITY DEFINER`.
- **Order-dependent failures:** re-check the “Pinned execution order” section and timestamps.

## References

- [Supabase migrations](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
