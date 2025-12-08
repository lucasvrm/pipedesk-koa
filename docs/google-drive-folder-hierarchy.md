# Google Drive Folder Hierarchy System

## Overview

This document describes the Google Drive folder hierarchy and creation system implemented for PipeDesk. The system automatically creates standardized folder structures for leads, companies, deals, and contacts using configurable templates stored in the database.

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
- `deal` - Deal/opportunity folders
- `track` - Track folders
- `lead` - Lead folders  
- `company` - Company folders
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

### Leads

**Path Pattern:** `{{root}}/010_Leads/{{lead_number}}_{{lead_name}}`

**Folder Structure:**
```
000_Lead Root/
├── 001_Documents/          # Lead documents and attachments
├── 002_Communications/     # Email threads and communication history
└── 003_Notes/             # Meeting notes and internal documentation
```

### Companies

**Path Pattern:** `{{root}}/001_Companies/{{company_type}}/{{company_number}}_{{company_name}}`

**Folder Structure:**
```
000_Company Root/
├── 001_Contracts/         # Legal contracts and agreements
├── 002_Documents/         # Company registration and legal documents
├── 003_Financial/         # Financial statements and reports
└── 004_Compliance/        # Regulatory and compliance documents (on-demand)
```

### Deals

**Path Pattern:** `{{root}}/020_Deals/{{deal_number}}_{{deal_name}}`

**Folder Structure:**
```
000_Deal Root/
├── 001_Proposals/         # Deal proposals and presentations
├── 002_Documents/         # Deal-related documents
├── 003_Analysis/          # Deal analysis and due diligence
├── 004_Negotiations/      # Negotiation documents (on-demand)
└── 005_Closing/           # Deal closing documents (on-demand)
```

### Contacts

**Path Pattern:** `{{root}}/030_Contacts/{{contact_number}}_{{contact_name}}`

**Folder Structure:**
```
000_Contact Root/
├── 001_Personal Documents/ # Contact personal documents and ID
├── 002_Communications/     # Communication history with contact
└── 003_Agreements/         # NDAs and other agreements
```

## Document Type Configurations

### Deals
- **Proposal Document** - Located in `001_Proposals/`, pattern: `Proposal_{{deal_name}}_{{date}}`
- **Deal Analysis** - Located in `003_Analysis/`, pattern: `Analysis_{{deal_name}}_{{date}}`
- **Contract** - Located in `005_Closing/`, pattern: `Contract_{{deal_name}}_{{date}}`, min_stage: 3

### Companies
- **Company Registration** - Located in `002_Documents/`, pattern: `Registration_{{company_name}}`
- **Company Contract** - Located in `001_Contracts/`, pattern: `Contract_{{company_name}}_{{date}}`
- **Financial Statement** - Located in `003_Financial/`, pattern: `FinStatement_{{company_name}}_{{period}}`

### Leads
- **Lead Qualification Doc** - Located in `001_Documents/`, pattern: `Qualification_{{lead_name}}_{{date}}`
- **Meeting Notes** - Located in `003_Notes/`, pattern: `Notes_{{lead_name}}_{{date}}`

### Contacts
- **Contact ID Document** - Located in `001_Personal Documents/`, pattern: `ID_{{contact_name}}`
- **NDA Agreement** - Located in `003_Agreements/`, pattern: `NDA_{{contact_name}}_{{date}}`

## Naming Conventions

### Folder Prefixes
- All folders use numeric prefixes (000, 001, 002, etc.) for consistent ordering
- Root folders always use prefix `000`
- Subfolder prefixes indicate their relative order within parent folder

### Placeholder Variables
Common placeholders used in path patterns and file names:

- `{{root}}` - Root Google Drive folder
- `{{entity_type}}` - Type of entity (lead, deal, company, contact)
- `{{entity_name}}` - Name of the entity
- `{{entity_number}}` - Sequential number/ID of entity
- `{{lead_number}}`, `{{lead_name}}` - Lead-specific placeholders
- `{{deal_number}}`, `{{deal_name}}` - Deal-specific placeholders
- `{{company_number}}`, `{{company_name}}`, `{{company_type}}` - Company-specific placeholders
- `{{contact_number}}`, `{{contact_name}}` - Contact-specific placeholders
- `{{date}}` - Current date (ISO format)
- `{{period}}` - Time period (for financial statements)
- `{{stage}}` - Deal stage

## On-Demand Folders

Some folders are marked as "on-demand" (`is_on_demand = true`), meaning they are only created when:
- Explicitly requested by a user
- Triggered by a specific lifecycle event
- Required by business logic (e.g., when a deal reaches a certain stage)

**Examples:**
- `Compliance` folder for companies (created when compliance docs are needed)
- `Negotiations` folder for deals (created when deal enters negotiation stage)
- `Closing` folder for deals (created when deal is ready to close)

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
supabase/migrations/20251208_google_drive_folder_hierarchy.sql
```

**This migration:**
1. Extends `google_drive_folders` to support lead, company, and contact entity types
2. Creates `drive_folder_nodes` table for hierarchical structure
3. Inserts template data for all entity types
4. Adds document type configurations
5. Sets up RLS policies for security

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
