import { useState, useEffect } from 'react'
import { useTasks, useCreateTask, useUpdateTask } from '@/services/taskService'
import { useUsers } from '@/services/userService'
import { X, Flag, LinkSimple } from '@phosphor-icons/react'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task } from '@/lib/types'
import { toast } from 'sonner'

interface CreateTaskDialogProps {
  playerTrackId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTask?: Task | null
}

export default function CreateTaskDialog({
  playerTrackId,
  open,
  onOpenChange,
  editingTask,
}: CreateTaskDialogProps) {
  const { data: tasks } = useTasks()
  const { data: users } = useUsers()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignees, setAssignees] = useState<string[]>([])
  const [isMilestone, setIsMilestone] = useState(false)
  const [dependencies, setDependencies] = useState<string[]>([])

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title)
      setDescription(editingTask.description)
      setDueDate(editingTask.dueDate || '')
      setAssignees(editingTask.assignees)
      setIsMilestone(editingTask.isMilestone)
      setDependencies(editingTask.dependencies)
    } else {
      resetForm()
    }
  }, [editingTask, open])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
    setAssignees([])
    setIsMilestone(false)
    setDependencies([])
  }

  const detectCircularDependency = (taskId: string, depId: string, allTasks: Task[]): boolean => {
    const visited = new Set<string>()
    const queue = [depId]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === taskId) return true
      if (visited.has(current)) continue
      visited.add(current)

      const task = allTasks.find(t => t.id === current)
      if (task) {
        queue.push(...task.dependencies)
      }
    }

    return false
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    const allTasks = tasks || []

    if (dependencies.length > 0) {
      for (const depId of dependencies) {
        if (detectCircularDependency(editingTask?.id || 'new', depId, allTasks)) {
          toast.error('Dependência circular detectada')
          return
        }
      }
    }

    if (editingTask) {
      updateTask.mutate({
        taskId: editingTask.id,
        updates: {
          title,
          description,
          dueDate: dueDate || undefined,
          assignees,
          isMilestone,
          dependencies,
        }
      }, {
        onSuccess: () => {
          toast.success('Tarefa atualizada')
          onOpenChange(false)
          resetForm()
        },
        onError: () => toast.error('Erro ao atualizar tarefa')
      })
    } else {
      if (!playerTrackId) {
        toast.error('Selecione um player track')
        return
      }

      createTask.mutate({
        playerTrackId,
        title,
        description,
        dueDate: dueDate || undefined,
        assignees,
        isMilestone,
        // Note: dependencies support needs to be added to createTask service if not present
        // I will assume I'll fix the service next.
      }, {
        onSuccess: (newTask) => {
          // If dependencies are needed and not supported by create, we might need a second update
          // But better to support it in create.
          if (dependencies.length > 0) {
            updateTask.mutate({
              taskId: newTask.id,
              updates: { dependencies }
            })
          }
          toast.success('Tarefa criada')
          onOpenChange(false)
          resetForm()
        },
        onError: () => toast.error('Erro ao criar tarefa')
      })
    }
  }

  const availableTasks = (tasks || []).filter(
    t => t.playerTrackId === playerTrackId && t.id !== editingTask?.id
  )

  const toggleDependency = (taskId: string) => {
    setDependencies(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const availableUsers = users || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          <DialogDescription>
            {editingTask ? 'Atualize as informações da tarefa' : 'Adicione uma nova tarefa ao player track'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              placeholder="Ex: Enviar NDA para assinatura"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição</Label>
            <Textarea
              id="task-description"
              placeholder="Detalhes da tarefa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Data de Vencimento</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignees">Responsáveis</Label>
              <Select
                value={assignees[0] || ''}
                onValueChange={(value) => {
                  if (value && !assignees.includes(value)) {
                    setAssignees([...assignees, value])
                  }
                }}
              >
                <SelectTrigger id="task-assignees">
                  <SelectValue placeholder="Selecionar usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {assignees.map(userId => {
                    const user = availableUsers.find(u => u.id === userId)
                    return (
                      <div
                        key={userId}
                        className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                      >
                        <span>{user?.name || userId}</span>
                        <button
                          onClick={() => setAssignees(assignees.filter(id => id !== userId))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="task-milestone"
              checked={isMilestone}
              onCheckedChange={(checked) => setIsMilestone(!!checked)}
            />
            <Label htmlFor="task-milestone" className="cursor-pointer flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Marcar como marco importante
            </Label>
          </div>

          {availableTasks.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LinkSimple className="h-4 w-4" />
                Dependências
              </Label>
              <p className="text-xs text-muted-foreground">
                Esta tarefa será bloqueada até que as dependências sejam concluídas
              </p>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {availableTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`dep-${task.id}`}
                      checked={dependencies.includes(task.id)}
                      onCheckedChange={() => toggleDependency(task.id)}
                    />
                    <Label
                      htmlFor={`dep-${task.id}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {task.title}
                      {task.isMilestone && <Flag className="inline h-3 w-3 ml-1 text-accent" />}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingTask ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
