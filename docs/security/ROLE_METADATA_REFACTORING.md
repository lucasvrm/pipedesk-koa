# Role Metadata Manager - Refactoring Documentation

## Overview

This document explains the refactoring of the role management system to establish a single source of truth for role metadata.

## Problem Statement

Previously, there were TWO different places to manage roles:

1. **Old CRUD**: `/admin/users` → "Funções e Permissões" tab
   - Component: `RolesManager` (from `@/features/rbac/components/RolesManager`)
   - Managed: Role definitions with permissions from the `roles` table
   - Issues: 
     - Permissions were stored in a many-to-many relationship table
     - Not integrated with the metadata system
     - Created confusion about where to manage roles

2. **New Metadata Manager**: Should be in `/admin/settings` → "Sistema" tab
   - Component: `RoleMetadataManager` (from `@/pages/admin/components/settings-sections/RoleMetadataManager`)
   - Manages: Role metadata including label, description, badgeVariant, permissions
   - Storage: `user_role_metadata` table
   - Integrated with the system metadata architecture

## Solution Implemented

### Phase 1: Establish Official Home for Role Metadata

The **official home** for role definition is now:
- **Path**: `/admin/settings` → Tab "Sistema" → Section "Metadados de Roles"
- **Component**: `RoleMetadataManager`
- **Included in**: `SystemSettingsSection`

Features available in RoleMetadataManager:
- ✅ View all roles (admin, analyst, newbusiness, client)
- ✅ Edit role properties:
  - `label` - Display name (e.g., "Administrador")
  - `description` - Role description
  - `badgeVariant` - Visual badge style (default, secondary, outline, destructive)
  - `permissions` - Comma-separated list of permissions
  - `sortOrder` - Display order
- ✅ Create new roles
- ✅ Delete roles (with warning about users)
- ✅ Real-time updates via `useSystemMetadata` hook

### Phase 2: Simplify User Management

The **user management page** is now:
- **Path**: `/admin/users`
- **Purpose**: Manage users and assign roles ONLY
- **Cannot**: Edit role definitions

Changes made to `UserManagementPage.tsx`:
1. ❌ Removed "Funções e Permissões" tab
2. ❌ Removed `RolesManager` import and usage
3. ❌ Removed `Tabs` structure (only one section now)
4. ✅ Added informational card directing users to `/admin/settings` → "Sistema"
5. ✅ Kept role assignment dropdown using `userRoleMetadata` from system metadata

### Phase 3: Role Assignment Flow

When managing users in `/admin/users`:

1. User clicks "Criar Manualmente" or edits existing user
2. User form appears with "Função" dropdown
3. Dropdown is populated from `userRoleMetadata` (system metadata)
4. User selects role and saves
5. Role is assigned to user (stored in `users.role` field)

**Important**: The role dropdown always reflects the current metadata, so any changes made in `/admin/settings` → "Sistema" immediately appear in the user form.

## Data Flow

```
┌─────────────────────────────────────┐
│  user_role_metadata table           │
│  - code (admin, analyst, etc.)      │
│  - label (Administrador, etc.)      │
│  - description                       │
│  - badgeVariant                      │
│  - permissions (array)               │
│  - sortOrder                         │
└────────────┬────────────────────────┘
             │
             │ Read by
             ▼
┌─────────────────────────────────────┐
│  useSystemMetadata hook             │
│  - Fetches all metadata             │
│  - Provides userRoleMetadata        │
│  - Provides getUserRoleByCode()     │
└────────────┬────────────────────────┘
             │
             │ Used by
             ▼
┌─────────────────────────────────────────────────────┐
│  Two places:                                        │
│                                                     │
│  1. RoleMetadataManager                            │
│     - Edit role definitions                        │
│     - Location: /admin/settings → Sistema          │
│                                                     │
│  2. UserManagementPage                             │
│     - Assign roles to users                        │
│     - Location: /admin/users                       │
│     - Dropdown populated from userRoleMetadata     │
└─────────────────────────────────────────────────────┘
```

## Benefits of This Architecture

1. **Single Source of Truth**: All role metadata comes from `user_role_metadata` table
2. **Consistent UX**: Role labels and badges are consistent across the application
3. **Centralized Management**: Admins know exactly where to go to manage role definitions
4. **Separation of Concerns**: 
   - Settings page = Define what roles mean
   - Users page = Assign roles to users
5. **Integrated Metadata**: Roles are part of the system metadata architecture
6. **Type Safety**: Using `useSystemMetadata` hook ensures type safety

## Migration Notes

### For Developers

- ✅ Import `userRoleMetadata` from `useSystemMetadata` hook, not from old role service
- ✅ Use `getUserRoleByCode()` to get role information
- ✅ Display role badges using `role.badgeVariant` from metadata
- ❌ Don't create new role management interfaces
- ❌ Don't bypass the metadata system

### For Users/Admins

- ℹ️ Go to `/admin/settings` → Tab "Sistema" to manage role definitions
- ℹ️ Go to `/admin/users` to manage users and assign roles
- ℹ️ Changes to role metadata are immediately reflected throughout the application

## Files Changed

1. **src/pages/admin/UserManagementPage.tsx**
   - Removed "Funções e Permissões" tab
   - Removed RolesManager component
   - Added informational card
   - Simplified structure (no more Tabs)

2. **src/pages/admin/components/settings-sections/index.ts**
   - Added export for RoleMetadataManager

3. **src/pages/admin/components/settings-sections/SystemSettingsSection.tsx** (no changes, already correct)
   - Already includes RoleMetadataManager component

4. **src/pages/admin/components/settings-sections/RoleMetadataManager.tsx** (no changes, already correct)
   - Complete role metadata management interface

## Testing Checklist

- [ ] Navigate to `/admin/settings` → "Sistema" tab
- [ ] Verify "Metadados de Roles" section is visible
- [ ] Verify all roles are displayed (admin, analyst, newbusiness, client)
- [ ] Test editing a role (label, description, badgeVariant, permissions)
- [ ] Verify changes are saved and reflected immediately
- [ ] Navigate to `/admin/users`
- [ ] Verify informational card is displayed
- [ ] Create/edit a user and verify role dropdown is populated
- [ ] Verify role labels match the metadata (not raw codes)
- [ ] Verify role assignment works correctly
- [ ] Check that role badges throughout the app use correct variants

## Future Enhancements

- Consider deprecating the old `RolesManager` component entirely
- Add role usage statistics (how many users have each role)
- Add validation to prevent deletion of roles in use
- Add role templates for quick setup
- Consider adding role hierarchy/inheritance
