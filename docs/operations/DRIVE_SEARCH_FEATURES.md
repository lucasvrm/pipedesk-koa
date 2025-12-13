# Drive Search and Filter Features

This document describes the search and filtering features added to the DriveSection component.

## Features Implemented

### 1. Text Search
- **Location**: Search input in the toolbar
- **Behavior**: 
  - Debounced search with 500ms delay to avoid excessive API calls
  - Searches across file and folder names
  - Real-time results as you type
- **API Endpoint**: `GET /api/drive/search?q=<query>&entity_type=<type>&entity_id=<id>`

### 2. Date Range Filtering
- **Location**: Two date picker buttons in the toolbar
- **Behavior**:
  - Select "Data inicial" (start date) to filter files created from that date
  - Select "Data final" (end date) to filter files created up to that date
  - Both filters can be used independently or together
  - Date format sent to API: `yyyy-MM-dd` (ISO 8601)
- **API Parameters**: `created_from` and `created_to`

### 3. Clear Filters
- **Location**: Button appears in toolbar when any filter is active
- **Behavior**:
  - Clears all active filters (text search and date range)
  - Reloads the default file listing
  - Button is automatically hidden when no filters are active

### 4. Drag and Drop Upload
- **Location**: Entire DriveSection area
- **Behavior**:
  - Drag files from your computer over the component
  - Visual feedback: border highlight and animated overlay
  - Drop files to upload them
  - Supports multiple file uploads
  - Activity is logged as "upload de arquivo (drag-and-drop)"
  - Disabled in read-only mode

## Technical Details

### Search Implementation

The search functionality is implemented in three layers:

1. **API Layer** (`src/services/pdGoogleDriveApi.ts`):
   - `searchRemoteDocuments()` function
   - Accepts `SearchOptions` interface with optional parameters
   - Returns `RemoteDriveSnapshot` with results

2. **Hook Layer** (`src/hooks/useDriveDocuments.ts`):
   - State management for search query and date filters
   - `search()` function that calls the API
   - `clearSearch()` function to reset filters
   - `isSearching` state to show loading indicator

3. **Component Layer** (`src/components/DriveSection.tsx`):
   - UI controls (input, date pickers, clear button)
   - Debounced search input (500ms)
   - Date formatting and conversion
   - Loading state display

### Drag and Drop Implementation

Already implemented in the DriveSection component:

- Event handlers: `handleDragOver`, `handleDragLeave`, `handleDrop`
- Visual feedback with `isDragging` state
- Respects read-only mode
- Integrates with existing upload functionality

## API Contract

### Search Endpoint

**Request:**
```
GET /api/drive/search
Query Parameters:
  - entity_type: string (required) - "lead", "deal", or "company"
  - entity_id: string (required) - ID of the entity
  - q: string (optional) - Search query for text matching
  - created_from: string (optional) - ISO date (yyyy-MM-dd) for start of range
  - created_to: string (optional) - ISO date (yyyy-MM-dd) for end of range
  - include_deleted: boolean (optional) - Include deleted files
  - page: number (optional) - Page number for pagination
  - limit: number (optional) - Items per page
```

**Response:**
```json
{
  "files": [
    {
      "id": "string",
      "name": "string",
      "mimeType": "string",
      "size": number,
      "webViewLink": "string",
      "createdTime": "ISO-8601 date string",
      "deleted": boolean
    }
  ],
  "permission": "owner" | "writer" | "reader",
  "breadcrumbs": [
    { "id": "string | null", "name": "string" }
  ]
}
```

## Usage Example

```tsx
import DriveSection from '@/components/DriveSection'

function MyComponent() {
  return (
    <DriveSection 
      entityType="deal" 
      entityId="deal-123"
      entityName="My Deal"
    />
  )
}
```

The search and filter features are automatically available in the component.

## Testing

Unit tests are available in `tests/unit/components/DriveSection.test.tsx`:
- Search functionality
- Date filter display
- Searching state indicator
- Drag and drop availability
- Read-only mode behavior

Run tests with:
```bash
npm run test:run -- tests/unit/components/DriveSection.test.tsx
```

## Future Enhancements

Potential improvements:
- Advanced filters (file type, size, uploader)
- Saved search queries
- Search history
- Real-time upload progress for drag-and-drop
- Batch operations on search results
