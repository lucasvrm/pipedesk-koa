# RBAC & Permissions Guide

## Roles
- **admin**: Full system access.
- **analyst**: Can view and edit deals/tracks, but cannot manage system settings.
- **newbusiness**: Can view deals/tracks and analytics.
- **client**: Restricted access to their own data.

## Permissions
Access is controlled via permissions linked to roles in the `role_permissions` table.

| Permission Code | Description | Default Roles |
|-----------------|-------------|---------------|
| `pipeline.manage` | Access to Pipeline Settings page (Admin UI). | admin |
| `pipeline.update` | Ability to update stages, SLAs, and transitions. | admin |
| `tags.manage` | Access to Tag Settings page (Admin UI). | admin |
| `tags.update` | Ability to create/edit/delete global tags. | admin |

## Frontend Enforcement
Use the `RequirePermission` component to protect routes or UI elements:

```tsx
<RequirePermission permission="pipeline.manage" fallback={<Unauthorized />}>
  <PipelineSettingsPage />
</RequirePermission>
```

## Backend Enforcement
RLS policies and Service logic should enforce these constraints. Currently, most admin operations rely on the `admin` role check or the bound permissions.
