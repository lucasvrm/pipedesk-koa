-- 004_integrity_and_tags.sql

-- 1. Add active column to pipeline_stages
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Insert new permissions
INSERT INTO permissions (code, description) VALUES
('pipeline.manage', 'Access to Pipeline Settings'),
('pipeline.update', 'Update Pipeline Configuration'),
('tags.manage', 'Access to Tag Settings'),
('tags.update', 'Update Tags Configuration')
ON CONFLICT (code) DO NOTHING;

-- 3. Bind new permissions to admin role
DO $$
DECLARE
  admin_role_id UUID;
  perm_record RECORD;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

  IF admin_role_id IS NOT NULL THEN
    FOR perm_record IN SELECT id FROM permissions WHERE code IN ('pipeline.manage', 'pipeline.update', 'tags.manage', 'tags.update') LOOP
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (admin_role_id, perm_record.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- 4. Initialize tags_config in system_settings
INSERT INTO system_settings (key, value, description)
VALUES (
  'tags_config',
  '{ "global": true, "modules": { "deals": true, "tracks": true } }'::jsonb,
  'Configuration for Tags module'
)
ON CONFLICT (key) DO NOTHING;
