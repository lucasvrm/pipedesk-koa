import { useState, useMemo } from 'react'
import { useActivities, ActivityEntityType } from '@/services/activityService'
import { useUsers } from '@/services/userService'
import { UserBadge } from '@/components/ui/user-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/helpers'
import {
  Plus, PencilSimple, Trash, XCircle, ArrowRight,
  ChatCircle, FileArrowUp, ClockCounterClockwise,
  Funnel, ArrowsDownUp, CheckCircle, Sparkle, WarningCircle
} from '@phosphor-icons/react'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ActivityHistoryProps {
  entityId: string
  entityType: ActivityEntityType
  limit?: number
  showUser?: boolean
  disableScroll?: boolean
}

// Group activities by date
function groupActivitiesByDate(activities: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>()

  activities.forEach(activity => {
    const date = new Date(activity.created_at)
    let dateKey: string

    if (isToday(date)) {
      dateKey = 'Hoje'
    } else if (isYesterday(date)) {
      dateKey = 'Ontem'
    } else {
      dateKey = format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(activity)
  })

  return groups
}

export default function ActivityHistory({ 
  entityId, 
  entityType, 
  limit = 100,
  showUser = true,
  disableScroll = false
}: ActivityHistoryProps) {
  const { data: activities, isLoading, error, refetch } = useActivities(entityId, entityType)
  const { data: users } = useUsers()

  // Estados dos Filtros
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const getActivityType = (action: string) => {
    const lower = action.toLowerCase()
    if (lower.includes('coment')) return 'comment'
    if (lower.includes('status') || lower.includes('fase') || lower.includes('mov')) return 'status'
    if (lower.includes('criou') || lower.includes('adicion')) return 'creation'
    if (lower.includes('edit') || lower.includes('atualiz')) return 'edit'
    if (lower.includes('delet') || lower.includes('exclu') || lower.includes('cancel')) return 'delete'
    if (lower.includes('arquivo') || lower.includes('upload')) return 'file'
    if (lower.includes('conclu') || lower.includes('finaliz')) return 'completed'
    return 'other'
  }

  const processedActivities = useMemo(() => {
    if (!activities) return []

    let result = [...activities]

    // 1. Filtro Usuário
    if (filterUser !== 'all') {
      result = result.filter(a => a.user_id === filterUser)
    }

    // 2. Filtro Tipo
    if (filterType !== 'all') {
      result = result.filter(a => getActivityType(a.action) === filterType)
    }

    // 3. Ordenação
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    return result.slice(0, limit)
  }, [activities, filterUser, filterType, sortOrder, limit])

  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(processedActivities)
  }, [processedActivities])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'creation': return <Plus className="h-4 w-4" weight="bold" />
      case 'edit': return <PencilSimple className="h-4 w-4" weight="bold" />
      case 'delete': return <Trash className="h-4 w-4" weight="bold" />
      case 'comment': return <ChatCircle className="h-4 w-4" weight="fill" />
      case 'status': return <ArrowRight className="h-4 w-4" weight="bold" />
      case 'file': return <FileArrowUp className="h-4 w-4" weight="bold" />
      case 'completed': return <CheckCircle className="h-4 w-4" weight="bold" />
      default: return <ClockCounterClockwise className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'creation': return 'bg-emerald-500 text-white'
      case 'edit': return 'bg-blue-500 text-white'
      case 'delete': return 'bg-red-500 text-white'
      case 'comment': return 'bg-slate-500 text-white'
      case 'status': return 'bg-amber-500 text-white'
      case 'file': return 'bg-indigo-500 text-white'
      case 'completed': return 'bg-green-600 text-white'
      default: return 'bg-slate-400 text-white'
    }
  }

  const isImportant = (action: string) => {
    const lower = action.toLowerCase()
    return (
      lower.includes('fechou') ||
      lower.includes('concluiu') ||
      lower.includes('ganhou') ||
      lower.includes('perdeu') ||
      lower.includes('qualificou')
    )
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return { text, isTruncated: false }
    return { text: text.slice(0, maxLength) + '...', isTruncated: true }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="relative pl-12">
              <Skeleton className="absolute left-0 top-1 h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <WarningCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm font-medium text-foreground mb-2">Erro ao carregar atividades</p>
        <p className="text-xs text-muted-foreground mb-4">
          Não foi possível carregar o histórico de atividades.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  const content = (
    <div className="space-y-6">
      {groupedActivities.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg bg-muted/10">
          <ClockCounterClockwise className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Nenhuma atividade encontrada</p>
          <p className="text-xs text-muted-foreground">
            {filterUser !== 'all' || filterType !== 'all' 
              ? 'Tente ajustar os filtros aplicados.' 
              : 'Nenhuma atividade foi registrada ainda.'}
          </p>
        </div>
      ) : (
        Array.from(groupedActivities.entries()).map(([dateLabel, dateActivities]) => (
          <div key={dateLabel} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
                {dateLabel}
              </Badge>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Activities for this date */}
            <div className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-0.5 before:bg-border">
              {dateActivities.map((activity) => {
                const user = activity.user
                const type = getActivityType(activity.action)
                const important = isImportant(activity.action)
                const { text: truncatedAction, isTruncated } = truncateText(activity.action, 150)
                const isExpanded = expandedItems.has(activity.id)
                const displayAction = isExpanded || !isTruncated ? activity.action : truncatedAction
                
                return (
                  <div key={activity.id} className="relative pl-12 group">
                    {/* Timeline Icon */}
                    <div className={cn(
                      "absolute left-0 top-1 h-8 w-8 rounded-full border-2 border-background flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                      getActivityColor(type),
                      important && "ring-2 ring-offset-2 ring-amber-400"
                    )}>
                      {getActivityIcon(type)}
                    </div>

                    {/* Content Card */}
                    <div className="bg-card border rounded-lg p-3 shadow-sm transition-all hover:border-primary/20">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {showUser && (
                            <>
                              <UserBadge
                                name={user?.name || 'Sistema'}
                                avatarUrl={user?.avatar_url}
                                bgColor={user?.avatarBgColor}
                                textColor={user?.avatarTextColor}
                                borderColor={user?.avatarBorderColor}
                                size="xs"
                              />
                              <span className="text-xs font-semibold text-foreground truncate">
                                {user?.name || 'Sistema'}
                              </span>
                              <span className="text-muted-foreground text-xs">•</span>
                            </>
                          )}
                          {important && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500">
                              <Sparkle className="h-2.5 w-2.5 mr-0.5" weight="fill" />
                              importante
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(activity.created_at), 'HH:mm', { locale: ptBR })}
                        </span>
                      </div>

                      {/* Main Content */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {displayAction}
                        </p>

                        {/* Show more/less button */}
                        {isTruncated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-primary hover:text-primary"
                            onClick={() => toggleExpanded(activity.id)}
                          >
                            {isExpanded ? 'ver menos' : 'ver mais'}
                          </Button>
                        )}

                        {/* Changes metadata */}
                        {activity.changes && Object.keys(activity.changes).length > 0 && (
                          <div className="mt-2 p-2 rounded bg-muted/50 border border-border/50 space-y-1">
                            {Object.entries(activity.changes).map(([key, value]) => {
                              if (!value || key === 'updated_at') return null
                              return (
                                <div key={key} className="flex gap-2 text-[11px]">
                                  <span className="font-semibold capitalize text-foreground/80 shrink-0">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="text-muted-foreground break-all">
                                    {String(value)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/10 rounded-md border">
        {/* Filtro Usuário */}
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
            <div className="flex items-center gap-2 truncate">
              <Funnel className="h-3 w-3" />
              <SelectValue placeholder="Usuário" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários</SelectItem>
            {users?.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro Tipo */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
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
            <SelectItem value="completed">Concluídas</SelectItem>
          </SelectContent>
        </Select>

        {/* Ordenação */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 bg-background ml-auto" 
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          title={sortOrder === 'asc' ? 'Mais antigos primeiro' : 'Mais recentes primeiro'}
        >
          <ArrowsDownUp className={cn("h-3.5 w-3.5 transition-transform", sortOrder === 'asc' && 'rotate-180')} />
          <span className="ml-1.5 text-xs hidden sm:inline">
            {sortOrder === 'asc' ? 'Antigos' : 'Recentes'}
          </span>
        </Button>
      </div>

      {disableScroll ? (
        <div className="pr-1">{content}</div>
      ) : (
        <ScrollArea className="h-[500px] pr-2">
          {content}
        </ScrollArea>
      )}
    </div>
  )
}