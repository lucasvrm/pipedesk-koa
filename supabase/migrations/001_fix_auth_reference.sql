-- Migration: Fix Authentication Reference
-- This migration updates the users table to properly reference auth.users(id)
-- and creates a trigger to auto-create user profiles on registration

-- ============================================================================
-- Step 1: Backup existing users table
-- ============================================================================
CREATE TABLE users_backup AS SELECT * FROM users;

-- ============================================================================
-- Step 2: Drop existing foreign key constraints that reference users
-- ============================================================================

-- Drop constraints from tables referencing users
ALTER TABLE IF EXISTS magic_links DROP CONSTRAINT IF EXISTS magic_links_user_id_fkey;
ALTER TABLE IF EXISTS master_deals DROP CONSTRAINT IF EXISTS master_deals_created_by_fkey;
ALTER TABLE IF EXISTS comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
ALTER TABLE IF EXISTS notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS custom_field_definitions DROP CONSTRAINT IF EXISTS custom_field_definitions_created_by_fkey;
ALTER TABLE IF EXISTS custom_field_values DROP CONSTRAINT IF EXISTS custom_field_values_updated_by_fkey;
ALTER TABLE IF EXISTS folders DROP CONSTRAINT IF EXISTS folders_created_by_fkey;
ALTER TABLE IF EXISTS entity_locations DROP CONSTRAINT IF EXISTS entity_locations_added_by_fkey;
ALTER TABLE IF EXISTS activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE IF EXISTS google_integrations DROP CONSTRAINT IF EXISTS google_integrations_user_id_fkey;
ALTER TABLE IF EXISTS documents DROP CONSTRAINT IF EXISTS documents_created_by_fkey;
ALTER TABLE IF EXISTS data_room_files DROP CONSTRAINT IF EXISTS data_room_files_uploaded_by_fkey;
ALTER TABLE IF EXISTS qa_threads DROP CONSTRAINT IF EXISTS qa_threads_asked_by_fkey;
ALTER TABLE IF EXISTS qa_answers DROP CONSTRAINT IF EXISTS qa_answers_answered_by_fkey;
ALTER TABLE IF EXISTS sla_config DROP CONSTRAINT IF EXISTS sla_config_created_by_fkey;

-- ============================================================================
-- Step 3: Drop and recreate users table with auth.users reference
-- ============================================================================

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'client', 'newbusiness')),
  avatar TEXT,
  client_entity TEXT,
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 4: Migrate data from backup preserving IDs
-- ============================================================================

INSERT INTO users (id, name, email, role, avatar, client_entity, has_completed_onboarding, created_at, updated_at)
SELECT id, name, email, role, avatar, client_entity, has_completed_onboarding, created_at, updated_at
FROM users_backup
WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = users_backup.id);

-- ============================================================================
-- Step 5: Recreate all foreign key constraints
-- ============================================================================

ALTER TABLE magic_links 
  ADD CONSTRAINT magic_links_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE master_deals 
  ADD CONSTRAINT master_deals_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE comments 
  ADD CONSTRAINT comments_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES users(id);

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE custom_field_definitions 
  ADD CONSTRAINT custom_field_definitions_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE custom_field_values 
  ADD CONSTRAINT custom_field_values_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE folders 
  ADD CONSTRAINT folders_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE entity_locations 
  ADD CONSTRAINT entity_locations_added_by_fkey 
  FOREIGN KEY (added_by) REFERENCES users(id);

ALTER TABLE activity_log 
  ADD CONSTRAINT activity_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE google_integrations 
  ADD CONSTRAINT google_integrations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add constraints for tables that might exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    ALTER TABLE documents 
      ADD CONSTRAINT documents_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_room_files') THEN
    ALTER TABLE data_room_files 
      ADD CONSTRAINT data_room_files_uploaded_by_fkey 
      FOREIGN KEY (uploaded_by) REFERENCES users(id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qa_threads') THEN
    ALTER TABLE qa_threads 
      ADD CONSTRAINT qa_threads_asked_by_fkey 
      FOREIGN KEY (asked_by) REFERENCES users(id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qa_answers') THEN
    ALTER TABLE qa_answers 
      ADD CONSTRAINT qa_answers_answered_by_fkey 
      FOREIGN KEY (answered_by) REFERENCES users(id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sla_config') THEN
    ALTER TABLE sla_config 
      ADD CONSTRAINT sla_config_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
END $$;

-- ============================================================================
-- Step 6: Create trigger function to handle new user registration
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, avatar, has_completed_onboarding)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'analyst'),
    NEW.raw_user_meta_data->>'avatar',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 7: Create trigger on auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- Step 8: Create RLS Policies for users table
-- ============================================================================

-- Users can read all other users (for collaboration features)
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Only admins can insert users (or via trigger)
CREATE POLICY "Only admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete users
CREATE POLICY "Only admins can delete users"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- Step 9: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- Step 10: Grant permissions
-- ============================================================================

-- Grant authenticated users access to users table
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Note: Keep users_backup table for safety
-- To drop it after verifying migration: DROP TABLE users_backup;
