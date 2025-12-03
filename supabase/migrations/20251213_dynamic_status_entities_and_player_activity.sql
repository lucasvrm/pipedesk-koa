-- 20251213_dynamic_status_entities_and_player_activity.sql
-- Adds support for player entity type in activity_log and introduces dynamic tables
-- for track statuses, operation types, task statuses, and task priorities.

-- ============================================================================
-- Extend activity_log entity_type to include 'player'
-- ============================================================================
DO $$
BEGIN
  -- Drop existing constraint if present
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'activity_log' AND constraint_name = 'activity_log_entity_type_check'
  ) THEN
    ALTER TABLE activity_log DROP CONSTRAINT activity_log_entity_type_check;
  END IF;

  -- Recreate constraint with the new allowed type
  ALTER TABLE activity_log
    ADD CONSTRAINT activity_log_entity_type_check
    CHECK (entity_type IN ('deal', 'track', 'task', 'lead', 'company', 'user', 'folder', 'player'));
END $$;

-- ============================================================================
-- Utility: create standard policy for admin/analyst/newbusiness management
-- ============================================================================
CREATE OR REPLACE FUNCTION create_managed_table(
  target_table TEXT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target_table);

  EXECUTE format('CREATE POLICY "Users can view %I" ON %I FOR SELECT USING (true);', target_table, target_table);

  EXECUTE format(
    'CREATE POLICY "Authorized users can manage %1$I" ON %1$I FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (''admin'', ''analyst'', ''newbusiness'')
      )
    );',
    target_table
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- track_statuses
-- ============================================================================
CREATE TABLE IF NOT EXISTS track_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

SELECT create_managed_table('track_statuses');

-- ============================================================================
-- operation_types (dynamic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS operation_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

SELECT create_managed_table('operation_types');

-- ============================================================================
-- task_statuses
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

SELECT create_managed_table('task_statuses');

-- ============================================================================
-- task_priorities
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

SELECT create_managed_table('task_priorities');
