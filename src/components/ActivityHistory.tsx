import { useKV } from '@github/spark/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User } from '@/lib/types'
import { getInitials, formatDateTime } from '@/lib/helpers'
import {
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChatCircle,
  UserPlus,
  At,
  FileArrowUp,
} from '@phosphor-icons/react'

export interface ActivityLogEntry {
  id: string
  userId: string
  action: ActivityAction
  entityType: 'deal' | 'track' | 'task' | 'comment' | 'user' | 'file'
  entityId: string
  entityName: string
  details?: string
  metadata?: Record<string, any>
  createdAt: string
}

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'completed'
  | 'cancelled'
  | 'stage_changed'
  | 'commented'
  | 'mentioned'
  | 'assigned'
  | 'uploaded'

interface ActivityHistoryProps {
  entityId?: string
  entityType?: 'deal' | 'track' | 'task'
  limit?: number
  showUser?: boolean
}

export default function ActivityHistory({ 
  entityId, 
  entityType, 
  limit = 50,
  showUser = true 
}: ActivityHistoryProps) {
  const [activityLog] = useKV<ActivityLogEntry[]>('activityLog', [])
  const [users] = useKV<User[]>('users', [])

  const filteredActivities = (activityLog || [])
    .filter(activity => {
      if (entityId && entityType) {
        return activity.entityId === entityId && activity.entityType === entityType
      }
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)

  const getUser = (userId: string) => {
    return (users || []).find(u => u.id === userId)
  }

  const getActivityIcon = (action: ActivityAction) => {
    switch (action) {
      case 'created':
        return <Plus className="text-success" />
      case 'updated':
        return <PencilSimple className="text-primary" />
      case 'deleted':
        return <Trash className="text-destructive" />
      case 'completed':
        return <CheckCircle className="text-success" />
      case 'cancelled':
        return <XCircle className="text-destructive" />
      case 'stage_changed':
        return <ArrowRight className="text-accent" />
      case 'commented':
        return <ChatCircle className="text-muted-foreground" />
      case 'mentioned':
        return <At className="text-primary" />
      case 'assigned':
        return <UserPlus className="text-accent" />
      case 'uploaded':
        return <FileArrowUp className="text-primary" />
      default:
        return <PencilSimple className="text-muted-foreground" />
    }
  }

  const getActivityLabel = (action: ActivityAction) => {
    switch (action) {
      case 'created':
        return 'criou'
      case 'updated':
        return 'atualizou'
      case 'deleted':
        return 'excluiu'
      case 'completed':
        return 'completou'
      case 'cancelled':
        return 'cancelou'
      case 'stage_changed':
        return 'mudou estágio de'
      case 'commented':
        return 'comentou em'
      case 'mentioned':
        return 'mencionou em'
      case 'assigned':
        return 'atribuiu'
      case 'uploaded':
        return 'enviou arquivo para'
      default:
        return 'modificou'
    }
  }

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'deal':
        return 'negócio'
      case 'track':
        return 'player track'
      case 'task':
        return 'tarefa'
      case 'comment':
        return 'comentário'
      case 'user':
        return 'usuário'
      case 'file':
        return 'arquivo'
      default:
        return type
    }
  }

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma atividade registrada
      </div>
    )
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-2">
        {filteredActivities.map((activity, index) => {
          const user = getUser(activity.userId)
          const isFirst = index === 0
          const prevActivity = index > 0 ? filteredActivities[index - 1] : null
          const showDate = !prevActivity || 
            new Date(activity.createdAt).toDateString() !== new Date(prevActivity.createdAt).toDateString()

          return (
            <div key={activity.id}>
              {showDate && (
                <div className="flex items-center gap-2 my-4">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground font-medium px-2">
                    {new Date(activity.createdAt).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="h-px bg-border flex-1" />
                </div>
              )}

              <Card className={isFirst ? 'border-primary/20' : ''}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    {showUser && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1 text-sm">
                          {getActivityIcon(activity.action)}
                          {showUser && (
                            <span className="font-medium">{user?.name || 'Usuário'}</span>
                          )}
                          <span className="text-muted-foreground">
                            {getActivityLabel(activity.action)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getEntityTypeLabel(activity.entityType)}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm font-medium mb-1">{activity.entityName}</p>

                      {activity.details && (
                        <p className="text-xs text-muted-foreground mb-2">{activity.details}</p>
                      )}

                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export function logActivity(entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>) {
  window.spark.kv.get<ActivityLogEntry[]>('activityLog').then(log => {
    const activityLog = log || []
    
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    const updatedLog = [...activityLog, newEntry]
    
    const maxEntries = 10000
    const trimmedLog = updatedLog.length > maxEntries 
      ? updatedLog.slice(-maxEntries) 
      : updatedLog

    window.spark.kv.set('activityLog', trimmedLog)
  })
}
