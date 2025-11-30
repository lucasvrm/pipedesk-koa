-- 003_sla_fix.sql
-- Add stage_entered_at column to player_tracks for accurate SLA tracking

ALTER TABLE player_tracks ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT now();

-- Initialize stage_entered_at for existing records with updated_at as a best-effort fallback
UPDATE player_tracks
SET stage_entered_at = updated_at
WHERE stage_entered_at IS NULL;
