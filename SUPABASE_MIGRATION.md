# Supabase Migration Guide

This guide explains how to set up and use the Supabase integration for the PipeDesk-Koa application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed
3. Git

## Setup Instructions

### 1. Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details (name, database password, region)
4. Wait for the project to be created (takes 1-2 minutes)

### 2. Run the Database Schema

1. In your Supabase project dashboard, go to the SQL Editor
2. Copy the entire contents of `supabase-schema.sql` from this repository
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- All database tables
- Foreign key relationships
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamps and stage tracking

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to your Supabase project settings
   - Click on "API" in the left sidebar
   - Copy the "Project URL" and "anon public" API key

3. Update `.env` with your credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 4. Configure Authentication

1. In your Supabase project, go to Authentication > Settings
2. Configure the Site URL to your application URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs:
   - `http://localhost:5173/auth` (development)
   - `https://your-production-domain.com/auth` (production)
4. Enable Email authentication provider
5. Configure your email templates if desired

### 5. Install Dependencies

```bash
npm install
```

This will install the Supabase client library along with all other dependencies.

### 6. Run the Application

```bash
npm run dev
```

The application should now connect to Supabase for data persistence and authentication.

## Migration from Local Storage

The application has been migrated from using `@github/spark/hooks` with `useKV` (local storage) to Supabase for persistent, collaborative data storage.

### Key Changes

1. **Data Persistence**: All data now stored in PostgreSQL via Supabase instead of browser localStorage
2. **Real-time Updates**: Changes made by one user are immediately visible to all other users
3. **Authentication**: Magic link authentication now powered by Supabase Auth
4. **Multi-user Support**: True collaborative editing with user permissions and RLS policies

### New Hooks

The following custom hooks replace the old `useKV` pattern:

- `useAuth()` - Authentication and user session management
- `useDeals()` - Master deals CRUD operations
- `usePlayerTracks()` - Player tracks CRUD operations
- `useTasks()` - Tasks CRUD operations
- `useUsers()` - User management
- `useComments()` - Comments on entities
- `useNotifications()` - User notifications
- `useCustomFields()` - Custom field definitions and values
- `useFolders()` - Folder/organization management
- `useIntegrations()` - Google Drive and Calendar integrations

### Hook Usage Example

```typescript
import { useDeals } from '@/hooks/useDeals'

function MyComponent() {
  const { data: deals, loading, error, create, update, remove } = useDeals()

  // Create a new deal
  const handleCreateDeal = async () => {
    const newDeal = await create({
      clientName: 'Acme Corp',
      volume: 1000000,
      operationType: 'acquisition',
      status: 'active',
      // ... other fields
    })
  }

  // Update a deal
  const handleUpdateDeal = async (dealId: string) => {
    const updated = await update(dealId, {
      status: 'concluded',
    })
  }

  // Delete a deal
  const handleDeleteDeal = async (dealId: string) => {
    const success = await remove(dealId)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {deals.map(deal => (
        <div key={deal.id}>{deal.clientName}</div>
      ))}
    </div>
  )
}
```

## Real-time Subscriptions

All hooks automatically subscribe to real-time updates from Supabase. When data changes in the database (from any user), your components will automatically re-render with the new data.

This is enabled by default but can be disabled by passing `realtime: false` to the hook options.

## Row Level Security (RLS)

The database schema includes comprehensive RLS policies to ensure users can only access data they're authorized to see:

- **Admins**: Full access to all data
- **Analysts**: Can view and manage deals, tracks, and tasks
- **Clients**: Can only view deals they created
- **New Business**: Similar access to analysts for business development

Users can only:
- Read their own notifications
- Update their own profile
- Manage their own Google integrations

## Database Schema

The database uses PostgreSQL naming conventions (snake_case) while the TypeScript code uses camelCase. Type mappers in `src/lib/dbMappers.ts` handle the conversion automatically.

### Main Tables

- `users` - User accounts and profiles
- `master_deals` - Top-level deals
- `player_tracks` - Individual tracks within deals
- `tasks` - Tasks associated with tracks
- `comments` - Comments on deals, tracks, or tasks
- `notifications` - User notifications
- `custom_field_definitions` - Custom field schemas
- `custom_field_values` - Custom field data
- `folders` - Organizational folders
- `entity_locations` - Entity-to-folder mappings
- `stage_history` - Historical stage transitions
- `google_integrations` - Google OAuth tokens
- `google_drive_folders` - Google Drive folder mappings
- `calendar_events` - Calendar event synchronization

## Troubleshooting

### Connection Errors

If you see connection errors:
1. Verify your `.env` file has the correct Supabase URL and anon key
2. Check that your Supabase project is running (not paused)
3. Verify your network connection

### Authentication Issues

If magic links aren't working:
1. Check that email authentication is enabled in Supabase
2. Verify redirect URLs are configured correctly
3. Check your email spam folder
4. Review Supabase Auth logs in the dashboard

### RLS Policy Errors

If you get permission denied errors:
1. Verify you're authenticated (check `useAuth()` hook)
2. Check that your user role has appropriate permissions
3. Review the RLS policies in `supabase-schema.sql`

### Missing Data

If data isn't appearing:
1. Check the browser console for errors
2. Verify the data exists in Supabase Table Editor
3. Check RLS policies aren't blocking access
4. Ensure real-time subscriptions are active

## Development Tips

1. **Use the Supabase Dashboard**: The Table Editor is great for viewing and debugging data
2. **Check Real-time Logs**: Monitor real-time events in the Supabase dashboard
3. **Use SQL Editor**: Run queries directly to debug data issues
4. **Monitor Auth Logs**: Check authentication events in the Auth section

## Production Deployment

Before deploying to production:

1. Update environment variables with production Supabase credentials
2. Configure production redirect URLs in Supabase Auth settings
3. Set up proper email templates for magic links
4. Consider setting up custom SMTP for emails (Supabase Auth > Email settings)
5. Enable database backups in Supabase project settings
6. Review and adjust RLS policies as needed
7. Set up monitoring and alerting

## Support

For issues specific to:
- **Supabase**: Check https://supabase.com/docs or https://github.com/supabase/supabase/discussions
- **This Application**: Open an issue in the GitHub repository
