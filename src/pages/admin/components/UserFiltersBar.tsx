import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { UserStatus } from '../UserManagementPage';

interface RoleMetadata {
  code: string;
  label: string;
}

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
  roles: RoleMetadata[];
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
    <div className="bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div className="w-[180px]">
          <Select value={roleFilter} onValueChange={(v) => onRoleChange(v as UserRole | 'all')}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
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
        <div className="w-[160px]">
          <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as UserStatus | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Ativos
                </span>
              </SelectItem>
              <SelectItem value="inactive">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Inativos
                </span>
              </SelectItem>
              <SelectItem value="pending">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Pendentes
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter */}
        <div className="w-[180px]">
          <Select
            value={departmentFilter || 'all'}
            onValueChange={(v) => onDepartmentChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
