import { useKV } from '@github/spark/hooks'
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
import { Notification } from '@/lib/types'
import { formatDateTime } from '@/lib/helpers'
import { 
  Bell,
  CheckCircle,
  WarningCircle,
  User,
  Tag,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface InboxPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InboxPanel({ open, onOpenChange }: InboxPanelProps) {
  const [notifications, setNotifications] = useKV<Notification[]>('notifications', [])

  const handleMarkAsRead = (id: string) => {
    setNotifications((current) =>
      (current || []).map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((current) => (current || []).map((n) => ({ ...n, read: true })))
  }

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
          {(!notifications || notifications.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            notifications
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-colors',
                    notification.read
                      ? 'bg-card border-border'
                      : 'bg-accent/5 border-accent/20'
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
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
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
