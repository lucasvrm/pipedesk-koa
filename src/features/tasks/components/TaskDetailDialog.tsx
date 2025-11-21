import { useState } from 'react'
import { useKV } from '@/hooks/useKV'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CalendarBlank,
  User as UserIcon,
  Flag,
  LinkSimple,
  Clock,
  ChatCircle,
  Trash,
  PencilSimple,
} from '@phosphor-icons/react'
import { Task, PlayerTrack, MasterDeal, User, Comment } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/helpers'
import { toast } from 'sonner'
import CreateTaskDialog from './CreateTaskDialog'
import CommentsPanel from '@/components/CommentsPanel'

interface TaskDetailDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleComplete: (task: Task) => void
  currentUser: User
}

export default function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onToggleComplete,
  currentUser,
}: TaskDetailDialogProps) {
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [users] = useKV<User[]>('users', [])
  const [comments] = useKV<Comment[]>('comments', [])
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const track = playerTracks?.find(t => t.id === task.playerTrackId)
  const deal = track ? masterDeals?.find(d => d.id === track.masterDealId) : undefined
  
  const assignees = task.assignees
    .map(id => users?.find(u => u.id === id))
    .filter((u): u is User => !!u)
  
  const dependencies = task.dependencies
    .map(id => tasks?.find(t => t.id === id))
    .filter((t): t is Task => !!t)
  
  const dependents = (tasks || []).filter(t => t.dependencies.includes(task.id))
  
  const blockedBy = dependencies.filter(t => !t.completed)
  
  const taskComments = (comments || []).filter(
    c => c.entityType === 'task' && c.entityId === task.id
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < today

  const handleDelete = () => {
    if (dependents.length > 0) {
      toast.error('Não é possível excluir tarefa com dependentes')
      return
    }

    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      setTasks((currentTasks) => (currentTasks || []).filter(t => t.id !== task.id))
      toast.success('Tarefa excluída')
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {task.isMilestone && <Flag className="h-5 w-5 text-accent" />}
                  <DialogTitle className={task.completed ? 'line-through' : ''}>
                    {task.title}
                  </DialogTitle>
                </div>
                {track && (
                  <div className="text-sm text-muted-foreground">
                    {track.playerName} - {deal?.clientName || 'N/A'}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <PencilSimple />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-4 pr-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task)}
                  disabled={blockedBy.length > 0}
                  id="task-complete"
                />
                <label
                  htmlFor="task-complete"
                  className="text-sm font-medium cursor-pointer"
                >
                  {task.completed ? 'Concluída' : 'Marcar como concluída'}
                </label>
              </div>

              {blockedBy.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Tarefa Bloqueada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Esta tarefa está bloqueada por {blockedBy.length} dependência(s) não concluída(s)
                  </p>
                </div>
              )}

              {isOverdue && !task.completed && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive">
                    Tarefa Atrasada
                  </p>
                </div>
              )}

              {task.description && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {task.dueDate && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarBlank className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Vencimento
                      </p>
                    </div>
                    <Badge
                      variant={isOverdue ? 'destructive' : 'default'}
                      className="font-normal"
                    >
                      {formatDate(task.dueDate)}
                    </Badge>
                  </div>
                )}

                {assignees.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Responsáveis
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assignees.map(user => (
                        <Badge key={user.id} variant="secondary" className="font-normal">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">Criada em</p>
                  </div>
                  <p className="text-sm">{formatDateTime(task.createdAt)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">
                      Atualizada em
                    </p>
                  </div>
                  <p className="text-sm">{formatDateTime(task.updatedAt)}</p>
                </div>
              </div>

              {dependencies.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LinkSimple className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">
                      Dependências ({dependencies.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {dependencies.map(dep => (
                      <div
                        key={dep.id}
                        className="p-2 bg-muted/50 rounded-lg flex items-center gap-2"
                      >
                        <Checkbox checked={dep.completed} disabled />
                        <span className={`text-sm ${dep.completed ? 'line-through' : ''}`}>
                          {dep.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dependents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LinkSimple className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">
                      Tarefas Dependentes ({dependents.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {dependents.map(dep => (
                      <div
                        key={dep.id}
                        className="p-2 bg-muted/50 rounded-lg flex items-center gap-2"
                      >
                        <Checkbox checked={dep.completed} disabled />
                        <span className={`text-sm ${dep.completed ? 'line-through' : ''}`}>
                          {dep.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="w-full"
                >
                  <ChatCircle className="mr-2" />
                  Comentários ({taskComments.length})
                </Button>
                {showComments && (
                  <div className="mt-3">
                    <CommentsPanel
                      entityId={task.id}
                      entityType="task"
                      currentUser={currentUser}
                    />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CreateTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        playerTrackId={task.playerTrackId}
        editingTask={task}
      />
    </>
  )
}
