import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers } from '@/services/userService'
import { User, UserRole } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash, UserPlus, PencilSimple, EnvelopeSimple, Link as LinkIcon, ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/helpers'
import { useNavigate } from 'react-router-dom'
import InviteUserDialog from '@/features/rbac/components/InviteUserDialog'
import MagicLinksDialog from '@/features/rbac/components/MagicLinksDialog'

export default function UserManagementPage() {
  const { profile: currentUser } = useAuth()
  const navigate = useNavigate()
  const { data: users } = useUsers()
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

  if (!currentUser || !hasPermission(currentUser.role, 'MANAGE_USERS')) {
    return <div className="p-8">Acesso negado.</div>
  }

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({ name: '', email: '', role: 'analyst', clientEntity: '' })
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
    toast.warning('Gerenciamento de usuários requer implementação no backend (userService mutations)')
    setIsCreating(false)
    setEditingUser(null)
  }

  const handleDelete = (userId: string) => {
    if (userId === currentUser.id) {
      toast.error('Você não pode excluir seu próprio usuário')
      return
    }
    toast.warning('Funcionalidade requer implementação no backend')
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'default'
      case 'analyst': return 'secondary'
      case 'client': case 'newbusiness': return 'outline'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rbac')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Controle de acesso e permissões do sistema</p>
        </div>
      </div>

      <div className="grid gap-6">
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

        {isCreating && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
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
                {formData.role === 'client' && (
                  <div className="space-y-2">
                    <Label>Empresa Cliente</Label>
                    <Input value={formData.clientEntity} onChange={e => setFormData({...formData, clientEntity: e.target.value})} />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
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
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>{user.role.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.clientEntity || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <PencilSimple />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} disabled={user.id === currentUser.id}>
                          <Trash className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} currentUser={currentUser} />
      <MagicLinksDialog open={magicLinksDialogOpen} onOpenChange={setMagicLinksDialogOpen} />
    </div>
  )
}