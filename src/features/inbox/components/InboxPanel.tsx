import { useAuth } from '@/contexts/AuthContext'
import { 
  useNotifications, 
  useMarkAsRead, 
  useMarkAllAsRead, 
  useDeleteNotification, 
  Notification 
} from '@/services/notificationService' // Importando do serviço centralizado
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Check, 
  Trash, 
  ChatCircle, 
  User, 
  Clock, 
  WarningCircle, 
  CheckCircle 
} from '@phosphor-icons/react'
import { formatDate } from '@/lib/helpers'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface InboxPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InboxPanel({ open, onOpenChange }: InboxPanelProps) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  
  // Hooks do serviço de notificação
  const { data: notifications, isLoading } = useNotifications(profile?.id || null)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
      onOpenChange(false)
    }
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'mention': return <ChatCircle className="text-blue-500" weight="fill" size={18} />
      case 'assignment': return <User className="text-purple-500" weight="fill" size={18} />
      case 'deadline': return <Clock className="text-amber-500" weight="fill" size={18} />
      case 'sla_breach': return <WarningCircle className="text-red-500" weight="fill" size={18} />
      case 'status_change': return <CheckCircle className="text-green-500" weight="fill" size={18} />
      default: return <Bell className="text-gray-500" weight="fill" size={18} />
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 gap-0">
        
        {/* Cabeçalho Fixo */}
        <SheetHeader className="p-4 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle>Notificações</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {unreadCount} novas
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8"
                onClick={() => markAllAsRead.mutate(profile!.id)}
                disabled={markAllAsRead.isPending}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
          <SheetDescription className="hidden">
            Central de notificações do usuário
          </SheetDescription>
        </SheetHeader>

        {/* Área de Scroll com Altura Limitada */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-sm">Tudo limpo por aqui!</p>
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="flex flex-col p-2">
                {notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group flex gap-3 p-3 rounded-lg transition-colors cursor-pointer relative border mb-2 last:mb-0",
                      notification.read 
                        ? "bg-card border-transparent hover:bg-muted/50" 
                        : "bg-primary/5 border-primary/10 hover:bg-primary/10"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Ícone */}
                    <div className="mt-1 shrink-0">
                      {getIcon(notification.type)}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm font-medium leading-none", !notification.read && "text-foreground")}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                        {notification.message}
                      </p>
                    </div>

                    {/* Ações (Hover) */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification.mutate(notification.id)
                        }}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                    
                    {/* Bolinha de não lido */}
                    {!notification.read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 -translate-x-3 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
