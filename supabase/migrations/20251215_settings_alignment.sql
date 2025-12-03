-- 20251215_settings_alignment.sql
-- Align settings tables schemas, defaults, and RLS policies.

-- Ensure uuid generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table definitions and column defaults
-- ============================================================================

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  acronym TEXT,
  default_fee_percentage NUMERIC,
  default_sla_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS acronym TEXT,
  ADD COLUMN IF NOT EXISTS default_fee_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS default_sla_days INTEGER,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE products
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Deal Sources
CREATE TABLE IF NOT EXISTS deal_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE deal_sources
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE deal_sources
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

DROP TRIGGER IF EXISTS set_deal_sources_updated_at ON deal_sources;
CREATE TRIGGER set_deal_sources_updated_at
  BEFORE UPDATE ON deal_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Loss Reasons
CREATE TABLE IF NOT EXISTS loss_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE loss_reasons
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE loss_reasons
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

DROP TRIGGER IF EXISTS set_loss_reasons_updated_at ON loss_reasons;
CREATE TRIGGER set_loss_reasons_updated_at
  BEFORE UPDATE ON loss_reasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Player Categories
CREATE TABLE IF NOT EXISTS player_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE player_categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE player_categories
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

DROP TRIGGER IF EXISTS set_player_categories_updated_at ON player_categories;
CREATE TRIGGER set_player_categories_updated_at
  BEFORE UPDATE ON player_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Holidays
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE holidays
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE holidays
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

DROP TRIGGER IF EXISTS set_holidays_updated_at ON holidays;
CREATE TRIGGER set_holidays_updated_at
  BEFORE UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Communication Templates
CREATE TABLE IF NOT EXISTS communication_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE communication_templates
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE communication_templates
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN updated_at SET DEFAULT now();

DROP TRIGGER IF EXISTS set_communication_templates_updated_at ON communication_templates;
CREATE TRIGGER set_communication_templates_updated_at
  BEFORE UPDATE ON communication_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS policies: read for all, manage for admins
-- ============================================================================
DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOR target_table IN SELECT unnest(ARRAY[
    'products',
    'deal_sources',
    'loss_reasons',
    'player_categories',
    'holidays',
    'communication_templates'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', target_table);

    -- Clean up legacy policies with common names
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

    -- Read for everyone
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = target_table AND policyname = format('%s readable by all', target_table)
    ) THEN
      EXECUTE format('CREATE POLICY "%s" ON %I FOR SELECT USING (true);', format('%s readable by all', target_table), target_table);
    END IF;

    -- Admin-only write
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

-- Align system_settings RLS with admin-only writes
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings viewable by everyone" ON system_settings;
DROP POLICY IF EXISTS "Settings manageable by admins" ON system_settings;

CREATE POLICY "system_settings readable by all" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage system_settings" ON system_settings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- Default auth_config entry
-- ============================================================================
INSERT INTO system_settings (key, value, description, updated_at)
VALUES (
  'auth_config',
  '{"enableMagicLinks": true, "restrictDomain": false, "allowedDomain": null}'::jsonb,
  'Authentication settings',
  now()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = COALESCE(system_settings.description, EXCLUDED.description),
    updated_at = now();
