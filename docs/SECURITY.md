# Security Documentation

## Table of Contents
1. [Security Model Overview](#security-model-overview)
2. [Roles and Permissions](#roles-and-permissions)
3. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
4. [Authentication](#authentication)
5. [Best Practices](#best-practices)
6. [Environment Configuration](#environment-configuration)
7. [Incident Response Plan](#incident-response-plan)
8. [Deployment Checklist](#deployment-checklist)

---

## Security Model Overview

PipeDesk-Koa implements a multi-layered security approach:

- **Authentication**: Supabase Auth with magic link authentication
- **Authorization**: Role-Based Access Control (RBAC) with 4 distinct roles
- **Data Protection**: Row Level Security (RLS) policies on all tables
- **Input Validation**: Client-side and server-side sanitization
- **Audit Logging**: Comprehensive activity tracking
- **Real-time Security**: Supabase realtime with authenticated channels

### Architecture

```
┌─────────────────────────────────────────────────┐
│              Client Application                  │
│  - React Query for data fetching               │
│  - Security utils for permission checks        │
│  - Input sanitization on user actions          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Supabase Backend                      │
│  - Authentication (auth.users)                  │
│  - RLS Policies (database level)               │
│  - Realtime subscriptions (authenticated)       │
└─────────────────────────────────────────────────┘
```

---

## Roles and Permissions

PipeDesk uses a single-tenant model with four distinct roles:

### Role Hierarchy

```
Admin > Analyst > New Business > Client
```

### Role Definitions

#### 1. Admin
**Description**: Full system access with management capabilities

**Permissions**:
- ✅ View all data
- ✅ Edit all data
- ✅ Delete all data
- ✅ Manage users
- ✅ Manage system settings
- ✅ View analytics
- ✅ Export data
- ✅ Manage RBAC policies

**Use Cases**:
- System administrators
- IT managers
- Data governance officers

#### 2. Analyst
**Description**: Operational role with broad access to deals and data

**Permissions**:
- ✅ View all data
- ✅ Edit all data
- ❌ Delete data
- ❌ Manage users
- ❌ Manage system settings
- ✅ View analytics
- ✅ Export data
- ❌ Manage RBAC policies

**Use Cases**:
- Deal managers
- M&A analysts
- Operations team

#### 3. New Business
**Description**: Read-only access with analytics capabilities

**Permissions**:
- ✅ View all data
- ❌ Edit data
- ❌ Delete data
- ❌ Manage users
- ❌ Manage system settings
- ✅ View analytics
- ❌ Export data
- ❌ Manage RBAC policies

**Use Cases**:
- Business development
- Sales team
- Strategic partners

#### 4. Client
**Description**: Limited access to own entities only

**Permissions**:
- ✅ View own data only
- ❌ Edit data
- ❌ Delete data
- ❌ Manage users
- ❌ Manage system settings
- ❌ View analytics
- ❌ Export data
- ❌ Manage RBAC policies

**Use Cases**:
- External clients
- Limited partners
- Observers

### Permission Checking

Use the security utilities to check permissions:

```typescript
import { usePermission, useEntityPermissions } from '@/utils/security';

// Check global permission
const canManageUsers = usePermission('canManageUsers');

// Check entity-specific permissions
const { canView, canEdit, canDelete } = useEntityPermissions(entityOwnerId);
```

---

## Row Level Security (RLS) Policies

All tables in the database have RLS enabled to enforce access control at the database level.

### Users Table

**Policies**:
- `Users can view all users` - All authenticated users can read user data
- `Users can update own profile` - Users can only update their own profile
- `Only admins can insert users` - Only admin role can create users
- `Only admins can delete users` - Only admin role can delete users

**Implementation**:
```sql
-- Users can read all other users (for collaboration features)
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Master Deals Table

**Recommended Policies**:
```sql
-- All authenticated users can view deals
CREATE POLICY "Authenticated users can view deals"
  ON master_deals FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and analysts can create deals
CREATE POLICY "Admins and analysts can create deals"
  ON master_deals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'analyst')
    )
  );

-- Admins and analysts can update deals
CREATE POLICY "Admins and analysts can update deals"
  ON master_deals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'analyst')
    )
  );

-- Only admins can delete deals
CREATE POLICY "Only admins can delete deals"
  ON master_deals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### Notifications Table

**Policies**:
```sql
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
```

### Activity Log Table

**Policies**:
```sql
-- All authenticated users can view activity log
CREATE POLICY "Authenticated users can view activity log"
  ON activity_log FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can insert to activity log
CREATE POLICY "Authenticated users can create activity log"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No one can update or delete activity log
-- (immutable audit trail)
```

---

## Authentication

### Supabase Auth Integration

PipeDesk uses Supabase Auth with automatic user profile creation:

1. **User Registration**: When a user signs up via Supabase Auth, a trigger automatically creates a corresponding record in the `users` table
2. **User Profile**: The trigger function `handle_new_user()` creates the profile with metadata from auth
3. **Session Management**: Supabase handles JWT tokens and session refresh

### Trigger Function

```sql
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, avatar, has_completed_onboarding)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'analyst'),
    NEW.raw_user_meta_data->>'avatar',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Client-Side Auth

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signOut } = useAuth();
  
  if (!user) {
    return <button onClick={() => signIn(email)}>Sign In</button>;
  }
  
  return <div>Welcome, {user.name}</div>;
}
```

---

## Best Practices

### 1. Input Sanitization

**Always sanitize user input** before storing or displaying:

```typescript
import { sanitizeInput, sanitizeObject } from '@/utils/security';

// Sanitize single input
const safeName = sanitizeInput(userInput);

// Sanitize entire object
const safeData = sanitizeObject(formData);
```

### 2. Permission Checks

**Check permissions before UI actions**:

```typescript
import { usePermission } from '@/utils/security';

function DealActions() {
  const canDelete = usePermission('canDeleteAll');
  
  return (
    <>
      <button>View</button>
      <button>Edit</button>
      {canDelete && <button>Delete</button>}
    </>
  );
}
```

### 3. Validation

**Validate all inputs**:

```typescript
import { isValidEmail, isValidUUID } from '@/utils/security';

if (!isValidEmail(email)) {
  throw new Error('Invalid email format');
}

if (!isValidUUID(dealId)) {
  throw new Error('Invalid deal ID');
}
```

### 4. Security Logging

**Log security-relevant events**:

```typescript
import { logSecurityEvent } from '@/utils/security';

await logSecurityEvent({
  userId: user.id,
  action: 'DELETE_DEAL',
  entityType: 'deal',
  entityId: dealId,
  status: 'success',
});
```

### 5. Rate Limiting

**Implement client-side rate limiting** for sensitive operations:

```typescript
import { rateLimiter } from '@/utils/security';

if (rateLimiter.isRateLimited('password-reset', 3, 60000)) {
  toast.error('Too many attempts. Please wait.');
  return;
}

rateLimiter.recordAttempt('password-reset');
// Proceed with action
```

### 6. Secure Defaults

- **Always use HTTPS** in production
- **Never log sensitive data** (passwords, tokens, etc.)
- **Use environment variables** for secrets
- **Enable MFA** for admin accounts
- **Regular security audits**

---

## Environment Configuration

### Development Environment

```env
# .env.development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Enable debug mode
VITE_DEBUG=true
```

### Production Environment

```env
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Ensure debug is disabled
VITE_DEBUG=false
```

### Security Configuration

1. **Supabase Dashboard**:
   - Enable RLS on all tables
   - Configure auth providers
   - Set up email templates
   - Configure password policies

2. **Database**:
   - Regular backups
   - Point-in-time recovery enabled
   - SSL connections enforced

3. **Application**:
   - CORS properly configured
   - CSP headers set
   - No sensitive data in logs

---

## Incident Response Plan

### 1. Detection

Monitor for:
- Failed authentication attempts
- Unauthorized access attempts
- Unusual data access patterns
- SQL injection attempts
- XSS attempts

### 2. Assessment

When an incident is detected:
1. **Determine scope**: What data/systems are affected?
2. **Assess impact**: What is the potential damage?
3. **Classify severity**: Critical, High, Medium, Low

### 3. Containment

Immediate actions:
1. **Isolate affected systems** if necessary
2. **Revoke compromised credentials**
3. **Enable additional monitoring**
4. **Document all actions**

### 4. Investigation

1. Review activity logs in `activity_log` table
2. Check Supabase auth logs
3. Analyze access patterns
4. Identify root cause

### 5. Recovery

1. **Restore from backup** if needed
2. **Patch vulnerabilities**
3. **Reset compromised credentials**
4. **Verify system integrity**

### 6. Post-Incident

1. **Document lessons learned**
2. **Update security policies**
3. **Notify affected parties** if required
4. **Implement preventive measures**

### Contact Information

- **Security Team**: security@pipedesk.com
- **Emergency Hotline**: [Pending]
- **Supabase Support**: support@supabase.io

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run all migrations in staging environment
- [ ] Verify RLS policies are enabled on all tables
- [ ] Test authentication flow
- [ ] Verify permission checks work correctly
- [ ] Run security tests
- [ ] Review and sanitize logs
- [ ] Check environment variables
- [ ] Verify SSL/TLS configuration

### Database

- [ ] Apply migration `001_fix_auth_reference.sql`
- [ ] Verify users table references auth.users
- [ ] Test trigger function `handle_new_user()`
- [ ] Confirm all RLS policies are active
- [ ] Create database backup
- [ ] Document rollback procedure

### Application

- [ ] Build passes with no errors
- [ ] All tests pass
- [ ] Security utilities properly imported
- [ ] React Query configured correctly
- [ ] Error boundaries in place
- [ ] Analytics tracking configured

### Post-Deployment

- [ ] Monitor error logs
- [ ] Verify authentication works
- [ ] Test user registration flow
- [ ] Verify RLS policies enforce correctly
- [ ] Check real-time subscriptions
- [ ] Monitor performance metrics
- [ ] Review security logs

### Rollback Plan

If issues occur:
1. Restore database from backup
2. Revert to previous application version
3. Disable new features via feature flags
4. Communicate with users
5. Investigate and fix issues
6. Plan re-deployment

---

## Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/security.html)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Last Updated**: 2025-11-21  
**Document Owner**: Security Team  
**Review Frequency**: Quarterly
