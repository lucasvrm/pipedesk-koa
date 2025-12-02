-- 20251208_fix_synthetic_data_v2.sql

-- This migration updates the v2 synthetic data generator to avoid
-- violating the `companies_relationship_level_check` by omitting
-- the `relationship_level` column when inserting companies.
-- It also retains explicit relationship levels for players only.

-- Replace the existing generate_synthetic_data_v2 function with a corrected version.
CREATE OR REPLACE FUNCTION generate_synthetic_data_v2(payload jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    -- Inputs
    p_companies_count int := COALESCE((payload->>'companies_count')::int, 0);
    p_leads_count     int := COALESCE((payload->>'leads_count')::int, 0);
    p_deals_count     int := COALESCE((payload->>'deals_count')::int, 0);
    p_contacts_count  int := COALESCE((payload->>'contacts_count')::int, 0);
    p_players_count   int := COALESCE((payload->>'players_count')::int, 0);
    p_users_ids       text[] := ARRAY(SELECT jsonb_array_elements_text(COALESCE(payload->'users_ids', '[]'::jsonb)));
    p_admin_id        uuid := auth.uid();

    -- Internal vars
    v_company_id     uuid;
    v_deal_id        uuid;
    v_counter        int;

    -- Result counters
    r_companies int := 0;
    r_leads     int := 0;
    r_deals     int := 0;
    r_contacts  int := 0;
    r_players   int := 0;

    -- Arrays for random selection
    v_company_ids       uuid[];
    v_available_user_ids uuid[];

    -- Logic vars
    v_comp_type   text;
    v_owner_id    uuid;
    v_player_type text;
    v_rel_level   text;
BEGIN
    -- Determine available users: provided IDs, existing synthetic users, or fallback to admin
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
        -- Select a random company type
        v_comp_type := (ARRAY['incorporadora','construtora','assessor_juridico','agente_fiduciario','servicer','outros'])[floor(random()*6 + 1)];
        v_owner_id  := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];

        BEGIN
            -- Insert company without specifying relationship_level to satisfy CHECK constraint
            INSERT INTO companies (
                name,
                type,
                is_synthetic,
                created_by
            ) VALUES (
                'Synth Comp ' || substr(md5(random()::text), 1, 6),
                v_comp_type,
                true,
                v_owner_id
            ) RETURNING id INTO v_company_id;

            v_company_ids := array_append(v_company_ids, v_company_id);
            r_companies := r_companies + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Propagate any errors to the caller so front‑end logs them
            RAISE EXCEPTION 'Failed to create company: %', SQLERRM;
        END;
    END LOOP;

    -- If no new companies created, fallback to existing synthetic companies
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
                (random() > 0.8),
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
            (ARRAY['new','contacted','qualified','disqualified'])[floor(random()*4 + 1)],
            (ARRAY['inbound','outbound','referral','event','other'])[floor(random()*5 + 1)],
            true,
            v_owner_id,
            v_owner_id
        );
        r_leads := r_leads + 1;
    END LOOP;

    -- 4. Generate Deals
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
            -- Assign owner as a deal member. Some deployments may not have
            -- the `role` column on `deal_members` (e.g., older schemas). Attempt
            -- to insert with the `role` column and fall back to a two‑column
            -- insert if the column does not exist. This avoids runtime errors
            -- like "column \"role\" does not exist".
            BEGIN
                INSERT INTO deal_members (deal_id, user_id, role)
                VALUES (v_deal_id, v_owner_id, 'owner');
            EXCEPTION
                WHEN undefined_column THEN
                    -- Fallback: insert without specifying role; uses table default
                    INSERT INTO deal_members (deal_id, user_id)
                    VALUES (v_deal_id, v_owner_id);
                WHEN others THEN
                    -- Propagate unexpected errors to aid debugging
                    RAISE;
            END;
            r_deals := r_deals + 1;
        END LOOP;
    END IF;

    -- 5. Generate Players
    FOR v_counter IN 1..p_players_count LOOP
        v_owner_id := v_available_user_ids[floor(random()*array_length(v_available_user_ids, 1) + 1)];
        v_player_type := (ARRAY['bank','asset_manager','securitizer','family_office','other','fund'])[floor(random()*6 + 1)];
        v_rel_level := (ARRAY['none','basic','intermediate','close'])[floor(random()*4 + 1)];
        INSERT INTO players (
            name,
            type,
            relationship_level,
            product_capabilities,
            is_synthetic,
            created_by
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
        'leads',     r_leads,
        'deals',     r_deals,
        'contacts',  r_contacts,
        'players',   r_players
    );
END;
$$;