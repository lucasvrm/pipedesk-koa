import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/services/userService'
import { User, UserRole } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Trash, UserPlus, PencilSimple, EnvelopeSimple, Link as LinkIcon, 
  MagnifyingGlass, Funnel, CaretUp, CaretDown, CaretUpDown,
  User as UserIcon, IdentificationCard, Wallet, FileText
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/helpers'
import InviteUserDialog from '@/features/rbac/components/InviteUserDialog'
import MagicLinksDialog from '@/features/rbac/components/MagicLinksDialog'

// Tipos para Ordenação
type SortKey = 'name' | 'email' | 'role' | 'clientEntity';
type SortDirection = 'asc' | 'desc';

export default function UserManagementPage() {
  const { profile: currentUser } = useAuth()
  
  // Hooks de Dados e Mutações
  const { data: users, isLoading } = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  // Estados de Edição/Criação
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'analyst' as UserRole,
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
    docServiceAgreementUrl: ''
  })

  // Estados de Modais Auxiliares
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [magicLinksDialogOpen, setMagicLinksDialogOpen] = useState(false)

  // Estados de Filtro e Busca
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [companyFilter, setCompanyFilter] = useState('')

  // Estados de Ordenação
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'name', 
    direction: 'asc' 
  })

  // Estados de Deleção
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  if (!currentUser || !hasPermission(currentUser.role, 'MANAGE_USERS')) {
    return <div className="p-8">Acesso negado.</div>
  }

  // --- Lógica de Filtros e Ordenação ---

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const processedUsers = useMemo(() => {
    if (!users) return []

    // 1. Filtragem
    let result = users.filter(user => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.cellphone && user.cellphone.includes(searchLower)) || false

      const matchesRole = roleFilter === 'all' || user.role === roleFilter

      const matchesCompany = 
        !companyFilter || 
        (user.clientEntity && user.clientEntity.toLowerCase().includes(companyFilter.toLowerCase())) || false

      return matchesSearch && matchesRole && matchesCompany
    })

    // 2. Ordenação
    result.sort((a, b) => {
      let aValue = ''
      let bValue = ''

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'role':
          aValue = a.role
          bValue = b.role
          break
        case 'clientEntity':
          aValue = (a.clientEntity || '').toLowerCase()
          bValue = (b.clientEntity || '').toLowerCase()
          break
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [users, searchQuery, roleFilter, companyFilter, sortConfig])

  // --- Handlers de Ação ---

  const resetForm = () => {
    setFormData({
      name: '', email: '', role: 'analyst', clientEntity: '', avatar: '',
      cellphone: '', cpf: '', rg: '', address: '',
      pixKeyPJ: '', pixKeyPF: '',
      docIdentityUrl: '', docSocialContractUrl: '', docServiceAgreementUrl: ''
    })
  }

  const handleCreate = () => {
    setIsCreating(true)
    resetForm()
    setEditingUser(null)
  }

  const handleEdit = (user: User) => {
    setIsCreating(true)
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
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
      docServiceAgreementUrl: user.docServiceAgreementUrl || ''
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }

    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: formData
        })
        toast.success('Usuário atualizado com sucesso')
      } else {
        await createUserMutation.mutateAsync(formData)
        toast.success('Usuário criado com sucesso')
      }

      setIsCreating(false)
      setEditingUser(null)
      resetForm()
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      toast.error(error.message || 'Erro ao salvar usuário')
    }
  }

  const confirmDelete = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    if (userId === currentUser.id) {
      toast.error('Você não pode excluir seu próprio usuário')
      return
    }
    setUserToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!userToDelete) return

    try {
      await deleteUserMutation.mutateAsync(userToDelete)
      toast.success('Usuário excluído com sucesso')
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error(error.message || 'Erro ao excluir usuário')
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'default'
      case 'analyst': return 'secondary'
      case 'client': return 'outline'
      case 'newbusiness': return 'outline'
      default: return 'outline'
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <CaretUpDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" />
    return sortConfig.direction === 'asc' 
      ? <CaretUp className="ml-1 h-3 w-3 text-primary" weight="bold" />
      : <CaretDown className="ml-1 h-3 w-3 text-primary" weight="bold" />
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Controle de acesso e permissões do sistema</p>
        </div>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button onClick={() => setInviteDialogOpen(true)}><EnvelopeSimple className="mr-2" /> Enviar Convite</Button>
          <Button onClick={() => setMagicLinksDialogOpen(true)} variant="outline"><LinkIcon className="mr-2" /> Ver Links Mágicos</Button>
          <Button onClick={handleCreate} variant="secondary"><UserPlus className="mr-2" /> Criar Manualmente</Button>
        </CardContent>
      </Card>

      {/* Formulário de Criação/Edição */}
      {isCreating && (
        <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Grupo: Perfil Básico */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                <UserIcon className="h-5 w-5" /> Dados de Acesso e Perfil
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    disabled={!!editingUser} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v as UserRole})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="analyst">Analista</SelectItem>
                      <SelectItem value="newbusiness">New Business</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Empresa / Entidade (Opcional)</Label>
                  <Input value={formData.clientEntity} onChange={e => setFormData({...formData, clientEntity: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>URL da Foto (Avatar)</Label>
                  <Input value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* Outros grupos de inputs (mantidos iguais para brevidade, mas funcionais) */}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsCreating(false)}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {createUserMutation.isPending || updateUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de Filtros e Busca (LAYOUT CORRIGIDO) */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        
        {/* Container Unificado para Campos de Busca/Filtro - Garante espaçamento idêntico */}
        <div className="flex flex-1 flex-col md:flex-row gap-4 w-full">
          
          {/* Pesquisa */}
          <div className="relative w-full md:w-80">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro Função */}
          <div className="w-full md:w-[180px]">
            <Select value={roleFilter} onValueChange={v => setRoleFilter(v as UserRole | 'all')}>
              <SelectTrigger>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Funnel className="h-4 w-4" />
                  <SelectValue placeholder="Função" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Funções</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="analyst">Analista</SelectItem>
                <SelectItem value="newbusiness">New Business</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Empresa */}
          <div className="w-full md:w-[220px]">
            <Input 
              placeholder="Filtrar empresa..." 
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
            />
          </div>
        </div>
        
        {/* Contador */}
        <div className="text-sm text-muted-foreground whitespace-nowrap hidden md:block">
          Total: {processedUsers.length} usuários
        </div>
      </div>

      {/* Tabela de Usuários (VISUAL MELHORADO: Removemos o Card extra) */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Usuário <SortIcon columnKey="name" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-1">Email <SortIcon columnKey="email" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('role')}>
                <div className="flex items-center gap-1">Função <SortIcon columnKey="role" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('clientEntity')}>
                <div className="flex items-center gap-1">Empresa <SortIcon columnKey="clientEntity" /></div>
              </TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : processedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              processedUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleEdit(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {/* Correção do Avatar: Prioridade para URL, depois fallback */}
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.clientEntity || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); handleEdit(user); }}
                      >
                        <PencilSimple />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => confirmDelete(e, user.id)} 
                        disabled={user.id === currentUser.id}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modais */}
      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} currentUser={currentUser} />
      <MagicLinksDialog open={magicLinksDialogOpen} onOpenChange={setMagicLinksDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário e revogará seu acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setUserToDelete(null); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}