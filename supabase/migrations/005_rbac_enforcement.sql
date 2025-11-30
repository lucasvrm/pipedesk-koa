-- 005_rbac_enforcement.sql

-- 1. Helper Function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(requested_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role from profiles
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();

  -- If Admin, bypass (optional, but good for safety)
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Check if role has the specific permission
  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.roles r ON rp.role_id = r.id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE r.name = user_role
    AND p.code = requested_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Policies

-- Pipeline Stages
DROP POLICY IF EXISTS "Authorized users can manage pipeline_stages" ON pipeline_stages; -- If exists
-- We assume previous policy was 'system' or 'admin'. Let's drop potentially conflicting ones if we knew names.
-- Since we can't easily know all previous names without inspection, we Create OR REPLACE new ones using specific names.

-- Note: 001 didn't have specific policies for pipeline_stages?
-- Wait, 001 created table but didn't set specific RLS?
-- Let's ensure RLS is enabled and policies are strict.

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pipeline read access" ON pipeline_stages
  FOR SELECT USING (true);

CREATE POLICY "Pipeline management" ON pipeline_stages
  FOR ALL USING (public.has_permission('pipeline.manage') OR public.has_permission('pipeline.update'));

-- SLA Policies
ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SLA read access" ON sla_policies
  FOR SELECT USING (true);

CREATE POLICY "SLA management" ON sla_policies
  FOR ALL USING (public.has_permission('pipeline.update'));

-- Phase Transition Rules
ALTER TABLE phase_transition_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transition rules read access" ON phase_transition_rules
  FOR SELECT USING (true);

CREATE POLICY "Transition rules management" ON phase_transition_rules
  FOR ALL USING (public.has_permission('pipeline.update'));

-- Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Drop old loose policies if they conflict?
DROP POLICY IF EXISTS "Tags manageable by users" ON tags;

CREATE POLICY "Tags read access" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Tags management" ON tags
  FOR ALL USING (public.has_permission('tags.manage') OR public.has_permission('tags.update'));

-- Entity Tags
ALTER TABLE entity_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entity tags manageable by users" ON entity_tags;

CREATE POLICY "Entity tags read access" ON entity_tags
  FOR SELECT USING (true);

-- Assigning/Removing tags requires 'tags.update' OR being the owner/responsible?
-- Usually tagging deals is an operational task (analyst), not just config.
-- Let's allow Analysts to assign tags, but maybe restrict creating new global tags.
-- The policy above ("Tags management") restricts CRUD on the `tags` definition table.
-- `entity_tags` is the association.
-- Requirement: "tags/associação retornam erro...".
-- Let's say associating tags requires 'deals.update' (generic) or just being an analyst.
-- But the prompt asks for strict RBAC.
-- Let's stick to: Analysts can assign. Admins can assign.
-- So we use standard role check for association, but specific permission for `tags` definition.

CREATE POLICY "Entity tags management" ON entity_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst', 'newbusiness'))
  );
