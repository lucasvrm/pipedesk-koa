-- Migration: Dashboard Templates Table
-- Description: Create dashboard_templates table to store role-based dashboard layouts
-- Date: 2025-12-19

-- Create dashboard_templates table
CREATE TABLE IF NOT EXISTS dashboard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT, -- NULL means global default
  config JSONB NOT NULL DEFAULT '{"topWidgets": [], "mainWidgets": []}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_role_template UNIQUE (role)
);

-- Add RLS policies
ALTER TABLE dashboard_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read templates
CREATE POLICY "Anyone can read dashboard templates"
  ON dashboard_templates
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert/update templates
CREATE POLICY "Only admins can manage dashboard templates"
  ON dashboard_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_role ON dashboard_templates(role);

-- Insert global default template (role = NULL)
-- This is the current DEFAULT_DASHBOARD_CONFIG from registry.tsx
INSERT INTO dashboard_templates (role, config)
VALUES (
  NULL,
  '{
    "topWidgets": [
      "notifications",
      "quick-tasks",
      "weighted-pipeline",
      "active-deals",
      "conversion-rate",
      "total-deals"
    ],
    "mainWidgets": [
      "weighted-forecast",
      "portfolio-matrix",
      "my-deals"
    ]
  }'::jsonb
)
ON CONFLICT (role) DO NOTHING;

-- Insert example admin template for testing
-- Admin sees system-focused widgets
INSERT INTO dashboard_templates (role, config)
VALUES (
  'admin',
  '{
    "topWidgets": [
      "notifications",
      "quick-tasks",
      "active-deals",
      "total-deals"
    ],
    "mainWidgets": [
      "team-workload",
      "sla-overview",
      "conversion-funnel",
      "my-deals"
    ]
  }'::jsonb
)
ON CONFLICT (role) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_dashboard_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dashboard_templates_updated_at
  BEFORE UPDATE ON dashboard_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_templates_updated_at();

-- Add comment to table
COMMENT ON TABLE dashboard_templates IS 'Stores role-based dashboard layout configurations. Role NULL represents the global default.';
COMMENT ON COLUMN dashboard_templates.role IS 'User role (admin, analyst, client, newbusiness) or NULL for global default';
COMMENT ON COLUMN dashboard_templates.config IS 'Dashboard configuration with topWidgets and mainWidgets arrays';
