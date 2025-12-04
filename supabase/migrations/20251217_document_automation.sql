-- 20251217_document_automation.sql
-- Add configuration tables for structure templates and document type settings

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum to identify lifecycle events
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_event_type') THEN
        CREATE TYPE template_event_type AS ENUM ('on_create', 'on_stage_change', 'on_convert', 'on_add_party');
    END IF;
END $$;

-- Templates that describe folder/doc creation rules for entity events
CREATE TABLE IF NOT EXISTS structure_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    event_type template_event_type NOT NULL,
    path_pattern TEXT NOT NULL,
    documents_to_create JSONB DEFAULT '[]'::jsonb,
    conditions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE structure_templates
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

DROP TRIGGER IF EXISTS set_structure_templates_updated_at ON structure_templates;
CREATE TRIGGER set_structure_templates_updated_at
    BEFORE UPDATE ON structure_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Document type configuration to resolve folders and file naming
CREATE TABLE IF NOT EXISTS document_type_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    folder_pattern TEXT NOT NULL,
    template_file TEXT,
    file_name_pattern TEXT,
    min_stage INTEGER,
    required_stage INTEGER,
    cardinality TEXT DEFAULT 'single',
    tags TEXT[] DEFAULT '{}',
    required_placeholders JSONB DEFAULT '[]'::jsonb,
    optional_placeholders JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE document_type_configs
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

DROP TRIGGER IF EXISTS set_document_type_configs_updated_at ON document_type_configs;
CREATE TRIGGER set_document_type_configs_updated_at
    BEFORE UPDATE ON document_type_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
