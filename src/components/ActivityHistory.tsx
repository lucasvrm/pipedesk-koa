import { useState, useMemo } from 'react'
import { useActivities } from '@/services/activityService'
import { useUsers } from '@/services/userService'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { getInitials, formatDateTime } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus, PencilSimple, Trash, XCircle, ArrowRight,
  ChatCircle, FileArrowUp, ClockCounterClockwise,
  Funnel, ArrowsDownUp, CalendarBlank, X
} from '@phosphor-icons/react'

interface ActivityHistoryProps {
  entityId?: string
  entityType?: string
  limit?: number
  showUser?: boolean
  disableScroll?: boolean
}

export default function ActivityHistory({ 
  entityId, 
  entityType, 
  limit = 100, // Aumentei o limite padrão para fazer sentido filtrar
  showUser = true,
  disableScroll = false
}: ActivityHistoryProps) {
  const { data: activities, isLoading } = useActivities(entityId, entityType)
  const { data: users } = useUsers()

  // Estados dos Filtros
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Helper para identificar tipo
  const getActivityType = (action: string) => {
    const lower = action.toLowerCase()
    if (lower.includes('coment')) return 'comment'
    if (lower.includes('status') || lower.includes('fase') || lower.includes('mov')) return 'status'
    if (lower.includes('criou') || lower.includes('adicion')) return 'creation'
    if (lower.includes('edit') || lower.includes('atualiz')) return 'edit'
    if (lower.includes('delet') || lower.includes('exclu') || lower.includes('cancel')) return 'delete'
    if (lower.includes('arquivo') || lower.includes('upload')) return 'file'
    return 'other'
  }

  // Filtragem e Ordenação
  const processedActivities = useMemo(() => {
    if (!activities) return []

    let result = [...activities]

    // 1. Filtro Usuário
    if (filterUser !== 'all') {
      result = result.filter(a => a.user_id === filterUser)
    }

    // 2. Filtro Data
    if (filterDate) {
      result = result.filter(a => isSameDay(new Date(a.created_at), filterDate))
    }

    // 3. Filtro Tipo
    if (filterType !== 'all') {
      result = result.filter(a => getActivityType(a.action) === filterType)
    }

    // 4. Ordenação
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    return result.slice(0, limit)
  }, [activities, filterUser, filterDate, filterType, sortOrder, limit])

  // Helper de Ícone
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'creation': return <Plus className="text-emerald-500" />
      case 'edit': return <PencilSimple className="text-blue-500" />
      case 'delete': return <Trash className="text-red-500" />
      case 'comment': return <ChatCircle className="text-slate-500" />
      case 'status': return <ArrowRight className="text-amber-500" />
      case 'file': return <FileArrowUp className="text-indigo-500" />
      default: return <ClockCounterClockwise className="text-muted-foreground" />
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Carregando histórico...</div>
  }

  const content = (
    <div className="space-y-4 p-1">
      {processedActivities.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">Nenhuma atividade encontrada com os filtros atuais.</p>
        </div>
      ) : (
        processedActivities.map((activity, index) => {
          const user = activity.user
          const type = getActivityType(activity.action)
          const isFirst = index === 0
          
          return (
            <div key={activity.id} className="relative pl-4 border-l border-border pb-4 last:pb-0 last:border-0">
              <div className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border bg-background ${isFirst ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm">
                  {showUser && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 border border-border">
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback className="text-[9px] bg-muted">{getInitials(user?.name || 'U')}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-xs text-foreground">{user?.name || 'Sistema'}</span>
                    </div>
                  )}
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</span>
                </div>

                <div className="flex items-start gap-3 mt-1 bg-card border rounded-md p-3 shadow-sm transition-all hover:border-primary/20">
                  <div className="mt-0.5 shrink-0">{getActivityIcon(type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    {activity.changes && Object.keys(activity.changes).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border/50">
                        {Object.entries(activity.changes).map(([key, value]) => {
                          if (!value || key === 'updated_at') return null
                          return (
                            <div key={key} className="flex gap-1 items-start mb-0.5 last:mb-0">
                              <span className="font-semibold capitalize text-foreground/80 shrink-0">{key.replace(/_/g, ' ')}:</span>
                              <span className="truncate break-all">{String(value)}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-muted/10 rounded-md">
        {/* Filtro Usuário */}
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="h-8 text-xs w-[120px] bg-background">
            <div className="flex items-center gap-2 truncate">
              <Funnel className="h-3 w-3" />
              <SelectValue placeholder="Usuário" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {users?.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro Tipo */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 text-xs w-[120px] bg-background">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="comment">Comentários</SelectItem>
            <SelectItem value="status">Status/Fase</SelectItem>
            <SelectItem value="edit">Edições</SelectItem>
            <SelectItem value="creation">Criações</SelectItem>
            <SelectItem value="delete">Remoções</SelectItem>
            <SelectItem value="file">Arquivos</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro Data */}
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                size="sm"
                className={cn(
                  "h-8 text-xs justify-start text-left font-normal w-[130px] bg-background",
                  !filterDate && "text-muted-foreground"
                )}
              >
                <CalendarBlank className="mr-2 h-3 w-3" />
                {filterDate ? format(filterDate, "P", { locale: ptBR }) : <span>Data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="end">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          {filterDate && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFilterDate(undefined)}>
              <X size={12} />
            </Button>
          )}
        </div>

        {/* Ordenação */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0 bg-background ml-auto" 
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          title={sortOrder === 'asc' ? 'Mais antigos primeiro' : 'Mais recentes primeiro'}
        >
          <ArrowsDownUp className={sortOrder === 'asc' ? 'rotate-180' : ''} />
        </Button>
      </div>

      {disableScroll ? (
        <div className="pr-4">{content}</div>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          {content}
        </ScrollArea>
      )}
    </div>
  )
}