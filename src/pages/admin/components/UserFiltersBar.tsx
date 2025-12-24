import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { UserRole } from '@/lib/types';

type UserStatus = 'active' | 'inactive' | 'pending';

interface UserFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: UserRole | 'all';
  onRoleChange: (value: UserRole | 'all') => void;
  statusFilter: UserStatus | 'all';
  onStatusChange: (value: UserStatus | 'all') => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  departments: string[];
  roles: Array<{ code: string; label: string }>;
}

export function UserFiltersBar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
  departments,
  roles,
}: UserFiltersBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Role Filter */}
      <div className="w-full md:w-[180px]">
        <Select value={roleFilter} onValueChange={(v) => onRoleChange(v as UserRole | 'all')}>
          <SelectTrigger>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Função" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Funções</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.code} value={role.code}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="w-full md:w-[180px]">
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as UserStatus | 'all')}>
          <SelectTrigger>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department Filter */}
      {departments.length > 0 && (
        <div className="w-full md:w-[200px]">
          <Input
            placeholder="Filtrar departamento..."
            value={departmentFilter}
            onChange={(e) => onDepartmentChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
