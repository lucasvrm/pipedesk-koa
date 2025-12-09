# SystemMetadataContext Expansion

## Overview

The SystemMetadataContext has been expanded to support all new dynamic settings tables, replacing hardcoded values throughout the application with database-driven metadata.

## New Metadata Tables

### 1. deal_statuses
Defines available deal statuses (e.g., active, cancelled, concluded, on_hold).

**Schema:**
```sql
- id: uuid (primary key)
- code: text (unique, e.g., 'active', 'concluded')
- label: text (display name)
- description: text (optional)
- is_active: boolean
- sort_order: integer
- created_at: timestamptz
```

### 2. company_relationship_levels (accessed as relationshipLevels)
Defines relationship levels for companies/players (e.g., none, basic, intermediate, close).

**Schema:**
```sql
- id: uuid (primary key)
- code: text (unique)
- label: text
- description: text (optional)
- is_active: boolean
- sort_order: integer
- created_at: timestamptz
```

### 3. company_types
Defines types of companies (e.g., incorporadora, construtora, corporation).

**Schema:**
```sql
- id: uuid (primary key)
- code: text (unique)
- label: text
- description: text (optional)
- is_active: boolean
- sort_order: integer
- created_at: timestamptz
```

### 4. lead_statuses
Defines lead statuses (e.g., new, contacted, qualified, disqualified).

**Schema:**
```sql
- id: uuid (primary key)
- code: text (unique)
- label: text
- description: text (optional)
- is_active: boolean
- sort_order: integer
- created_at: timestamptz
```

### 5. lead_origins
Defines lead origin sources (e.g., inbound, outbound, referral, event).

**Schema:**
```sql
- id: uuid (primary key)
- code: text (unique)
- label: text
- description: text (optional)
- is_active: boolean
- sort_order: integer
- created_at: timestamptz
```

### 6. lead_member_roles
Defines roles for lead team members (e.g., owner, collaborator, watcher).

**Schema:**
```sql
- id: uuid (primary key)
- code: text (unique)
- label: text
- description: text (optional)
- is_active: boolean
- sort_order: integer
- created_at: timestamptz
```

**Default Values:**
- `owner` - Lead owner with full permissions
- `collaborator` - Team member who can collaborate on the lead
- `watcher` - Observer who receives notifications but cannot edit

### 7. user_role_metadata
Defines user roles with associated permissions (e.g., admin, analyst, client, newbusiness).

**Schema:**
```sql
- id: uuid (primary key)
- code: text (unique)
- label: text
- description: text (optional)
- permissions: jsonb (array of permission codes)
- is_active: boolean
- sort_order: integer
- created_at: timestamptz
- updated_at: timestamptz
```

**Default Values:**
- `admin` - Administrator with full system access
- `analyst` - Can create/edit deals, view analytics
- `newbusiness` - View-only with analytics and real names
- `client` - Limited access with anonymized names

## Usage

### Accessing Metadata in Components

```typescript
import { useSystemMetadata } from '@/hooks/useSystemMetadata'

function MyComponent() {
  const {
    dealStatuses,
    relationshipLevels,
    companyTypes,
    leadStatuses,
    leadOrigins,
    leadMemberRoles,
    userRoleMetadata,
    isLoading,
    error,
    refreshMetadata
  } = useSystemMetadata()

  // Access metadata arrays directly
  const activeDealStatuses = dealStatuses.filter(ds => ds.isActive)
  
  // Use helper functions for lookups
  const activeStatus = getDealStatusByCode('active')
  const adminRole = getUserRoleByCode('admin')
  
  // Refresh metadata after settings changes
  await refreshMetadata()
}
```

### Helper Functions

The `useSystemMetadata` hook provides helper functions for easy lookups:

**Deal Status:**
- `getDealStatusByCode(code: string)` - Find by code
- `getDealStatusById(id: string)` - Find by ID

**Relationship Level:**
- `getRelationshipLevelByCode(code: string)` - Find by code
- `getRelationshipLevelById(id: string)` - Find by ID

**Company Type:**
- `getCompanyTypeByCode(code: string)` - Find by code
- `getCompanyTypeById(id: string)` - Find by ID

**Lead Status:**
- `getLeadStatusByCode(code: string)` - Find by code
- `getLeadStatusById(id: string)` - Find by ID

**Lead Origin:**
- `getLeadOriginByCode(code: string)` - Find by code
- `getLeadOriginById(id: string)` - Find by ID

**Lead Member Role:**
- `getLeadMemberRoleByCode(code: string)` - Find by code
- `getLeadMemberRoleById(id: string)` - Find by ID

**User Role:**
- `getUserRoleByCode(code: string)` - Find by code
- `getUserRoleById(id: string)` - Find by ID

### Refreshing Metadata

The context provides two functions for reloading metadata:

```typescript
const { reload, refreshMetadata } = useSystemMetadata()

// Both functions do the same thing
await reload() // Kept for backward compatibility
await refreshMetadata() // New alias for clarity
```

Call these functions after updating settings tables to ensure the UI reflects the latest values.

## TypeScript Types

All metadata types are defined in `src/types/metadata.ts`:

```typescript
export interface DealStatusMeta {
  id: string
  code: string
  label: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

// Similar interfaces for:
// - RelationshipLevelMeta
// - CompanyTypeMeta
// - LeadStatusMeta
// - LeadOriginMeta
// - LeadMemberRoleMeta
// - UserRoleMetadata (includes permissions array)
```

## Database Migration

The migration file `20251209_add_lead_member_roles_and_user_role_metadata.sql` creates the two new tables and seeds them with default values.

To apply the migration:
```bash
# Using Supabase CLI
supabase db push

# Or apply directly to your database
psql -f supabase/migrations/20251209_add_lead_member_roles_and_user_role_metadata.sql
```

## Security

- All metadata tables have RLS (Row Level Security) enabled
- Read access is granted to all authenticated users
- Write access is restricted to admin role only
- No sensitive data should be stored in these tables

## Testing

Tests are located in `tests/unit/hooks/useSystemMetadata.test.tsx` and cover:
- Loading all metadata tables
- Helper functions for lookups
- Error handling
- Refresh functionality

Run tests with:
```bash
npm run test:run tests/unit/hooks/useSystemMetadata.test.tsx
```

## Performance Considerations

- All metadata is loaded in parallel on app startup
- Data is cached in React context
- Only reload when settings are changed via `refreshMetadata()`
- Consider implementing a refresh strategy if metadata changes frequently

## Future Improvements

1. Add WebSocket subscriptions for real-time metadata updates
2. Implement caching strategies (localStorage, IndexedDB)
3. Add admin UI for managing metadata values
4. Support for metadata versioning/history
5. Add validation schemas for metadata fields
