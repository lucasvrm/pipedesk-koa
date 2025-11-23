import { useState } from 'react'
import { useKV } from '@/hooks/useKV'
import { useUsers } from '@/services/userService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MasterDeal, PlayerTrack, Task, User, DealStatus, PlayerStage } from '@/lib/types'
import { CheckSquare, Trash, ArrowRight, Users as UsersIcon, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { logActivity } from '@/components/ActivityHistory'

interface BulkOperationsProps {
  entityType: 'deal' | 'track' | 'task'
  entities: (MasterDeal | PlayerTrack | Task)[]
  currentUser: User
  onComplete?: () => void
}

type BulkAction = 'delete' | 'change_status' | 'change_stage' | 'assign' | 'complete'

export default function BulkOperations({
  entityType,
  entities,
  currentUser,
  onComplete,
}: BulkOperationsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null)
  const [newStatus, setNewStatus] = useState<DealStatus>('active')
  const [newStage, setNewStage] = useState<PlayerStage>('nda')
  const [assigneeId, setAssigneeId] = useState<string>('')

  // Note: Bulk operations need full service implementation with mutations
  const [, setMasterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [, setPlayerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [, setTasks] = useKV<Task[]>('tasks', [])
  const { data: users } = useUsers()

  const allSelected = selectedIds.length === entities.length && entities.length > 0
  const someSelected = selectedIds.length > 0 && selectedIds.length < entities.length

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(entities.map(e => e.id))
    }
  }

  const toggleEntity = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkAction = (action: BulkAction) => {
    if (selectedIds.length === 0) {
      toast.error('Selecione ao menos um item')
      return
    }

    setSelectedAction(action)
    setConfirmDialogOpen(true)
  }

  const executeBulkAction = () => {
    if (!selectedAction) return

    const count = selectedIds.length

    switch (selectedAction) {
      case 'delete':
        if (entityType === 'deal') {
          setMasterDeals(current =>
            (current || []).map(d =>
              selectedIds.includes(d.id) ? { ...d, deletedAt: new Date().toISOString() } : d
            )
          )
        } else if (entityType === 'track') {
          setPlayerTracks(current =>
            (current || []).filter(t => !selectedIds.includes(t.id))
          )
        } else if (entityType === 'task') {
          setTasks(current =>
            (current || []).filter(t => !selectedIds.includes(t.id))
          )
        }

        selectedIds.forEach(id => {
          const entity = entities.find(e => e.id === id)
          logActivity({
            userId: currentUser.id,
            action: 'deleted',
            entityType,
            entityId: id,
            entityName: getEntityName(entity),
            details: `Excluído em operação em massa (${count} itens)`,
          })
        })

        toast.success(`${count} ${getEntityTypeLabel(count)} excluído(s)`)
        break

      case 'change_status':
        if (entityType === 'deal') {
          setMasterDeals(current =>
            (current || []).map(d =>
              selectedIds.includes(d.id) ? { ...d, status: newStatus } : d
            )
          )
        } else if (entityType === 'track') {
          setPlayerTracks(current =>
            (current || []).map(t =>
              selectedIds.includes(t.id) ? { ...t, status: newStatus } : t
            )
          )
        }

        selectedIds.forEach(id => {
          const entity = entities.find(e => e.id === id)
          logActivity({
            userId: currentUser.id,
            action: 'updated',
            entityType,
            entityId: id,
            entityName: getEntityName(entity),
            details: `Status alterado para ${newStatus} em operação em massa`,
            metadata: { newStatus },
          })
        })

        toast.success(`Status de ${count} ${getEntityTypeLabel(count)} atualizado(s)`)
        break

      case 'change_stage':
        if (entityType === 'track') {
          setPlayerTracks(current =>
            (current || []).map(t =>
              selectedIds.includes(t.id) ? { ...t, currentStage: newStage } : t
            )
          )

          selectedIds.forEach(id => {
            const entity = entities.find(e => e.id === id) as PlayerTrack
            logActivity({
              userId: currentUser.id,
              action: 'stage_changed',
              entityType: 'track',
              entityId: id,
              entityName: getEntityName(entity),
              details: `Estágio alterado para ${newStage} em operação em massa`,
              metadata: { oldStage: entity.currentStage, newStage },
            })
          })

          toast.success(`Estágio de ${count} player(s) atualizado(s)`)
        }
        break

      case 'assign': {
        if (entityType === 'track') {
          setPlayerTracks(current =>
            (current || []).map(t =>
              selectedIds.includes(t.id)
                ? { ...t, responsibles: [...new Set([...t.responsibles, assigneeId])] }
                : t
            )
          )
        } else if (entityType === 'task') {
          setTasks(current =>
            (current || []).map(t =>
              selectedIds.includes(t.id)
                ? { ...t, assignees: [...new Set([...t.assignees, assigneeId])] }
                : t
            )
          )
        }

        const assignedUser = (users || []).find(u => u.id === assigneeId)
        toast.success(`${count} ${getEntityTypeLabel(count)} atribuído(s) a ${assignedUser?.name}`)
        break
      }

      case 'complete':
        if (entityType === 'task') {
          setTasks(current =>
            (current || []).map(t =>
              selectedIds.includes(t.id) ? { ...t, completed: true } : t
            )
          )

          selectedIds.forEach(id => {
            const entity = entities.find(e => e.id === id)
            logActivity({
              userId: currentUser.id,
              action: 'completed',
              entityType: 'task',
              entityId: id,
              entityName: getEntityName(entity),
              details: `Completada em operação em massa (${count} itens)`,
            })
          })

          toast.success(`${count} tarefa(s) completada(s)`)
        }
        break
    }

    setSelectedIds([])
    setConfirmDialogOpen(false)
    setSelectedAction(null)
    onComplete?.()
  }

  const getEntityName = (entity: any): string => {
    if (!entity) return 'Item'
    if ('clientName' in entity) return entity.clientName
    if ('playerName' in entity) return entity.playerName
    if ('title' in entity) return entity.title
    return 'Item'
  }

  const getEntityTypeLabel = (count: number): string => {
    if (entityType === 'deal') return count === 1 ? 'negócio' : 'negócios'
    if (entityType === 'track') return count === 1 ? 'player' : 'players'
    if (entityType === 'task') return count === 1 ? 'tarefa' : 'tarefas'
    return 'item(s)'
  }

  const getActionLabel = (): string => {
    switch (selectedAction) {
      case 'delete':
        return 'Excluir'
      case 'change_status':
        return 'Alterar Status'
      case 'change_stage':
        return 'Alterar Estágio'
      case 'assign':
        return 'Atribuir'
      case 'complete':
        return 'Completar'
      default:
        return ''
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              className={someSelected ? 'opacity-50' : ''}
            />
            <span className="text-sm font-medium">
              {selectedIds.length > 0
                ? `${selectedIds.length} selecionado(s)`
                : `Selecionar todos (${entities.length})`}
            </span>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash className="mr-1" />
                Excluir
              </Button>

              {(entityType === 'deal' || entityType === 'track') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('change_status')}
                >
                  <XCircle className="mr-1" />
                  Status
                </Button>
              )}

              {entityType === 'track' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('change_stage')}
                >
                  <ArrowRight className="mr-1" />
                  Estágio
                </Button>
              )}

              {(entityType === 'track' || entityType === 'task') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('assign')}
                >
                  <UsersIcon className="mr-1" />
                  Atribuir
                </Button>
              )}

              {entityType === 'task' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('complete')}
                >
                  <CheckSquare className="mr-1" />
                  Completar
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {entities.map(entity => (
            <div
              key={entity.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedIds.includes(entity.id)}
                onCheckedChange={() => toggleEntity(entity.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{getEntityName(entity)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {'status' in entity ? entity.status : 'completed' in entity && entity.completed ? 'Completa' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar {getActionLabel()}</DialogTitle>
            <DialogDescription>
              Esta ação afetará {selectedIds.length} {getEntityTypeLabel(selectedIds.length)}.
              {selectedAction === 'delete' && ' Esta ação não pode ser desfeita.'}
            </DialogDescription>
          </DialogHeader>

          {selectedAction === 'change_status' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Novo Status</label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DealStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="concluded">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedAction === 'change_stage' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Novo Estágio</label>
              <Select value={newStage} onValueChange={(v) => setNewStage(v as PlayerStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="analysis">Análise</SelectItem>
                  <SelectItem value="proposal">Proposta</SelectItem>
                  <SelectItem value="negotiation">Negociação</SelectItem>
                  <SelectItem value="closing">Fechamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedAction === 'assign' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Atribuir a</label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {(users || []).map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={executeBulkAction}
              variant={selectedAction === 'delete' ? 'destructive' : 'default'}
              disabled={
                (selectedAction === 'assign' && !assigneeId)
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
