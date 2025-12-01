-- 012_add_synthetic_flag.sql
-- Adds is_synthetic flag to core tables to support Synthetic Data Generator cleanup

DO $$
BEGIN
    -- Add is_synthetic to profiles if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_synthetic') THEN
        ALTER TABLE profiles ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;

    -- Add is_synthetic to companies if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'is_synthetic') THEN
        ALTER TABLE companies ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;

    -- Add is_synthetic to contacts if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'is_synthetic') THEN
        ALTER TABLE contacts ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;

    -- Add is_synthetic to leads if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'is_synthetic') THEN
        ALTER TABLE leads ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;

    -- Add is_synthetic to master_deals if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_deals' AND column_name = 'is_synthetic') THEN
        ALTER TABLE master_deals ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;

    -- Add is_synthetic to player_tracks if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_tracks' AND column_name = 'is_synthetic') THEN
        ALTER TABLE player_tracks ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;

    -- Add is_synthetic to tasks if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_synthetic') THEN
        ALTER TABLE tasks ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;

    -- Add is_synthetic to players if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'is_synthetic') THEN
        ALTER TABLE players ADD COLUMN is_synthetic BOOLEAN DEFAULT false;
    END IF;

END $$;
