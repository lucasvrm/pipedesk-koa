-- 20251226_add_priority_weight_config.sql
-- Add priority_weight columns to lead_statuses and lead_origins
-- Create lead_priority_config setting for configurable priority calculation
-- Date: 2025-12-26

-- ============================================================================
-- 1. ADD PRIORITY_WEIGHT COLUMNS
-- ============================================================================

-- Add priority_weight to lead_statuses (default 0)
ALTER TABLE public.lead_statuses
  ADD COLUMN IF NOT EXISTS priority_weight int4 NOT NULL DEFAULT 0;

-- Add priority_weight to lead_origins (default 0)
ALTER TABLE public.lead_origins
  ADD COLUMN IF NOT EXISTS priority_weight int4 NOT NULL DEFAULT 0;

-- ============================================================================
-- 2. SEED DEFAULT WEIGHTS (idempotent - only update if still 0)
-- ============================================================================

-- Update lead_statuses weights for known codes
UPDATE public.lead_statuses
SET priority_weight = CASE code
  WHEN 'qualified' THEN 15
  WHEN 'contacted' THEN 10
  WHEN 'new' THEN 5
  ELSE priority_weight
END
WHERE priority_weight = 0 AND code IN ('qualified', 'contacted', 'new');

-- Update lead_origins weights for known codes
UPDATE public.lead_origins
SET priority_weight = CASE code
  WHEN 'partner' THEN 15
  WHEN 'inbound' THEN 12
  WHEN 'referral' THEN 10
  WHEN 'outbound' THEN 8
  WHEN 'event' THEN 7
  ELSE priority_weight
END
WHERE priority_weight = 0 AND code IN ('partner', 'inbound', 'referral', 'outbound', 'event');

-- ============================================================================
-- 3. CREATE LEAD PRIORITY CONFIG SETTING (idempotent)
-- ============================================================================

INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES (
  'lead_priority_config',
  '{
    "thresholds": {
      "hot": 70,
      "warm": 40
    },
    "scoring": {
      "recencyMaxPoints": 40,
      "staleDays": 30,
      "upcomingMeetingPoints": 25,
      "minScore": 0,
      "maxScore": 100
    },
    "descriptions": {
      "hot": "High priority leads requiring immediate attention",
      "warm": "Medium priority leads with moderate engagement",
      "cold": "Low priority leads or inactive prospects"
    }
  }'::jsonb,
  'Configurable priority calculation for leads: thresholds (hot>=70, warm>=40), scoring weights, and priority level descriptions',
  now()
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.lead_statuses.priority_weight IS 'Weight used in priority score calculation (0 = no weight)';
COMMENT ON COLUMN public.lead_origins.priority_weight IS 'Weight used in priority score calculation (0 = no weight)';
