import { useAuth } from '@/contexts/AuthContext';
import { Permission, UserRole } from '@/lib/types';
import { usePermissions, useRoles } from '@/services/roleService';
import { useQuery } from '@tanstack/react-query';

export function useUserPermissions() {
  const { profile } = useAuth();
  const { data: roles = [] } = useRoles();
  // We can't fetch ALL permissions here efficiently if the system grows,
  // but currently `getRoles` returns `permissions` nested.
  // So we just need to find the user's role and extract permissions.

  // NOTE: Ideally, the profile itself should carry permissions or we fetch specifically for the user.
  // Given current architecture where profile has `role` (string), we map it to the Role object.

  // Find the role object matching profile.role
  // profile.role is a string (e.g. 'admin'). roles is Array<Role>.
  // We match by name? Or ID? Schema has roles.name.

  const userRole = roles.find(r => r.name === profile?.role);

  const permissions = userRole?.permissions?.map(p => p.code) || [];

  return {
    permissions,
    hasPermission: (code: string) => permissions.includes(code),
    isAdmin: profile?.role === 'admin'
  };
}

export function RequirePermission({ children, permission, fallback = null }: { children: React.ReactNode, permission: string, fallback?: React.ReactNode }) {
  const { hasPermission, isAdmin } = useUserPermissions();

  if (isAdmin) return <>{children}</>; // Admins usually bypass, but strictly we should check permissions if RBAC is strict.
  // For now, let's assume 'admin' role has all perms bound in DB (step 1 did this).

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
