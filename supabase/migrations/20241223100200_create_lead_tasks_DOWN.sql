-- Rollback: Drop lead_tasks table and related objects
-- Date: 2024-12-23

DROP TRIGGER IF EXISTS trigger_ensure_single_next_action ON lead_tasks;
DROP TRIGGER IF EXISTS trigger_auto_completed_at ON lead_tasks;
DROP FUNCTION IF EXISTS ensure_single_next_action();
DROP FUNCTION IF EXISTS auto_set_completed_at();
DROP POLICY IF EXISTS "lead_tasks_select_policy" ON lead_tasks;
DROP POLICY IF EXISTS "lead_tasks_staff_policy" ON lead_tasks;
DROP TABLE IF EXISTS lead_tasks;
