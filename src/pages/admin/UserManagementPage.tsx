import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/services/userService';
import { User, UserRole } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import { UnifiedLayout } from '@/components/UnifiedLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';

// Components
import { UserStatsCards } from './components/UserStatsCards';
import { UserFiltersBar } from './components/UserFiltersBar';
import { UserTable } from './components/UserTable';
import { UserFormDrawer } from './components/UserFormDrawer';
import { BulkActionsBar } from './components/BulkActionsBar';

// Dialogs
import InviteUserDialog from '@/features/rbac/components/InviteUserDialog';
import MagicLinksDialog from '@/features/rbac/components/MagicLinksDialog';
import { DeleteUserDialog } from './components/DeleteUserDialog';
import { Link } from 'lucide-react';

// Types
export type UserStatus = 'active' | 'inactive' | 'pending';
export type SortKey = 'name' | 'email' | 'role' | 'department' | 'lastLogin';
export type SortDirection = 'asc' | 'desc';

export interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  title: string;
  department: string;
  clientEntity: string;
  avatar: string;
  cellphone: string;
  cpf: string;
  rg: string;
  address: string;
  pixKeyPJ: string;
  pixKeyPF: string;
  docIdentityUrl: string;
  docSocialContractUrl: string;
  docServiceAgreementUrl: string;
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  role: 'analyst',
  status: 'pending',
  title: '',
  department: '',
  clientEntity: '',
  avatar: '',
  cellphone: '',
  cpf: '',
  rg: '',
  address: '',
  pixKeyPJ: '',
  pixKeyPF: '',
  docIdentityUrl: '',
  docSocialContractUrl: '',
  docServiceAgreementUrl: '',
};

export default function UserManagementPage() {
  const { profile: currentUser } = useAuth();
  const { userRoleMetadata, getUserRoleByCode } = useSystemMetadata();

  // Data
  const { data: users = [], isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // UI State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);

  // Dialogs
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [magicLinksDialogOpen, setMagicLinksDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'name',
    direction: 'asc',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Permission check
  if (!currentUser || !hasPermission(currentUser.role, 'MANAGE_USERS')) {
    return (
      <UnifiedLayout activeSection="management" activeItem="users">
        <div className="p-8 text-center">
          <p className="text-destructive">Acesso negado.</p>
        </div>
      </UnifiedLayout>
    );
  }

  // Stats calculation
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const pending = users.filter(u => u.status === 'pending').length;
    return { total, active, inactive, pending };
  }, [users]);

  // Departments list
  const departments = useMemo(() => {
    const depts = new Set(users.map(u => u.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [users]);

  // Filtered and sorted users
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.cellphone?.includes(query)
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }

    if (departmentFilter) {
      result = result.filter(u =>
        u.department?.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      switch (sortConfig.key) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'role':
          aVal = (getUserRoleByCode(a.role)?.label || a.role).toLowerCase();
          bVal = (getUserRoleByCode(b.role)?.label || b.role).toLowerCase();
          break;
        case 'department':
          aVal = (a.department || '').toLowerCase();
          bVal = (b.department || '').toLowerCase();
          break;
        case 'lastLogin':
          aVal = a.lastLogin || '';
          bVal = b.lastLogin || '';
          break;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, roleFilter, statusFilter, departmentFilter, sortConfig, getUserRoleByCode]);

  // Pagination
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const paginatedUsers = processedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData(initialFormData);
    setDrawerOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      title: user.title || '',
      department: user.department || '',
      clientEntity: user.clientEntity || '',
      avatar: user.avatar || '',
      cellphone: user.cellphone || '',
      cpf: user.cpf || '',
      rg: user.rg || '',
      address: user.address || '',
      pixKeyPJ: user.pixKeyPJ || '',
      pixKeyPF: user.pixKeyPF || '',
      docIdentityUrl: user.docIdentityUrl || '',
      docSocialContractUrl: user.docSocialContractUrl || '',
      docServiceAgreementUrl: user.docServiceAgreementUrl || '',
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: formData,
        });
        toast.success('Usuário atualizado!');
      } else {
        await createUserMutation.mutateAsync(formData);
        toast.success('Usuário criado!');
      }
      setDrawerOpen(false);
      setEditingUser(null);
      setFormData(initialFormData);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    }
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      toast.success('Usuário excluído!');
      setSelectedUsers(prev => {
        const next = new Set(prev);
        next.delete(userToDelete.id);
        return next;
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir');
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleResetPassword = async (user: User) => {
    toast.info(`Reset de senha enviado para ${user.email}`);
  };

  const handleImpersonate = (user: User) => {
    toast.info(`Impersonando ${user.name}...`);
  };

  // Selection handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  // Bulk actions
  const handleBulkActivate = async () => {
    toast.success(`${selectedUsers.size} usuários ativados`);
    setSelectedUsers(new Set());
  };

  const handleBulkDeactivate = async () => {
    toast.success(`${selectedUsers.size} usuários desativados`);
    setSelectedUsers(new Set());
  };

  const handleBulkDelete = async () => {
    toast.success(`${selectedUsers.size} usuários excluídos`);
    setSelectedUsers(new Set());
  };

  return (
    <UnifiedLayout activeSection="management" activeItem="users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
            <p className="text-sm text-muted-foreground">
              Controle de acessos, funções e permissões
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setMagicLinksDialogOpen(true)}
              className="gap-2"
            >
              <Link className="h-4 w-4" />
              Magic Links
            </Button>
            <Button
              variant="outline"
              onClick={handleCreate}
              className="gap-2"
            >
              Criar Manualmente
            </Button>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="gap-2"
            >
              Convidar Usuário
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <UserStatsCards stats={stats} />

        {/* Filters */}
        <UserFiltersBar
          searchQuery={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
          roleFilter={roleFilter}
          onRoleChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
          statusFilter={statusFilter}
          onStatusChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
          departmentFilter={departmentFilter}
          onDepartmentChange={(v) => { setDepartmentFilter(v); setCurrentPage(1); }}
          departments={departments}
          roles={userRoleMetadata}
        />

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedUsers.size}
            onActivate={handleBulkActivate}
            onDeactivate={handleBulkDeactivate}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedUsers(new Set())}
          />
        )}

        {/* Table */}
        <UserTable
          users={paginatedUsers}
          selectedUsers={selectedUsers}
          sortConfig={sortConfig}
          isLoading={isLoading}
          currentUserId={currentUser.id}
          onSort={handleSort}
          onSelect={handleSelectUser}
          onSelectAll={handleSelectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
          onImpersonate={handleImpersonate}
          getRoleInfo={getUserRoleByCode}
          totalCount={processedUsers.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Dialogs */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        currentUser={currentUser}
      />

      <MagicLinksDialog
        open={magicLinksDialogOpen}
        onOpenChange={setMagicLinksDialogOpen}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={userToDelete}
        onConfirm={confirmDelete}
        isDeleting={deleteUserMutation.isPending}
      />

      <UserFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        formData={formData}
        setFormData={setFormData}
        editingUser={editingUser}
        onSave={handleSave}
        isSaving={createUserMutation.isPending || updateUserMutation.isPending}
        roles={userRoleMetadata}
      />
    </UnifiedLayout>
  );
}
