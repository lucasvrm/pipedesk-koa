import { supabase } from '@/lib/supabaseClient';
import { Role, Permission } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RolePermissionRow {
  permissions: Permission;
}

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  role_permissions: RolePermissionRow[];
}

function mapRoleFromDB(role: RoleRow): Role {
  return {
    id: role.id,
    name: role.name,
    description: role.description || '',
    isSystem: role.is_system,
    permissions: (role.role_permissions ?? []).map((rp) => rp.permissions)
  };
}

// --- API ---

export async function getRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*, role_permissions(permissions(*))')
    .order('name');

  if (error) throw error;

  const roles = (data as RoleRow[] | null) ?? [];

  // Mapper simples para ajustar a estrutura do join
  return roles.map(mapRoleFromDB);
}

export async function getPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase.from('permissions').select('*').order('code');
  if (error) throw error;
  return data;
}

export async function createRole(name: string, description: string, permissionIds: string[]) {
  // 1. Criar Role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert({ name, description })
    .select()
    .single();

  if (roleError) throw roleError;

  // 2. Associar Permissões
  if (permissionIds.length > 0) {
    const associations = permissionIds.map(pid => ({
      role_id: role.id,
      permission_id: pid
    }));
    const { error: permError } = await supabase.from('role_permissions').insert(associations);
    if (permError) throw permError;
  }

  return role;
}

export async function updateRole(roleId: string, name: string, description: string, permissionIds: string[]) {
  // 1. Atualizar dados básicos
  const { error: roleError } = await supabase
    .from('roles')
    .update({ name, description })
    .eq('id', roleId);

  if (roleError) throw roleError;

  // 2. Atualizar permissões (Estratégia: Deleta tudo e recria)
  // Nota: Em produção, o ideal é fazer diff, mas deletar e recriar é seguro em transações pequenas
  await supabase.from('role_permissions').delete().eq('role_id', roleId);

  if (permissionIds.length > 0) {
    const associations = permissionIds.map(pid => ({
      role_id: roleId,
      permission_id: pid
    }));
    await supabase.from('role_permissions').insert(associations);
  }
}

export async function deleteRole(roleId: string) {
  const { error } = await supabase.from('roles').delete().eq('id', roleId);
  if (error) throw error;
}

// --- Hooks ---

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: getRoles });
}

export function usePermissions() {
  return useQuery({ queryKey: ['permissions'], queryFn: getPermissions });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string, description: string, permissions: string[] }) => 
      createRole(vars.name, vars.description, vars.permissions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string, name: string, description: string, permissions: string[] }) => 
      updateRole(vars.id, vars.name, vars.description, vars.permissions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  });
}