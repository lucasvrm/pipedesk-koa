# RBAC & Permissions

PipeDesk implements a comprehensive Role-Based Access Control (RBAC) system with magic link authentication, enabling secure multi-user collaboration with granular permission management.

## Overview

The RBAC system provides:
- **Four-tier role hierarchy** (Admin, Analyst, New Business, Client)
- **Granular permission system** for fine-grained access control
- **Magic link authentication** for passwordless, secure access
- **Player name anonymization** for external clients
- **Row-Level Security (RLS)** via Supabase policies

## User Roles

### Admin
**Full system access and control**

Capabilities:
- ✅ Manage users (invite, edit, delete)
- ✅ Configure pipeline and settings
- ✅ Manage integrations (Google Workspace, etc.)
- ✅ Export data (Excel, CSV)
- ✅ Access all features without restrictions
- ✅ View audit logs and system metrics

Use Cases:
- System administrators
- Platform owners
- Senior management with full oversight

### Analyst
**Deal management and operational access**

Capabilities:
- ✅ Create and edit deals
- ✅ Manage player tracks
- ✅ Assign and complete tasks
- ✅ View analytics and reports
- ✅ Add comments and mentions
- ❌ Cannot manage users or system settings
- ❌ Cannot export data
- ❌ Cannot access admin integrations

Use Cases:
- Investment analysts
- Deal managers
- Operations team members

### New Business
**Read-only access to all deals**

Capabilities:
- ✅ View all deals and player tracks
- ✅ View real player names
- ✅ Browse companies and contacts
- ❌ Cannot create or modify anything
- ❌ Cannot access analytics
- ❌ Cannot assign tasks

Use Cases:
- Business development team
- Sales team viewing pipeline
- Stakeholders needing visibility without editing rights

### Client
**Limited external access with data protection**

Capabilities:
- ✅ View specific deals they're involved in
- ⚠️ Player names are anonymized (e.g., "Player A", "Player B")
- ✅ Read-only access to their deals
- ❌ Cannot create or modify anything
- ❌ Cannot see other deals
- ❌ No access to admin features

Use Cases:
- External clients viewing their deals
- Partners with limited visibility
- Third parties requiring controlled access

## Permission Matrix

| Permission | Admin | Analyst | New Business | Client |
|-----------|:-----:|:-------:|:------------:|:------:|
| **Deals** |
| View Deals | ✅ | ✅ | ✅ | ✅* |
| Create Deals | ✅ | ✅ | ❌ | ❌ |
| Edit Deals | ✅ | ✅ | ❌ | ❌ |
| Delete Deals | ✅ | ❌ | ❌ | ❌ |
| **Player Tracks** |
| View Tracks | ✅ | ✅ | ✅ | ⚠️ |
| Create Tracks | ✅ | ✅ | ❌ | ❌ |
| Edit Tracks | ✅ | ✅ | ❌ | ❌ |
| See Real Player Names | ✅ | ✅ | ✅ | ❌ |
| **Tasks** |
| View Tasks | ✅ | ✅ | ✅ | ✅* |
| Create Tasks | ✅ | ✅ | ❌ | ❌ |
| Assign Tasks | ✅ | ✅ | ❌ | ❌ |
| Complete Tasks | ✅ | ✅ | ❌ | ❌ |
| **Analytics** |
| View Analytics | ✅ | ✅ | ❌ | ❌ |
| Export Data | ✅ | ❌ | ❌ | ❌ |
| **Companies & Contacts** |
| View | ✅ | ✅ | ✅ | ❌ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Leads** |
| View Leads | ✅ | ✅ | ❌ | ❌ |
| Create Leads | ✅ | ✅ | ❌ | ❌ |
| Qualify Leads | ✅ | ✅ | ❌ | ❌ |
| **Administration** |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Configure Pipeline | ✅ | ❌ | ❌ | ❌ |
| Manage Tags | ✅ | ❌ | ❌ | ❌ |
| Manage Integrations | ✅ | ❌ | ❌ | ❌ |
| View Audit Log | ✅ | ❌ | ❌ | ❌ |

\* Limited to deals they're associated with

⚠️ Player names are anonymized

## Granular Permissions

The system uses granular permissions for fine-grained control:

### Tracks Module
- `tracks.view` - View tracks and details
- `tracks.create` - Create new tracks
- `tracks.update` - Update existing tracks
- `tracks.manage` - Full administration (including deletion)

### Pipeline Module
- `pipeline.manage` - Access pipeline settings
- `pipeline.update` - Modify stages and SLAs

### Tags Module
- `tags.manage` - Access tag settings
- `tags.update` - Create/edit/delete tags

### Custom Fields Module
- `custom_fields.manage` - Access custom fields page

### RBAC Module
- `rbac.manage` - Manage roles and permissions

### Leads Module
- `leads.view` - View leads
- `leads.create` - Create leads
- `leads.update` - Edit leads
- `leads.qualify` - Convert leads to deals
- `leads.delete` - Delete leads

### Contacts Module
- `contacts.view` - View contacts
- `contacts.create` - Create contacts
- `contacts.update` - Edit contacts
- `contacts.delete` - Delete contacts

### Companies Module
- `companies.view` - View companies
- `companies.create` - Create companies
- `companies.update` - Edit companies
- `companies.delete` - Delete companies

## Magic Link Authentication

### Overview
PipeDesk uses passwordless magic link authentication for secure, frictionless access.

### How It Works

1. **Admin sends invitation**
   - Fills in user details (name, email, role)
   - Sets expiration period (24h, 48h, 72h, or 7 days)
   - System generates secure 64-character token
   - Admin copies magic link or email template

2. **User receives invitation**
   - Email with magic link
   - Link format: `https://app.com/auth?token=abc123...`

3. **User clicks link**
   - System validates token
   - Checks: not expired, not used, not revoked
   - Automatically logs user in
   - Token marked as "Used"

4. **Secure session**
   - User authenticated
   - Role and permissions loaded
   - Session persisted

### Token Security

**Generation:**
- 64-character random tokens
- Cryptographically secure randomness
- Unique per invitation

**Validation:**
- Time-based expiration
- One-time use (prevents replay attacks)
- Admin revocation capability
- Status tracking (Active, Used, Expired, Revoked)

**Protection:**
- HTTPS-only transmission
- Short expiration windows
- No token reuse
- Automatic cleanup of expired tokens

## User Management

### Inviting Users (Admin Only)

1. **Navigate to User Management**
   - Click avatar → "Gerenciar Usuários"

2. **Click "Enviar Convite"**

3. **Fill in User Details:**
   - **Name**: User's full name
   - **Email**: Valid email address
   - **Role**: Select from Admin, Analyst, New Business, or Client
   - **Company**: (Optional) For client users
   - **Expiration**: Choose link validity period

4. **Create Invitation**
   - Click "Criar Convite"
   - Copy magic link or email template
   - Send to user via your email client

### Managing Magic Links (Admin Only)

1. **View All Links**
   - In User Management dialog, click "Ver Links"

2. **Features:**
   - See all invitation links with status
   - Copy active links to resend
   - Revoke links that should no longer be valid
   - Filter by status
   - View user details

### Editing Users (Admin Only)

1. Click "Edit" on any user
2. Update name, email, role, or company
3. Save changes
4. User permissions update immediately

### Deleting Users (Admin Only)

1. Click "Delete" on any user
2. Confirm deletion
3. User loses access immediately
4. Cannot delete yourself (protection)

## Player Name Anonymization

### Purpose
Protect competitive intelligence when sharing deals with external clients.

### How It Works

**For Admin, Analyst, and New Business:**
- Real names displayed: "JPMorgan Chase", "Goldman Sachs", "Blackstone"

**For Client role:**
- Anonymized names: "Player A", "Player B", "Player C"
- Consistent anonymization across all views
- Alphabetically sorted by anonymized name

### Where It Applies

- Deal detail dialogs
- Player track lists
- Kanban boards
- Master matrix view
- Analytics dashboards
- Task assignments

### Implementation

```typescript
// Check permission to view real names
if (canViewPlayerName(user.role)) {
  return playerTrack.name; // Real name
} else {
  return anonymizePlayerName(playerTrack.name, index); // "Player A"
}
```

## Permission Enforcement

### Frontend (UX Layer)

**Component-Level Protection:**
```tsx
<RequirePermission permission="leads.qualify">
  <Button>Qualify Lead</Button>
</RequirePermission>
```

**Hook-Based Checks:**
```typescript
const { hasPermission } = useAuth();

if (hasPermission('deals.create')) {
  // Show create button
}
```

**Route Protection:**
```tsx
<Route path="/admin/users" element={
  <ProtectedRoute requiredRole={['admin']}>
    <UserManagementPage />
  </ProtectedRoute>
} />
```

### Backend (Security Layer)

**Row-Level Security (RLS):**
```sql
-- Supabase policy example
CREATE POLICY "Contacts update" ON contacts
  FOR UPDATE 
  USING (public.has_permission('contacts.update'));
```

**Function-Level Checks:**
```sql
-- RPC function example
CREATE FUNCTION qualify_lead(lead_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT public.has_permission('leads.qualify') THEN
    RAISE EXCEPTION 'Access Denied: Missing permission leads.qualify';
  END IF;
  -- Proceed with qualification
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Implementation Status

### ✅ Fully Implemented
- Four-tier role system
- Magic link authentication
- User management interface
- Token generation and validation
- Player name anonymization
- Frontend permission checks
- Protected routes
- Role-based UI rendering

### ⚠️ Partially Implemented
- `tracks.*` permissions: Backend ✅, Frontend route protection ❌
- `pipeline.*` permissions: Using role check instead of granular permission
- `tags.*` permissions: Using role check instead of granular permission
- `companies.*` permissions: Backend ✅, Frontend partial

### ❌ Not Yet Implemented
- `custom_fields.manage` permission enforcement
- Audit trail for permission changes
- Permission inspector UI
- Feature flags for gradual RBAC rollout

## Best Practices

### For Admins

1. **Minimum Expiration Time**
   - Use 24-48 hours for most invitations
   - Shorter periods reduce security risk
   - Can always resend if expired

2. **Role Assignment**
   - Start with least privilege (New Business or Analyst)
   - Upgrade roles as needed
   - Review roles periodically

3. **Client Access**
   - Only invite when necessary
   - Use shortest reasonable expiration
   - Revoke access when engagement ends

4. **Token Management**
   - Regularly review active links
   - Revoke unused/suspicious tokens
   - Clean up expired tokens

### For Developers

1. **Always Check Permissions**
   ```typescript
   // Good
   if (hasPermission('deals.create')) {
     createDeal();
   }
   
   // Bad
   if (user.role === 'admin' || user.role === 'analyst') {
     createDeal(); // Fragile, doesn't scale
   }
   ```

2. **Use Components**
   ```tsx
   // Good
   <RequirePermission permission="leads.qualify">
     <QualifyButton />
   </RequirePermission>
   
   // Bad
   {user.role !== 'client' && <QualifyButton />}
   ```

3. **Backend Validation**
   - Never trust frontend permissions
   - Always validate in RLS policies
   - Double-check in RPC functions

## Troubleshooting

### User Cannot Log In

**Check:**
1. Token not expired
2. Token not already used
3. Token not revoked
4. Correct URL format

**Solution:**
- Regenerate and resend invitation

### Wrong Permissions

**Check:**
1. User role is correct
2. Database permissions seeded correctly
3. RLS policies enabled

**Solution:**
- Edit user role if incorrect
- Run permission seed migrations

### Player Names Not Anonymizing

**Check:**
1. User role is "Client"
2. Anonymization function called
3. Frontend using correct permission check

**Solution:**
- Verify `canViewPlayerName()` implementation

### Permission Denied Errors

**Check:**
1. RLS policies enabled on table
2. `has_permission()` function exists
3. Permission exists in database

**Solution:**
- Run migrations to create policies
- Verify permission seeds

## Security Considerations

### Token Security
- ✅ 64-character cryptographically random tokens
- ✅ HTTPS-only transmission
- ✅ One-time use enforcement
- ✅ Short expiration windows
- ✅ Admin revocation capability

### Session Security
- ✅ Persistent session management
- ✅ Automatic session timeout
- ✅ Secure cookie flags
- ✅ CSRF protection (via Supabase)

### Data Protection
- ✅ Row-Level Security (RLS)
- ✅ Player name anonymization
- ✅ Permission-based data filtering
- ✅ Audit logging

### Access Control
- ✅ Frontend permission checks
- ✅ Backend RLS policies
- ✅ Function-level authorization
- ✅ Route protection

## Future Improvements

### Planned Enhancements

1. **Permission Inspector**
   - UI to view effective permissions
   - Debug why a check passed/failed
   - Show permission inheritance

2. **Audit Trail**
   - Log all permission changes
   - Track who modified roles
   - Record access attempts

3. **Advanced Permissions**
   - Team-based permissions
   - Deal-level access control
   - Dynamic permission assignment

4. **Self-Service**
   - User profile management
   - Password reset flows
   - Multi-factor authentication (MFA)

## Related Documentation

- [Quick Start Guide](../getting-started/quick-start.md)
- [Configuration Guide](../getting-started/configuration.md)
- [Security Policy](../SECURITY.md)
- [User Management (Admin Guide)](../development/admin-guide.md)

---

**Need help?** Check the [Troubleshooting Guide](../development/troubleshooting.md) or open an issue on GitHub.
