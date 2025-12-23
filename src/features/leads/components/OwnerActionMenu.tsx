import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, UserCog, Check, Loader2, ChevronRight, Mail, Shield } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useUsers } from '@/services/userService'
import { useUpdateLead } from '@/services/leadService'
import { User as UserType } from '@/lib/types'
import { safeString } from '@/lib/utils'
import { toast } from 'sonner'

interface OwnerInfo {
  id?: string
  name?: string
  avatar?: string | null
}

interface OwnerActionMenuProps {
  leadId: string
  currentOwner: OwnerInfo | null | undefined
  children: React.ReactNode
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  analyst: 'Analista',
  client: 'Cliente',
  newbusiness: 'New Business'
}

function getInitials(name?: string) {
  if (!name) return 'NA'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function OwnerActionMenu({ leadId, currentOwner, children }: OwnerActionMenuProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showUserPicker, setShowUserPicker] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: users = [], isLoading: isLoadingUsers } = useUsers()
  const updateLeadMutation = useUpdateLead()

  const filteredUsers = searchTerm.trim()
    ? users.filter((user) =>
        safeString(user.name, '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        safeString(user.email, '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users

  const handleViewOwner = () => {
    if (currentOwner?.id) {
      setOpen(false)
      navigate(`/admin/users`)
    }
  }

  const handleSelectOwner = async (user: UserType) => {
    try {
      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: { ownerUserId: user.id },
      })

      toast.success('Responsável alterado', {
        description: `${safeString(user.name, 'Usuário')} agora é o responsável.`,
      })

      setShowUserPicker(false)
      setOpen(false)
      setSearchTerm('')
    } catch (error) {
      console.error('[OwnerActionMenu] Error updating owner:', error)
      toast.error('Erro ao alterar responsável', {
        description: 'Tente novamente mais tarde.',
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setShowUserPicker(false)
      setSearchTerm('')
    }
  }

  const isMutating = updateLeadMutation.isPending

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        {!showUserPicker ? (
          <div className="py-1">
            {/* View Owner Option */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
              onClick={handleViewOwner}
              disabled={!currentOwner?.id}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Ver responsável</span>
            </button>

            <Separator className="my-1" />

            {/* Change Owner Option */}
            <button
              className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
              onClick={() => setShowUserPicker(true)}
            >
              <div className="flex items-center gap-3">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Alterar responsável</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 px-2"
                onClick={() => { setShowUserPicker(false); setSearchTerm('') }}>
                ← Voltar
              </Button>
              <span className="text-sm font-medium">Selecionar responsável</span>
            </div>

            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />

            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário disponível.'}
              </div>
            ) : (
              <ScrollArea className="h-[280px] -mx-3">
                <div className="px-3 space-y-1">
                  {filteredUsers.map((user) => {
                    const isCurrentOwner = currentOwner?.id === user.id
                    const roleLabel = ROLE_LABELS[user.role] || user.role
                    return (
                      <button
                        key={user.id}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-lg transition-colors text-left ${
                          isCurrentOwner ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleSelectOwner(user)}
                        disabled={isMutating || isCurrentOwner}
                      >
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            {isCurrentOwner && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Atual</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {user.email}
                          </p>
                          {user.role && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Shield className="h-3 w-3" /> {roleLabel}
                            </p>
                          )}
                        </div>
                        {isCurrentOwner && <Check className="h-4 w-4 text-primary mt-1" />}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
