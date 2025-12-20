import { useState, useMemo } from 'react'
import { Loader2, Check, Search, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useUpdateLead, addLeadMember } from '@/services/leadService'
import { Lead, User } from '@/lib/types'
import { safeString } from '@/lib/utils'
import { toast } from 'sonner'

interface ChangeOwnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  /** Current user ID - reserved for future use (e.g., permissions, analytics) */
  currentUserId?: string
  availableUsers: User[]
}

function getInitials(name?: string): string {
  if (!name) return 'NA'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function ChangeOwnerDialog({
  open,
  onOpenChange,
  lead,
  // currentUserId is reserved for future use (e.g., permissions check, analytics)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserId: _currentUserId,
  availableUsers,
}: ChangeOwnerDialogProps) {
  // Internal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [keepAsMember, setKeepAsMember] = useState(true)

  const updateLeadMutation = useUpdateLead()

  // Filter users: exclude current owner, filter by search query, show only active users
  const filteredUsers = useMemo(() => {
    const currentOwnerId = lead.ownerUserId
    return availableUsers.filter((user) => {
      // Exclude current owner
      if (user.id === currentOwnerId) return false

      // Filter by search query (name or email)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const nameMatch = safeString(user.name, '').toLowerCase().includes(query)
        const emailMatch = safeString(user.email, '').toLowerCase().includes(query)
        return nameMatch || emailMatch
      }

      return true
    })
  }, [availableUsers, lead.ownerUserId, searchQuery])

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
  }

  const handleConfirm = async () => {
    if (!selectedUser) return

    try {
      // If keepAsMember is true, add the previous owner as a member before changing
      if (keepAsMember && lead.ownerUserId) {
        try {
          await addLeadMember({
            leadId: lead.id,
            userId: lead.ownerUserId,
            // Role will be set by addLeadMember using system settings default
          })
        } catch (memberError) {
          // Ignore duplicate key error (user already a member)
          console.warn('[ChangeOwnerDialog] Could not add previous owner as member:', memberError)
        }
      }

      // Change the owner
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: { ownerUserId: selectedUser.id },
      })

      toast.success('Responsável alterado', {
        description: `${safeString(selectedUser.name, 'Usuário')} agora é o responsável pelo lead.`,
      })

      // Reset state and close dialog
      setSelectedUser(null)
      setSearchQuery('')
      setKeepAsMember(true)
      onOpenChange(false)
    } catch (error) {
      console.error('[ChangeOwnerDialog] Error changing owner:', error)
      toast.error('Erro ao alterar responsável', {
        description: 'Não foi possível alterar o responsável. Tente novamente.',
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSelectedUser(null)
      setSearchQuery('')
      setKeepAsMember(true)
    }
    onOpenChange(newOpen)
  }

  const isMutating = updateLeadMutation.isPending
  const hasNoUsers = filteredUsers.length === 0 && !searchQuery.trim()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Alterar Responsável
          </DialogTitle>
          <DialogDescription>
            Selecione um novo responsável para o lead{' '}
            <strong>{safeString(lead.legalName, 'este lead')}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Search and Selection */}
          <Command className="border rounded-lg" shouldFilter={false}>
            <CommandInput
              placeholder="Buscar usuário por nome ou e-mail..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[240px]">
              {hasNoUsers ? (
                <CommandEmpty className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum usuário disponível para seleção.
                  </p>
                </CommandEmpty>
              ) : filteredUsers.length === 0 ? (
                <CommandEmpty className="py-6 text-center">
                  <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum usuário encontrado para "{searchQuery}".
                  </p>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUser?.id === user.id
                    return (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => handleSelectUser(user)}
                        className="flex items-center gap-3 py-2 cursor-pointer"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.avatar}
                            alt={safeString(user.name, 'Usuário')}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(safeString(user.name, 'NA'))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {safeString(user.name, 'Usuário')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {safeString(user.email, '')}
                          </p>
                        </div>
                        {user.role && (
                          <Badge variant="outline" className="text-xs capitalize shrink-0">
                            {user.role}
                          </Badge>
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>

          {/* Selected User Preview */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={selectedUser.avatar}
                  alt={safeString(selectedUser.name, 'Usuário')}
                />
                <AvatarFallback>
                  {getInitials(safeString(selectedUser.name, 'NA'))}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Novo responsável:</p>
                <p className="text-sm text-muted-foreground truncate">
                  {safeString(selectedUser.name, 'Usuário')} ({safeString(selectedUser.email, '')})
                </p>
              </div>
            </div>
          )}

          {/* Keep as Member Checkbox */}
          {lead.ownerUserId && (
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="keepAsMember"
                checked={keepAsMember}
                onCheckedChange={(checked) => setKeepAsMember(checked === true)}
                disabled={isMutating}
              />
              <div className="grid gap-1 leading-none">
                <Label
                  htmlFor="keepAsMember"
                  className="text-sm font-medium cursor-pointer"
                >
                  Manter responsável anterior como membro
                </Label>
                <p className="text-xs text-muted-foreground">
                  O responsável atual continuará com acesso ao lead como colaborador.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isMutating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedUser || isMutating}
          >
            {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
