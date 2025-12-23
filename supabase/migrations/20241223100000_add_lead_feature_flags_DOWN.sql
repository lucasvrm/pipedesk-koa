-- Rollback: Remove feature flags (cuidado: só execute se realmente necessário)
DELETE FROM system_settings 
WHERE key IN (
  'feature_lead_auto_priority',
  'feature_lead_auto_next_action', 
  'feature_lead_manual_priority',
  'feature_lead_task_next_action'
);
