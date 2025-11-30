-- 009_qualify_lead_update.sql
-- Updates qualify_lead to copy comments from Lead to Company

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
      RAISE EXCEPTION 'Contact % belongs to another company.', v_contact.name;
    END IF;
  END LOOP;

  -- 5. Propagate Members
  INSERT INTO deal_members (deal_id, user_id)
  SELECT v_deal_id, user_id FROM lead_members WHERE lead_id = p_lead_id
  ON CONFLICT DO NOTHING;

  -- 6. Copy Comments (New Step)
  -- Copies all comments from Lead to the new Company to ensure history continuity
  FOR v_comment IN SELECT * FROM comments WHERE entity_id = p_lead_id AND entity_type = 'lead' LOOP
    INSERT INTO comments (entity_id, entity_type, author_id, content, mentions, created_at)
    VALUES (v_company_id, 'company', v_comment.author_id, v_comment.content, v_comment.mentions, v_comment.created_at);
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
