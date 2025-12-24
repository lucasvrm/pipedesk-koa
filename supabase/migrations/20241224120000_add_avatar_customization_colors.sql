-- Migration: Add avatar customization fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_bg_color VARCHAR(20) DEFAULT '#fee2e2',
ADD COLUMN IF NOT EXISTS avatar_text_color VARCHAR(20) DEFAULT '#991b1b',
ADD COLUMN IF NOT EXISTS avatar_border_color VARCHAR(20) DEFAULT NULL;
