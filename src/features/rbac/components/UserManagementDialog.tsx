import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, UserRole } from '@/lib/types'
import { hasPermission } from '../lib/permissions'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trash, UserPlus, PencilSimple, EnvelopeSimple, Link as LinkIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/helpers'
import InviteUserDialog from './InviteUserDialog'
import MagicLinksDialog from '@/components/MagicLinksDialog'

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
  const [users, setUsers] = useKV<User[]>('users', [])
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

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }

    if (editingUser) {
      setUsers((current) =>
        (current || []).map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                clientEntity: formData.clientEntity || undefined,
              }
            : u
        )
      )
      toast.success('Usuário atualizado')
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        clientEntity: formData.clientEntity || undefined,
      }
      setUsers((current) => [...(current || []), newUser])
      toast.success('Usuário criado')
    }

    setIsCreating(false)
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      role: 'analyst',
      clientEntity: '',
    })
  }

  const handleDelete = (userId: string) => {
    if (userId === currentUser.id) {
      toast.error('Você não pode excluir seu próprio usuário')
      return
    }

    setUsers((current) => (current || []).filter((u) => u.id !== userId))
    toast.success('Usuário removido')
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'analyst':
        return 'secondary'
      case 'client':
        return 'outline'
      case 'newbusiness':
        return 'outline'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'analyst':
        return 'Analista'
      case 'client':
        return 'Cliente'
      case 'newbusiness':
        return 'New Business'
    }
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
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="analyst">Analista</SelectItem>
                  <SelectItem value="newbusiness">New Business</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
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
                  placeholder="Nome da empresa"
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
              >
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingUser ? 'Atualizar' : 'Criar'}
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
                {(users || []).map((user) => (
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
                          disabled={user.id === currentUser.id}
                        >
                          <Trash className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
