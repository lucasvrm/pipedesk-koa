import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  Key,
  UserCog,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getInitials } from '@/lib/helpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type SortKey = 'name' | 'email' | 'role' | 'department' | 'lastLogin';
export type SortDirection = 'asc' | 'desc';
export type UserStatus = 'active' | 'inactive' | 'pending';

interface UserTableProps {
  users: User[];
  selectedUsers: Set<string>;
  sortConfig: { key: SortKey; direction: SortDirection };
  isLoading: boolean;
  currentUserId: string;
  onSort: (key: SortKey) => void;
  onSelect: (userId: string) => void;
  onSelectAll: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
  onImpersonate: (user: User) => void;
  getRoleInfo: (role: string) => { label: string; badgeVariant?: string } | undefined;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function SortIcon({ column, sortConfig }: { column: SortKey; sortConfig: { key: SortKey; direction: SortDirection } }) {
  if (sortConfig.key !== column) {
    return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
  }
  return sortConfig.direction === 'asc' 
    ? <ChevronUp className="h-3 w-3 text-primary" />
    : <ChevronDown className="h-3 w-3 text-primary" />;
}

function StatusBadge({ status }: { status: UserStatus }) {
  const config = {
    active: { label: 'Ativo', variant: 'default' as BadgeVariant, dotClass: 'bg-green-500' },
    inactive: { label: 'Inativo', variant: 'secondary' as BadgeVariant, dotClass: 'bg-red-500' },
    pending: { label: 'Pendente', variant: 'outline' as BadgeVariant, dotClass: 'bg-amber-500' },
  };

  const { label, variant, dotClass } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </Badge>
  );
}

export function UserTable({
  users,
  selectedUsers,
  sortConfig,
  isLoading,
  currentUserId,
  onSort,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onResetPassword,
  onImpersonate,
  getRoleInfo,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
}: UserTableProps) {
  const allSelected = users.length > 0 && selectedUsers.size === users.length;
  const someSelected = selectedUsers.size > 0 && selectedUsers.size < users.length;

  const formatLastLogin = (dateStr: string | undefined) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  // @ts-ignore - indeterminate is valid but not in types
                  indeterminate={someSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-1">
                  Usuário
                  <SortIcon column="name" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => onSort('role')}
              >
                <div className="flex items-center gap-1">
                  Função
                  <SortIcon column="role" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => onSort('department')}
              >
                <div className="flex items-center gap-1">
                  Departamento
                  <SortIcon column="department" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => onSort('lastLogin')}
              >
                <div className="flex items-center gap-1">
                  Último Acesso
                  <SortIcon column="lastLogin" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🔍</span>
                    <span className="text-muted-foreground">Nenhum usuário encontrado</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                const isCurrentUser = user.id === currentUserId;
                const isSelected = selectedUsers.has(user.id);

                return (
                  <TableRow
                    key={user.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => onEdit(user)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelect(user.id)}
                        disabled={isCurrentUser}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          {user.status === 'active' && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(roleInfo?.badgeVariant as BadgeVariant) || 'outline'}>
                        {roleInfo?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.department || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status || 'pending'} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLastLogin(user.lastLogin)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onResetPassword(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Resetar Senha
                          </DropdownMenuItem>
                          {!isCurrentUser && (
                            <DropdownMenuItem onClick={() => onImpersonate(user)}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Impersonar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(user)}
                            disabled={isCurrentUser}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} usuário{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
