import { useState } from 'react'
import { useKV } from '@/hooks/useKV'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/EmptyState'
import { Notification } from '@/lib/types'
import { formatDateTime } from '@/lib/helpers'
import { 
  Bell,
  CheckCircle,
  WarningCircle,
  User,
  Tag,
  ArrowRight,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface InboxPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InboxPanel({ open, onOpenChange }: InboxPanelProps) {
  const [notifications, setNotifications] = useKV<Notification[]>('notifications', [])
  const [filter, setFilter] = useState<'all' | Notification['type']>('all')

  const handleMarkAsRead = (id: string) => {
    setNotifications((current) =>
      (current || []).map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((current) => (current || []).map((n) => ({ ...n, read: true })))
  }

  const handleNavigate = (notification: Notification) => {
    handleMarkAsRead(notification.id)
    if (notification.link) {
      onOpenChange(false)
    }
  }

  const filteredNotifications = (notifications || []).filter((n) => 
    filter === 'all' || n.type === filter
  )

  const unreadCount = (notifications || []).filter((n) => !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'mention':
        return <Tag className="text-primary" />
      case 'assignment':
        return <User className="text-accent" />
      case 'status_change':
        return <CheckCircle className="text-success" />
      case 'sla_breach':
      case 'deadline':
        return <WarningCircle className="text-destructive" />
      default:
        return <Bell />
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} não lidas</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Suas atualizações e menções
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="mention">Menções</TabsTrigger>
              <TabsTrigger value="assignment">Tarefas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {unreadCount > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="w-full mt-4"
            >
              Marcar todas como lidas
            </Button>
            <Separator className="my-4" />
          </>
        )}

        <div className="mt-6 space-y-4">
          {(!filteredNotifications || filteredNotifications.length === 0) ? (
            <EmptyState
              icon={<Bell size={48} weight="duotone" />}
              title="Nenhuma notificação"
              description="Você está em dia! Não há notificações no momento."
            />
          ) : (
            filteredNotifications
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-colors hover:bg-secondary/50',
                    notification.read
                      ? 'bg-card border-border'
                      : 'bg-accent/5 border-accent/20'
                  )}
                  onClick={() => handleNavigate(notification)}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-accent" />
                      )}
                      {notification.link && (
                        <ArrowRight className="text-muted-foreground" size={16} />
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
