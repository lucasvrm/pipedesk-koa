-- 20251203_synthetic_data_full_system.sql
-- Implements robust, server-side synthetic data generation and cleanup

-- 1. Ensure is_synthetic column exists on all relevant tables (idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_synthetic') THEN
        ALTER TABLE profiles ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'is_synthetic') THEN
        ALTER TABLE companies ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'is_synthetic') THEN
        ALTER TABLE contacts ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'is_synthetic') THEN
        ALTER TABLE leads ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_deals' AND column_name = 'is_synthetic') THEN
        ALTER TABLE master_deals ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_tracks' AND column_name = 'is_synthetic') THEN
        ALTER TABLE player_tracks ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_synthetic') THEN
        ALTER TABLE tasks ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'is_synthetic') THEN
        ALTER TABLE players ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;
END $$;


-- 2. Generator RPC
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

    p_users_ids text[] := ARRAY(SELECT jsonb_array_elements_text(COALESCE(payload->'users_ids', '[]'::jsonb)));
    p_company_strategy text := COALESCE(payload->>'company_strategy', 'v1');
    p_admin_id uuid := auth.uid();

    -- Internal vars
    v_company_id uuid;
    v_counter int;

    -- Result counters
    r_companies int := 0;
    r_leads int := 0;
    r_deals int := 0;
    r_contacts int := 0;

    -- Arrays for random selection
    v_company_ids uuid[];
    v_available_user_ids uuid[];

    -- Logic vars
    v_rel_level text;
    v_comp_type text;
    v_owner_id uuid;
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
        -- Select strategy
        IF p_company_strategy = 'v2' THEN
             -- New types found in memory
             v_rel_level := (ARRAY['none', 'prospect', 'active_client', 'partner', 'churned'])[floor(random()*5 + 1)];
        ELSE
             -- Legacy types from TypeScript
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

    -- 4. Generate Deals (Master Deals)
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
            );
            r_deals := r_deals + 1;
        END LOOP;
    END IF;

    RETURN json_build_object(
        'companies', r_companies,
        'leads', r_leads,
        'deals', r_deals,
        'contacts', r_contacts,
        'strategy_used', p_company_strategy
    );
END;
$$;


-- 3. Cleanup RPC (Full Reset)
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
    d_users int;
    d_lead_links int;
BEGIN
    -- Order matters due to Foreign Keys

    -- 1. Tasks
    DELETE FROM tasks WHERE is_synthetic = true;
    GET DIAGNOSTICS d_tasks = ROW_COUNT;

    -- 2. Player Tracks
    DELETE FROM player_tracks WHERE is_synthetic = true;
    GET DIAGNOSTICS d_tracks = ROW_COUNT;

    -- 3. Master Deals
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

    -- 9. Profiles (Users)
    DELETE FROM profiles WHERE is_synthetic = true;
    GET DIAGNOSTICS d_users = ROW_COUNT;

    deleted_counts := json_build_object(
        'tasks', d_tasks,
        'tracks', d_tracks,
        'deals', d_deals,
        'leads', d_leads,
        'contacts', d_contacts,
        'companies', d_companies,
        'players', d_players,
        'users', d_users
    );

    RETURN deleted_counts;
END;
$$;
