# Supabase Migrations

This directory contains SQL migration files for the PipeDesk database schema.

## Migration Naming Convention

Migrations are named using the pattern: `YYYYMMDD_description.sql`

For migrations that need to be executed in a specific order on the same date, use a sequence number:
- `YYYYMMDD_step1_description.sql`
- `YYYYMMDD_step2_description.sql`

## Latest Migrations (2025-12-23)

### Notification System Expansion

These 5 migrations expand the notification system with priorities, categories, user preferences, and DND mode:

1. **20251223_expand_notifications_table.sql** - Adds new columns to notifications table
2. **20251223_create_user_notification_preferences.sql** - Creates user preferences table
3. **20251223_rls_user_notification_preferences.sql** - Adds RLS policies for preferences
4. **20251223_create_notification_with_preferences.sql** - Creates helper function
5. **20251223_add_delete_policy_notifications.sql** - Adds delete policy for notifications

⚠️ **Important:** These migrations must be executed in the order listed above.

📖 **Documentation:** See `/docs/data/notification-system-migrations.md` for detailed information, verification queries, and usage examples.

## How to Apply Migrations

### Method 1: Supabase Dashboard (Recommended for Production)
1. Go to Supabase Dashboard > SQL Editor
2. Copy the content of each migration file
3. Execute in order
4. Verify success before proceeding to next

### Method 2: Supabase CLI (Development)
```bash
# Apply all pending migrations
supabase db push

# Apply specific migration
supabase db execute --file supabase/migrations/FILENAME.sql
```

## Migration Guidelines

1. **Always use IF NOT EXISTS / IF EXISTS** for idempotent operations
2. **Add comments** to document the purpose of columns/tables
3. **Create indexes** for frequently queried columns
4. **Enable RLS** on all user-facing tables
5. **Document foreign keys** clearly
6. **Use proper data types** (UUID for IDs, TIMESTAMPTZ for dates)
7. **Add CHECK constraints** for enum-like fields
8. **Create DOWN migrations** for reversible changes (when appropriate)

## Testing Migrations

Before applying to production:

1. Test on local Supabase instance
2. Verify schema changes with `\d table_name` in psql
3. Test RLS policies with different user roles
4. Run verification queries from documentation
5. Check performance impact of new indexes

## Rollback Strategy

If a migration fails or needs to be reversed:

1. Check if a DOWN migration file exists (e.g., `*_DOWN.sql`)
2. If not, refer to documentation for rollback SQL
3. Test rollback on staging first
4. Document any data loss implications

## Common Issues

### Issue: "relation already exists"
**Solution:** Use `CREATE TABLE IF NOT EXISTS` or `CREATE INDEX IF NOT EXISTS`

### Issue: "column already exists"
**Solution:** Use `ADD COLUMN IF NOT EXISTS` in ALTER TABLE

### Issue: "constraint violation"
**Solution:** Check existing data before adding constraints. May need to clean/migrate data first.

### Issue: "permission denied"
**Solution:** Verify RLS policies and grants. Use `SECURITY DEFINER` for functions that need elevated privileges.

## Resources

- [Supabase Migrations Documentation](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
