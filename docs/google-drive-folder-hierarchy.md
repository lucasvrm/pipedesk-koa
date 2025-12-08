# Google Drive Folder Hierarchy System - KOA Real Estate Structure

## Overview

This document describes the Google Drive folder hierarchy and creation system implemented for PipeDesk KOA. The system automatically creates standardized folder structures for companies, leads, and deals using configurable templates stored in the database. The structure follows Brazilian real estate investment fund (FII) best practices.

## Database Schema

### Core Tables

#### `google_drive_folders`
Tracks the Google Drive folder associations for entities.

```sql
CREATE TABLE google_drive_folders (
  id UUID PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'track', 'lead', 'company', 'contact')),
  folder_id TEXT NOT NULL,
  folder_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Supported Entity Types:**
- `company` - Company/client folders (top-level organization)
- `lead` - Lead folders (potential deals)
- `deal` - Deal/opportunity folders (active deals)
- `track` - Track folders
- `contact` - Contact folders

#### `structure_templates`
Defines folder creation rules for different entity types and lifecycle events.

```sql
CREATE TABLE structure_templates (
    id UUID PRIMARY KEY,
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
```

**Fields:**
- `name` - Human-readable template name
- `entity_type` - Type of entity this template applies to
- `event_type` - Lifecycle event that triggers this template (`on_create`, `on_stage_change`, `on_convert`, `on_add_party`)
- `path_pattern` - Path pattern with placeholders (e.g., `{{root}}/010_Leads/{{lead_number}}_{{lead_name}}`)
- `is_active` - Whether this template is currently active

#### `drive_folder_nodes`
Hierarchical folder structure nodes for templates.

```sql
CREATE TABLE drive_folder_nodes (
    id UUID PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES structure_templates(id),
    parent_node_id UUID REFERENCES drive_folder_nodes(id),
    folder_name TEXT NOT NULL,
    folder_prefix TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_on_demand BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Fields:**
- `template_id` - Reference to the parent structure template
- `parent_node_id` - Reference to parent folder node (NULL for root)
- `folder_name` - Name of the folder
- `folder_prefix` - Numeric prefix for ordering (e.g., '001', '002')
- `display_order` - Order in which folders should be displayed/created
- `is_on_demand` - If true, folder is created only when explicitly requested
- `description` - Human-readable description of folder purpose

#### `document_type_configs`
Configuration for document types including folder location and naming patterns.

```sql
CREATE TABLE document_type_configs (
    id UUID PRIMARY KEY,
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
```

## Default Folder Templates

### Companies (Top-Level Organization)

**Path Pattern:** `Companies/{{company_name}}`

**Folder Structure:**
```
[Nome da Empresa]/
├── 01. Leads/                              # Leads da empresa
├── 02. Deals/                              # Deals da empresa
├── 03. Documentos Gerais/                  # Documentos gerais da empresa
│   ├── 03.01 Dossiê Sócios PF/            # Documentos de sócios pessoa física
│   ├── 03.02 Dossiê PJs/                  # Documentos de pessoas jurídicas
│   └── 03.03 Modelos / Planilhas KOA/     # Modelos e planilhas padrão KOA
├── 90. Compartilhamento Externo/           # Arquivos compartilhados externamente
└── 99. Arquivo / Encerrados/              # Documentos arquivados e processos encerrados
```

### Leads (Potential Deals)

**Path Pattern:** `Companies/{{company_name}}/01. Leads/Lead - {{lead_name}}`

**Folder Structure:**
```
Lead - [Nome do Lead]/
├── 00. Administração do Lead/                      # Documentos administrativos do lead
├── 01. Originação & Materiais/                     # Materiais de originação e prospecção
├── 02. Ativo / Terreno (Básico)/                   # Informações básicas do ativo/terreno
├── 03. Empreendimento & Viabilidade (Preliminar)/  # Análise preliminar de viabilidade
├── 04. Partes & KYC (Básico)/                      # KYC básico das partes envolvidas
└── 05. Decisão Interna/                            # Documentos de decisão interna
```

### Deals (Active Investments)

**Path Pattern:** `Companies/{{company_name}}/02. Deals/Deal - {{deal_name}}`

**Folder Structure:**
```
Deal - [Nome do Deal]/
├── 00. Administração do Deal/                      # Documentos administrativos do deal
├── 01. Originação & Mandato/                       # Documentos de originação e mandato
├── 02. Ativo / Terreno & Garantias/                # Documentos do ativo, terreno e garantias
│   ├── 02.01 Matrículas & RI/                     # Matrículas e registro de imóveis
│   ├── 02.02 Escrituras / C&V Terreno/            # Escrituras e contratos de compra e venda
│   ├── 02.03 Alvarás & Licenças/                  # Alvarás e licenças necessárias
│   ├── 02.04 Colateral Adicional/                 # Garantias e colaterais adicionais
│   └── 02.05 Seguros & Apólices/                  # Apólices de seguro
├── 03. Empreendimento & Projeto/                   # Documentos do empreendimento e projeto
│   ├── 03.01 Plantas & Projetos/                  # Plantas arquitetônicas e projetos
│   ├── 03.02 Memoriais & Quadros de Áreas/        # Memoriais descritivos e quadros de áreas
│   ├── 03.03 Pesquisas de Mercado/                # Pesquisas e análises de mercado
│   └── 03.04 Books & Teasers/                     # Materiais de apresentação
├── 04. Comercial/                                  # Documentos comerciais
│   ├── 04.01 Tabelas de Vendas/                   # Tabelas e condições de venda
│   ├── 04.02 Contratos C&V Clientes/              # Contratos com clientes
│   └── 04.03 Recebíveis & Borderôs/               # Recebíveis e borderôs de vendas
├── 05. Financeiro & Modelagem/                     # Documentos financeiros e modelagem
│   ├── 05.01 Viabilidades/                        # Estudos de viabilidade financeira
│   ├── 05.02 Fluxos de Caixa/                     # Projeções de fluxo de caixa
│   ├── 05.03 Cronogramas Físico-Financeiros/      # Cronogramas da obra
│   └── 05.04 Planilhas KOA & Modelos/             # Planilhas padrão KOA
├── 06. Partes & KYC/                               # KYC das partes envolvidas
│   ├── 06.01 Sócios PF/                           # Documentos de sócios pessoa física
│   └── 06.02 PJs/                                 # Documentos de pessoas jurídicas
├── 07. Jurídico & Estruturação/                    # Documentos jurídicos e estruturação
│   ├── 07.01 DD Jurídica/                         # Due diligence jurídica
│   └── 07.02 Contratos Estruturais/               # Contratos estruturais do negócio
└── 08. Operação & Monitoring/                      # Monitoramento e operação
    ├── 08.01 Relatórios Operacionais/             # Relatórios de acompanhamento
    ├── 08.02 Recebíveis / Cash Flow Realizado/    # Fluxo de caixa realizado
    └── 08.03 Comunicação Recorrente/              # Comunicações e atualizações
```

## Document Type Configurations

### Leads

Document types organized by folder within the lead structure:

| Document Type | Folder Location | File Pattern | Required Fields |
|--------------|----------------|--------------|-----------------|
| Materiais de Originação | 01. Originação & Materiais | `Originacao_{{lead_name}}_{{date}}` | lead_name, date |
| Informações do Ativo | 02. Ativo / Terreno (Básico) | `Ativo_{{lead_name}}_{{date}}` | lead_name, date |
| Estudo de Viabilidade Preliminar | 03. Empreendimento & Viabilidade (Preliminar) | `Viabilidade_{{lead_name}}_{{date}}` | lead_name, date |
| Documentos KYC Básico | 04. Partes & KYC (Básico) | `KYC_{{lead_name}}` | lead_name |
| Parecer Decisão Interna | 05. Decisão Interna | `Decisao_{{lead_name}}_{{date}}` | lead_name, date |

### Deals

Comprehensive document types covering the complete deal lifecycle:

| Document Type | Folder Location | File Pattern | Min Stage | Required Fields |
|--------------|----------------|--------------|-----------|-----------------|
| Mandato | 01. Originação & Mandato | `Mandato_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Matrícula do Imóvel | 02.01 Matrículas & RI | `Matricula_{{deal_name}}` | 0 | deal_name |
| Escritura | 02.02 Escrituras / C&V Terreno | `Escritura_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Alvará de Construção | 02.03 Alvarás & Licenças | `Alvara_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Apólice de Seguro | 02.05 Seguros & Apólices | `Apolice_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Projeto Arquitetônico | 03.01 Plantas & Projetos | `Projeto_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Memorial Descritivo | 03.02 Memoriais & Quadros de Áreas | `Memorial_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Pesquisa de Mercado | 03.03 Pesquisas de Mercado | `Pesquisa_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Tabela de Vendas | 04.01 Tabelas de Vendas | `Tabela_Vendas_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Contrato C&V Cliente | 04.02 Contratos C&V Clientes | `CV_Cliente_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Estudo de Viabilidade | 05.01 Viabilidades | `Viabilidade_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Fluxo de Caixa | 05.02 Fluxos de Caixa | `FluxoCaixa_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Cronograma Físico-Financeiro | 05.03 Cronogramas Físico-Financeiros | `Cronograma_{{deal_name}}_{{date}}` | 0 | deal_name, date |
| Documentos Sócio PF | 06.01 Sócios PF | `Socio_PF_{{deal_name}}_{{socio_name}}` | 0 | deal_name, socio_name |
| Documentos PJ | 06.02 PJs | `PJ_{{deal_name}}_{{pj_name}}` | 0 | deal_name, pj_name |
| Due Diligence Jurídica | 07.01 DD Jurídica | `DD_Juridica_{{deal_name}}_{{date}}` | 1 | deal_name, date |
| Contrato Estrutural | 07.02 Contratos Estruturais | `Contrato_{{deal_name}}_{{date}}` | 2 | deal_name, date |
| Relatório Operacional | 08.01 Relatórios Operacionais | `Relatorio_{{deal_name}}_{{date}}` | 3 | deal_name, date |
| Fluxo de Caixa Realizado | 08.02 Recebíveis / Cash Flow Realizado | `CashFlow_Real_{{deal_name}}_{{date}}` | 3 | deal_name, date |

### Companies

Company-level document types:

| Document Type | Folder Location | File Pattern | Required Fields |
|--------------|----------------|--------------|-----------------|
| Dossiê Sócio PF | 03.01 Dossiê Sócios PF | `Dossie_PF_{{company_name}}_{{socio_name}}` | company_name, socio_name |
| Dossiê PJ | 03.02 Dossiê PJs | `Dossie_PJ_{{company_name}}_{{pj_name}}` | company_name, pj_name |
| Modelo/Planilha KOA | 03.03 Modelos / Planilhas KOA | `Modelo_KOA_{{company_name}}_{{template_type}}` | company_name, template_type |

## Naming Conventions

### Folder Prefixes

The KOA structure uses a two-digit numeric prefix system for clear organization and ordering:

- **00-09**: Administrative and core documents
- **01-09**: Main operational folders (Leads, Deals, Documents)
- **90-99**: Special purposes (External Sharing, Archive)

**Sub-folder numbering** follows the pattern `XX.YY` where:
- `XX` is the parent folder number
- `YY` is the sequential subfolder number

**Examples:**
- `02. Ativo / Terreno & Garantias` (main folder)
  - `02.01 Matrículas & RI` (subfolder 1)
  - `02.02 Escrituras / C&V Terreno` (subfolder 2)
  - `02.03 Alvarás & Licenças` (subfolder 3)

### Placeholder Variables

Common placeholders used in path patterns and file names:

**Company Level:**
- `{{company_name}}` - Name of the company/client
- `{{company_type}}` - Type classification (optional)

**Lead Level:**
- `{{lead_name}}` - Name of the lead
- `{{lead_number}}` - Sequential identifier (optional)

**Deal Level:**
- `{{deal_name}}` - Name of the deal
- `{{deal_number}}` - Sequential identifier (optional)
- `{{stage}}` - Current deal stage

**Person/Entity:**
- `{{socio_name}}` - Name of partner (sócio pessoa física)
- `{{pj_name}}` - Name of legal entity (pessoa jurídica)
- `{{contact_name}}` - Name of contact

**Temporal:**
- `{{date}}` - Current date (ISO format YYYY-MM-DD)
- `{{period}}` - Time period (e.g., 2024-Q1, Jan-2024)

**Other:**
- `{{template_type}}` - Type of template or model

## On-Demand Folders

The current KOA structure creates all folders upfront for consistency and ease of use. However, the system supports marking folders as "on-demand" (`is_on_demand = true`) for future expansion, meaning they would only be created when:
- Explicitly requested by a user
- Triggered by a specific lifecycle event
- Required by business logic (e.g., when a deal reaches a certain stage)

**Potential Future On-Demand Folders:**
- Additional sub-folders within deal stages
- Client-specific customizations
- Archive folders for completed phases

## Frontend Integration

### Service Layer

The frontend uses the `driveService` to interact with the Drive API:

```typescript
import { createFolder, getDriveItems, uploadFile } from '@/services/driveService';

// Create a folder for a deal
await createFolder('deal', 'deal-123', { 
  name: 'Custom Folder',
  parentId: 'parent-folder-id' 
});

// Get drive items for a lead
const { items, total } = await getDriveItems('lead', 'lead-456', {
  page: 1,
  limit: 50
});

// Upload a file to a company folder
const file = new File(['content'], 'document.pdf');
await uploadFile('company', 'company-789', file, {
  parentId: 'folder-id'
});
```

### Supported Entity Types

```typescript
export type EntityType = 'lead' | 'deal' | 'company' | 'contact';
```

**Note:** While `contact` is supported in the type definition for potential future use, the current KOA structure focuses on `company`, `lead`, and `deal` entities.

## Backend API Requirements

The backend Drive API (FastAPI/pd-google) should implement these endpoints:

### Folder Operations
- `POST /api/drive/{entity_type}/{entity_id}/folder` - Create folder
- `DELETE /api/drive/{entity_type}/{entity_id}/folders/{folder_id}` - Delete folder
- `POST /api/drive/{entity_type}/{entity_id}/repair` - Repair folder structure

### File Operations
- `GET /api/drive/items?entityType={type}&entityId={id}` - List items
- `POST /api/drive/{entity_type}/{entity_id}/upload` - Upload file
- `DELETE /api/drive/{entity_type}/{entity_id}/files/{file_id}` - Delete file

### Name Sync
- `POST /api/drive/sync-name` - Sync entity name with Drive folder

## Migration and Deployment

The folder hierarchy system is deployed via SQL migration:
```
supabase/migrations/20251218_google_drive_folder_hierarchy.sql
```

**This migration:**
1. Extends `google_drive_folders` to support lead, company, and contact entity types
2. Creates `drive_folder_nodes` table for hierarchical structure
3. Inserts comprehensive KOA folder templates:
   - **Companies**: 5 main folders with 3 subfolders in Documentos Gerais
   - **Leads**: 6 folders covering the complete lead qualification process
   - **Deals**: 9 main folders with 21 subfolders covering full deal lifecycle
4. Adds 27 document type configurations for Brazilian real estate documents
5. Sets up RLS policies for security

**Important:** This migration must run AFTER `20251217_document_automation.sql` which creates the required `structure_templates` and `document_type_configs` tables.

**To apply the migration:**
```bash
# Using Supabase CLI
supabase db push

# Or via Supabase dashboard
# Upload the migration file in the SQL editor
```

## Security

### Row Level Security (RLS)

All Drive-related tables have RLS enabled:

```sql
-- View access for all authenticated users
CREATE POLICY "Users can view drive_folder_nodes" ON drive_folder_nodes
    FOR SELECT USING (true);

-- Manage access only for admin and analyst roles
CREATE POLICY "Authorized users can manage drive_folder_nodes" ON drive_folder_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'analyst')
        )
    );
```

## Future Enhancements

1. **Dynamic Template Creation** - Allow users to create custom templates via UI
2. **Template Versioning** - Support multiple versions of templates
3. **Conditional Folders** - Create folders based on entity properties
4. **Auto-archiving** - Automatically archive old folders based on entity status
5. **Folder Inheritance** - Support template inheritance for specialized entity types
6. **Permissions Management** - Fine-grained folder permissions based on user roles
7. **Audit Trail** - Track all folder creation/modification operations

## Troubleshooting

### Folders Not Being Created

1. **Check Backend API Connection**
   - Verify `VITE_DRIVE_API_URL` environment variable is set
   - Ensure backend API is running and accessible

2. **Check Database Configuration**
   - Verify migration has been applied
   - Check that templates exist in `structure_templates` table
   - Verify entity type is supported in `google_drive_folders` constraint

3. **Check User Permissions**
   - Ensure user has valid authentication token
   - Verify user role has necessary permissions
   - Check RLS policies are not blocking access

### Template Not Found

```sql
-- Query to check available templates
SELECT * FROM structure_templates WHERE is_active = true;

-- Query to check folder nodes for a template
SELECT fn.* 
FROM drive_folder_nodes fn
JOIN structure_templates st ON fn.template_id = st.id
WHERE st.entity_type = 'deal' AND st.is_active = true
ORDER BY fn.display_order;
```

## References

- [Google Drive Integration Documentation](./archive/reports/google-drive-integration.md)
- [Drive Types Documentation](./frontend/drive_types.md)
- [Drive Client Documentation](./frontend/drive_client.md)
