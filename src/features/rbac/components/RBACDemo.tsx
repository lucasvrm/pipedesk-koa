import { useState, useMemo } from 'react'
import { useUsers } from '@/features/rbac/hooks/useUsers'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { User, UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/types'
import { toast } from 'sonner'

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu'
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
  Users, 
  ShieldCheck, 
  MagicWand, 
  Trash, 
  DotsThree, 
  Funnel, 
  Check
} from '@phosphor-icons/react'

import InviteUserDialog from './InviteUserDialog'
import MagicLinksDialog from './MagicLinksDialog'
import SyntheticDataPanel from './SyntheticDataPanel'

export default function RBACDemo({ currentUser }: { currentUser: User }) {
  const { data: users, refetch } = useUsers()
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // --- Lógica de Filtro e Seleção (CORRIGIDA) ---

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter(user => {
      // Proteção contra valores nulos/undefined
      const name = user.name || ''
      const email = user.email || ''
      const search = searchTerm.toLowerCase()

      const matchesSearch = name.toLowerCase().includes(search) || 
                            email.toLowerCase().includes(search)
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, roleFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  // --- Ações de Banco de Dados (CRUD) ---

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      toast.success('Permissão atualizada com sucesso')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar permissão')
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      
      toast.success('Usuário removido')
      setSelectedUsers(prev => prev.filter(id => id !== userId))
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao remover usuário')
    } finally {
      setUserToDelete(null)
    }
  }

  const handleBulkRoleUpdate = async (newRole: UserRole) => {
    if (selectedUsers.length === 0) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .in('id', selectedUsers)

      if (error) throw error
      toast.success(`${selectedUsers.length} usuários atualizados para ${ROLE_LABELS[newRole]}`)
      setSelectedUsers([])
      refetch()
    } catch (error) {
      toast.error('Erro na atualização em massa')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', selectedUsers)

      if (error) throw error
      toast.success(`${selectedUsers.length} usuários removidos`)
      setSelectedUsers([])
      refetch()
    } catch (error) {
      toast.error('Erro na remoção em massa')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Acesso</h1>
          <p className="text-muted-foreground">Gerencie usuários, permissões e convites do sistema.</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="users" className="gap-2">
            <Users size={16} /> Usuários
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-2">
            <MagicWand size={16} /> Convites & Links
          </TabsTrigger>
          <TabsTrigger value="definitions" className="gap-2">
            <ShieldCheck size={16} /> Definições de Papéis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>
                    Visualize e gerencie quem tem acesso à plataforma.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <InviteUserDialog />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end md:items-center">
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Input 
                      placeholder="Buscar por nome ou email..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Funnel size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Filtrar por Função</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
                        <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <DropdownMenuRadioItem key={key} value={key}>{label}</DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md animate-in fade-in slide-in-from-right-5">
                    <span className="text-sm font-medium px-2">{selectedUsers.length} selecionados</span>
                    <div className="h-4 w-px bg-border mx-1" />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm">Alterar Função</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Aplicar a todos selecionados</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <DropdownMenuItem key={key} onClick={() => handleBulkRoleUpdate(key as UserRole)}>
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setIsBulkDeleting(true)}
                    >
                      <Trash size={16} className="mr-2" /> Excluir
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função (Role)</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className={selectedUsers.includes(user.id) ? 'bg-muted/30' : ''}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{user.name || 'Sem nome'}</TableCell>
                          <TableCell>{user.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {ROLE_LABELS[user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <DotsThree size={20} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>Alterar Permissão</DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                      <DropdownMenuItem 
                                        key={key} 
                                        onClick={() => updateUserRole(user.id, key as UserRole)}
                                        className="justify-between"
                                      >
                                        {label}
                                        {user.role === key && <Check size={14} />}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setUserToDelete(user.id)}
                                >
                                  Excluir Usuário
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Magic Links</CardTitle>
                <CardDescription>Gerencie links de acesso rápido sem senha.</CardDescription>
              </CardHeader>
              <CardContent>
                <MagicLinksDialog />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Dados de Teste</CardTitle>
                <CardDescription>Gere usuários sintéticos para testes de carga e permissão.</CardDescription>
              </CardHeader>
              <CardContent>
                <SyntheticDataPanel />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="definitions">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões</CardTitle>
              <CardDescription>Entenda o que cada nível de acesso permite fazer no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Função</TableHead>
                    <TableHead>Descrição e Capacidades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <TableRow key={role}>
                      <TableCell className="font-semibold align-top">
                        <Badge variant="outline">{label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role as UserRole]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o acesso do usuário ao sistema. 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => userToDelete && deleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleting} onOpenChange={setIsBulkDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedUsers.length} usuários?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir todos os usuários selecionados? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Todos Selecionados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}