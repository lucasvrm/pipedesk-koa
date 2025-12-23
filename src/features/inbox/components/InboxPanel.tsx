import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useGroupedNotifications,
  useMarkAsRead, 
  useMarkAllAsRead, 
  useMarkGroupAsRead,
  useDeleteNotification,
  useDeleteAllRead,
  useNotificationPreferences,
  GroupedNotification,
} from '@/services/notificationService';
import {
  NotificationCategory,
  NotificationPriority,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_PRIORITY_COLORS,
} from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Bell, 
  Check, 
  Trash, 
  MessageCircle, 
  UserCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Settings,
  Activity,
  ChevronDown,
  ChevronRight,
  Filter,
  MoreVertical,
  BellOff,
} from 'lucide-react';
import { formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';

export interface InboxPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Ícones por categoria
const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  mention: MessageCircle,
  assignment: UserCircle,
  status: RefreshCw,
  sla: AlertTriangle,
  deadline: Clock,
  activity: Activity,
  system: Settings,
  general: Bell,
};

export default function InboxPanel({ open, onOpenChange }: InboxPanelProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  // Hooks de dados (ordem obrigatória: queries e mutations primeiro)
  const { data: groupedNotifications, isLoading } = useGroupedNotifications(profile?.id || null);
  const { data: preferences } = useNotificationPreferences(profile?.id || null);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const markGroupAsRead = useMarkGroupAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllRead = useDeleteAllRead();
  
  // State (após hooks de dados)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    if (!groupedNotifications) return [];
    
    return groupedNotifications.filter(group => {
      if (filterCategory !== 'all' && group.category !== filterCategory) return false;
      if (filterPriority !== 'all' && group.priority !== filterPriority) return false;
      return true;
    });
  }, [groupedNotifications, filterCategory, filterPriority]);

  // Contadores
  const unreadCount = groupedNotifications?.reduce((acc, g) => acc + g.unreadCount, 0) || 0;
  const totalCount = groupedNotifications?.length || 0;
  const hasFilters = filterCategory !== 'all' || filterPriority !== 'all';

  // Handlers
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleNotificationClick = (notification: GroupedNotification) => {
    // Se tem mais de 1 notificação, expandir o grupo
    if (notification.totalCount > 1) {
      toggleGroup(notification.groupKey);
      return;
    }
    
    // Marcar como lido e navegar
    if (notification.unreadCount > 0) {
      markAsRead.mutate(notification.notifications[0].id);
    }
    if (notification.link) {
      navigate(notification.link);
      onOpenChange(false);
    }
  };

  const handleSingleNotificationClick = (notificationId: string, link: string, read: boolean) => {
    if (!read) {
      markAsRead.mutate(notificationId);
    }
    if (link) {
      navigate(link);
      onOpenChange(false);
    }
  };

  const handleMarkGroupAsRead = (groupKey: string) => {
    if (profile?.id) {
      markGroupAsRead.mutate({ userId: profile.id, groupKey });
    }
  };

  const getIcon = (category: NotificationCategory) => {
    const Icon = CATEGORY_ICONS[category] || Bell;
    return Icon;
  };

  const getPriorityColors = (priority: NotificationPriority) => {
    return NOTIFICATION_PRIORITY_COLORS[priority];
  };

  const clearFilters = () => {
    setFilterCategory('all');
    setFilterPriority('all');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[540px] flex flex-col p-0 gap-0">
        
        {/* Header */}
        <SheetHeader className="p-4 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="flex items-center gap-2">
                Notificações
                {preferences?.dndEnabled && (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
              </SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* Filtros */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={hasFilters ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8"
                  >
                    <Filter className={cn("h-4 w-4", hasFilters && "text-primary")} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por categoria</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filterCategory === 'all'}
                    onCheckedChange={() => setFilterCategory('all')}
                  >
                    Todas
                  </DropdownMenuCheckboxItem>
                  {(Object.keys(NOTIFICATION_CATEGORY_LABELS) as NotificationCategory[]).map(cat => (
                    <DropdownMenuCheckboxItem
                      key={cat}
                      checked={filterCategory === cat}
                      onCheckedChange={() => setFilterCategory(cat)}
                    >
                      {NOTIFICATION_CATEGORY_LABELS[cat]}
                    </DropdownMenuCheckboxItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuLabel>Filtrar por prioridade</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filterPriority === 'all'}
                    onCheckedChange={() => setFilterPriority('all')}
                  >
                    Todas
                  </DropdownMenuCheckboxItem>
                  {(Object.keys(NOTIFICATION_PRIORITY_LABELS) as NotificationPriority[]).map(pri => (
                    <DropdownMenuCheckboxItem
                      key={pri}
                      checked={filterPriority === pri}
                      onCheckedChange={() => setFilterPriority(pri)}
                    >
                      <span 
                        className={cn(
                          "w-2 h-2 rounded-full mr-2",
                          NOTIFICATION_PRIORITY_COLORS[pri].dot
                        )} 
                      />
                      {NOTIFICATION_PRIORITY_LABELS[pri]}
                    </DropdownMenuCheckboxItem>
                  ))}
                  
                  {hasFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters}>
                        Limpar filtros
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {unreadCount > 0 && (
                    <DropdownMenuItem
                      onClick={() => profile?.id && markAllAsRead.mutate(profile.id)}
                      disabled={markAllAsRead.isPending}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Marcar todas como lidas
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => profile?.id && deleteAllRead.mutate(profile.id)}
                    disabled={deleteAllRead.isPending}
                    className="text-muted-foreground"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Limpar lidas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <SheetDescription className="hidden">
            Central de notificações do usuário
          </SheetDescription>
        </SheetHeader>

        {/* DND Banner */}
        {preferences?.dndEnabled && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <BellOff className="h-4 w-4" />
            <span>Modo Não Perturbe ativo</span>
          </div>
        )}

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-sm">
                {hasFilters ? 'Nenhuma notificação com esses filtros' : 'Tudo limpo por aqui!'}
              </p>
              {hasFilters && (
                <Button variant="link" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="flex flex-col p-2 gap-1">
                {filteredNotifications.map((group) => {
                  const Icon = getIcon(group.category);
                  const priorityColors = getPriorityColors(group.priority);
                  const isExpanded = expandedGroups.has(group.groupKey);
                  const hasMultiple = group.totalCount > 1;

                  return (
                    <Collapsible 
                      key={group.groupKey} 
                      open={isExpanded}
                      onOpenChange={() => hasMultiple && toggleGroup(group.groupKey)}
                    >
                      {/* Item Principal */}
                      <div
                        className={cn(
                          "group flex gap-3 p-3 rounded-lg transition-colors cursor-pointer relative border",
                          group.unreadCount > 0
                            ? "bg-primary/5 border-primary/10 hover:bg-primary/10"
                            : "bg-card border-transparent hover:bg-muted/50"
                        )}
                        onClick={() => handleNotificationClick(group)}
                      >
                        {/* Indicador de Prioridade */}
                        <div 
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                            priorityColors.dot
                          )}
                        />

                        {/* Ícone */}
                        <div className="mt-0.5 shrink-0 ml-1">
                          <Icon 
                            className={cn("h-5 w-5", priorityColors.text)} 
                          />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "text-sm font-medium leading-none truncate",
                                group.unreadCount > 0 && "text-foreground"
                              )}>
                                {group.title}
                              </p>
                              {hasMultiple && (
                                <CollapsibleTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDate(group.latestAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                            {group.message}
                          </p>
                          
                          {/* Badges */}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {NOTIFICATION_CATEGORY_LABELS[group.category]}
                            </Badge>
                            {group.unreadCount > 0 && hasMultiple && (
                              <Badge variant="secondary" className="text-[10px] h-5 bg-primary/10 text-primary">
                                {group.unreadCount} não lidas
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Ações (Hover) */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {group.unreadCount > 0 && hasMultiple && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkGroupAsRead(group.groupKey);
                              }}
                              title="Marcar grupo como lido"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!hasMultiple && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification.mutate(group.notifications[0].id);
                              }}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Bolinha de não lido */}
                        {group.unreadCount > 0 && !hasMultiple && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>

                      {/* Itens Expandidos do Grupo */}
                      {hasMultiple && (
                        <CollapsibleContent>
                          <div className="ml-6 pl-4 border-l-2 border-muted mt-1 space-y-1">
                            {group.notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={cn(
                                  "flex gap-2 p-2 rounded-md transition-colors cursor-pointer text-sm",
                                  notification.read 
                                    ? "hover:bg-muted/50" 
                                    : "bg-primary/5 hover:bg-primary/10"
                                )}
                                onClick={() => handleSingleNotificationClick(
                                  notification.id, 
                                  notification.link, 
                                  notification.read
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "truncate",
                                    !notification.read && "font-medium"
                                  )}>
                                    {notification.message}
                                  </p>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {formatDate(notification.createdAt)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification.mutate(notification.id);
                                  }}
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer com contagem */}
        {totalCount > 0 && (
          <div className="p-2 border-t bg-muted/10 text-center text-xs text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'notificação' : 'notificações'}
            {hasFilters && ` (filtrado de ${groupedNotifications?.length || 0})`}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
