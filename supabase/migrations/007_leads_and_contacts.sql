-- 007_leads_and_contacts.sql
-- Implements Leads, Contacts (generic), and Qualification Flow

-- ============================================================================
-- 1. COMPANIES (Ensure Existence / Idempotency)
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj TEXT,
  site TEXT,
  description TEXT,
  type TEXT CHECK (type IN ('corporation', 'fund', 'startup', 'advisor', 'other')),
  relationship_level TEXT CHECK (relationship_level IN ('none', 'prospect', 'active_client', 'partner', 'churned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS on companies if not already
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Companies viewable by everyone') THEN
    CREATE POLICY "Companies viewable by everyone" ON companies FOR SELECT USING (deleted_at IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Companies manageable by users') THEN
    CREATE POLICY "Companies manageable by users" ON companies FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
    );
  END IF;
END $$;


-- ============================================================================
-- 2. CONTACTS (Refactor from company_contacts)
-- ============================================================================

-- Rename if exists, otherwise create
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_contacts') THEN
    ALTER TABLE company_contacts RENAME TO contacts;
  ELSE
    CREATE TABLE contacts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID REFERENCES companies(id), -- Nullable now
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      created_by UUID REFERENCES profiles(id),
      updated_by UUID REFERENCES profiles(id)
    );
  END IF;
END $$;

-- Alter contacts to support new fields and null company_id
ALTER TABLE contacts
  ALTER COLUMN company_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS origin TEXT; -- To track where it came from

-- Add Constraints
-- Ensure email is unique (optional, but good for data quality)
-- Handling duplicates: If renaming, we might have duplicates.
-- For MVP, let's just create an index for performance, not strict constraint yet unless requested.
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);

-- RLS for Contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Contacts viewable by everyone') THEN
    CREATE POLICY "Contacts viewable by everyone" ON contacts FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Contacts manageable by users') THEN
    CREATE POLICY "Contacts manageable by users" ON contacts FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
    );
  END IF;
END $$;

-- ============================================================================
-- 3. LEADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  website TEXT,
  segment TEXT,
  address_city TEXT,
  address_state TEXT,
  description TEXT,

  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'disqualified')),
  origin TEXT DEFAULT 'outbound' CHECK (origin IN ('inbound', 'outbound', 'referral', 'event', 'other')),

  owner_user_id UUID REFERENCES profiles(id),

  -- Qualification Audit
  qualified_at TIMESTAMPTZ,
  qualified_company_id UUID REFERENCES companies(id),
  qualified_master_deal_id UUID REFERENCES master_deals(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ
);

-- RLS for Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leads viewable by active users" ON leads FOR SELECT USING (
  deleted_at IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
);

CREATE POLICY "Leads manageable by active users" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
);

-- ============================================================================
-- 4. LEAD LINKS (Contacts & Members)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_contacts (
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (lead_id, contact_id)
);

CREATE TABLE IF NOT EXISTS lead_members (
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator', 'watcher')),
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (lead_id, user_id)
);

ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead links viewable by active users" ON lead_contacts FOR SELECT USING (true);
CREATE POLICY "Lead links manageable by active users" ON lead_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
);

CREATE POLICY "Lead members viewable by active users" ON lead_members FOR SELECT USING (true);
CREATE POLICY "Lead members manageable by active users" ON lead_members FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
);

-- ============================================================================
-- 5. POLYMORPHISM UPDATES (Entity Types)
-- ============================================================================

-- We need to update check constraints. Postgres doesn't allow easy modification of CHECK constraints.
-- We usually drop and recreate.

-- Helper procedure to safely drop and add constraint
CREATE OR REPLACE FUNCTION extend_entity_type_check(tbl_name text, constraint_name text) RETURNS void AS $$
BEGIN
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', tbl_name, constraint_name);
    -- Re-add with new types
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (entity_type IN (''deal'', ''track'', ''task'', ''lead'', ''company'', ''user'', ''folder''))', tbl_name, constraint_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to tables known to have entity_type
-- comments
SELECT extend_entity_type_check('comments', 'comments_entity_type_check');

-- activity_log
SELECT extend_entity_type_check('activity_log', 'activity_log_entity_type_check');

-- entity_tags (if constraint exists named entity_tags_entity_type_check, usually auto-named)
-- Checking migration 002: CHECK (entity_type IN ('deal', 'track'))
-- We need to find the name. Usually `entity_tags_entity_type_check`.
SELECT extend_entity_type_check('entity_tags', 'entity_tags_entity_type_check');

-- custom_field_definitions
SELECT extend_entity_type_check('custom_field_definitions', 'custom_field_definitions_entity_type_check');
SELECT extend_entity_type_check('custom_field_values', 'custom_field_values_entity_type_check');

-- ============================================================================
-- 6. ENTITY LINKS (History Projection)
-- ============================================================================
-- Stores "This note on Company X was originally from Lead Y"
CREATE TABLE IF NOT EXISTS entity_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  target_entity_type TEXT NOT NULL,
  target_entity_id UUID NOT NULL,
  type TEXT DEFAULT 'projection', -- 'projection', 'duplicate', 'reference'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE entity_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entity links viewable" ON entity_links FOR SELECT USING (true);

-- ============================================================================
-- 7. QUALIFY LEAD RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION qualify_lead(
  p_lead_id UUID,
  p_company_id UUID, -- If linking to existing
  p_new_company_data JSONB, -- If creating new: {name, cnpj, ...}
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_company_id UUID;
  v_deal_id UUID;
  v_contact RECORD;
  v_lead_member RECORD;
  v_lead_data RECORD;
BEGIN
  -- 1. Get Lead Data
  SELECT * INTO v_lead_data FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  IF v_lead_data.status = 'qualified' THEN
    RAISE EXCEPTION 'Lead already qualified';
  END IF;

  -- 2. Determine Company
  IF p_company_id IS NOT NULL THEN
    v_company_id := p_company_id;
  ELSE
    -- Create new Company
    INSERT INTO companies (name, cnpj, site, description, type, relationship_level, created_by)
    VALUES (
      p_new_company_data->>'name',
      p_new_company_data->>'cnpj',
      p_new_company_data->>'website',
      p_new_company_data->>'description',
      COALESCE(p_new_company_data->>'type', 'corporation'),
      'active_client',
      p_user_id
    ) RETURNING id INTO v_company_id;
  END IF;

  -- 3. Create Master Deal
  INSERT INTO master_deals (
    client_name,
    company_id,
    status,
    created_by,
    operation_type,
    observations
  ) VALUES (
    (SELECT name FROM companies WHERE id = v_company_id),
    v_company_id,
    'active',
    p_user_id,
    'acquisition', -- Default, user can change later
    'Qualificado via Lead: ' || v_lead_data.legal_name
  ) RETURNING id INTO v_deal_id;

  -- 4. Migrate Contacts
  -- For each contact linked to lead:
  FOR v_contact IN SELECT c.* FROM contacts c
                   JOIN lead_contacts lc ON lc.contact_id = c.id
                   WHERE lc.lead_id = p_lead_id
  LOOP
    -- If contact has no company, assign to new company
    IF v_contact.company_id IS NULL THEN
      UPDATE contacts SET company_id = v_company_id WHERE id = v_contact.id;
    ELSIF v_contact.company_id != v_company_id THEN
      -- If contact belongs to ANOTHER company, we have a conflict.
      -- Policy: Raise warning? Or just ignore moving?
      -- Requirement: "Bloquear e retornar erro amigável".
      RAISE EXCEPTION 'Contact % belongs to another company.', v_contact.name;
    END IF;
  END LOOP;

  -- 5. Propagate Members
  -- Copy lead_members to deal_members (assuming deal_members table exists, created in 006?)
  -- If deal_members table doesn't exist (it was mentioned in 006 discussion but I need to be sure), we check.
  -- Assuming 006 created `deal_members`. If not, we skip or insert to array if `master_deals` uses array.
  -- Checking 001: `responsibles UUID[]` in `player_tracks`, but `master_deals` doesn't have it.
  -- Checking `dealService.ts`: inserts into `deal_members`. So it exists.

  INSERT INTO deal_members (deal_id, user_id)
  SELECT v_deal_id, user_id FROM lead_members WHERE lead_id = p_lead_id
  ON CONFLICT DO NOTHING;

  -- 6. Update Lead
  UPDATE leads
  SET status = 'qualified',
      qualified_at = now(),
      qualified_company_id = v_company_id,
      qualified_master_deal_id = v_deal_id
  WHERE id = p_lead_id;

  RETURN jsonb_build_object(
    'company_id', v_company_id,
    'master_deal_id', v_deal_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
