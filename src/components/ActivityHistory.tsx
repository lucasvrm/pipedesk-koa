import { useActivities, ActivityLogEntry } from '@/services/activityService'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getInitials, formatDateTime } from '@/lib/helpers'
import {
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChatCircle,
  User,
  FileArrowUp,
  ClockCounterClockwise
} from '@phosphor-icons/react'

interface ActivityHistoryProps {
  entityId?: string
  entityType?: string
  limit?: number
  showUser?: boolean
  disableScroll?: boolean // NEW PROP
}

export default function ActivityHistory({ 
  entityId, 
  entityType, 
  limit = 50,
  showUser = true,
  disableScroll = false // Default to false to keep old behavior elsewhere
}: ActivityHistoryProps) {
  const { data: activities, isLoading } = useActivities(entityId, entityType)

  const filteredActivities = (activities || []).slice(0, limit)

  const getActivityIcon = (action: string) => {
    // ... existing logic ...
    const lowerAction = action.toLowerCase()
    if (lowerAction.includes('criou') || lowerAction.includes('created')) return <Plus className="text-emerald-500" />
    if (lowerAction.includes('edit') || lowerAction.includes('atualiz') || lowerAction.includes('edição')) return <PencilSimple className="text-blue-500" />
    if (lowerAction.includes('delet') || lowerAction.includes('exclu')) return <Trash className="text-red-500" />
    if (lowerAction.includes('cancel')) return <XCircle className="text-red-500" />
    if (lowerAction.includes('coment')) return <ChatCircle className="text-slate-500" />
    if (lowerAction.includes('status') || lowerAction.includes('mov')) return <ArrowRight className="text-amber-500" />
    if (lowerAction.includes('arquivo') || lowerAction.includes('upload')) return <FileArrowUp className="text-indigo-500" />
    return <ClockCounterClockwise className="text-muted-foreground" />
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Carregando histórico...</div>
  }

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10 mx-4 my-4">
        <ClockCounterClockwise className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
      </div>
    )
  }

  // The actual list content
  const content = (
    <div className="space-y-4 p-1">
      {filteredActivities.map((activity, index) => {
        const user = activity.user
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
                <div className="mt-0.5 shrink-0">{getActivityIcon(activity.action)}</div>
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
      })}
    </div>
  )

  // Conditionally render ScrollArea
  if (disableScroll) {
    return <div className="pr-4">{content}</div>
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      {content}
    </ScrollArea>
  )
}