-- Migration to support robust synthetic data generation and cleanup

-- 1. Helper for Introspection (Anti-Drift)
-- Returns all check constraints for a given table to be used by the frontend generator
CREATE OR REPLACE FUNCTION get_table_constraints(table_name text)
RETURNS TABLE (
    constraint_name text,
    check_clause text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.constraint_name::text,
        cc.check_clause::text
    FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
    WHERE tc.table_name = get_table_constraints.table_name
    AND tc.constraint_type = 'CHECK';
END;
$$;

-- 2. Robust Cleanup RPC
-- Deletes all data marked as is_synthetic = true in the correct order to avoid FK issues
-- Returns counts of deleted items
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
    d_users int; -- Note: This only counts profiles, Auth users must be deleted via Edge Function
BEGIN
    -- Order matters due to Foreign Keys

    -- 1. Tasks (depend on Tracks)
    DELETE FROM tasks WHERE is_synthetic = true;
    GET DIAGNOSTICS d_tasks = ROW_COUNT;

    -- 2. Player Tracks (depend on Master Deals & Players)
    DELETE FROM player_tracks WHERE is_synthetic = true;
    GET DIAGNOSTICS d_tracks = ROW_COUNT;

    -- 3. Master Deals (depend on Companies)
    DELETE FROM master_deals WHERE is_synthetic = true;
    GET DIAGNOSTICS d_deals = ROW_COUNT;

    -- 4. Lead Members & Contacts (depend on Leads)
    -- Clean up junction tables for synthetic leads
    DELETE FROM lead_contacts WHERE lead_id IN (SELECT id FROM leads WHERE is_synthetic = true);
    DELETE FROM lead_members WHERE lead_id IN (SELECT id FROM leads WHERE is_synthetic = true);

    DELETE FROM leads WHERE is_synthetic = true;
    GET DIAGNOSTICS d_leads = ROW_COUNT;

    -- 5. Contacts (depend on Companies)
    -- Delete all synthetic contacts
    DELETE FROM contacts WHERE is_synthetic = true;
    GET DIAGNOSTICS d_contacts = ROW_COUNT;

    -- 6. Companies
    DELETE FROM companies WHERE is_synthetic = true;
    GET DIAGNOSTICS d_companies = ROW_COUNT;

    -- 7. Players
    DELETE FROM player_contacts WHERE player_id IN (SELECT id FROM players WHERE is_synthetic = true);
    DELETE FROM players WHERE is_synthetic = true;
    GET DIAGNOSTICS d_players = ROW_COUNT;

    -- 8. Profiles (Users)
    -- Only delete profiles explicitly marked synthetic.
    -- Note: Real deletion of Auth User happens in Edge Function, which cascades to Profile.
    -- This step is just to report count or clean orphans.
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

-- 3. Feature Flag
INSERT INTO system_settings (key, value, description, updated_at)
VALUES
    ('synthetic_data.enabled', 'false'::jsonb, 'Enable or disable synthetic data generator features', now())
ON CONFLICT (key) DO NOTHING;
