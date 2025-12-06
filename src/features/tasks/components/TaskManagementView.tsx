import { useState, useMemo } from 'react'
import { useTasks, useUpdateTask, useDeleteTask } from '@/services/taskService'
import { useTracks } from '@/services/trackService'
import { useDeals } from '@/services/dealService'
import { useUsers } from '@/services/userService'
import {
  ListChecks,
  Plus,
  Funnel,
  SortAscending,
  CalendarBlank,
  User as UserIcon,
  Flag,
  CheckCircle,
  Clock,
  Circle,
  Kanban,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'


import { Checkbox } from '@/components/ui/checkbox'
import { Task, User } from '@/lib/types'
import { formatDate } from '@/lib/helpers'
import { toast } from 'sonner'
import CreateTaskDialog from './CreateTaskDialog'
import TaskDetailDialog from './TaskDetailDialog'
import TaskKanbanView from './TaskKanbanView'
import { PageContainer } from '@/components/PageContainer'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { getTaskQuickActions } from '@/hooks/useQuickActions'

interface TaskManagementViewProps {
  currentUser: User
}

type TaskFilter = 'all' | 'my-tasks' | 'overdue' | 'today' | 'week' | 'completed' | 'milestone'
type TaskSort = 'due-date' | 'priority' | 'created' | 'updated' | 'alphabetical'
type ViewMode = 'list' | 'kanban' | 'grouped'

export default function TaskManagementView({ currentUser }: TaskManagementViewProps) {
  const { data: tasks } = useTasks()
  const { data: playerTracks } = useTracks()
  const { data: masterDeals } = useDeals()
  const { data: users } = useUsers()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [sortBy, setSortBy] = useState<TaskSort>('due-date')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekFromNow = new Date(today)
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = (tasks || [])

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      )
    }

    if (selectedTrackId !== 'all') {
      filtered = filtered.filter(task => task.playerTrackId === selectedTrackId)
    }

    switch (filter) {
      case 'my-tasks':
        filtered = filtered.filter(task => task.assignees.includes(currentUser.id))
        break
      case 'overdue':
        filtered = filtered.filter(task => {
          if (!task.dueDate || task.completed) return false
          return new Date(task.dueDate) < today
        })
        break
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.dueDate || task.completed) return false
          const dueDate = new Date(task.dueDate)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate.getTime() === today.getTime()
        })
        break
      case 'week':
        filtered = filtered.filter(task => {
          if (!task.dueDate || task.completed) return false
          const dueDate = new Date(task.dueDate)
          return dueDate >= today && dueDate <= weekFromNow
        })
        break
      case 'completed':
        filtered = filtered.filter(task => task.completed)
        break
      case 'milestone':
        filtered = filtered.filter(task => task.isMilestone)
        break
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'due-date':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'priority': {
          const priorityA = a.isMilestone ? 2 : (a.dueDate && new Date(a.dueDate) < today ? 1 : 0)
          const priorityB = b.isMilestone ? 2 : (b.dueDate && new Date(b.dueDate) < today ? 1 : 0)
          return priorityB - priorityA
        }
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return sorted
  }, [tasks, searchQuery, filter, sortBy, selectedTrackId, currentUser.id, today, weekFromNow])

  const stats = useMemo(() => {
    const allTasks = tasks || []
    const myTasks = allTasks.filter(t => t.assignees.includes(currentUser.id))
    const overdue = allTasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < today)
    const todayTasks = allTasks.filter(t => {
      if (!t.dueDate || t.completed) return false
      const dueDate = new Date(t.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    })
    const completed = allTasks.filter(t => t.completed)

    return {
      total: allTasks.length,
      myTasks: myTasks.length,
      overdue: overdue.length,
      today: todayTasks.length,
      completed: completed.length,
      completionRate: allTasks.length > 0 ? Math.round((completed.length / allTasks.length) * 100) : 0,
    }
  }, [tasks, currentUser.id, today])

  const handleToggleComplete = (task: Task) => {
    const blockedBy = task.dependencies
      .map(depId => tasks?.find(t => t.id === depId))
      .filter((t): t is Task => !!t && !t.completed)

    if (blockedBy.length > 0 && !task.completed) {
      toast.error('Tarefa bloqueada por dependências não concluídas')
      return
    }

    updateTask.mutate({
      taskId: task.id,
      updates: { completed: !task.completed }
    }, {
      onSuccess: () => {
        if (!task.completed && task.isMilestone) {
          toast.success('🎉 Marco concluído!', {
            description: task.title,
          })
        }
      },
      onError: () => {
        toast.error('Erro ao atualizar tarefa')
      }
    })
  }

  const getTrackInfo = (trackId: string) => {
    const track = playerTracks?.find(t => t.id === trackId)
    if (!track) return null
    const deal = masterDeals?.find(d => d.id === track.masterDealId)
    return { track, deal }
  }

  const getAssigneeNames = (assigneeIds: string[]) => {
    return assigneeIds
      .map(id => users?.find(u => u.id === id)?.name || 'Unknown')
      .join(', ')
  }

  const isTaskOverdue = (task: Task): boolean => {
    return !!(task.dueDate && !task.completed && new Date(task.dueDate) < today)
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Tarefas</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie todas as tarefas do sistema
                </p>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2" />
              Nova Tarefa
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Minhas</p>
                </div>
                <p className="text-2xl font-bold">{stats.myTasks}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-destructive" />
                  <p className="text-xs text-muted-foreground">Atrasadas</p>
                </div>
                <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarBlank className="h-4 w-4 text-accent" />
                  <p className="text-xs text-muted-foreground">Hoje</p>
                </div>
                <p className="text-2xl font-bold">{stats.today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                </div>
                <p className="text-2xl font-bold text-success">{stats.completionRate}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por player" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os players</SelectItem>
                  {(playerTracks || []).map(track => {
                    const deal = masterDeals?.find(d => d.id === track.masterDealId)
                    return (
                      <SelectItem key={track.id} value={track.id}>
                        {track.playerName} - {deal?.clientName || 'N/A'}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Select value={filter} onValueChange={(v) => setFilter(v as TaskFilter)}>
                <SelectTrigger className="w-[160px]">
                  <Funnel className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="my-tasks">Minhas tarefas</SelectItem>
                  <SelectItem value="overdue">Atrasadas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="milestone">Marcos</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as TaskSort)}>
                <SelectTrigger className="w-[160px]">
                  <SortAscending className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due-date">Data de vencimento</SelectItem>
                  <SelectItem value="priority">Prioridade</SelectItem>
                  <SelectItem value="created">Data de criação</SelectItem>
                  <SelectItem value="updated">Última atualização</SelectItem>
                  <SelectItem value="alphabetical">Alfabética</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <Kanban className="mr-2 h-4 w-4" />
              Kanban
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === 'kanban' ? (
          <TaskKanbanView
            tasks={filteredAndSortedTasks}
            onToggleComplete={handleToggleComplete}
            onSelectTask={setSelectedTask}
            getTrackInfo={getTrackInfo}
            getAssigneeNames={getAssigneeNames}
            isTaskOverdue={isTaskOverdue}
          />
        ) : (
          <div>
            {filteredAndSortedTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <ListChecks className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Nenhuma tarefa encontrada</p>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery.trim()
                          ? 'Tente ajustar sua busca ou filtros'
                          : 'Comece criando uma nova tarefa'}
                      </p>
                    </div>
                    {!searchQuery.trim() && (
                      <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                        <Plus className="mr-2" />
                        Criar Tarefa
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedTasks.map((task) => {
                  const trackInfo = getTrackInfo(task.playerTrackId)
                  const isOverdue = isTaskOverdue(task)
                  const blockedBy = task.dependencies
                    .map(depId => tasks?.find(t => t.id === depId))
                    .filter((t): t is Task => !!t && !t.completed)

                  return (
                    <Card
                      key={task.id}
                      className={`cursor-pointer transition-colors hover:bg-accent/5 ${task.completed ? 'opacity-60' : ''
                        }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleComplete(task)}
                              disabled={blockedBy.length > 0}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {task.isMilestone && (
                                    <Flag className="h-4 w-4 text-accent flex-shrink-0" />
                                  )}
                                  <h3
                                    className={`font-medium ${task.completed ? 'line-through' : ''
                                      }`}
                                  >
                                    {task.title}
                                  </h3>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              {task.dueDate && (
                                <Badge
                                  variant={
                                    isOverdue
                                      ? 'destructive'
                                      : task.completed
                                        ? 'secondary'
                                        : 'default'
                                  }
                                  className="flex-shrink-0"
                                >
                                  <CalendarBlank className="mr-1 h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {trackInfo && (
                                <Badge variant="outline" className="font-normal">
                                  {trackInfo.track.playerName} -{' '}
                                  {trackInfo.deal?.clientName || 'N/A'}
                                </Badge>
                              )}
                              {task.assignees.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" />
                                  {getAssigneeNames(task.assignees)}
                                </span>
                              )}
                              {task.dependencies.length > 0 && (
                                <Badge variant="secondary" className="font-normal">
                                  {task.dependencies.length} dependência(s)
                                </Badge>
                              )}
                              {blockedBy.length > 0 && (
                                <Badge variant="destructive" className="font-normal">
                                  Bloqueada
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                            <QuickActionsMenu
                              actions={getTaskQuickActions({
                                task,
                                updateTask,
                                deleteTask,
                                profileId: currentUser?.id,
                                onEdit: () => setSelectedTask(task),
                              })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onToggleComplete={handleToggleComplete}
          currentUser={currentUser}
        />
      )}
    </PageContainer>
  )
}
