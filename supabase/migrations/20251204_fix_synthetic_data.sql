-- 20251204_fix_synthetic_data.sql

-- Update generate_synthetic_data to include players and fix deals visibility
CREATE OR REPLACE FUNCTION generate_synthetic_data(payload jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Inputs
    p_companies_count int := COALESCE((payload->>'companies_count')::int, 0);
    p_leads_count int := COALESCE((payload->>'leads_count')::int, 0);
    p_deals_count int := COALESCE((payload->>'deals_count')::int, 0);
    p_contacts_count int := COALESCE((payload->>'contacts_count')::int, 0);
    p_players_count int := COALESCE((payload->>'players_count')::int, 0); -- NEW

    p_users_ids text[] := ARRAY(SELECT jsonb_array_elements_text(COALESCE(payload->'users_ids', '[]'::jsonb)));
    p_company_strategy text := COALESCE(payload->>'company_strategy', 'v1');
    p_admin_id uuid := auth.uid();

    -- Internal vars
    v_company_id uuid;
    v_deal_id uuid;
    v_counter int;

    -- Result counters
    r_companies int := 0;
    r_leads int := 0;
    r_deals int := 0;
    r_contacts int := 0;
    r_players int := 0; -- NEW

    -- Arrays for random selection
    v_company_ids uuid[];
    v_available_user_ids uuid[];

    -- Logic vars
    v_rel_level text;
    v_comp_type text;
    v_owner_id uuid;
    v_player_type text;
BEGIN
    -- 0. Setup Users
    -- If p_users_ids provided, use them. Else, try to find existing synthetic users. Else, use admin.
    IF array_length(p_users_ids, 1) > 0 THEN
        v_available_user_ids := p_users_ids::uuid[];
    ELSE
        SELECT array_agg(id) INTO v_available_user_ids FROM profiles WHERE is_synthetic = true;
        IF v_available_user_ids IS NULL THEN
            v_available_user_ids := ARRAY[p_admin_id];
        END IF;
    END IF;

    -- 1. Generate Companies
    FOR v_counter IN 1..p_companies_count LOOP
        IF p_company_strategy = 'v2' THEN
             v_rel_level := (ARRAY['none', 'prospect', 'active_client', 'partner', 'churned'])[floor(random()*5 + 1)];
        ELSE
             v_rel_level := (ARRAY['none', 'basic', 'intermediate', 'close'])[floor(random()*4 + 1)];
        END IF;

        v_comp_type := (ARRAY['incorporadora', 'construtora', 'assessor_juridico', 'agente_fiduciario', 'servicer', 'outros'])[floor(random()*6 + 1)];
        v_owner_id := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];

        INSERT INTO companies (
            name,
            type,
            relationship_level,
            is_synthetic,
            created_by,
            updated_by
        ) VALUES (
            'Synth Comp ' || substr(md5(random()::text), 1, 6),
            v_comp_type,
            v_rel_level,
            true,
            v_owner_id,
            v_owner_id
        ) RETURNING id INTO v_company_id;

        v_company_ids := array_append(v_company_ids, v_company_id);
        r_companies := r_companies + 1;
    END LOOP;

    -- Update available companies if we didn't create any (using existing for deals/contacts)
    IF v_company_ids IS NULL THEN
        SELECT array_agg(id) INTO v_company_ids FROM companies WHERE is_synthetic = true;
    END IF;

    -- 2. Generate Contacts
    IF p_contacts_count > 0 AND v_company_ids IS NOT NULL THEN
        FOR v_counter IN 1..p_contacts_count LOOP
            v_owner_id := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];
            INSERT INTO contacts (
                company_id,
                name,
                is_primary,
                is_synthetic,
                created_by
            ) VALUES (
                v_company_ids[floor(random()*array_length(v_company_ids, 1) + 1)],
                'Synth Contact ' || substr(md5(random()::text), 1, 4),
                (random() > 0.8), -- 20% chance of being primary
                true,
                v_owner_id
            );
            r_contacts := r_contacts + 1;
        END LOOP;
    END IF;

    -- 3. Generate Leads
    FOR v_counter IN 1..p_leads_count LOOP
        v_owner_id := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];
        INSERT INTO leads (
            legal_name,
            status,
            origin,
            is_synthetic,
            created_by,
            owner_user_id
        ) VALUES (
            'Synth Lead ' || substr(md5(random()::text), 1, 6),
            (ARRAY['new', 'contacted', 'qualified', 'disqualified'])[floor(random()*4 + 1)],
            (ARRAY['inbound', 'outbound', 'referral', 'event', 'other'])[floor(random()*5 + 1)],
            true,
            v_owner_id,
            v_owner_id
        );
        r_leads := r_leads + 1;
    END LOOP;

    -- 4. Generate Deals (Master Deals + Members)
    IF v_company_ids IS NOT NULL THEN
        FOR v_counter IN 1..p_deals_count LOOP
            v_owner_id := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];

            INSERT INTO master_deals (
                client_name,
                volume,
                operation_type,
                status,
                deadline,
                observations,
                company_id,
                created_by,
                is_synthetic
            ) VALUES (
                'Synth Deal ' || substr(md5(random()::text), 1, 6),
                (random() * 1000000)::numeric,
                (ARRAY['ccb', 'cri_land', 'cri_construction', 'cri_corporate'])[floor(random()*4 + 1)],
                (ARRAY['active', 'cancelled', 'concluded', 'on_hold'])[floor(random()*4 + 1)],
                now() + (random() * 30 || ' days')::interval,
                'Synthetic observation',
                v_company_ids[floor(random()*array_length(v_company_ids, 1) + 1)],
                v_owner_id,
                true
            ) RETURNING id INTO v_deal_id;

            -- INSERT MEMBER (Critical for visibility)
            INSERT INTO deal_members (deal_id, user_id, role)
            VALUES (v_deal_id, v_owner_id, 'owner');

            r_deals := r_deals + 1;
        END LOOP;
    END IF;

    -- 5. Generate Players (NEW)
    FOR v_counter IN 1..p_players_count LOOP
        v_owner_id := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];
        v_player_type := (ARRAY['banco', 'gestora', 'family_office', 'consultoria', 'outros'])[floor(random()*5 + 1)];

        -- Map relationship level based on strategy or standard
        v_rel_level := (ARRAY['none', 'basic', 'intermediate', 'close'])[floor(random()*4 + 1)];

        INSERT INTO players (
            name,
            type,
            relationship_level,
            product_capabilities,
            is_synthetic,
            created_by,
            updated_by
        ) VALUES (
            'Synth Player ' || substr(md5(random()::text), 1, 6),
            v_player_type,
            v_rel_level,
            '{"credit": [], "equity": [], "barter": []}'::jsonb,
            true,
            v_owner_id,
            v_owner_id
        );
        r_players := r_players + 1;
    END LOOP;

    RETURN json_build_object(
        'companies', r_companies,
        'leads', r_leads,
        'deals', r_deals,
        'contacts', r_contacts,
        'players', r_players,
        'strategy_used', p_company_strategy
    );
END;
$$;

-- Update clear_synthetic_data to REMOVE profiles deletion (handled by Edge Function)
CREATE OR REPLACE FUNCTION clear_synthetic_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_counts json;
    d_tasks int;
    d_tracks int;
    d_deals int;
    d_leads int;
    d_contacts int;
    d_companies int;
    d_players int;
    d_lead_links int;
    d_deal_links int;
BEGIN
    -- Order matters due to Foreign Keys

    -- 1. Tasks
    DELETE FROM tasks WHERE is_synthetic = true;
    GET DIAGNOSTICS d_tasks = ROW_COUNT;

    -- 2. Player Tracks
    DELETE FROM player_tracks WHERE is_synthetic = true;
    GET DIAGNOSTICS d_tracks = ROW_COUNT;

    -- 3. Master Deals (and links)
    -- First delete deal_members for synthetic deals
    DELETE FROM deal_members WHERE deal_id IN (SELECT id FROM master_deals WHERE is_synthetic = true);
    GET DIAGNOSTICS d_deal_links = ROW_COUNT;

    DELETE FROM master_deals WHERE is_synthetic = true;
    GET DIAGNOSTICS d_deals = ROW_COUNT;

    -- 4. Lead Links (Junctions)
    DELETE FROM lead_contacts WHERE lead_id IN (SELECT id FROM leads WHERE is_synthetic = true);
    DELETE FROM lead_members WHERE lead_id IN (SELECT id FROM leads WHERE is_synthetic = true);
    GET DIAGNOSTICS d_lead_links = ROW_COUNT;

    -- 5. Leads
    DELETE FROM leads WHERE is_synthetic = true;
    GET DIAGNOSTICS d_leads = ROW_COUNT;

    -- 6. Contacts
    DELETE FROM contacts WHERE is_synthetic = true;
    GET DIAGNOSTICS d_contacts = ROW_COUNT;

    -- 7. Companies
    DELETE FROM companies WHERE is_synthetic = true;
    GET DIAGNOSTICS d_companies = ROW_COUNT;

    -- 8. Players
    DELETE FROM player_contacts WHERE player_id IN (SELECT id FROM players WHERE is_synthetic = true);
    DELETE FROM players WHERE is_synthetic = true;
    GET DIAGNOSTICS d_players = ROW_COUNT;

    -- Note: We DO NOT delete profiles here anymore.
    -- The Edge Function `admin-create-synthetic-users` (DELETE) handles auth.users, which cascades to profiles.

    deleted_counts := json_build_object(
        'tasks', d_tasks,
        'tracks', d_tracks,
        'deals', d_deals,
        'leads', d_leads,
        'contacts', d_contacts,
        'companies', d_companies,
        'players', d_players,
        'users', 0 -- Report 0 here, handled by EF
    );

    RETURN deleted_counts;
END;
$$;
