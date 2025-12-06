# Configuration Guide

This guide covers all configuration options for PipeDesk, including environment variables, Supabase setup, and integration configuration.

## Environment Variables

PipeDesk uses environment variables for configuration. All variables are prefixed with `VITE_` to be accessible in the Vite build.

### Required Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Optional Variables

```env
# Optional: Custom configuration
VITE_APP_NAME=PipeDesk
VITE_APP_VERSION=0.3.0
```

## Supabase Setup

### 1. Create a Supabase Project

1. Sign up at [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project Name**: e.g., "PipeDesk Production"
   - **Database Password**: Strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project initialization (~2 minutes)

### 2. Run Database Migrations

PipeDesk includes SQL migration files in `supabase/migrations/`.

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to SQL Editor in Supabase Dashboard
2. Run migrations in order:

```bash
# List migrations in order
ls -1 supabase/migrations/*.sql | sort
```

3. Copy each migration file content
4. Paste into SQL Editor
5. Click "Run"

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

### 3. Verify Database Setup

Run this query in SQL Editor to verify tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see tables like:
- `profiles`
- `master_deals`
- `player_tracks`
- `tasks`
- `comments`
- `companies`
- `contacts`
- `leads`
- etc.

### 4. Configure Authentication

#### Enable Email Authentication

1. Go to Authentication → Providers
2. Enable "Email" provider
3. Configure email templates (optional):
   - Confirmation email
   - Magic link email
   - Password recovery email

#### Configure Site URL

1. Go to Authentication → URL Configuration
2. Set **Site URL**:
   - Development: `http://localhost:5000`
   - Production: `https://your-domain.com`

3. Add **Redirect URLs**:
   - `http://localhost:5000/**` (development)
   - `https://your-domain.com/**` (production)

#### Configure Email Templates

Customize email templates in Authentication → Email Templates:

**Magic Link Template:**
```html
<h2>Welcome to PipeDesk</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
```

### 5. Set Up Row Level Security (RLS)

RLS is configured via migrations, but verify it's enabled:

```sql
-- Check RLS status for key tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

All main tables should have `rowsecurity = true`.

### 6. Configure Storage (Optional)

For document uploads:

1. Go to Storage → Buckets
2. Create a bucket named `documents`
3. Set policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to view their files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
```

## Google Workspace Integration

### Prerequisites

- Google Workspace or Google Cloud account
- Admin access to configure OAuth

### Setup Steps

#### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable APIs:
   - Google Drive API
   - Google Calendar API
   - Gmail API (optional, for email sync)
4. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
5. Configure OAuth consent screen:
   - App name: "PipeDesk"
   - User support email
   - Developer contact email
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5000/admin/integrations/google`
     - `https://your-domain.com/admin/integrations/google`
7. Save Client ID and Client Secret

#### 2. Configure in PipeDesk

1. Login as Admin
2. Navigate to Admin → Integrations → Google
3. Click "Connect Google Account"
4. Authorize access
5. Configure sync settings:
   - **Drive Folders**: Enable/disable auto-folder creation
   - **Calendar Sync**: Enable/disable deadline sync
   - **Gmail Sync**: Enable/disable (beta)

### Integration Features

**Google Drive:**
- Auto-create folders for each deal
- Hierarchical structure: Master Deal → Player Tracks
- Custom naming patterns
- Automatic permission management

**Google Calendar:**
- Sync deal deadlines
- Sync milestone dates
- Configurable sync interval
- Two-way sync (optional)

**Gmail (Beta):**
- Link email threads to deals
- Track communication history

## Pipeline Configuration

### Customize Pipeline Stages

1. Navigate to Admin → Pipeline Settings
2. Configure stages:

```json
{
  "stages": [
    { "id": "nda", "name": "NDA", "order": 1, "sla_days": 7 },
    { "id": "analysis", "name": "Analysis", "order": 2, "sla_days": 14 },
    { "id": "proposal", "name": "Proposal", "order": 3, "sla_days": 21 },
    { "id": "negotiation", "name": "Negotiation", "order": 4, "sla_days": 30 },
    { "id": "closing", "name": "Closing", "order": 5, "sla_days": 15 }
  ]
}
```

### Configure SLA Timeframes

Set time limits for each stage:
- Warning threshold (percentage)
- Maximum days in stage
- Alert recipients

## Custom Fields

### Create Custom Fields

1. Navigate to Custom Fields page
2. Click "Add Custom Field"
3. Configure:
   - **Name**: Field name
   - **Type**: Text, Number, Date, Select, Multi-select
   - **Entity**: Deal, Track, Task, Company, Contact
   - **Required**: Yes/No
   - **Options**: For select fields

### Example Custom Fields

**For Deals:**
- Asset Class (Select)
- Target IRR (Number)
- Investment Thesis (Text)

**For Player Tracks:**
- Minimum Check Size (Number)
- Investment Focus (Multi-select)
- Geographic Preference (Select)

**For Companies:**
- Industry (Select)
- Employee Count (Number)
- Website (Text)

## Tag Configuration

### Enable Tag Modules

1. Navigate to Admin → Tag Settings
2. Enable/disable tag categories:
   - Deal Tags
   - Player Tags
   - Task Tags
   - Company Tags

### Create Tags

1. Click "Add Tag"
2. Set:
   - Name
   - Color
   - Module (which entity type)
   - Description (optional)

## User Management

### Invite Users

1. Navigate to Admin → User Management
2. Click "Send Invite"
3. Fill in:
   - Email
   - Name
   - Role (Admin, Analyst, New Business, Client)
   - Expiration (optional)
4. Copy magic link and send to user

### Role Permissions

See [RBAC Guide](../features/rbac.md) for detailed permission matrix.

## Runtime Configuration

### GitHub Spark (Production)

PipeDesk is designed for GitHub Spark runtime:
- Automatic deployment
- KV store for rapid prototyping
- Edge functions

### Supabase (Recommended for Production)

For production deployments:
- PostgreSQL database
- Real-time subscriptions
- Row-level security
- Built-in authentication
- File storage

## Performance Optimization

### Code Splitting

PipeDesk uses automatic code splitting:
- Main bundle: ~145 KB (gzipped)
- Feature chunks loaded on-demand
- Analytics: ~994 KB
- Deals: ~183 KB

### Caching Strategy

```javascript
// Service worker configuration (optional)
{
  "cacheFirst": ["*.svg", "*.png", "*.jpg"],
  "networkFirst": ["api/*"],
  "staleWhileRevalidate": ["*.js", "*.css"]
}
```

## Troubleshooting Configuration

### Supabase Connection Issues

```bash
# Test connection
curl -H "apikey: YOUR_ANON_KEY" \
     https://your-project.supabase.co/rest/v1/profiles
```

Expected: 200 OK or 401 Unauthorized (not 404)

### Environment Variables Not Loading

1. Verify `.env` file is in project root
2. Restart development server
3. Check variable names start with `VITE_`
4. Check no spaces around `=` in `.env`

### Google OAuth Errors

1. Verify redirect URIs match exactly
2. Check OAuth consent screen is configured
3. Ensure APIs are enabled
4. Verify credentials are not expired

## Security Best Practices

1. **Never commit `.env` to Git**
   - Add to `.gitignore`
   - Use `.env.example` for templates

2. **Use environment-specific credentials**
   - Different keys for dev/staging/production
   - Rotate keys periodically

3. **Enable RLS in Supabase**
   - Test policies thoroughly
   - Use service role key only server-side

4. **Secure Google OAuth**
   - Use HTTPS in production
   - Implement PKCE flow
   - Regularly review authorized apps

## Next Steps

- [Quick Start Guide](quick-start.md)
- [Features Overview](../features/)
- [Development Guide](../development/)

---

**Previous:** [Installation](installation.md) | **Next:** [Features](../features/)
