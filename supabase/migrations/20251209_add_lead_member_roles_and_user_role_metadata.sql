-- 20251209_add_lead_member_roles_and_user_role_metadata.sql
-- Creates reference tables for lead member roles and user role metadata
-- to support dynamic settings instead of hardcoded values

-- Ensure uuid generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. lead_member_roles
-- Defines available roles for lead team members (owner, collaborator, watcher)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_member_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,  -- ex: 'owner', 'collaborator', 'watcher'
  label       text NOT NULL,         -- ex: 'Owner', 'Collaborator', 'Watcher'
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed default lead member roles
INSERT INTO public.lead_member_roles (code, label, description, sort_order)
VALUES 
  ('owner', 'Owner', 'Lead owner with full permissions', 1),
  ('collaborator', 'Collaborator', 'Team member who can collaborate on the lead', 2),
  ('watcher', 'Watcher', 'Observer who receives notifications but cannot edit', 3)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. user_role_metadata
-- Defines metadata for user roles (admin, analyst, client, newbusiness)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_role_metadata (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,  -- ex: 'admin', 'analyst', 'client', 'newbusiness'
  label       text NOT NULL,         -- ex: 'Administrator', 'Analyst', 'Client', 'New Business'
  description text,
  permissions jsonb DEFAULT '[]'::jsonb, -- Array of permission codes
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed default user roles
INSERT INTO public.user_role_metadata (code, label, description, permissions, sort_order)
VALUES 
  ('admin', 'Administrator', 'Full system access including user management, settings, and data export', '["manage_users", "manage_settings", "manage_integrations", "export_data", "create_deals", "edit_deals", "delete_deals", "view_analytics"]'::jsonb, 1),
  ('analyst', 'Analyst', 'Can create and edit deals, view analytics, and manage tasks', '["create_deals", "edit_deals", "view_analytics", "manage_tasks", "view_real_names"]'::jsonb, 2),
  ('newbusiness', 'New Business', 'View-only access with analytics and real player names', '["view_analytics", "view_real_names"]'::jsonb, 3),
  ('client', 'Client', 'Limited access with anonymized player names', '["view_deals"]'::jsonb, 4)
ON CONFLICT (code) DO NOTHING;

-- Add updated_at trigger for user_role_metadata
DROP TRIGGER IF EXISTS set_user_role_metadata_updated_at ON user_role_metadata;
CREATE TRIGGER set_user_role_metadata_updated_at
  BEFORE UPDATE ON user_role_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE lead_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_metadata ENABLE ROW LEVEL SECURITY;

-- Everyone can view these reference tables
CREATE POLICY "lead_member_roles readable by all" ON lead_member_roles FOR SELECT USING (true);
CREATE POLICY "user_role_metadata readable by all" ON user_role_metadata FOR SELECT USING (true);

-- Only admins can manage these tables
CREATE POLICY "Admins manage lead_member_roles" ON lead_member_roles
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins manage user_role_metadata" ON user_role_metadata
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
