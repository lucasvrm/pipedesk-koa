-- 20251226_add_priority_weight_config_DOWN.sql
-- Rollback: Remove priority_weight columns and lead_priority_config setting
-- Date: 2025-12-26

-- ============================================================================
-- 1. REMOVE SYSTEM SETTING
-- ============================================================================

DELETE FROM public.system_settings
WHERE key = 'lead_priority_config';

-- ============================================================================
-- 2. REMOVE COLUMNS
-- ============================================================================

ALTER TABLE public.lead_statuses
  DROP COLUMN IF EXISTS priority_weight;

ALTER TABLE public.lead_origins
  DROP COLUMN IF EXISTS priority_weight;
