# Notification System Schema Migrations

## Overview
This set of migrations expands the notification system to support priorities, categories, grouping, user preferences, and Do Not Disturb mode.

## Migration Files (Execution Order)

1. **20251223_expand_notifications_table.sql**
   - Adds new columns to `notifications` table: `priority`, `category`, `entity_id`, `entity_type`, `group_key`, `metadata`, `expires_at`
   - Creates performance indexes for common queries
   - Adds documentation comments

2. **20251223_create_user_notification_preferences.sql**
   - Creates `user_notification_preferences` table
   - Includes per-category preferences, DND mode, min priority filter
   - Sets up trigger for `updated_at` auto-update
   - Ensures one preferences record per user

3. **20251223_rls_user_notification_preferences.sql**
   - Enables Row Level Security on preferences table
   - Creates policies for SELECT, INSERT, UPDATE, DELETE
   - Users can only manage their own preferences

4. **20251223_create_notification_with_preferences.sql**
   - Creates `create_notification_if_allowed()` function
   - Respects user preferences when creating notifications
   - Auto-creates default preferences if missing
   - Filters by category and priority settings

5. **20251223_add_delete_policy_notifications.sql**
   - Adds DELETE policy to `notifications` table
   - Users can delete their own notifications

## How to Apply

### Option 1: Supabase Dashboard
1. Go to Supabase Dashboard > SQL Editor
2. Run each migration file in order (1-5)
3. Verify each completes successfully before proceeding

### Option 2: Supabase CLI
```bash
# Make sure you're in the project directory
cd /path/to/pipedesk-koa

# Apply all migrations
supabase db push

# Or apply specific migration
supabase db execute --file supabase/migrations/20251223_expand_notifications_table.sql
supabase db execute --file supabase/migrations/20251223_create_user_notification_preferences.sql
supabase db execute --file supabase/migrations/20251223_rls_user_notification_preferences.sql
supabase db execute --file supabase/migrations/20251223_create_notification_with_preferences.sql
supabase db execute --file supabase/migrations/20251223_add_delete_policy_notifications.sql
```

## Verification Queries

### 1. Verify `notifications` table structure
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;
```

**Expected new columns:**
- `priority` (text, nullable, default 'normal')
- `category` (text, nullable, default 'general')
- `entity_id` (uuid, nullable)
- `entity_type` (text, nullable)
- `group_key` (text, nullable)
- `metadata` (jsonb, nullable, default '{}')
- `expires_at` (timestamp with time zone, nullable)

### 2. Verify `user_notification_preferences` table
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'user_notification_preferences'
ORDER BY ordinal_position;
```

**Expected columns:**
- `id`, `user_id`, `dnd_enabled`
- `pref_mention`, `pref_assignment`, `pref_status`, `pref_sla`, `pref_deadline`, `pref_activity`, `pref_system`
- `min_priority`, `channel_inapp`, `channel_email`, `channel_push`
- `created_at`, `updated_at`

### 3. Verify indexes
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('notifications', 'user_notification_preferences')
  AND schemaname = 'public'
ORDER BY tablename, indexname;
```

**Expected indexes on `notifications`:**
- `idx_notifications_user_unread` (partial, WHERE read = false)
- `idx_notifications_user_created` (descending on created_at)
- `idx_notifications_group_key` (partial, WHERE group_key IS NOT NULL)
- `idx_notifications_entity` (partial, WHERE entity_id IS NOT NULL)
- `idx_notifications_priority` (partial, WHERE read = false)

**Expected index on `user_notification_preferences`:**
- `idx_user_notification_prefs_user`

### 4. Verify RLS policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('notifications', 'user_notification_preferences')
ORDER BY tablename, policyname;
```

**Expected policies on `user_notification_preferences`:**
- "Users can view own notification preferences" (SELECT)
- "Users can insert own notification preferences" (INSERT)
- "Users can update own notification preferences" (UPDATE)
- "Users can delete own notification preferences" (DELETE)

**Expected new policy on `notifications`:**
- "Users can delete their own notifications" (DELETE)

### 5. Verify function exists
```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_notification_if_allowed';
```

**Expected:** One row with `routine_type = 'FUNCTION'` and `data_type = 'uuid'`

### 6. Test the function
```sql
-- Replace 'your-user-id-here' with an actual user UUID from profiles table
SELECT create_notification_if_allowed(
  'your-user-id-here'::uuid,
  'mention',
  'Test Notification',
  'This is a test message',
  '/test',
  'normal',
  'mention',
  NULL,
  NULL,
  NULL,
  '{}'::jsonb
);
```

**Expected:** Returns a UUID (notification created) or NULL (filtered by preferences)

### 7. Test preference filtering
```sql
-- Get a test user ID
SELECT id FROM profiles LIMIT 1;

-- Insert preferences with activity notifications disabled
INSERT INTO user_notification_preferences (user_id, pref_activity)
VALUES ('your-user-id-here'::uuid, false)
ON CONFLICT (user_id) DO UPDATE SET pref_activity = false;

-- Try to create an activity notification
SELECT create_notification_if_allowed(
  'your-user-id-here'::uuid,
  'activity',
  'Activity Test',
  'This should be filtered',
  NULL,
  'normal',
  'activity'
);

-- Expected: Returns NULL (notification filtered)

-- Re-enable activity notifications
UPDATE user_notification_preferences 
SET pref_activity = true 
WHERE user_id = 'your-user-id-here'::uuid;
```

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- 1. Drop function
DROP FUNCTION IF EXISTS create_notification_if_allowed CASCADE;

-- 2. Drop preferences table (will cascade delete RLS policies)
DROP TABLE IF EXISTS user_notification_preferences CASCADE;

-- 3. Remove new columns from notifications
ALTER TABLE notifications
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS entity_id,
  DROP COLUMN IF EXISTS entity_type,
  DROP COLUMN IF EXISTS group_key,
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS expires_at;

-- 4. Drop new indexes
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_notifications_user_created;
DROP INDEX IF EXISTS idx_notifications_group_key;
DROP INDEX IF EXISTS idx_notifications_entity;
DROP INDEX IF EXISTS idx_notifications_priority;

-- 5. Drop delete policy on notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
```

## Post-Migration Tasks

### 1. Update existing notifications (optional)
If you have existing notifications, you may want to backfill default values:

```sql
-- Set default category for existing notifications
UPDATE notifications 
SET category = 'general' 
WHERE category IS NULL;

-- Set default priority for existing notifications
UPDATE notifications 
SET priority = 'normal' 
WHERE priority IS NULL;

-- Set default metadata for existing notifications
UPDATE notifications 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;
```

### 2. Create default preferences for existing users (optional)
```sql
-- Create default preferences for all users who don't have them yet
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
```

## Usage Examples

### Creating a notification with the new function
```sql
-- High priority mention notification
SELECT create_notification_if_allowed(
  p_user_id => 'user-uuid-here'::uuid,
  p_type => 'mention',
  p_title => 'You were mentioned',
  p_message => 'John Doe mentioned you in a comment',
  p_link => '/leads/lead-uuid/comments',
  p_priority => 'high',
  p_category => 'mention',
  p_entity_id => 'lead-uuid-here'::uuid,
  p_entity_type => 'lead',
  p_group_key => 'mention:lead:lead-uuid',
  p_metadata => '{"author_id": "author-uuid", "comment_id": "comment-uuid"}'::jsonb
);
```

### Updating user preferences
```sql
-- Enable DND mode
UPDATE user_notification_preferences
SET dnd_enabled = true
WHERE user_id = auth.uid();

-- Set minimum priority to 'high' (only receive high, urgent, critical)
UPDATE user_notification_preferences
SET min_priority = 'high'
WHERE user_id = auth.uid();

-- Disable SLA notifications
UPDATE user_notification_preferences
SET pref_sla = false
WHERE user_id = auth.uid();
```

### Querying notifications by priority
```sql
-- Get unread critical/urgent notifications
SELECT * FROM notifications
WHERE user_id = auth.uid()
  AND read = false
  AND priority IN ('critical', 'urgent')
ORDER BY created_at DESC;
```

### Grouping notifications
```sql
-- Get grouped notifications by group_key
SELECT 
  group_key,
  COUNT(*) as count,
  MAX(created_at) as latest,
  MIN(created_at) as earliest,
  BOOL_AND(read) as all_read
FROM notifications
WHERE user_id = auth.uid()
  AND group_key IS NOT NULL
GROUP BY group_key
HAVING COUNT(*) > 1
ORDER BY MAX(created_at) DESC;
```

## Data Model

### Notification Priorities
- `critical` - System critical issues
- `urgent` - Requires immediate attention
- `high` - Important, should be addressed soon
- `normal` - Standard notification (default)
- `low` - FYI, can be deferred

### Notification Categories
- `mention` - User was mentioned
- `assignment` - Task/lead assigned
- `status` - Status changed
- `sla` - SLA breach or warning
- `deadline` - Deadline approaching/missed
- `activity` - General activity update
- `system` - System-level notification
- `general` - Default category

### Entity Types
- `lead`
- `deal`
- `track`
- `task`
- `company`
- `contact`
- `comment`

## Complexity Assessment
**Complexity:** 25/100 (as specified in requirements)
- Pure SQL migrations
- No application code changes required
- Well-defined schema additions
- Clear RLS policies
- Straightforward helper function

## Related Documentation
- See `AGENTS.md` for development guidelines
- Database schema: `supabase/migrations/001_initial_schema.sql`
- Notification feature implementation: TBD (frontend integration)
