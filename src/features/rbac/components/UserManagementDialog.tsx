import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/services/userService'
import { User, UserRole } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge, BadgeVariant } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trash, UserPlus, PencilSimple, EnvelopeSimple, Link as LinkIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/helpers'
import InviteUserDialog from './InviteUserDialog'
import MagicLinksDialog from './MagicLinksDialog'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'

interface UserManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

export default function UserManagementDialog({
  open,
  onOpenChange,
  currentUser,
}: UserManagementDialogProps) {
  const { data: users, isLoading } = useUsers()
  const { userRoleMetadata, getUserRoleByCode } = useSystemMetadata()
  
  // Mutações Reais
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [magicLinksDialogOpen, setMagicLinksDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'analyst' as UserRole,
    clientEntity: '',
  })

  const canManage = hasPermission(currentUser.role, 'MANAGE_USERS')

  if (!canManage) {
    return null
  }

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({
      name: '',
      email: '',
      role: 'analyst',
      clientEntity: '',
    })
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
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }

    try {
      if (editingUser) {
        // ATUALIZAÇÃO REAL
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: formData
        })
        toast.success('Usuário atualizado com sucesso')
      } else {
        // CRIAÇÃO REAL
        await createUserMutation.mutateAsync(formData)
        toast.success('Usuário criado com sucesso')
      }

      // Reset
      setIsCreating(false)
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        role: 'analyst',
        clientEntity: '',
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao salvar usuário')
    }
  }

  const handleDelete = async (userId: string) => {
    if (userId === currentUser.id) {
      toast.error('Você não pode excluir seu próprio usuário')
      return
    }

    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) {
      return
    }

    try {
      // DELEÇÃO REAL
      await deleteUserMutation.mutateAsync(userId)
      toast.success('Usuário excluído com sucesso')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao excluir usuário')
    }
  }

  const getRoleLabel = (role: UserRole) => {
    return getUserRoleByCode(role)?.label || role
  }

  const getRoleBadgeVariant = (role: UserRole): BadgeVariant => {
    const roleMeta = getUserRoleByCode(role)
    return (roleMeta?.badgeVariant as BadgeVariant) || 'outline'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuários</DialogTitle>
          <DialogDescription>
            Controle de acesso e permissões do sistema
          </DialogDescription>
        </DialogHeader>

        {isCreating ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nome</Label>
              <Input
                id="user-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@empresa.com"
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userRoleMetadata.filter(r => r.isActive).map((roleMeta) => (
                    <SelectItem key={roleMeta.code} value={roleMeta.code}>
                      {roleMeta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="client-entity">Empresa Cliente</Label>
                <Input
                  id="client-entity"
                  value={formData.clientEntity}
                  onChange={(e) =>
                    setFormData({ ...formData, clientEntity: e.target.value })
                  }
                  placeholder="Nome da empresa vinculada"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setEditingUser(null)
                }}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {createUserMutation.isPending || updateUserMutation.isPending 
                  ? 'Salvando...' 
                  : (editingUser ? 'Atualizar' : 'Criar')
                }
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-4 gap-2">
              <div className="flex gap-2">
                <Button onClick={() => setInviteDialogOpen(true)} size="sm" variant="default">
                  <EnvelopeSimple className="mr-2" />
                  Enviar Convite
                </Button>
                <Button onClick={() => setMagicLinksDialogOpen(true)} size="sm" variant="outline">
                  <LinkIcon className="mr-2" />
                  Ver Links
                </Button>
              </div>
              <Button onClick={handleCreate} size="sm" variant="secondary">
                <UserPlus className="mr-2" />
                Criar Manual
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">Carregando usuários...</TableCell>
                    </TableRow>
                  ) : (
                    (users || []).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.clientEntity || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                            >
                              <PencilSimple />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                              disabled={user.id === currentUser.id || deleteUserMutation.isPending}
                            >
                              <Trash className="text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          currentUser={currentUser}
        />

        <MagicLinksDialog
          open={magicLinksDialogOpen}
          onOpenChange={setMagicLinksDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}