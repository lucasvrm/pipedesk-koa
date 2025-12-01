-- 014_clear_synthetic_data_rpc.sql
-- RPC to robustly clear synthetic data with proper dependency order

CREATE OR REPLACE FUNCTION clear_synthetic_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_deals INT;
  v_deleted_leads INT;
  v_deleted_companies INT;
  v_deleted_players INT;
  v_deleted_contacts INT;
  v_deleted_users INT;
BEGIN
  -- 1. Master Deals (and related tasks/tracks/members via CASCADE if set, else manual)
  -- Deleting master_deals should cascade to deal_members, player_tracks, tasks?
  -- Checking schema:
  -- player_tracks -> master_deals ON DELETE CASCADE
  -- tasks -> player_tracks ON DELETE CASCADE
  -- So deleting master_deals is enough for those.
  -- But we must delete manually if is_synthetic is flagged on them specifically?
  -- Usually we delete the root object.

  -- First delete explicitly marked synthetic tracks/tasks just in case they are orphans
  DELETE FROM tasks WHERE is_synthetic = true;
  DELETE FROM player_tracks WHERE is_synthetic = true;

  -- Delete synthetic deals
  WITH deleted AS (
    DELETE FROM master_deals WHERE is_synthetic = true RETURNING id
  ) SELECT count(*) INTO v_deleted_deals FROM deleted;

  -- 2. Leads
  -- Cascade usually handles lead_contacts/members
  -- But we clean dependencies first to be safe or if they are orphans
  DELETE FROM lead_contacts WHERE lead_id IN (SELECT id FROM leads WHERE is_synthetic = true);
  DELETE FROM lead_members WHERE lead_id IN (SELECT id FROM leads WHERE is_synthetic = true);

  WITH deleted AS (
    DELETE FROM leads WHERE is_synthetic = true RETURNING id
  ) SELECT count(*) INTO v_deleted_leads FROM deleted;

  -- 3. Players
  -- Clean associations
  DELETE FROM player_contacts WHERE player_id IN (SELECT id FROM players WHERE is_synthetic = true);

  WITH deleted AS (
    DELETE FROM players WHERE is_synthetic = true RETURNING id
  ) SELECT count(*) INTO v_deleted_players FROM deleted;

  -- 4. Companies & Contacts
  -- Delete synthetic contacts linked to synthetic companies first
  DELETE FROM contacts WHERE company_id IN (SELECT id FROM companies WHERE is_synthetic = true);

  -- Delete orphan synthetic contacts (explicitly marked)
  WITH deleted_contacts AS (
    DELETE FROM contacts WHERE is_synthetic = true RETURNING id
  ) SELECT count(*) INTO v_deleted_contacts FROM deleted_contacts;

  -- Delete synthetic companies
  WITH deleted_companies AS (
    DELETE FROM companies WHERE is_synthetic = true RETURNING id
  ) SELECT count(*) INTO v_deleted_companies FROM deleted_companies;

  -- 5. Users (Profiles)
  -- Note: Deleting from auth.users requires service role or edge function usually.
  -- This RPC runs as postgres, but managing auth.users from here is restricted.
  -- We can only delete from public.profiles if constraints allow, but auth.users will remain unless triggered.
  -- For synthetic data generator, usually the edge function handles user deletion.
  -- We will return the count of profiles marked synthetic so the UI knows,
  -- but actual deletion might need the Edge Function 'generate-synthetic-users' with action='delete'.
  -- However, we can delete the profile rows here.

  WITH deleted AS (
    DELETE FROM profiles WHERE is_synthetic = true RETURNING id
  ) SELECT count(*) INTO v_deleted_users FROM deleted;

  RETURN jsonb_build_object(
    'deals', v_deleted_deals,
    'leads', v_deleted_leads,
    'players', v_deleted_players,
    'companies', v_deleted_companies,
    'contacts', v_deleted_contacts,
    'users', v_deleted_users
  );
END;
$$;
