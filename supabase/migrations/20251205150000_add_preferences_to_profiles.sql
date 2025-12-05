-- Migration to add preferences column to profiles table
-- Created at: 2025-12-05

-- 1. Add preferences column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Insert default Dashboard Global Config into system_settings if missing
-- Note: system_settings does NOT have a created_at column based on schema inspection.
INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES (
    'dashboard_global_config',
    '{
        "availableWidgets": [
            "kpi-overview",
            "notifications",
            "quick-tasks",
            "portfolio-matrix",
            "weighted-forecast",
            "conversion-funnel",
            "team-workload",
            "sla-overview",
            "my-deals"
        ],
        "defaultConfig": {
            "topWidgets": ["notifications", "quick-tasks", "kpi-overview"],
            "mainWidgets": ["weighted-forecast", "portfolio-matrix", "my-deals"]
        }
    }'::jsonb,
    'Global Dashboard Configuration (Available Widgets)',
    NOW()
)
ON CONFLICT (key) DO NOTHING;
