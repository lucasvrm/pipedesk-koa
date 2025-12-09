# settingsService - Centralized CRUD for Dynamic Metadata Tables

## Overview

The `settingsService` provides a centralized, type-safe interface for CRUD operations on all dynamic metadata tables in the system. It uses the Supabase client and follows a consistent `{data, error}` return pattern.

## Usage

```typescript
import { settingsService, getSystemSetting, updateSystemSetting } from '@/services/settingsService'
```

## Generic CRUD Helpers

### list(tableName)
Lists all items from a metadata table, ordered by `sort_order`.

```typescript
const { data, error } = await settingsService.list<DealStatusMeta>('deal_statuses')

if (error) {
  console.error('Failed to load deal statuses:', error)
} else {
  console.log('Deal statuses:', data)
}
```

**Supported tables:**
- `deal_statuses`
- `relationship_levels` (maps to `company_relationship_levels`)
- `company_types`
- `lead_statuses`
- `lead_origins`
- `lead_member_roles`
- `user_role_metadata`
- `loss_reasons`, `products`, `deal_sources`, `player_categories`, `holidays`, `communication_templates`

### create(tableName, payload)
Creates a new item in a metadata table with validation.

```typescript
const { data, error } = await settingsService.create<LeadStatusMeta>(
  'lead_statuses',
  {
    code: 'in_progress',
    label: 'Em Progresso',
    description: 'Lead is being worked on',
    isActive: true,
    sortOrder: 2
  }
)

if (error) {
  console.error('Failed to create lead status:', error)
} else {
  console.log('Created lead status:', data)
}
```

**Validation:**
- `code` must not be empty (after trim)
- `label` must not be empty (after trim)

### update(tableName, id, payload)
Updates an existing item in a metadata table.

```typescript
const { data, error } = await settingsService.update<LeadOriginMeta>(
  'lead_origins',
  'origin-id-123',
  {
    label: 'Updated Label',
    description: 'Updated description',
    isActive: true
  }
)

if (error) {
  console.error('Failed to update lead origin:', error)
} else {
  console.log('Updated lead origin:', data)
}
```

**Validation:**
- `id` must not be empty (after trim)

**Note:** Fields `id` and `created_at` are automatically removed from the update payload.

### remove(tableName, id)
Deletes an item from a metadata table.

```typescript
const { data, error } = await settingsService.remove('lead_member_roles', 'role-id-123')

if (error) {
  console.error('Failed to delete role:', error)
} else {
  console.log('Role deleted successfully')
}
```

**Validation:**
- `id` must not be empty (after trim)

## System Settings Helpers

### getSystemSetting(key)
Gets a system setting value by key from the `system_settings` table.

```typescript
const { data, error } = await getSystemSetting('auth_config')

if (error) {
  console.error('Failed to get auth config:', error)
} else {
  console.log('Auth config:', data) // Returns the value directly
}
```

**Returns:** `null` if key doesn't exist (not an error).

### updateSystemSetting(key, value, description)
Upserts a system setting (creates if doesn't exist, updates if exists).

```typescript
const { data, error } = await updateSystemSetting(
  'auth_config',
  { enableMagicLinks: true, restrictDomain: false },
  'Authentication settings'
)

if (error) {
  console.error('Failed to update auth config:', error)
} else {
  console.log('Auth config updated:', data)
}
```

**Validation:**
- `key` must not be empty (after trim)

**Note:** Automatically sets `updated_by` to current user ID and `updated_at` to current timestamp.

## Response Pattern

All functions return an object with this shape:

```typescript
{
  data: T | null,
  error: Error | null
}
```

- On success: `{ data: <result>, error: null }`
- On failure: `{ data: null, error: <Error object> }`

This pattern allows for consistent error handling:

```typescript
const { data, error } = await settingsService.list('deal_statuses')

if (error) {
  // Handle error
  showErrorToast(error.message)
  return
}

// Use data safely (TypeScript knows it's not null here)
setDealStatuses(data)
```

## Type Safety

The service is fully typed. Import the appropriate types:

```typescript
import { 
  DealStatusMeta,
  RelationshipLevelMeta,
  CompanyTypeMeta,
  LeadStatusMeta,
  LeadOriginMeta,
  LeadMemberRoleMeta,
  UserRoleMetadata
} from '@/types/metadata'

// Use with type parameter
const { data, error } = await settingsService.list<DealStatusMeta>('deal_statuses')
// data is typed as DealStatusMeta[] | null
```

## Legacy Methods (Deprecated)

The following methods are kept for backward compatibility but are deprecated:

- `getSettings<T>(type)` - Use `list<T>(tableName)` instead
- `createSetting<T>(type, data)` - Use `create<T>(tableName, payload)` instead
- `updateSetting<T>(type, id, data)` - Use `update<T>(tableName, id, payload)` instead
- `deleteSetting(type, id)` - Use `remove(tableName, id)` instead

**Difference:** Legacy methods throw errors on failure, while new methods return `{data, error}`.

## Example: Complete CRUD Flow

```typescript
import { settingsService } from '@/services/settingsService'
import type { LeadStatusMeta } from '@/types/metadata'

async function manageLeadStatuses() {
  // 1. List all lead statuses
  const { data: statuses, error: listError } = await settingsService.list<LeadStatusMeta>('lead_statuses')
  if (listError) {
    console.error('Failed to list statuses:', listError)
    return
  }
  console.log('Current statuses:', statuses)

  // 2. Create a new status
  const { data: newStatus, error: createError } = await settingsService.create<LeadStatusMeta>(
    'lead_statuses',
    {
      code: 'negotiating',
      label: 'Negociando',
      description: 'In active negotiation',
      isActive: true,
      sortOrder: 3
    }
  )
  if (createError) {
    console.error('Failed to create status:', createError)
    return
  }
  console.log('Created status:', newStatus)

  // 3. Update the status
  const { data: updatedStatus, error: updateError } = await settingsService.update<LeadStatusMeta>(
    'lead_statuses',
    newStatus.id,
    {
      description: 'Actively negotiating terms'
    }
  )
  if (updateError) {
    console.error('Failed to update status:', updateError)
    return
  }
  console.log('Updated status:', updatedStatus)

  // 4. Delete the status
  const { error: deleteError } = await settingsService.remove('lead_statuses', newStatus.id)
  if (deleteError) {
    console.error('Failed to delete status:', deleteError)
    return
  }
  console.log('Status deleted successfully')
}
```

## Integration with SystemMetadataContext

After making changes to metadata tables, refresh the context:

```typescript
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { settingsService } from '@/services/settingsService'

function SettingsPage() {
  const { refreshMetadata } = useSystemMetadata()

  const handleCreateStatus = async (payload) => {
    const { data, error } = await settingsService.create('lead_statuses', payload)
    
    if (error) {
      showErrorToast(error.message)
      return
    }

    showSuccessToast('Status created')
    await refreshMetadata() // Reload context data
  }

  // ...
}
```

## Error Handling Best Practices

```typescript
// ✅ Good: Check for error first
const { data, error } = await settingsService.list('deal_statuses')
if (error) {
  // Handle error appropriately
  if (error.message.includes('permission')) {
    showErrorToast('You do not have permission to view deal statuses')
  } else {
    showErrorToast('Failed to load deal statuses')
  }
  return
}
// Safe to use data here

// ❌ Bad: Accessing data without checking error
const { data } = await settingsService.list('deal_statuses')
data.forEach(status => console.log(status)) // Might crash if error occurred
```

## Testing

Tests are located in `tests/unit/services/settingsService.test.ts`.

Run tests:
```bash
npm run test:run tests/unit/services/settingsService.test.ts
```

Current coverage: 12 tests covering all CRUD operations, validation, and error handling.
