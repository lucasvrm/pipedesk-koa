-- 011_qualify_lead_traceability.sql
-- Adds traceability columns to comments and updates qualify_lead RPC

-- 1. Add traceability columns to comments
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS origin_entity_type TEXT,
ADD COLUMN IF NOT EXISTS origin_entity_id UUID;

-- 2. Update qualify_lead RPC
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
  v_comment RECORD;
BEGIN
  -- 0. Permission Check (Server-side Guard)
  -- Since this is SECURITY DEFINER, we manually check.
  IF NOT public.has_permission('leads.qualify') THEN
    RAISE EXCEPTION 'Access Denied: leads.qualify permission required.';
  END IF;

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
  FOR v_contact IN SELECT c.* FROM contacts c
                   JOIN lead_contacts lc ON lc.contact_id = c.id
                   WHERE lc.lead_id = p_lead_id
  LOOP
    IF v_contact.company_id IS NULL THEN
      UPDATE contacts SET company_id = v_company_id WHERE id = v_contact.id;
    ELSIF v_contact.company_id != v_company_id THEN
      -- Log warning instead of failing? Requirement says "Bloquear".
      -- But blocking qualification due to one contact might be harsh if data is messy.
      -- Requirement said: "Se contact.company_id já for outra company: bloquear qualificação e retornar erro claro".
      RAISE EXCEPTION 'Contact % belongs to another company.', v_contact.name;
    END IF;
  END LOOP;

  -- 5. Propagate Members
  INSERT INTO deal_members (deal_id, user_id)
  SELECT v_deal_id, user_id FROM lead_members WHERE lead_id = p_lead_id
  ON CONFLICT DO NOTHING;

  -- 6. Copy Comments with Traceability & Idempotence
  FOR v_comment IN SELECT * FROM comments WHERE entity_id = p_lead_id AND entity_type = 'lead' LOOP
    -- Check if already copied (Idempotence)
    IF NOT EXISTS (
      SELECT 1 FROM comments
      WHERE entity_id = v_company_id
      AND entity_type = 'company'
      AND origin_entity_id = p_lead_id
      AND origin_entity_type = 'lead'
      AND content = v_comment.content -- Extra safety
    ) THEN
      INSERT INTO comments (
        entity_id, entity_type, author_id, content, mentions, created_at,
        origin_entity_id, origin_entity_type
      )
      VALUES (
        v_company_id, 'company', v_comment.author_id, v_comment.content, v_comment.mentions, v_comment.created_at,
        p_lead_id, 'lead'
      );
    END IF;
  END LOOP;

  -- 7. Update Lead
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
