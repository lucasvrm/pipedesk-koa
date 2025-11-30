-- 006_fix_schema_and_permissions.sql

-- 1. Create deal_members table if not exists (Fixes 400 error on deals list)
CREATE TABLE IF NOT EXISTS deal_members (
  deal_id UUID NOT NULL REFERENCES master_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (deal_id, user_id)
);

ALTER TABLE deal_members ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone (filtered by deal visibility logically via join, but simple policy here)
CREATE POLICY "Deal members viewable by everyone" ON deal_members FOR SELECT USING (true);

-- Allow manage for authorized roles
CREATE POLICY "Deal members manageable by authorized" ON deal_members FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
);

-- 2. Seed Tracks Permissions (RBAC)
INSERT INTO permissions (code, description) VALUES
('tracks.view', 'View tracks details'),
('tracks.update', 'Update track details (stage, tags, fields)'),
('tracks.manage', 'Manage tracks (delete, reassign)'),
('tracks.create', 'Create new tracks')
ON CONFLICT (code) DO NOTHING;

-- 3. Bind Permissions to Roles
DO $$
DECLARE
  admin_role_id UUID;
  analyst_role_id UUID;
  perm_record RECORD;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO analyst_role_id FROM roles WHERE name = 'analyst';

  -- Bind all 'tracks.*' to Admin
  IF admin_role_id IS NOT NULL THEN
    FOR perm_record IN SELECT id FROM permissions WHERE code LIKE 'tracks.%' LOOP
      INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_role_id, perm_record.id) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Bind operational permissions to Analyst
  IF analyst_role_id IS NOT NULL THEN
    FOR perm_record IN SELECT id FROM permissions WHERE code IN ('tracks.view', 'tracks.update', 'tracks.create') LOOP
      INSERT INTO role_permissions (role_id, permission_id) VALUES (analyst_role_id, perm_record.id) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- 4. Migrate Auth Config to system_settings (Fixes 406 error)
-- We ensure default auth_config exists in system_settings if not present.
INSERT INTO system_settings (key, value, description)
VALUES ('auth_config', '{"enableMagicLinks": true, "restrictDomain": false}'::jsonb, 'Authentication settings')
ON CONFLICT (key) DO NOTHING;
