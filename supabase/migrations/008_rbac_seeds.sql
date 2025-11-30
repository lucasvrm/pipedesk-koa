-- 008_rbac_seeds.sql
-- Seeds new permissions for Contacts, Companies, and Leads

-- 1. Insert new permissions
INSERT INTO permissions (code, description) VALUES
  -- Contacts
  ('contacts.view', 'View contacts list and details'),
  ('contacts.create', 'Create new contacts'),
  ('contacts.update', 'Edit existing contacts'),
  ('contacts.delete', 'Delete contacts'),

  -- Companies
  ('companies.view', 'View companies list and details'),
  ('companies.create', 'Create new companies'),
  ('companies.update', 'Edit existing companies'),
  ('companies.delete', 'Delete companies'),

  -- Leads
  ('leads.view', 'View leads list and details'),
  ('leads.create', 'Create new leads'),
  ('leads.update', 'Edit lead details'),
  ('leads.qualify', 'Qualify leads (convert to client)'),
  ('leads.delete', 'Delete leads'),
  ('leads.manage', 'Manage lead settings (admin)')
ON CONFLICT (code) DO NOTHING;

-- 2. Bind permissions to Roles

DO $$
DECLARE
  admin_role_id UUID;
  analyst_role_id UUID;
  newbusiness_role_id UUID;
  perm_record RECORD;
BEGIN
  -- Get Role IDs
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO analyst_role_id FROM roles WHERE name = 'analyst';
  SELECT id INTO newbusiness_role_id FROM roles WHERE name = 'newbusiness';

  -- A. ADMIN: Gets everything
  FOR perm_record IN SELECT id FROM permissions WHERE code LIKE 'contacts.%' OR code LIKE 'companies.%' OR code LIKE 'leads.%' LOOP
    INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_role_id, perm_record.id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- B. ANALYST: View/Create/Update (No Delete usually, but requirement says "Bind to Admin/Analyst")
  -- Let's give full CRUD to Analyst for now based on "padrão atual" (Analyst can usually edit/manage deals)
  FOR perm_record IN SELECT id FROM permissions WHERE code LIKE 'contacts.%' OR code LIKE 'companies.%' OR code LIKE 'leads.%' LOOP
    INSERT INTO role_permissions (role_id, permission_id) VALUES (analyst_role_id, perm_record.id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- C. NEW BUSINESS: View/Create/Update/Qualify (Maybe no delete?)
  -- For leads, they definitely need qualify.
  FOR perm_record IN SELECT id FROM permissions WHERE code IN (
    'contacts.view', 'contacts.create', 'contacts.update',
    'companies.view', 'companies.create', 'companies.update',
    'leads.view', 'leads.create', 'leads.update', 'leads.qualify'
  ) LOOP
    INSERT INTO role_permissions (role_id, permission_id) VALUES (newbusiness_role_id, perm_record.id) ON CONFLICT DO NOTHING;
  END LOOP;

END $$;
