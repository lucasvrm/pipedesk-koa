import { useKV } from '@/hooks/useKV'
import { Task, MasterDeal, PlayerTrack } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, CaretLeft, CaretRight, Flag, LinkSimple, Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import CreateTaskDialog from '@/features/tasks/components/CreateTaskDialog'
import { formatDate } from '@/lib/helpers'

interface PlayerCalendarProps {
  playerTrackId: string
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  tasks: Task[]
}

export default function PlayerCalendar({ playerTrackId }: PlayerCalendarProps) {
  const [tasks] = useKV<Task[]>('tasks', [])
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const trackTasks = (tasks || []).filter(t => t.playerTrackId === playerTrackId)
  const currentTrack = (playerTracks || []).find(t => t.id === playerTrackId)
  const currentDeal = (masterDeals || []).find(d => d.id === currentTrack?.masterDealId)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const calendarDays: CalendarDay[] = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  }).map(date => ({
    date,
    isCurrentMonth: isSameMonth(date, currentDate),
    tasks: trackTasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    ),
  }))

  const dealDeadline = currentDeal?.deadline ? new Date(currentDeal.deadline) : null

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const selectedDayTasks = selectedDate 
    ? trackTasks.filter(task => 
        task.dueDate && isSameDay(new Date(task.dueDate), selectedDate)
      )
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Calendário de Prazos</h3>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h4>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <CaretLeft />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <CaretRight />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {calendarDays.map((calendarDay, index) => {
              const isSelected = selectedDate && isSameDay(calendarDay.date, selectedDate)
              const isDealDeadline = dealDeadline && isSameDay(calendarDay.date, dealDeadline)
              const dayIsToday = isToday(calendarDay.date)
              const hasTasks = calendarDay.tasks.length > 0
              const completedTasks = calendarDay.tasks.filter(t => t.completed).length
              const allCompleted = hasTasks && completedTasks === calendarDay.tasks.length

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(calendarDay.date)}
                  className={`
                    relative min-h-[80px] p-2 rounded-lg border transition-all
                    ${!calendarDay.isCurrentMonth ? 'opacity-40' : ''}
                    ${dayIsToday ? 'border-primary bg-primary/5' : 'border-border'}
                    ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}
                    ${isDealDeadline ? 'bg-destructive/10 border-destructive' : ''}
                    hover:bg-muted/50 hover:border-primary/50
                  `}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`
                      text-xs font-medium
                      ${dayIsToday ? 'text-primary font-bold' : 'text-foreground'}
                      ${!calendarDay.isCurrentMonth ? 'text-muted-foreground' : ''}
                    `}>
                      {format(calendarDay.date, 'd')}
                    </span>
                    {isDealDeadline && (
                      <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">
                        Prazo
                      </Badge>
                    )}
                  </div>

                  {hasTasks && (
                    <div className="space-y-1">
                      {calendarDay.tasks.slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          className={`
                            text-[9px] leading-tight p-1 rounded truncate
                            ${task.completed 
                              ? 'bg-success/20 text-success line-through' 
                              : task.isMilestone
                              ? 'bg-accent/20 text-accent font-medium'
                              : 'bg-primary/20 text-primary'
                            }
                          `}
                          title={task.title}
                        >
                          {task.isMilestone && <Flag weight="fill" className="inline h-2 w-2 mr-0.5" />}
                          {task.title.substring(0, 15)}{task.title.length > 15 ? '...' : ''}
                        </div>
                      ))}
                      {calendarDay.tasks.length > 2 && (
                        <div className="text-[8px] text-muted-foreground text-center">
                          +{calendarDay.tasks.length - 2} mais
                        </div>
                      )}
                    </div>
                  )}

                  {allCompleted && hasTasks && (
                    <div className="absolute bottom-1 right-1">
                      <Check weight="bold" className="h-3 w-3 text-success" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">
                Tarefas - {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              </h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedDate(null)}
              >
                Fechar
              </Button>
            </div>
            
            {selectedDayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tarefa nesta data
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayTasks.map(task => {
                  const hasBlockingDeps = task.dependencies.some(
                    depId => tasks?.find(t => t.id === depId && !t.completed)
                  )

                  return (
                    <div
                      key={task.id}
                      className={`
                        p-3 rounded-lg border
                        ${task.completed ? 'bg-success/5 border-success/20' : 'bg-card'}
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.completed && (
                          <Check weight="bold" className="h-4 w-4 text-success flex-shrink-0" />
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {task.isMilestone && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 border-accent text-accent">
                            <Flag weight="fill" className="h-2.5 w-2.5" />
                            Marco
                          </Badge>
                        )}
                        {task.dependencies.length > 0 && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${
                              hasBlockingDeps ? 'border-destructive text-destructive' : ''
                            }`}
                          >
                            <LinkSimple className="h-2.5 w-2.5" />
                            {task.dependencies.length} {hasBlockingDeps ? 'bloqueada' : 'dep.'}
                          </Badge>
                        )}
                        {task.assignees.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                            {task.assignees.length} {task.assignees.length === 1 ? 'responsável' : 'responsáveis'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Este Mês</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Tarefas:</span>
                <span className="font-medium">
                  {trackTasks.filter(t => 
                    t.dueDate && isSameMonth(new Date(t.dueDate), currentDate)
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concluídas:</span>
                <span className="font-medium text-success">
                  {trackTasks.filter(t => 
                    t.dueDate && isSameMonth(new Date(t.dueDate), currentDate) && t.completed
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marcos:</span>
                <span className="font-medium text-accent">
                  {trackTasks.filter(t => 
                    t.dueDate && isSameMonth(new Date(t.dueDate), currentDate) && t.isMilestone
                  ).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Próximos Prazos</h4>
            <div className="space-y-2">
              {trackTasks
                .filter(t => t.dueDate && new Date(t.dueDate) >= new Date() && !t.completed)
                .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                .slice(0, 3)
                .map(task => (
                  <div key={task.id} className="text-xs">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-muted-foreground">{formatDate(task.dueDate!)}</p>
                  </div>
                ))}
              {trackTasks.filter(t => t.dueDate && new Date(t.dueDate) >= new Date() && !t.completed).length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum prazo pendente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={dealDeadline ? 'border-destructive' : ''}>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Prazo do Negócio</h4>
            {dealDeadline ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold text-destructive">
                  {format(dealDeadline, 'd')}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {format(dealDeadline, "MMMM yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs font-medium">
                  {Math.ceil((dealDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sem prazo definido</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateTaskDialog
        playerTrackId={playerTrackId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
