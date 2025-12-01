-- 20251207_fix_synthetic_companies_check.sql

-- Update generate_synthetic_data to fix CHECK constraint violation in companies
-- 1. Remove relationship_level from companies INSERT (let DB use default)
-- 2. Ensure v_rel_level for players uses valid values only
-- 3. Set SECURITY DEFINER and search_path

CREATE OR REPLACE FUNCTION generate_synthetic_data(payload jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    -- Inputs
    p_companies_count int := COALESCE((payload->>'companies_count')::int, 0);
    p_leads_count int := COALESCE((payload->>'leads_count')::int, 0);
    p_deals_count int := COALESCE((payload->>'deals_count')::int, 0);
    p_contacts_count int := COALESCE((payload->>'contacts_count')::int, 0);
    p_players_count int := COALESCE((payload->>'players_count')::int, 0);

    p_users_ids text[] := ARRAY(SELECT jsonb_array_elements_text(COALESCE(payload->'users_ids', '[]'::jsonb)));
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
    r_players int := 0;

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
        -- CORRECTED TYPES based on strict user input
        v_comp_type := (ARRAY['incorporadora','construtora','assessor_juridico','agente_fiduciario','servicer','outros'])[floor(random()*6 + 1)];

        -- REMOVED: v_rel_level assignment for companies. relationship_level column has a CHECK constraint.
        -- We will let it default to 'none' by not inserting it.

        v_owner_id := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];

        BEGIN
            INSERT INTO companies (
                name,
                type,
                -- relationship_level, -- REMOVED to satisfy CHECK constraint
                is_synthetic,
                created_by
                -- NO updated_by
            ) VALUES (
                'Synth Comp ' || substr(md5(random()::text), 1, 6),
                v_comp_type,
                -- v_rel_level, -- REMOVED
                true,
                v_owner_id
            ) RETURNING id INTO v_company_id;

            v_company_ids := array_append(v_company_ids, v_company_id);
            r_companies := r_companies + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Re-raise exception to alert frontend, do not swallow.
            RAISE EXCEPTION 'Failed to create company with type %: %', v_comp_type, SQLERRM;
        END;
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
                -- NO updated_by
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
                status,
                company_id,
                created_by,
                is_synthetic,
                deleted_at
            ) VALUES (
                'Synth Deal ' || substr(md5(random()::text), 1, 6),
                'active',
                v_company_ids[floor(random()*array_length(v_company_ids, 1) + 1)],
                v_owner_id,
                true,
                NULL
            ) RETURNING id INTO v_deal_id;

            -- INSERT MEMBER (Critical for visibility)
            INSERT INTO deal_members (deal_id, user_id, role)
            VALUES (v_deal_id, v_owner_id, 'owner');

            r_deals := r_deals + 1;
        END LOOP;
    END IF;

    -- 5. Generate Players
    FOR v_counter IN 1..p_players_count LOOP
        v_owner_id := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];
        -- Types inferred from types.ts (since schema not available)
        v_player_type := (ARRAY['bank', 'asset_manager', 'securitizer', 'family_office', 'other', 'fund'])[floor(random()*6 + 1)];

        -- Rel level: Explicitly using valid values from CHECK constraint
        v_rel_level := (ARRAY['none', 'basic', 'intermediate', 'close'])[floor(random()*4 + 1)];

        INSERT INTO players (
            name,
            type,
            relationship_level,
            product_capabilities,
            is_synthetic,
            created_by
            -- NO updated_by
        ) VALUES (
            'Synth Player ' || substr(md5(random()::text), 1, 6),
            v_player_type,
            v_rel_level,
            '{"credit": [], "equity": [], "barter": []}'::jsonb,
            true,
            v_owner_id
        );
        r_players := r_players + 1;
    END LOOP;

    RETURN json_build_object(
        'companies', r_companies,
        'leads', r_leads,
        'deals', r_deals,
        'contacts', r_contacts,
        'players', r_players
    );
END;
$$;
