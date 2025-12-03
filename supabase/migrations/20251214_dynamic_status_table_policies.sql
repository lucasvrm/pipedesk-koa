-- 20251214_dynamic_status_table_policies.sql
-- Ensure dynamic status tables align with service expectations
-- and apply consistent RLS + updated_at maintenance.

-- ============================================================================
-- Table definitions (id, name, description, is_active, created_at, updated_at)
-- ============================================================================
CREATE TABLE IF NOT EXISTS track_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operation_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure defaults exist even if tables already present
ALTER TABLE track_statuses
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE operation_types
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE task_statuses
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE task_priorities
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN is_active SET DEFAULT true;

-- ============================================================================
-- updated_at triggers (front-end agnostic)
-- ============================================================================
DROP TRIGGER IF EXISTS set_track_statuses_updated_at ON track_statuses;
CREATE TRIGGER set_track_statuses_updated_at
  BEFORE UPDATE ON track_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_operation_types_updated_at ON operation_types;
CREATE TRIGGER set_operation_types_updated_at
  BEFORE UPDATE ON operation_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_task_statuses_updated_at ON task_statuses;
CREATE TRIGGER set_task_statuses_updated_at
  BEFORE UPDATE ON task_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_task_priorities_updated_at ON task_priorities;
CREATE TRIGGER set_task_priorities_updated_at
  BEFORE UPDATE ON task_priorities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS policies (read for all, write for admins)
-- ============================================================================
DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOR target_table IN SELECT unnest(ARRAY['track_statuses', 'operation_types', 'task_statuses', 'task_priorities']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', target_table);

    -- Drop legacy policies if they exist
    IF EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = target_table AND policyname = format('Users can view %s', target_table)
    ) THEN
      EXECUTE format('DROP POLICY "%s" ON %I;', format('Users can view %s', target_table), target_table);
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = target_table AND policyname = format('Authorized users can manage %s', target_table)
    ) THEN
      EXECUTE format('DROP POLICY "%s" ON %I;', format('Authorized users can manage %s', target_table), target_table);
    END IF;

    -- Apply open read policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = target_table AND policyname = format('%s readable by all', target_table)
    ) THEN
      EXECUTE format('CREATE POLICY "%s" ON %I FOR SELECT USING (true);', format('%s readable by all', target_table), target_table);
    END IF;

    -- Admin-only management policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = target_table AND policyname = format('Admins manage %s', target_table)
    ) THEN
      EXECUTE format(
        'CREATE POLICY "%s" ON %I FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''));',
        format('Admins manage %s', target_table),
        target_table
      );
    END IF;
  END LOOP;
END $$;
