-- Create dashboard_templates table
CREATE TABLE IF NOT EXISTS public.dashboard_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT UNIQUE, -- can be null for global default
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dashboard_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access for authenticated users"
ON public.dashboard_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow full access for admins"
ON public.dashboard_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add comment
COMMENT ON TABLE public.dashboard_templates IS 'Stores dashboard layout templates per user role';
