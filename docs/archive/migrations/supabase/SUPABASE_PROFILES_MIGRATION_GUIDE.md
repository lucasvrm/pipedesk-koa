# Supabase Profiles Migration Guide

## Overview
This guide explains how to set up the Supabase profiles table to fix the authentication flow in PipeDesk.

## Problem
The authentication system was trying to fetch user data from `auth.users` table, which is protected by Supabase and not accessible via the API. This caused 404 errors when users tried to log in.

## Solution
Create a separate `profiles` table in the public schema with Row Level Security (RLS) enabled. This table will store additional user profile information and will be automatically populated when a new user signs up.

## Migration Steps

### 1. Execute SQL Migration

Open your Supabase project's SQL Editor:
https://app.supabase.com/project/YOUR_PROJECT_ID/sql

Copy and paste the contents of `supabase-profiles-migration.sql` and execute it.

This will:
- Create the `profiles` table with basic fields (id, updated_at, username, avatar_url, website)
- Set up a foreign key to `auth.users` with CASCADE delete
- Enable Row Level Security (RLS)
- Create policies allowing:
  - Anyone to view all profiles
  - Users to insert their own profile
  - Users to update their own profile
- Create a trigger that automatically creates a profile when a new user signs up

### 2. Verify the Migration

After running the migration, verify it worked:

```sql
-- Check if the table exists
SELECT * FROM public.profiles;

-- Test the trigger by creating a test user in Supabase Auth UI
-- A profile should be automatically created
```

### 3. Code Changes

The following files were updated:

#### `src/contexts/AuthContext.tsx`
- Changed profile fetch query from `supabase.from('users')` to `supabase.from('profiles')`

#### `src/App.tsx`
- Temporarily commented out `useKV` notifications to prevent 401 errors during auth
- These will be migrated to Supabase in a future update

## Authentication Flow

With these changes, the authentication flow now works as follows:

1. User requests magic link via email
2. Supabase sends magic link email
3. User clicks link → Supabase verifies token
4. AuthContext detects session change
5. AuthContext fetches profile from `profiles` table ✅ (was failing before)
6. User is authenticated and app renders

## Testing

To test the authentication:

1. Go to your Supabase project → Authentication → Users
2. Delete any test users if needed
3. In your app, enter an email and request a magic link
4. Check your email and click the magic link
5. You should be redirected back to the app and logged in
6. Check Supabase → Table Editor → profiles to see your profile was created

## Next Steps

Future improvements to implement:

1. **Migrate Notifications to Supabase**
   - Create a `notifications` table
   - Update InboxPanel to use Supabase instead of useKV
   
2. **Extend Profile Fields**
   - Add name, role, company fields
   - Add avatar upload functionality
   
3. **User Management**
   - Create admin interface for managing user roles
   - Implement invitation system with Supabase

## Troubleshooting

### Profile not created after signup
Check the trigger:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### 404 errors persist
Verify the policies are set correctly:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Cannot update profile
Check RLS policies and ensure `auth.uid()` matches the profile id

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
