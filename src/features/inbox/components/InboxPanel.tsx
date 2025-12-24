import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useGroupedNotifications, useMarkAsRead, useMarkAsUnread, useMarkAllAsRead, useMarkGroupAsRead,
  useDeleteNotification, useDeleteAllRead, useArchiveNotification,
  useNotificationPreferences, GroupedNotification, Notification,
} from '@/services/notificationService';
import {
  NotificationCategory, NotificationPriority,
  NOTIFICATION_CATEGORY_LABELS, NOTIFICATION_PRIORITY_LABELS, NOTIFICATION_PRIORITY_COLORS,
} from '@/lib/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, BellOff, Check, Trash2, Archive, Filter, MoreHorizontal,
  ChevronDown, ChevronRight, ExternalLink, MessageCircle, UserCircle,
  RefreshCw, AlertTriangle, Clock, Activity, Cog, Circle,
} from 'lucide-react';
import { formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface InboxPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  mention: MessageCircle, assignment: UserCircle, status: RefreshCw,
  sla: AlertTriangle, deadline: Clock, activity: Activity, system: Cog, general: Bell,
};

type FilterStatus = 'all' | 'unread' | 'read';

export default function InboxPanel({ open, onOpenChange }: InboxPanelProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  const { data: groupedNotifications, isLoading } = useGroupedNotifications(profile?.id || null);
  const { data: preferences } = useNotificationPreferences(profile?.id || null);
  const markAsRead = useMarkAsRead();
  const markAsUnread = useMarkAsUnread();
  const markAllAsRead = useMarkAllAsRead();
  const markGroupAsRead = useMarkGroupAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllRead = useDeleteAllRead();
  const archiveNotification = useArchiveNotification();

  const filteredNotifications = useMemo(() => {
    if (!groupedNotifications) return [];
    return groupedNotifications.filter(group => {
      if (filterCategory !== 'all' && group.category !== filterCategory) return false;
      if (filterPriority !== 'all' && group.priority !== filterPriority) return false;
      if (filterStatus === 'unread' && group.unreadCount === 0) return false;
      if (filterStatus === 'read' && group.unreadCount > 0) return false;
      return true;
    });
  }, [groupedNotifications, filterCategory, filterPriority, filterStatus]);

  const unreadCount = groupedNotifications?.reduce((acc, g) => acc + g.unreadCount, 0) || 0;
  const totalCount = groupedNotifications?.length || 0;
  const hasFilters = filterCategory !== 'all' || filterPriority !== 'all' || filterStatus !== 'all';

  const toggleGroupExpand = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleNotificationExpand = (id: string) => {
    setExpandedNotifications(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleNotificationClick = (n: Notification) => {
    toggleNotificationExpand(n.id);
    if (!n.read) markAsRead.mutate(n.id);
  };

  const handleGroupClick = (g: GroupedNotification) => {
    g.totalCount > 1 ? toggleGroupExpand(g.groupKey) : handleNotificationClick(g.notifications[0]);
  };

  const handleNavigate = (link: string) => {
    if (link) { navigate(link); onOpenChange(false); }
  };

  const handleOpenPreferences = () => {
    onOpenChange(false);
    navigate('/profile/preferences');
  };

  const handleMarkAll = () => {
    if (profile?.id) { markAllAsRead.mutate(profile.id); toast.success('Todas marcadas como lidas'); }
  };

  const handleDeleteRead = () => {
    if (profile?.id) { deleteAllRead.mutate(profile.id); toast.success('Lidas removidas'); }
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); archiveNotification.mutate(id); toast.success('Arquivada');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); deleteNotification.mutate(id);
  };

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); markAsRead.mutate(id);
  };

  const handleMarkUnread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); markAsUnread.mutate(id);
  };

  const clearFilters = () => {
    setFilterCategory('all'); setFilterPriority('all'); setFilterStatus('all');
  };

  const getIcon = (cat: NotificationCategory) => CATEGORY_ICONS[cat] || Bell;
  const getPriorityColors = (pri: NotificationPriority) => NOTIFICATION_PRIORITY_COLORS[pri];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-[620px] sm:w-[700px] flex flex-col p-0 gap-0 border-l"
        closeButtonClassName="bg-white/95 hover:bg-white text-gray-700 hover:text-gray-900 shadow-sm border border-gray-200"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {preferences?.dndEnabled ? <BellOff className="h-5 w-5 text-white" /> : <Bell className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Notificações</h2>
              <p className="text-white/70 text-sm">{unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}</p>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex gap-2 mt-4 overflow-x-auto whitespace-nowrap">
            {(['all', 'unread', 'read'] as FilterStatus[]).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn("px-[0.7rem] py-[0.34rem] rounded-full text-[11px] font-medium transition-all",
                  filterStatus === s ? "bg-white text-red-600" : "bg-white/20 text-white hover:bg-white/30")}>
                {s === 'all' ? 'Todas' : s === 'unread' ? 'Não lidas' : 'Lidas'}
              </button>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("px-[0.7rem] py-[0.34rem] rounded-full text-[11px] font-medium transition-all flex items-center gap-1",
                  (filterCategory !== 'all' || filterPriority !== 'all') ? "bg-white text-red-600" : "bg-white/20 text-white hover:bg-white/30")}>
                  <Filter className="h-3 w-3" /> Filtros
                  {(filterCategory !== 'all' || filterPriority !== 'all') && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px]">
                      {(filterCategory !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                <DropdownMenuLabel>Categoria</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={filterCategory === 'all'} onCheckedChange={() => setFilterCategory('all')}>
                  Todas
                </DropdownMenuCheckboxItem>
                {(Object.keys(NOTIFICATION_CATEGORY_LABELS) as NotificationCategory[]).filter(c => c !== 'general').map(cat => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <DropdownMenuCheckboxItem key={cat} checked={filterCategory === cat} onCheckedChange={() => setFilterCategory(cat)}>
                      <Icon className="h-4 w-4 mr-2" />{NOTIFICATION_CATEGORY_LABELS[cat]}
                    </DropdownMenuCheckboxItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Prioridade</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={filterPriority === 'all'} onCheckedChange={() => setFilterPriority('all')}>
                  Todas
                </DropdownMenuCheckboxItem>
                {(['critical', 'urgent', 'high', 'normal', 'low'] as NotificationPriority[]).map(pri => (
                  <DropdownMenuCheckboxItem key={pri} checked={filterPriority === pri} onCheckedChange={() => setFilterPriority(pri)}>
                    <span className={cn("w-2 h-2 rounded-full mr-2", NOTIFICATION_PRIORITY_COLORS[pri].dot)} />
                    {NOTIFICATION_PRIORITY_LABELS[pri]}
                  </DropdownMenuCheckboxItem>
                ))}
                {hasFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearFilters} className="text-red-600">Limpar filtros</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="secondary"
              className="px-[0.7rem] py-[0.34rem] h-8 rounded-full text-[11px] font-medium bg-gray-700/90 text-white hover:bg-gray-700 transition-all"
              onClick={handleOpenPreferences}
            >
              Opções
            </Button>
          </div>
        </div>

        {/* DND Banner */}
        {preferences?.dndEnabled && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2 text-sm text-amber-700">
            <BellOff className="h-4 w-4" /><span>Não Perturbe ativo</span>
            <Button variant="link" size="sm" className="ml-auto h-auto p-0 text-amber-700" onClick={handleOpenPreferences}>
              Configurar
            </Button>
          </div>
        )}

        {/* Ações em massa */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAll} disabled={markAllAsRead.isPending}>
                <Check className="h-3 w-3 mr-1" />Marcar todas
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={handleDeleteRead} disabled={deleteAllRead.isPending}>
                <Trash2 className="h-3 w-3 mr-1" />Limpar lidas
              </Button>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Carregando...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-8">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-8 w-8 opacity-30" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{hasFilters ? 'Nenhuma encontrada' : 'Tudo limpo!'}</p>
                <p className="text-sm mt-1">{hasFilters ? 'Ajuste os filtros' : 'Sem pendências'}</p>
              </div>
              {hasFilters && <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 pr-8 pb-40 space-y-2">
                {filteredNotifications.map((group) => {
                  const Icon = getIcon(group.category);
                  const colors = getPriorityColors(group.priority);
                  const isGroupExp = expandedGroups.has(group.groupKey);
                  const hasMultiple = group.totalCount > 1;

                  return (
                    <div key={group.groupKey} className="space-y-1">
                      {/* Card Principal */}
                      <div onClick={() => handleGroupClick(group)}
                        className={cn("relative p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-md max-w-full",
                          group.unreadCount > 0 ? "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900" : "bg-card border-border hover:border-muted-foreground/20")}>
                        <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-full", colors.dot)} />

                        <div className="flex gap-3 pl-2 pr-6">
                          <div className={cn("relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colors.bg)}>
                            <Icon className={cn("h-5 w-5", colors.text)} />
                            {group.unreadCount > 0 && !hasMultiple && (
                              <div className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-white", colors.dot)} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <p className={cn("font-medium text-sm truncate", group.unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>
                                  {group.title}
                                </p>
                                {hasMultiple && (
                                  <button onClick={(e) => { e.stopPropagation(); toggleGroupExpand(group.groupKey); }} className="p-0.5 hover:bg-muted rounded">
                                    {isGroupExp ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                  </button>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 pl-4">{formatDate(group.latestAt)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.message}</p>

                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px] h-5 font-normal">{NOTIFICATION_CATEGORY_LABELS[group.category]}</Badge>
                              {group.unreadCount > 0 && hasMultiple && (
                                <Badge className="text-[10px] h-5 bg-red-100 text-red-700 hover:bg-red-100">{group.unreadCount} não lida{group.unreadCount > 1 ? 's' : ''}</Badge>
                              )}
                              {group.priority === 'critical' && <Badge className="text-[10px] h-5 bg-red-500 text-white">URGENTE</Badge>}

                              <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                {!hasMultiple && group.unreadCount > 0 && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleMarkRead(group.notifications[0].id, e)} title="Marcar lida">
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                {!hasMultiple && group.unreadCount === 0 && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleMarkUnread(group.notifications[0].id, e)} title="Marcar não lida">
                                    <Circle className="h-4 w-4" />
                                  </Button>
                                )}
                                {!hasMultiple && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleArchive(group.notifications[0].id, e)} title="Arquivar">
                                      <Archive className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(group.notifications[0].id, e)} title="Excluir">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {hasMultiple && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => { if (profile?.id) markGroupAsRead.mutate({ userId: profile.id, groupKey: group.groupKey }); }}>
                                        <Check className="h-4 w-4 mr-2" />Marcar grupo como lido
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>

                            {/* Expandido (única) */}
                            {!hasMultiple && expandedNotifications.has(group.notifications[0].id) && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-sm text-foreground mb-3">{group.notifications[0].message}</p>
                                <div className="flex items-center gap-2">
                                  {group.link && (
                                    <Button size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); handleNavigate(group.link); }}>
                                      <ExternalLink className="h-3 w-3 mr-1" />Ver detalhes
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" className="h-8" onClick={(e) => handleArchive(group.notifications[0].id, e)}>
                                    <Archive className="h-3 w-3 mr-1" />Arquivar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* Grupo expandido */}
                      {hasMultiple && isGroupExp && (
                        <div className="ml-6 pl-4 border-l-2 border-muted space-y-1">
                          {group.notifications.map((n) => {
                            const isExp = expandedNotifications.has(n.id);
                            return (
                              <div key={n.id} onClick={() => handleNotificationClick(n)}
                                className={cn("p-3 rounded-lg border transition-all cursor-pointer group/item hover:shadow-sm",
                                  !n.read ? "bg-red-50/30 border-red-100" : "bg-card border-border")}>
                                <div className="flex items-start gap-2">
                                  {!n.read && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className={cn("text-sm truncate", !n.read ? "font-medium" : "")}>{n.message}</p>
                                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatDate(n.createdAt)}</span>
                                    </div>
                                    {isExp && (
                                      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                                        {n.link && (
                                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleNavigate(n.link); }}>
                                            <ExternalLink className="h-3 w-3 mr-1" />Ver
                                          </Button>
                                        )}
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => handleArchive(n.id, e)}>
                                          <Archive className="h-3 w-3 mr-1" />Arquivar
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1">
                                    {!n.read && (
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleMarkRead(n.id, e)} title="Marcar lida">
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    )}
                                    {n.read && (
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleMarkUnread(n.id, e)} title="Marcar não lida">
                                        <Circle className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(n.id, e)} title="Excluir">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        {totalCount > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{filteredNotifications.length} de {totalCount}</span>
              <Button variant="link" size="sm" className="h-auto p-0 text-red-600" onClick={handleOpenPreferences}>
                Preferências
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
