-- 20251208_google_drive_folder_hierarchy.sql
-- Fix Google Drive folder hierarchy and creation logic
-- Add support for leads, companies, deals, and contacts with proper folder templates

-- ============================================================================
-- 1. Extend google_drive_folders to support all entity types
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE google_drive_folders
    DROP CONSTRAINT IF EXISTS google_drive_folders_entity_type_check;

-- Add new constraint with all entity types
ALTER TABLE google_drive_folders
    ADD CONSTRAINT google_drive_folders_entity_type_check
    CHECK (entity_type IN ('deal', 'track', 'lead', 'company', 'contact'));

-- ============================================================================
-- 2. Create folder hierarchy nodes table for detailed structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS drive_folder_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES structure_templates(id) ON DELETE CASCADE,
    parent_node_id UUID REFERENCES drive_folder_nodes(id) ON DELETE CASCADE,
    folder_name TEXT NOT NULL,
    folder_prefix TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_on_demand BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drive_folder_nodes_template_id ON drive_folder_nodes(template_id);
CREATE INDEX IF NOT EXISTS idx_drive_folder_nodes_parent_id ON drive_folder_nodes(parent_node_id);

DROP TRIGGER IF EXISTS set_drive_folder_nodes_updated_at ON drive_folder_nodes;
CREATE TRIGGER set_drive_folder_nodes_updated_at
    BEFORE UPDATE ON drive_folder_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE drive_folder_nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drive_folder_nodes
CREATE POLICY "Users can view drive_folder_nodes" ON drive_folder_nodes
    FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage drive_folder_nodes" ON drive_folder_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'analyst')
        )
    );

-- ============================================================================
-- 3. Insert seed data for folder templates
-- ============================================================================

-- Template for Leads
INSERT INTO structure_templates (name, entity_type, event_type, path_pattern, is_active)
VALUES (
    'Lead Standard Folder Structure',
    'lead',
    'on_create',
    '{{root}}/010_Leads/{{lead_number}}_{{lead_name}}',
    true
) ON CONFLICT DO NOTHING;

-- Get the lead template ID for folder nodes
DO $$
DECLARE
    lead_template_id UUID;
    lead_root_id UUID;
BEGIN
    -- Get or create lead template
    SELECT id INTO lead_template_id 
    FROM structure_templates 
    WHERE entity_type = 'lead' AND event_type = 'on_create'
    LIMIT 1;

    IF lead_template_id IS NOT NULL THEN
        -- Check if nodes already exist for this template
        IF NOT EXISTS (SELECT 1 FROM drive_folder_nodes WHERE template_id = lead_template_id) THEN
            -- Root folder
            INSERT INTO drive_folder_nodes (template_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, 'Lead Root', '000', 0, 'Root folder for lead', false)
            RETURNING id INTO lead_root_id;

            -- Documents folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Documents', '001', 1, 'Lead documents and attachments', false);

            -- Communications folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Communications', '002', 2, 'Email threads and communication history', false);

            -- Notes folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Notes', '003', 3, 'Meeting notes and internal documentation', false);
        END IF;
    END IF;
END $$;

-- Template for Companies
INSERT INTO structure_templates (name, entity_type, event_type, path_pattern, is_active)
VALUES (
    'Company Standard Folder Structure',
    'company',
    'on_create',
    '{{root}}/001_Companies/{{company_type}}/{{company_number}}_{{company_name}}',
    true
) ON CONFLICT DO NOTHING;

-- Company folder nodes
DO $$
DECLARE
    company_template_id UUID;
    company_root_id UUID;
BEGIN
    SELECT id INTO company_template_id 
    FROM structure_templates 
    WHERE entity_type = 'company' AND event_type = 'on_create'
    LIMIT 1;

    IF company_template_id IS NOT NULL THEN
        -- Check if nodes already exist for this template
        IF NOT EXISTS (SELECT 1 FROM drive_folder_nodes WHERE template_id = company_template_id) THEN
            -- Root folder
            INSERT INTO drive_folder_nodes (template_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, 'Company Root', '000', 0, 'Root folder for company', false)
            RETURNING id INTO company_root_id;

            -- Contracts folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Contracts', '001', 1, 'Legal contracts and agreements', false);

            -- Documents folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Documents', '002', 2, 'Company registration and legal documents', false);

            -- Financial folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Financial', '003', 3, 'Financial statements and reports', false);

            -- Compliance folder (on-demand)
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Compliance', '004', 4, 'Regulatory and compliance documents', true);
        END IF;
    END IF;
END $$;

-- Template for Deals
INSERT INTO structure_templates (name, entity_type, event_type, path_pattern, is_active)
VALUES (
    'Deal Standard Folder Structure',
    'deal',
    'on_create',
    '{{root}}/020_Deals/{{deal_number}}_{{deal_name}}',
    true
) ON CONFLICT DO NOTHING;

-- Deal folder nodes
DO $$
DECLARE
    deal_template_id UUID;
    deal_root_id UUID;
BEGIN
    SELECT id INTO deal_template_id 
    FROM structure_templates 
    WHERE entity_type = 'deal' AND event_type = 'on_create'
    LIMIT 1;

    IF deal_template_id IS NOT NULL THEN
        -- Check if nodes already exist for this template
        IF NOT EXISTS (SELECT 1 FROM drive_folder_nodes WHERE template_id = deal_template_id) THEN
            -- Root folder
            INSERT INTO drive_folder_nodes (template_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, 'Deal Root', '000', 0, 'Root folder for deal', false)
            RETURNING id INTO deal_root_id;

            -- Proposals folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Proposals', '001', 1, 'Deal proposals and presentations', false);

            -- Documents folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Documents', '002', 2, 'Deal-related documents', false);

            -- Analysis folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Analysis', '003', 3, 'Deal analysis and due diligence', false);

            -- Stage-specific folders (on-demand, created when deal progresses)
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Negotiations', '004', 4, 'Negotiation documents and correspondence', true);

            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Closing', '005', 5, 'Deal closing documents', true);
        END IF;
    END IF;
END $$;

-- Template for Contacts
INSERT INTO structure_templates (name, entity_type, event_type, path_pattern, is_active)
VALUES (
    'Contact Standard Folder Structure',
    'contact',
    'on_create',
    '{{root}}/030_Contacts/{{contact_number}}_{{contact_name}}',
    true
) ON CONFLICT DO NOTHING;

-- Contact folder nodes
DO $$
DECLARE
    contact_template_id UUID;
    contact_root_id UUID;
BEGIN
    SELECT id INTO contact_template_id 
    FROM structure_templates 
    WHERE entity_type = 'contact' AND event_type = 'on_create'
    LIMIT 1;

    IF contact_template_id IS NOT NULL THEN
        -- Check if nodes already exist for this template
        IF NOT EXISTS (SELECT 1 FROM drive_folder_nodes WHERE template_id = contact_template_id) THEN
            -- Root folder
            INSERT INTO drive_folder_nodes (template_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (contact_template_id, 'Contact Root', '000', 0, 'Root folder for contact', false)
            RETURNING id INTO contact_root_id;

            -- Personal Documents folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (contact_template_id, contact_root_id, 'Personal Documents', '001', 1, 'Contact personal documents and ID', false);

            -- Communications folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (contact_template_id, contact_root_id, 'Communications', '002', 2, 'Communication history with contact', false);

            -- Agreements folder
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (contact_template_id, contact_root_id, 'Agreements', '003', 3, 'NDAs and other agreements', false);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 4. Add common document type configurations
-- ============================================================================

-- Document types for Deals
INSERT INTO document_type_configs (label, folder_pattern, file_name_pattern, min_stage, required_placeholders, is_active)
VALUES 
    ('Proposal Document', '{{deal_root}}/001_Proposals', 'Proposal_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Deal Analysis', '{{deal_root}}/003_Analysis', 'Analysis_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Contract', '{{deal_root}}/005_Closing', 'Contract_{{deal_name}}_{{date}}', 3, '["deal_name", "date"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Document types for Companies
INSERT INTO document_type_configs (label, folder_pattern, file_name_pattern, required_placeholders, is_active)
VALUES 
    ('Company Registration', '{{company_root}}/002_Documents', 'Registration_{{company_name}}', '["company_name"]'::jsonb, true),
    ('Company Contract', '{{company_root}}/001_Contracts', 'Contract_{{company_name}}_{{date}}', '["company_name", "date"]'::jsonb, true),
    ('Financial Statement', '{{company_root}}/003_Financial', 'FinStatement_{{company_name}}_{{period}}', '["company_name", "period"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Document types for Leads
INSERT INTO document_type_configs (label, folder_pattern, file_name_pattern, required_placeholders, is_active)
VALUES 
    ('Lead Qualification Doc', '{{lead_root}}/001_Documents', 'Qualification_{{lead_name}}_{{date}}', '["lead_name", "date"]'::jsonb, true),
    ('Meeting Notes', '{{lead_root}}/003_Notes', 'Notes_{{lead_name}}_{{date}}', '["lead_name", "date"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Document types for Contacts
INSERT INTO document_type_configs (label, folder_pattern, file_name_pattern, required_placeholders, is_active)
VALUES 
    ('Contact ID Document', '{{contact_root}}/001_Personal Documents', 'ID_{{contact_name}}', '["contact_name"]'::jsonb, true),
    ('NDA Agreement', '{{contact_root}}/003_Agreements', 'NDA_{{contact_name}}_{{date}}', '["contact_name", "date"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. Add helpful comments and documentation
-- ============================================================================

COMMENT ON TABLE drive_folder_nodes IS 'Hierarchical folder structure nodes for Google Drive integration templates';
COMMENT ON COLUMN drive_folder_nodes.is_on_demand IS 'If true, folder is created only when explicitly requested or when certain conditions are met';
COMMENT ON COLUMN drive_folder_nodes.folder_prefix IS 'Numeric prefix for folder ordering (e.g., 001, 002, 003)';
COMMENT ON COLUMN drive_folder_nodes.display_order IS 'Order in which folders should be displayed/created';

COMMENT ON TABLE structure_templates IS 'Templates defining folder creation rules for different entity types and lifecycle events';
COMMENT ON COLUMN structure_templates.path_pattern IS 'Path pattern with placeholders like {{root}}/{{entity_type}}/{{entity_name}}';
COMMENT ON COLUMN structure_templates.event_type IS 'Lifecycle event that triggers this template (on_create, on_stage_change, etc.)';

COMMENT ON TABLE document_type_configs IS 'Configuration for document types including folder location and naming patterns';
COMMENT ON COLUMN document_type_configs.required_placeholders IS 'JSON array of placeholder names that must be provided for document creation';
COMMENT ON COLUMN document_type_configs.min_stage IS 'Minimum deal stage required before this document type is available';
