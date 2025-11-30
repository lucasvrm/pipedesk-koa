-- 002_features_update.sql
-- Enable Extensions if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SYSTEM SETTINGS (Feature Flags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by everyone" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Settings manageable by admins" ON system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 2. TAGS MODULE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  entity_type TEXT CHECK (entity_type IN ('deal', 'track', 'global')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS entity_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tag_id, entity_id, entity_type)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_tags ENABLE ROW LEVEL SECURITY;

-- Tags Policies
CREATE POLICY "Tags viewable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Tags manageable by users" ON tags FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
);

-- Entity Tags Policies
CREATE POLICY "Entity tags viewable by everyone" ON entity_tags FOR SELECT USING (true);
CREATE POLICY "Entity tags manageable by users" ON entity_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
);

-- ============================================================================
-- 3. PIPELINE STAGES & DYNAMIC CONSTRAINTS
-- ============================================================================

-- A. Alter pipeline_stages
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0;
ALTER TABLE pipeline_stages ALTER COLUMN pipeline_id DROP NOT NULL;
ALTER TABLE pipeline_stages ALTER COLUMN pipeline_id DROP DEFAULT;

-- Remove the FK to master_deals if it exists (it was likely a mistake in 001 for global stages)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pipeline_stages_pipeline_id_fkey') THEN
    ALTER TABLE pipeline_stages DROP CONSTRAINT pipeline_stages_pipeline_id_fkey;
  END IF;
END $$;


-- B. Seed Default Stages (if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages) THEN
    INSERT INTO pipeline_stages (name, stage_order, probability, color, is_default) VALUES
    ('NDA', 1, 10, '#94a3b8', true),
    ('Teaser', 2, 25, '#60a5fa', true),
    ('Oferta', 3, 50, '#fbbf24', true),
    ('Diligência', 4, 75, '#f87171', true),
    ('Fechamento', 5, 95, '#4ade80', true);
  END IF;
END $$;

-- C. Remove Hardcoded CHECK constraints to allow Dynamic Stages
-- We use a dynamic block to find and drop constraints on 'stage' columns

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. player_tracks.current_stage
    FOR r IN SELECT constraint_name
             FROM information_schema.constraint_column_usage
             WHERE table_name = 'player_tracks' AND column_name = 'current_stage'
    LOOP
        EXECUTE 'ALTER TABLE player_tracks DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- 2. stage_history.stage
    FOR r IN SELECT constraint_name
             FROM information_schema.constraint_column_usage
             WHERE table_name = 'stage_history' AND column_name = 'stage'
    LOOP
        EXECUTE 'ALTER TABLE stage_history DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- 3. phase_transition_rules.from_stage
    FOR r IN SELECT constraint_name
             FROM information_schema.constraint_column_usage
             WHERE table_name = 'phase_transition_rules' AND column_name = 'from_stage'
    LOOP
        EXECUTE 'ALTER TABLE phase_transition_rules DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- 4. phase_transition_rules.to_stage
    FOR r IN SELECT constraint_name
             FROM information_schema.constraint_column_usage
             WHERE table_name = 'phase_transition_rules' AND column_name = 'to_stage'
    LOOP
        EXECUTE 'ALTER TABLE phase_transition_rules DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- ============================================================================
-- 4. SLA POLICIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS sla_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  max_hours INTEGER DEFAULT 0, -- 0 means no limit
  warning_threshold_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stage_id)
);

ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SLA policies viewable by everyone" ON sla_policies FOR SELECT USING (true);
CREATE POLICY "SLA policies manageable by admins" ON sla_policies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 5. UPDATE PHASE TRANSITION RULES
-- ============================================================================
-- We want to link rules to stage IDs ideally, but for now we might keep using text names
-- if the app heavily relies on them, OR we migrate.
-- Given the requirement "Estágio deve ser referenciável", using ID is better.
-- However, existing rows in `phase_transition_rules` use text (nda, tease...).
-- If we want to support renaming, we should migrate these columns to UUIDs eventually.
-- For this task, "Implementar regras entre estágios" implies we can just use the names
-- stored in `pipeline_stages`.
-- We will keep `from_stage` and `to_stage` as TEXT for flexibility but they should match `pipeline_stages.name` (or ID if we decided to refactor fully).
-- Let's stick to TEXT for now to avoid breaking existing logic that passes string keys,
-- but strictly validation will check against `pipeline_stages` names/ids.
