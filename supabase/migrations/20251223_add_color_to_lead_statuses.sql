-- Migration: Add color column to lead_statuses table
-- Date: 2024-12-23
-- Description: Adds a color column to lead_statuses to support dynamic color configuration in the UI

-- Add color column to lead_statuses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lead_statuses' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE public.lead_statuses 
    ADD COLUMN color VARCHAR(7) DEFAULT '#6b7280';
    
    RAISE NOTICE 'Coluna "color" adicionada à tabela lead_statuses';
  ELSE
    RAISE NOTICE 'Coluna "color" já existe na tabela lead_statuses';
  END IF;
END $$;

-- Populate default colors for existing lead statuses
-- Using common status colors that match the UI patterns
UPDATE public.lead_statuses
SET color = CASE code
  WHEN 'new' THEN '#3b82f6'           -- blue-500
  WHEN 'contacted' THEN '#f59e0b'     -- amber-500
  WHEN 'qualified' THEN '#10b981'     -- emerald-500
  WHEN 'disqualified' THEN '#ef4444'  -- rose-500
  WHEN 'nurturing' THEN '#8b5cf6'     -- violet-500
  WHEN 'follow_up' THEN '#06b6d4'     -- cyan-500
  ELSE '#6b7280'                      -- gray-500 (default)
END
WHERE color IS NULL OR color = '#6b7280';

-- Ensure RLS is enabled on lead_statuses table
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "lead_statuses_select" ON public.lead_statuses;
DROP POLICY IF EXISTS "lead_statuses_insert" ON public.lead_statuses;
DROP POLICY IF EXISTS "lead_statuses_update" ON public.lead_statuses;
DROP POLICY IF EXISTS "lead_statuses_delete" ON public.lead_statuses;

-- Create RLS policies for lead_statuses
-- All authenticated users can view lead statuses
CREATE POLICY "lead_statuses_select" ON public.lead_statuses
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert new lead statuses (role_level >= 100)
CREATE POLICY "lead_statuses_insert" ON public.lead_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_level >= 100
    )
  );

-- Only admins can update lead statuses (role_level >= 100)
CREATE POLICY "lead_statuses_update" ON public.lead_statuses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_level >= 100
    )
  );

-- Only admins can delete lead statuses (role_level >= 100)
CREATE POLICY "lead_statuses_delete" ON public.lead_statuses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_level >= 100
    )
  );

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251223_add_color_to_lead_statuses completed successfully';
  RAISE NOTICE 'Column "color" exists: %', EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lead_statuses' 
    AND column_name = 'color'
  );
END $$;
