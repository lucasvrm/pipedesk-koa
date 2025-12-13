# Dashboard Templates - Role-Based Layouts

## Overview

This feature allows the system to store and manage dashboard layouts per role in the database, rather than having them hardcoded in the application. This enables administrators to customize the default dashboard experience for different user roles without requiring code changes.

## Architecture

### Database Schema

**Table: `dashboard_templates`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `role` | TEXT | User role (admin, analyst, client, newbusiness) or NULL for global default |
| `config` | JSONB | Dashboard configuration with `topWidgets` and `mainWidgets` arrays |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Constraints:**
- Unique constraint on `role` to ensure one template per role
- NULL `role` represents the global default template

**Security:**
- Row Level Security (RLS) enabled
- Anyone can read templates
- Only admins can create/update/delete templates

### Loading Priority

When a user loads the dashboard, the layout is determined in the following order:

1. **User Preferences** - User's personal saved layout (from `profiles.preferences.dashboard`)
2. **Role Template** - Template specific to the user's role from `dashboard_templates`
3. **Global Template** - Template with `role = NULL` from `dashboard_templates`
4. **Code Fallback** - Hardcoded default from `constants/dashboardDefaults.ts`

This ensures users can customize their own layout while still benefiting from role-appropriate defaults.

## Files Modified

### New Files

1. **`supabase/migrations/20251219_dashboard_templates.sql`**
   - Creates the `dashboard_templates` table
   - Seeds initial templates (global and admin)
   - Sets up RLS policies and indexes

2. **`src/services/dashboardTemplateService.ts`**
   - Service layer for dashboard template operations
   - Functions:
     - `getTemplateForRole(role)` - Get template with fallback logic
     - `saveTemplate(role, config)` - Save/update a template
     - `getAllTemplates()` - Get all templates (admin)
     - `deleteTemplate(role)` - Delete a template (admin)

3. **`src/constants/dashboardDefaults.ts`**
   - Contains the hardcoded fallback configuration
   - Used only when database is unavailable or empty

4. **`tests/unit/services/dashboardTemplateService.test.ts`**
   - Unit tests for the template service
   - 7 test cases covering all scenarios

### Modified Files

1. **`src/hooks/useDashboardLayout.ts`**
   - Added template fetching with React Query
   - Updated loading priority to include role templates
   - Changed import from registry to constants

2. **`src/features/dashboard/registry.tsx`**
   - Removed `DEFAULT_DASHBOARD_CONFIG` export
   - Now contains only `WIDGET_REGISTRY`

3. **`src/pages/admin/DashboardSettings.tsx`**
   - Updated import to use constants

4. **`src/pages/DashboardPage.tsx`**
   - Updated import to use constants

## Usage

### For Developers

```typescript
// Get template for a specific role
import { getTemplateForRole } from '@/services/dashboardTemplateService';

const template = await getTemplateForRole('admin');
// Returns: { topWidgets: [...], mainWidgets: [...] } or null

// Save a new template
import { saveTemplate } from '@/services/dashboardTemplateService';

await saveTemplate('analyst', {
  topWidgets: ['widget1', 'widget2'],
  mainWidgets: ['widget3']
});
```

### For Administrators

Administrators can create custom templates for different roles through the admin interface (to be implemented) or directly in the database:

```sql
-- Create a template for the 'analyst' role
INSERT INTO dashboard_templates (role, config)
VALUES (
  'analyst',
  '{
    "topWidgets": ["notifications", "quick-tasks", "active-deals"],
    "mainWidgets": ["conversion-funnel", "my-deals"]
  }'::jsonb
)
ON CONFLICT (role) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = NOW();
```

## Seeded Templates

### Global Default (role = NULL)
```json
{
  "topWidgets": [
    "notifications",
    "quick-tasks",
    "weighted-pipeline",
    "active-deals",
    "conversion-rate",
    "total-deals"
  ],
  "mainWidgets": [
    "weighted-forecast",
    "portfolio-matrix",
    "my-deals"
  ]
}
```

### Admin Template
```json
{
  "topWidgets": [
    "notifications",
    "quick-tasks",
    "active-deals",
    "total-deals"
  ],
  "mainWidgets": [
    "team-workload",
    "sla-overview",
    "conversion-funnel",
    "my-deals"
  ]
}
```

## Available Widgets

Refer to `src/features/dashboard/registry.tsx` for the complete list of available widgets. Each widget has:
- `id` - Unique identifier
- `title` - Display name
- `component` - React component
- `defaultSize` - Suggested size (small, medium, large, full)
- `category` - Type (kpi, chart, list, operational)
- `requiredPermissions` - Optional permission requirements
- `requiredRoles` - Optional role requirements

## Testing

Run the dashboard template service tests:

```bash
npm test -- tests/unit/services/dashboardTemplateService.test.ts
```

All tests verify:
- Role-specific template retrieval
- Global template fallback
- Error handling
- Template saving
- Template listing

## Future Enhancements

1. **Admin UI** - Create a visual interface for managing templates
2. **Template Cloning** - Allow admins to clone templates between roles
3. **Template Versioning** - Track changes to templates over time
4. **Widget Recommendations** - Suggest widgets based on role and usage patterns
5. **Template Validation** - Ensure widget IDs are valid before saving

## Migration

To apply the migration:

```bash
# Using Supabase CLI
supabase migration up

# Or apply directly to the database
psql -d your_database -f supabase/migrations/20251219_dashboard_templates.sql
```

## Backward Compatibility

The implementation is fully backward compatible:
- Users with existing preferences continue to see their customized layouts
- If the database is unavailable, the system falls back to hardcoded defaults
- No breaking changes to existing APIs or hooks
