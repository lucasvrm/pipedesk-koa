-- 20251211_update_synthetic_randomization.sql

-- This migration updates the synthetic data generator to introduce greater
-- variability in the generated data and to address bugs uncovered during
-- testing.  Specifically, it randomizes deal properties (volume,
-- operation_type, deadline and fee_percentage), ensures that a valid
-- deadline date is always set, and assigns at least one product subtype to
-- each synthetic player.  This helps prevent downstream errors such as
-- "Invalid time value" in the frontend and makes the synthetic data more
-- representative of real‑world scenarios.

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
    v_company_ids        uuid[];
    v_available_user_ids uuid[];

    -- Logic vars
    v_comp_type      text;
    v_owner_id       uuid;
    v_player_type    text;
    v_rel_level      text;
    v_operation_type text;
    v_volume         numeric;
    v_deadline       date;
    v_fee            numeric;
    v_selected_cat   text;
    v_credit_subtypes text[];
    v_equity_subtypes text[];
    v_barter_subtypes text[];
    v_products       jsonb;
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
            -- Randomize deal parameters
            v_operation_type := (ARRAY['ccb','cri_land','cri_construction','cri_corporate','debt_construction','receivables_advance','working_capital','built_to_suit','preferred_equity','repurchase','sale_and_lease_back','inventory_purchase','financial_swap','physical_swap','hybrid_swap'])[floor(random()*14 + 1)];
            v_volume := floor(random()*4900000 + 100000); -- between 100k and 5M
            v_deadline := current_date + (floor(random()*150 + 30))::int; -- 30 to 180 days from today
            v_fee := round(random()*4 + 1, 2); -- 1.00 to 5.00
            BEGIN
                -- Attempt full insert with newer columns
                INSERT INTO master_deals (
                    client_name,
                    status,
                    volume,
                    operation_type,
                    deadline,
                    fee_percentage,
                    company_id,
                    created_by,
                    is_synthetic,
                    deleted_at
                ) VALUES (
                    'Synth Deal ' || substr(md5(random()::text), 1, 6),
                    'active',
                    v_volume,
                    v_operation_type,
                    v_deadline,
                    v_fee,
                    v_company_ids[floor(random()*array_length(v_company_ids, 1) + 1)],
                    v_owner_id,
                    true,
                    NULL
                ) RETURNING id INTO v_deal_id;
            EXCEPTION
                WHEN undefined_column THEN
                    -- Fallback: insert with minimal required fields
                    INSERT INTO master_deals (
                        client_name,
                        status,
                        created_by
                    ) VALUES (
                        'Synth Deal ' || substr(md5(random()::text), 1, 6),
                        'active',
                        v_owner_id
                    ) RETURNING id INTO v_deal_id;
                WHEN OTHERS THEN
                    RAISE;
            END;
            -- Assign owner as a deal member with fallback if role column is missing
            BEGIN
                INSERT INTO deal_members (deal_id, user_id, role)
                VALUES (v_deal_id, v_owner_id, 'owner');
            EXCEPTION
                WHEN undefined_column THEN
                    INSERT INTO deal_members (deal_id, user_id)
                    VALUES (v_deal_id, v_owner_id);
                WHEN OTHERS THEN
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
        -- Randomly assign at least one product subtype
        v_selected_cat := (ARRAY['credit','equity','barter'])[floor(random()*3 + 1)];
        IF v_selected_cat = 'credit' THEN
            v_credit_subtypes := ARRAY[(ARRAY['ccb','cri_terreno','cri_obra','cri_corporativo','plano_empresario','antecipacao','kgiro','bts'])[floor(random()*8 + 1)]];
            v_equity_subtypes := ARRAY[]::text[];
            v_barter_subtypes := ARRAY[]::text[];
        ELSIF v_selected_cat = 'equity' THEN
            v_credit_subtypes := ARRAY[]::text[];
            v_equity_subtypes := ARRAY[(ARRAY['equity_pref','retrovenda','slb','compra_estoque'])[floor(random()*4 + 1)]];
            v_barter_subtypes := ARRAY[]::text[];
        ELSE
            v_credit_subtypes := ARRAY[]::text[];
            v_equity_subtypes := ARRAY[]::text[];
            v_barter_subtypes := ARRAY[(ARRAY['financeira','fisica','hibrida'])[floor(random()*3 + 1)]];
        END IF;
        v_products := jsonb_build_object(
            'credit', to_jsonb(v_credit_subtypes),
            'equity', to_jsonb(v_equity_subtypes),
            'barter', to_jsonb(v_barter_subtypes)
        );
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
            v_products,
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