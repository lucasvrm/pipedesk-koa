import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/services/userService'
import { User, UserRole, ROLE_LABELS } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Trash, UserPlus, PencilSimple, EnvelopeSimple, Link as LinkIcon, 
  MagnifyingGlass, Funnel, CaretUp, CaretDown, CaretUpDown,
  User as UserIcon, IdentificationCard, Wallet, FileText, Lightning,
  CaretLeft, CaretRight, UserList, ShieldCheck
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/helpers'
import InviteUserDialog from '@/features/rbac/components/InviteUserDialog'
import MagicLinksDialog from '@/features/rbac/components/MagicLinksDialog'
import RolesManager from '@/features/rbac/components/RolesManager'
import { PageContainer } from '@/components/PageContainer'

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

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Estados de Ordenação
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'name', 
    direction: 'asc' 
  })

  // Estados de Deleção e Seleção
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Cleanup effect to prevent "listener indicated async response" error from extensions
  useEffect(() => {
    return () => {
        // Cleanup if any async ops pending?
        // React Query handles this mostly, but good to ensure clean unmount.
    };
  }, []);

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
          // Ordena pelo Label Traduzido
          aValue = ROLE_LABELS[a.role].toLowerCase()
          bValue = ROLE_LABELS[b.role].toLowerCase()
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

  // --- Paginação ---
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = processedUsers.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage)
  }

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

  const handleSelect = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null)
    } else {
      setSelectedId(id)
    }
  }

  const triggerDelete = () => {
    if (!selectedId) return
    confirmDelete(selectedId)
  }

  const confirmDelete = (userId: string) => {
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
      setSelectedId(null)
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error(error.message || 'Erro ao excluir usuário')
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  // Helper para renderizar nomes traduzidos no Badge
  const getRoleLabel = (role: UserRole) => {
    return ROLE_LABELS[role] || role;
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
    <PageContainer>
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Acessos</h1>
          <p className="text-muted-foreground">Controle de usuários, funções e permissões do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="text-base px-4 py-2"><UserList className="mr-2 h-4 w-4"/> Usuários</TabsTrigger>
          <TabsTrigger value="roles" className="text-base px-4 py-2"><ShieldCheck className="mr-2 h-4 w-4"/> Funções e Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          
          {/* Header da Aba Usuários */}
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Lightning className="h-4 w-4" />
                  Ações Rápidas
                  <CaretDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Ações Disponíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setInviteDialogOpen(true)}>
                  <EnvelopeSimple className="mr-2 h-4 w-4" /> Enviar Convite
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMagicLinksDialogOpen(true)}>
                  <LinkIcon className="mr-2 h-4 w-4" /> Ver Links Mágicos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCreate}>
                  <UserPlus className="mr-2 h-4 w-4" /> Criar Manualmente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
                          {/* Uso do Object.entries para popular o select automaticamente */}
                          {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
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

                {/* Demais Grupos (Dados Pessoais, Financeiro, Docs) - Mantidos */}
                {/* ... (código repetido omitido para focar na mudança, mas deve ser mantido igual ao anterior) ... */}
                {/* Para garantir que o código esteja completo, repetirei os blocos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                    <IdentificationCard className="h-5 w-5" /> Dados Pessoais
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>RG</Label>
                      <Input value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Celular</Label>
                      <Input value={formData.cellphone} onChange={e => setFormData({...formData, cellphone: e.target.value})} />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Endereço Completo</Label>
                      <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                    <Wallet className="h-5 w-5" /> Dados Financeiros
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Chave PIX (PJ)</Label>
                      <Input value={formData.pixKeyPJ} onChange={e => setFormData({...formData, pixKeyPJ: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Chave PIX (PF)</Label>
                      <Input value={formData.pixKeyPF} onChange={e => setFormData({...formData, pixKeyPF: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                    <FileText className="h-5 w-5" /> URLs de Documentos
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Link do Documento de Identidade</Label>
                      <Input value={formData.docIdentityUrl} onChange={e => setFormData({...formData, docIdentityUrl: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Link do Contrato Social</Label>
                      <Input value={formData.docSocialContractUrl} onChange={e => setFormData({...formData, docSocialContractUrl: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Link do Contrato de Prestação de Serviços</Label>
                      <Input value={formData.docServiceAgreementUrl} onChange={e => setFormData({...formData, docServiceAgreementUrl: e.target.value})} />
                    </div>
                  </div>
                </div>

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

          {/* Barra de Filtros, Busca e Ação de Deleção */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
            <div className="flex flex-1 flex-col md:flex-row gap-4 w-full items-center">
              
              {/* Pesquisa */}
              <div className="relative w-full md:w-80">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-4 flex-wrap md:flex-nowrap w-full md:w-auto">
                <div className="w-full md:w-[180px] shrink-0">
                  <Select value={roleFilter} onValueChange={v => { setRoleFilter(v as UserRole | 'all'); setCurrentPage(1); }}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Funnel className="h-4 w-4" />
                        <SelectValue placeholder="Função" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Funções</SelectItem>
                      {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-[200px] shrink-0">
                  <Input 
                    placeholder="Filtrar empresa..." 
                    value={companyFilter}
                    onChange={e => { setCompanyFilter(e.target.value); setCurrentPage(1); }}
                  />
                </div>
              </div>

              {/* Botão de Excluir (Aparece somente quando há seleção) */}
              {selectedId && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="animate-in fade-in slide-in-from-right-5"
                  onClick={triggerDelete}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir Usuário
                </Button>
              )}
            </div>
            
            {/* Paginação e Contador */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-sm text-muted-foreground whitespace-nowrap hidden md:block">
                {processedUsers.length} usuários
              </div>
              
              {processedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <CaretLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                    <CaretRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead> {/* Coluna do Checkbox */}
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
                    <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleEdit(user)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedId === user.id}
                          onCheckedChange={() => handleSelect(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
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
                        {/* USO DO LABEL TRADUZIDO AQUI */}
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
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
                            disabled={!selectedId || selectedId !== user.id || user.id === currentUser.id}
                            className={`
                              ${selectedId === user.id ? 'text-destructive hover:text-destructive/90 hover:bg-destructive/10' : 'text-muted-foreground/30 cursor-not-allowed'}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(user.id);
                            }}
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
        </TabsContent>

        <TabsContent value="roles">
          <RolesManager />
        </TabsContent>
      </Tabs>

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
    </PageContainer>
  )
}
