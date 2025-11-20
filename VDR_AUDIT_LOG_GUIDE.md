# Virtual Data Room & Audit Log Implementation Guide

## Overview

This implementation adds three major security and frontend features to PipeDesk:

1. **Virtual Data Room (VDR)** - Secure document browsing interface
2. **PDF Watermarking** - Automatic watermarking of downloaded PDFs
3. **Audit Log Viewer** - Comprehensive activity tracking interface

## Features Implemented

### 1. Virtual Data Room (VDR)

**File:** `src/components/DataRoomView.tsx`

The VDR provides a secure interface for browsing and downloading documents from Supabase Storage:

#### Features:
- Browse files and folders in the "documents" bucket
- Navigate folder hierarchy with breadcrumb navigation
- Search functionality for files and folders
- File type icons (PDF, images, documents, archives)
- File metadata display (size, last modified)
- Secure download with automatic PDF watermarking

#### Usage:
```tsx
import DataRoomView from '@/components/DataRoomView'

// Use in your app
<DataRoomView />
```

#### Access:
- Available to all authenticated users
- Accessible via dropdown menu → "Virtual Data Room"

### 2. PDF Watermarking

**File:** `src/lib/pdfWatermark.ts`

Automatic watermarking system that adds user tracking information to downloaded PDFs:

#### Features:
- Adds watermark to PDF footer with user information
- Includes: user name, email, and download timestamp
- Non-intrusive gray watermark with 70% opacity
- Applies to all pages of the PDF
- Non-PDF files download without modification

#### API:

```typescript
import { downloadWithWatermark } from '@/lib/pdfWatermark'

// Download a file with watermark
await downloadWithWatermark(
  fileUrl,      // URL of the file to download
  fileName,     // Name for the downloaded file
  {
    userName: 'John Doe',
    userEmail: 'john@example.com',
    timestamp: new Date(),
  }
)
```

#### Watermark Format:
```
Baixado por: [User Name] ([Email]) em [DD/MM/YYYY HH:MM]
```

Example:
```
Baixado por: João Silva (joao@empresa.com) em 20/11/2025 15:30
```

### 3. Audit Log Viewer

**File:** `src/components/AuditLogView.tsx`

Comprehensive audit log interface for tracking all system activities:

#### Features:
- View all activities from `activity_log` table
- Filter by user (dropdown)
- Filter by event type (create, update, delete, login, logout)
- Filter by date range (start and end dates)
- Search by action or user name/email
- Paginated view (50 records per page)
- Expandable change details in JSON format
- Color-coded badges for different action types

#### Access:
- Available only to users with `MANAGE_USERS` permission (admin role)
- Accessible via dropdown menu → "Log de Auditoria"

#### Badge Colors:
- **Green**: Create/Insert operations
- **Blue**: Update operations
- **Red**: Delete operations
- **Gray**: Other system actions

## Setup Instructions

### 1. Supabase Storage Setup

Create a storage bucket for the VDR:

```sql
-- Create the documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Set up Row Level Security policies
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'analyst'))
);
```

### 2. Activity Log (Already Exists)

The audit log uses the existing `activity_log` table defined in the schema:

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  entity_id UUID,
  entity_type TEXT CHECK (entity_type IN ('deal', 'track', 'task', 'user', 'folder')),
  action TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Install Dependencies

```bash
npm install pdf-lib
```

## Navigation Integration

The new features are integrated into the App.tsx dropdown menu:

```tsx
// VDR - Available to all users
<DropdownMenuItem onClick={() => setCurrentPage('dataroom')}>
  <Database className="mr-2" />
  Virtual Data Room
</DropdownMenuItem>

// Audit Log - Admin only
{canManageUsers && (
  <DropdownMenuItem onClick={() => setCurrentPage('audit')}>
    <ClockCounterClockwise className="mr-2" />
    Log de Auditoria
  </DropdownMenuItem>
)}
```

## Security Considerations

### PDF Watermarking
- ✅ Watermarks are permanently embedded in the PDF
- ✅ User information is tracked for accountability
- ✅ Timestamp provides audit trail
- ✅ Cannot be easily removed without damaging the document

### VDR Access
- ✅ Requires authentication via Supabase Auth
- ✅ Signed URLs with 10-minute expiration
- ✅ Row Level Security policies on storage bucket
- ✅ No direct public access to files

### Audit Log
- ✅ Read-only interface (no modification of logs)
- ✅ Restricted to admin users only
- ✅ All activities tracked at database level
- ✅ Immutable audit trail

## Technical Details

### Dependencies
- **pdf-lib**: ^1.17.1 (MIT License, no known vulnerabilities)
- **date-fns**: For date formatting and manipulation
- **react-day-picker**: For date range selection UI

### Browser Compatibility
- Modern browsers with ES6+ support
- Blob API for file downloads
- Fetch API for file retrieval

### Performance
- Pagination limits data transfer (50 records/page)
- Efficient Supabase queries with indexes
- Lazy loading of file lists
- Client-side search filtering

## Usage Examples

### VDR Folder Structure
```
documents/
  ├── deals/
  │   ├── deal-001/
  │   │   ├── contract.pdf
  │   │   └── nda.pdf
  │   └── deal-002/
  │       └── proposal.pdf
  └── general/
      └── handbook.pdf
```

### Audit Log Query Examples

**Filter by user and date:**
- Select user: "João Silva"
- Date from: 01/11/2025
- Date to: 20/11/2025

**Filter by event type:**
- Event type: "Criação"
- Shows all CREATE/INSERT operations

**Search:**
- Search term: "deal"
- Shows all actions related to deals

## Troubleshooting

### VDR shows "No files found"
- Check if the "documents" bucket exists in Supabase Storage
- Verify RLS policies allow the current user to read files
- Check browser console for Supabase errors

### PDF watermark not appearing
- Ensure the file is actually a PDF (check MIME type)
- Check browser console for pdf-lib errors
- Verify file is not corrupted or password-protected

### Audit Log empty
- Verify the activity_log table has records
- Check if the current user has MANAGE_USERS permission
- Review Supabase RLS policies for activity_log

## Future Enhancements

Potential improvements for future iterations:

1. **VDR:**
   - Upload functionality
   - Folder creation and management
   - File preview (PDFs, images)
   - Version control for documents
   - Sharing with expiration links

2. **PDF Watermarking:**
   - Custom watermark positioning
   - Company logo watermarks
   - Configurable watermark styles
   - Multiple watermarks (header + footer)

3. **Audit Log:**
   - Export to CSV/Excel
   - Advanced filtering (regex, multiple users)
   - Real-time updates
   - Analytics dashboard
   - Automated alerts for specific events

## Conclusion

This implementation provides a solid foundation for secure document management and comprehensive activity tracking in PipeDesk. All features follow security best practices and integrate seamlessly with the existing application architecture.
