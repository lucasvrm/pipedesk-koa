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

-- Template for Companies
INSERT INTO structure_templates (name, entity_type, event_type, path_pattern, is_active)
VALUES (
    'Company Standard Folder Structure',
    'company',
    'on_create',
    'Companies/{{company_name}}',
    true
) ON CONFLICT DO NOTHING;

-- Company folder nodes
DO $$
DECLARE
    company_template_id UUID;
    company_root_id UUID;
    doc_gerais_id UUID;
BEGIN
    SELECT id INTO company_template_id 
    FROM structure_templates 
    WHERE entity_type = 'company' AND event_type = 'on_create'
    LIMIT 1;

    IF company_template_id IS NOT NULL THEN
        -- Check if nodes already exist for this template
        IF NOT EXISTS (SELECT 1 FROM drive_folder_nodes WHERE template_id = company_template_id) THEN
            -- Root folder (Company)
            INSERT INTO drive_folder_nodes (template_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, 'Company Root', '', 0, 'Root folder for company', false)
            RETURNING id INTO company_root_id;

            -- 01. Leads
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Leads', '01', 1, 'Leads da empresa', false);

            -- 02. Deals
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Deals', '02', 2, 'Deals da empresa', false);

            -- 03. Documentos Gerais
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Documentos Gerais', '03', 3, 'Documentos gerais da empresa', false)
            RETURNING id INTO doc_gerais_id;

            -- 03.01 Dossiê Sócios PF
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, doc_gerais_id, 'Dossiê Sócios PF', '03.01', 1, 'Documentos de sócios pessoa física', false);

            -- 03.02 Dossiê PJs
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, doc_gerais_id, 'Dossiê PJs', '03.02', 2, 'Documentos de pessoas jurídicas', false);

            -- 03.03 Modelos / Planilhas KOA
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, doc_gerais_id, 'Modelos / Planilhas KOA', '03.03', 3, 'Modelos e planilhas padrão KOA', false);

            -- 90. Compartilhamento Externo
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Compartilhamento Externo', '90', 90, 'Arquivos compartilhados externamente', false);

            -- 99. Arquivo / Encerrados
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (company_template_id, company_root_id, 'Arquivo / Encerrados', '99', 99, 'Documentos arquivados e processos encerrados', false);
        END IF;
    END IF;
END $$;

-- Template for Leads
INSERT INTO structure_templates (name, entity_type, event_type, path_pattern, is_active)
VALUES (
    'Lead Standard Folder Structure',
    'lead',
    'on_create',
    'Companies/{{company_name}}/01. Leads/Lead - {{lead_name}}',
    true
) ON CONFLICT DO NOTHING;

-- Lead folder nodes
DO $$
DECLARE
    lead_template_id UUID;
    lead_root_id UUID;
BEGIN
    SELECT id INTO lead_template_id 
    FROM structure_templates 
    WHERE entity_type = 'lead' AND event_type = 'on_create'
    LIMIT 1;

    IF lead_template_id IS NOT NULL THEN
        -- Check if nodes already exist for this template
        IF NOT EXISTS (SELECT 1 FROM drive_folder_nodes WHERE template_id = lead_template_id) THEN
            -- Root folder (Lead)
            INSERT INTO drive_folder_nodes (template_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, 'Lead Root', '', 0, 'Root folder for lead', false)
            RETURNING id INTO lead_root_id;

            -- 00. Administração do Lead
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Administração do Lead', '00', 0, 'Documentos administrativos do lead', false);

            -- 01. Originação & Materiais
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Originação & Materiais', '01', 1, 'Materiais de originação e prospecção', false);

            -- 02. Ativo / Terreno (Básico)
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Ativo / Terreno (Básico)', '02', 2, 'Informações básicas do ativo/terreno', false);

            -- 03. Empreendimento & Viabilidade (Preliminar)
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Empreendimento & Viabilidade (Preliminar)', '03', 3, 'Análise preliminar de viabilidade', false);

            -- 04. Partes & KYC (Básico)
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Partes & KYC (Básico)', '04', 4, 'KYC básico das partes envolvidas', false);

            -- 05. Decisão Interna
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (lead_template_id, lead_root_id, 'Decisão Interna', '05', 5, 'Documentos de decisão interna', false);
        END IF;
    END IF;
END $$;
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
    'Companies/{{company_name}}/02. Deals/Deal - {{deal_name}}',
    true
) ON CONFLICT DO NOTHING;

-- Deal folder nodes
DO $$
DECLARE
    deal_template_id UUID;
    deal_root_id UUID;
    ativo_terreno_id UUID;
    empreendimento_id UUID;
    comercial_id UUID;
    financeiro_id UUID;
    partes_kyc_id UUID;
    juridico_id UUID;
    operacao_id UUID;
BEGIN
    SELECT id INTO deal_template_id 
    FROM structure_templates 
    WHERE entity_type = 'deal' AND event_type = 'on_create'
    LIMIT 1;

    IF deal_template_id IS NOT NULL THEN
        -- Check if nodes already exist for this template
        IF NOT EXISTS (SELECT 1 FROM drive_folder_nodes WHERE template_id = deal_template_id) THEN
            -- Root folder (Deal)
            INSERT INTO drive_folder_nodes (template_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, 'Deal Root', '', 0, 'Root folder for deal', false)
            RETURNING id INTO deal_root_id;

            -- 00. Administração do Deal
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Administração do Deal', '00', 0, 'Documentos administrativos do deal', false);

            -- 01. Originação & Mandato
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Originação & Mandato', '01', 1, 'Documentos de originação e mandato', false);

            -- 02. Ativo / Terreno & Garantias
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Ativo / Terreno & Garantias', '02', 2, 'Documentos do ativo, terreno e garantias', false)
            RETURNING id INTO ativo_terreno_id;

            -- 02.01 Matrículas & RI
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, ativo_terreno_id, 'Matrículas & RI', '02.01', 1, 'Matrículas e registro de imóveis', false);

            -- 02.02 Escrituras / C&V Terreno
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, ativo_terreno_id, 'Escrituras / C&V Terreno', '02.02', 2, 'Escrituras e contratos de compra e venda do terreno', false);

            -- 02.03 Alvarás & Licenças
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, ativo_terreno_id, 'Alvarás & Licenças', '02.03', 3, 'Alvarás e licenças necessárias', false);

            -- 02.04 Colateral Adicional
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, ativo_terreno_id, 'Colateral Adicional', '02.04', 4, 'Garantias e colaterais adicionais', false);

            -- 02.05 Seguros & Apólices
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, ativo_terreno_id, 'Seguros & Apólices', '02.05', 5, 'Apólices de seguro', false);

            -- 03. Empreendimento & Projeto
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Empreendimento & Projeto', '03', 3, 'Documentos do empreendimento e projeto', false)
            RETURNING id INTO empreendimento_id;

            -- 03.01 Plantas & Projetos
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, empreendimento_id, 'Plantas & Projetos', '03.01', 1, 'Plantas arquitetônicas e projetos', false);

            -- 03.02 Memoriais & Quadros de Áreas
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, empreendimento_id, 'Memoriais & Quadros de Áreas', '03.02', 2, 'Memoriais descritivos e quadros de áreas', false);

            -- 03.03 Pesquisas de Mercado
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, empreendimento_id, 'Pesquisas de Mercado', '03.03', 3, 'Pesquisas e análises de mercado', false);

            -- 03.04 Books & Teasers
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, empreendimento_id, 'Books & Teasers', '03.04', 4, 'Materiais de apresentação (books e teasers)', false);

            -- 04. Comercial
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Comercial', '04', 4, 'Documentos comerciais', false)
            RETURNING id INTO comercial_id;

            -- 04.01 Tabelas de Vendas
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, comercial_id, 'Tabelas de Vendas', '04.01', 1, 'Tabelas e condições de venda', false);

            -- 04.02 Contratos C&V Clientes
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, comercial_id, 'Contratos C&V Clientes', '04.02', 2, 'Contratos de compra e venda com clientes', false);

            -- 04.03 Recebíveis & Borderôs
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, comercial_id, 'Recebíveis & Borderôs', '04.03', 3, 'Recebíveis e borderôs de vendas', false);

            -- 05. Financeiro & Modelagem
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Financeiro & Modelagem', '05', 5, 'Documentos financeiros e modelagem', false)
            RETURNING id INTO financeiro_id;

            -- 05.01 Viabilidades
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, financeiro_id, 'Viabilidades', '05.01', 1, 'Estudos de viabilidade financeira', false);

            -- 05.02 Fluxos de Caixa
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, financeiro_id, 'Fluxos de Caixa', '05.02', 2, 'Projeções de fluxo de caixa', false);

            -- 05.03 Cronogramas Físico-Financeiros
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, financeiro_id, 'Cronogramas Físico-Financeiros', '05.03', 3, 'Cronogramas físico-financeiros da obra', false);

            -- 05.04 Planilhas KOA & Modelos
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, financeiro_id, 'Planilhas KOA & Modelos', '05.04', 4, 'Planilhas e modelos padrão KOA', false);

            -- 06. Partes & KYC
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Partes & KYC', '06', 6, 'KYC das partes envolvidas', false)
            RETURNING id INTO partes_kyc_id;

            -- 06.01 Sócios PF
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, partes_kyc_id, 'Sócios PF', '06.01', 1, 'Documentos de sócios pessoa física', false);

            -- 06.02 PJs
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, partes_kyc_id, 'PJs', '06.02', 2, 'Documentos de pessoas jurídicas', false);

            -- 07. Jurídico & Estruturação
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Jurídico & Estruturação', '07', 7, 'Documentos jurídicos e estruturação', false)
            RETURNING id INTO juridico_id;

            -- 07.01 DD Jurídica
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, juridico_id, 'DD Jurídica', '07.01', 1, 'Due diligence jurídica', false);

            -- 07.02 Contratos Estruturais
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, juridico_id, 'Contratos Estruturais', '07.02', 2, 'Contratos estruturais do negócio', false);

            -- 08. Operação & Monitoring
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, deal_root_id, 'Operação & Monitoring', '08', 8, 'Monitoramento e operação', false)
            RETURNING id INTO operacao_id;

            -- 08.01 Relatórios Operacionais
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, operacao_id, 'Relatórios Operacionais', '08.01', 1, 'Relatórios de acompanhamento operacional', false);

            -- 08.02 Recebíveis / Cash Flow Realizado
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, operacao_id, 'Recebíveis / Cash Flow Realizado', '08.02', 2, 'Fluxo de caixa realizado e recebíveis', false);

            -- 08.03 Comunicação Recorrente
            INSERT INTO drive_folder_nodes (template_id, parent_node_id, folder_name, folder_prefix, display_order, description, is_on_demand)
            VALUES (deal_template_id, operacao_id, 'Comunicação Recorrente', '08.03', 3, 'Comunicações e atualizações recorrentes', false);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 4. Add common document type configurations
-- ============================================================================

-- Document types for Leads
INSERT INTO document_type_configs (label, folder_pattern, file_name_pattern, required_placeholders, is_active)
VALUES 
    ('Materiais de Originação', '{{lead_root}}/01. Originação & Materiais', 'Originacao_{{lead_name}}_{{date}}', '["lead_name", "date"]'::jsonb, true),
    ('Informações do Ativo', '{{lead_root}}/02. Ativo / Terreno (Básico)', 'Ativo_{{lead_name}}_{{date}}', '["lead_name", "date"]'::jsonb, true),
    ('Estudo de Viabilidade Preliminar', '{{lead_root}}/03. Empreendimento & Viabilidade (Preliminar)', 'Viabilidade_{{lead_name}}_{{date}}', '["lead_name", "date"]'::jsonb, true),
    ('Documentos KYC Básico', '{{lead_root}}/04. Partes & KYC (Básico)', 'KYC_{{lead_name}}', '["lead_name"]'::jsonb, true),
    ('Parecer Decisão Interna', '{{lead_root}}/05. Decisão Interna', 'Decisao_{{lead_name}}_{{date}}', '["lead_name", "date"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Document types for Deals
INSERT INTO document_type_configs (label, folder_pattern, file_name_pattern, min_stage, required_placeholders, is_active)
VALUES 
    ('Mandato', '{{deal_root}}/01. Originação & Mandato', 'Mandato_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Matrícula do Imóvel', '{{deal_root}}/02. Ativo / Terreno & Garantias/02.01 Matrículas & RI', 'Matricula_{{deal_name}}', 0, '["deal_name"]'::jsonb, true),
    ('Escritura', '{{deal_root}}/02. Ativo / Terreno & Garantias/02.02 Escrituras / C&V Terreno', 'Escritura_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Alvará de Construção', '{{deal_root}}/02. Ativo / Terreno & Garantias/02.03 Alvarás & Licenças', 'Alvara_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Apólice de Seguro', '{{deal_root}}/02. Ativo / Terreno & Garantias/02.05 Seguros & Apólices', 'Apolice_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Projeto Arquitetônico', '{{deal_root}}/03. Empreendimento & Projeto/03.01 Plantas & Projetos', 'Projeto_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Memorial Descritivo', '{{deal_root}}/03. Empreendimento & Projeto/03.02 Memoriais & Quadros de Áreas', 'Memorial_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Pesquisa de Mercado', '{{deal_root}}/03. Empreendimento & Projeto/03.03 Pesquisas de Mercado', 'Pesquisa_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Tabela de Vendas', '{{deal_root}}/04. Comercial/04.01 Tabelas de Vendas', 'Tabela_Vendas_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Contrato C&V Cliente', '{{deal_root}}/04. Comercial/04.02 Contratos C&V Clientes', 'CV_Cliente_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Estudo de Viabilidade', '{{deal_root}}/05. Financeiro & Modelagem/05.01 Viabilidades', 'Viabilidade_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Fluxo de Caixa', '{{deal_root}}/05. Financeiro & Modelagem/05.02 Fluxos de Caixa', 'FluxoCaixa_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Cronograma Físico-Financeiro', '{{deal_root}}/05. Financeiro & Modelagem/05.03 Cronogramas Físico-Financeiros', 'Cronograma_{{deal_name}}_{{date}}', 0, '["deal_name", "date"]'::jsonb, true),
    ('Documentos Sócio PF', '{{deal_root}}/06. Partes & KYC/06.01 Sócios PF', 'Socio_PF_{{deal_name}}_{{socio_name}}', 0, '["deal_name", "socio_name"]'::jsonb, true),
    ('Documentos PJ', '{{deal_root}}/06. Partes & KYC/06.02 PJs', 'PJ_{{deal_name}}_{{pj_name}}', 0, '["deal_name", "pj_name"]'::jsonb, true),
    ('Due Diligence Jurídica', '{{deal_root}}/07. Jurídico & Estruturação/07.01 DD Jurídica', 'DD_Juridica_{{deal_name}}_{{date}}', 1, '["deal_name", "date"]'::jsonb, true),
    ('Contrato Estrutural', '{{deal_root}}/07. Jurídico & Estruturação/07.02 Contratos Estruturais', 'Contrato_{{deal_name}}_{{date}}', 2, '["deal_name", "date"]'::jsonb, true),
    ('Relatório Operacional', '{{deal_root}}/08. Operação & Monitoring/08.01 Relatórios Operacionais', 'Relatorio_{{deal_name}}_{{date}}', 3, '["deal_name", "date"]'::jsonb, true),
    ('Fluxo de Caixa Realizado', '{{deal_root}}/08. Operação & Monitoring/08.02 Recebíveis / Cash Flow Realizado', 'CashFlow_Real_{{deal_name}}_{{date}}', 3, '["deal_name", "date"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Document types for Companies
INSERT INTO document_type_configs (label, folder_pattern, file_name_pattern, required_placeholders, is_active)
VALUES 
    ('Dossiê Sócio PF', '{{company_root}}/03. Documentos Gerais/03.01 Dossiê Sócios PF', 'Dossie_PF_{{company_name}}_{{socio_name}}', '["company_name", "socio_name"]'::jsonb, true),
    ('Dossiê PJ', '{{company_root}}/03. Documentos Gerais/03.02 Dossiê PJs', 'Dossie_PJ_{{company_name}}_{{pj_name}}', '["company_name", "pj_name"]'::jsonb, true),
    ('Modelo/Planilha KOA', '{{company_root}}/03. Documentos Gerais/03.03 Modelos / Planilhas KOA', 'Modelo_KOA_{{company_name}}_{{template_type}}', '["company_name", "template_type"]'::jsonb, true)
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
