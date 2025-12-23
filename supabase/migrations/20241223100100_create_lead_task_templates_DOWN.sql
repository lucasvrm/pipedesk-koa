-- Rollback: Drop lead_task_templates table
DROP POLICY IF EXISTS "lead_task_templates_select_policy" ON lead_task_templates;
DROP POLICY IF EXISTS "lead_task_templates_admin_policy" ON lead_task_templates;
DROP TABLE IF EXISTS lead_task_templates;
