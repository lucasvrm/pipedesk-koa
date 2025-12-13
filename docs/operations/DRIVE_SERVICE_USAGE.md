# Drive Service - Usage Examples

The `driveService` provides a unified interface to interact with the Drive backend for entities: `lead`, `deal`, and `company`.

## Installation

```typescript
import {
  getDriveItems,
  createFolder,
  uploadFile,
  deleteFile,
  deleteFolder,
  repairStructure,
  syncName,
  type EntityType,
  type DriveItem,
} from '@/services/driveService';
```

## Examples

### 1. Get Drive Items

```typescript
// Get all items for a deal
const { items, total } = await getDriveItems('deal', 'deal-123');

// Get items with pagination
const { items, total } = await getDriveItems('deal', 'deal-123', {
  page: 1,
  limit: 50,
});

// Get items from a specific folder
const { items, total } = await getDriveItems('lead', 'lead-456', {
  folderId: 'folder-abc',
});
```

### 2. Create Folder

```typescript
// Create a folder in the root
await createFolder('company', 'company-789', {
  name: 'Documents',
});

// Create a subfolder
await createFolder('deal', 'deal-123', {
  name: 'Contracts',
  parentId: 'parent-folder-id',
});
```

### 3. Upload File

```typescript
// Upload a file to the root
const file = new File(['content'], 'document.pdf');
await uploadFile('deal', 'deal-123', file);

// Upload a file to a specific folder
await uploadFile('lead', 'lead-456', file, {
  parentId: 'folder-id',
});
```

### 4. Delete File

```typescript
await deleteFile('deal', 'deal-123', 'file-id-456');
```

### 5. Delete Folder

```typescript
await deleteFolder('company', 'company-789', 'folder-id-abc');
```

### 6. Repair Drive Structure

```typescript
// Repair the drive structure for an entity
await repairStructure('deal', 'deal-123');
```

### 7. Sync Entity Name

```typescript
// Sync the entity name with the Drive folder name
await syncName('lead', 'lead-456');
```

## Integration in Components

### Example: LeadDetailPage

```typescript
import { getDriveItems, uploadFile } from '@/services/driveService';
import { useState, useEffect } from 'react';

function LeadDetailPage({ leadId }: { leadId: string }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDriveItems();
  }, [leadId]);

  const loadDriveItems = async () => {
    setLoading(true);
    try {
      const { items } = await getDriveItems('lead', leadId);
      setItems(items);
    } catch (error) {
      console.error('Failed to load drive items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      await uploadFile('lead', leadId, file);
      await loadDriveItems(); // Reload items
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  return (
    <div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {items.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Error Handling

All functions throw errors that should be caught and handled:

```typescript
try {
  await createFolder('deal', 'deal-123', { name: 'Test' });
} catch (error) {
  if (error instanceof Error) {
    console.error('Error creating folder:', error.message);
  }
}
```

## Type Safety

The service is fully typed with TypeScript:

```typescript
type EntityType = 'lead' | 'deal' | 'company';

interface DriveItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  url?: string;
  permission?: 'read' | 'write' | 'admin';
}
```

## Notes

- All functions require authentication (handled automatically via Supabase session)
- The Drive API URL must be configured via `VITE_DRIVE_API_URL` environment variable
- The service uses the existing `safeFetch` HTTP client for consistency
- All functions are entity-agnostic and reusable
