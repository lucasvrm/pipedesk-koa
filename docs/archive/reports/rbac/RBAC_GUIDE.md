# Role-Based Access Control (RBAC) System

## Overview
PipeDesk now includes a complete Role-Based Access Control system with magic link authentication, enabling secure external client access with data anonymization.

## Features Implemented

### 1. Four-Tier Permission System
- **Admin**: Full system access including user management and integrations
- **Analyst**: Can create/edit deals, assign tasks, and view analytics
- **New Business**: View-only access to all deal data
- **Client**: Limited access with anonymized player names for data protection

### 2. Magic Link Authentication
- Secure 64-character token generation
- Configurable expiration (24h, 48h, 72h, 7 days)
- One-time use tokens
- Admin revocation capability
- Token status tracking (Active, Used, Expired, Revoked)

### 3. User Management
- **Invite Users**: Send magic link invitations via email
- **Manage Users**: Edit roles, update information
- **View Magic Links**: Dashboard showing all invitation links and their status
- **Manual Creation**: Create users directly without invitation flow

### 4. Player Name Anonymization
For client users, sensitive player names are automatically anonymized:
- Real name: "JPMorgan Chase" → Display: "Player A"
- Protects competitive intelligence
- Applies across all views (deals, matrix, analytics)

## How to Use

### Inviting a New User (Admin Only)

1. Click your avatar → **Gerenciar Usuários**
2. Click **Enviar Convite** button
3. Fill in user details:
   - Name and email
   - Role (Admin, Analyst, New Business, or Client)
   - Company (for clients)
   - Link expiration period
4. Click **Criar Convite**
5. Copy the magic link or email template
6. Send to the user via email

### Managing Magic Links (Admin Only)

1. In User Management dialog, click **Ver Links**
2. View all invitation links with status
3. Copy active links to resend
4. Revoke links that should no longer be valid

### User Login Flow

1. User receives magic link via email
2. Clicks link (format: `https://app.com/auth?token=...`)
3. System validates token (not expired, not used, not revoked)
4. User is authenticated and redirected to dashboard
5. Token marked as "Used" automatically

### Testing RBAC Features

1. Navigate to **RBAC** page (admin only)
2. View your current permissions
3. See how different roles affect access
4. Learn about magic link authentication system

## Permission Matrix

| Permission | Admin | Analyst | New Business | Client |
|-----------|-------|---------|--------------|--------|
| View Deals | ✅ | ✅ | ✅ | ✅ |
| Create Deals | ✅ | ✅ | ❌ | ❌ |
| Edit Deals | ✅ | ✅ | ❌ | ❌ |
| Delete Deals | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ❌ | ❌ |
| See Real Player Names | ✅ | ✅ | ✅ | ❌ |
| Assign Tasks | ✅ | ✅ | ❌ | ❌ |
| Manage Integrations | ✅ | ❌ | ❌ | ❌ |

## Security Features

### Token Security
- 64-character random tokens
- Secure generation using cryptographic randomness
- Single-use to prevent replay attacks
- Time-based expiration
- Admin revocation capability

### Data Protection
- Client users see anonymized player names
- Permission checks on all sensitive operations
- Authentication required for all protected routes
- Role-based UI rendering (features hidden if no access)

### Session Management
- Persistent login via `useKV` storage
- Sign out clears user session
- Automatic redirect on token-based login

## Code Structure

```
src/
├── components/
│   ├── InviteUserDialog.tsx       # Invitation creation
│   ├── MagicLinksDialog.tsx       # Link management
│   ├── MagicLinkAuth.tsx          # Auth flow
│   ├── UserManagementDialog.tsx   # User CRUD
│   └── RBACDemo.tsx               # Feature demo
├── lib/
│   ├── auth.ts                    # Auth utilities
│   ├── permissions.ts             # Permission system
│   └── types.ts                   # Type definitions
```

## Data Storage

All authentication data is persisted using `spark.kv`:

- `currentUser`: Current logged-in user
- `users`: Array of all system users
- `magicLinks`: Array of all invitation links with status

## Future Enhancements

Potential improvements for future iterations:

1. **Email Integration**: Actual email sending instead of copy/paste
2. **2FA**: Two-factor authentication for admins
3. **Session Timeout**: Auto-logout after inactivity
4. **Audit Log**: Track all authentication events
5. **Password Auth**: Option for password-based login
6. **SSO**: Single Sign-On with corporate identity providers

## Troubleshooting

### Magic Link Not Working
- Check if link has expired
- Verify link wasn't already used
- Confirm link wasn't revoked by admin
- Ensure full URL was copied

### User Can't See Expected Features
- Verify user role matches required permissions
- Check Permission Matrix above
- Admin may need to update user role

### Player Names Not Anonymizing
- Confirm user role is "Client"
- Check component is using `canViewPlayerName()` helper
- Verify player list is using anonymization function
