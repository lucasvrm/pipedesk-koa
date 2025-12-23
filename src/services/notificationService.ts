import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationEntityType,
  NotificationMetadata,
  GroupedNotification,
  UserNotificationPreferences,
  UserNotificationPreferencesInput,
  getDefaultPriorityForType,
  getCategoryForType,
} from '@/lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const NOTIFICATIONS_KEY = ['notifications'] as const;
export const NOTIFICATION_PREFERENCES_KEY = ['notification-preferences'] as const;
export const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;

// ============================================================================
// TYPES (Re-export for convenience)
// ============================================================================

export type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  GroupedNotification,
  UserNotificationPreferences,
};

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  entityId?: string;
  entityType?: NotificationEntityType;
  groupKey?: string;
  metadata?: NotificationMetadata;
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapNotificationFromDB(item: any): Notification {
  return {
    id: item.id,
    userId: item.user_id,
    type: item.type,
    title: item.title,
    message: item.message,
    link: item.link || '',
    read: item.read,
    createdAt: item.created_at,
    priority: item.priority || 'normal',
    category: item.category || 'general',
    entityId: item.entity_id,
    entityType: item.entity_type,
    groupKey: item.group_key,
    metadata: item.metadata || {},
    expiresAt: item.expires_at,
  };
}

function mapPreferencesFromDB(item: any): UserNotificationPreferences {
  return {
    id: item.id,
    userId: item.user_id,
    dndEnabled: item.dnd_enabled,
    prefMention: item.pref_mention,
    prefAssignment: item.pref_assignment,
    prefStatus: item.pref_status,
    prefSla: item.pref_sla,
    prefDeadline: item.pref_deadline,
    prefActivity: item.pref_activity,
    prefSystem: item.pref_system,
    minPriority: item.min_priority,
    channelInapp: item.channel_inapp,
    channelEmail: item.channel_email,
    channelPush: item.channel_push,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

// ============================================================================
// NOTIFICATION CRUD
// ============================================================================

/**
 * Fetch all notifications for a user
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100); // Limitar para performance

  if (error) throw error;
  return (data || []).map(mapNotificationFromDB);
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}

/**
 * Mark notifications by group key as read
 */
export async function markGroupAsRead(userId: string, groupKey: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('group_key', groupKey)
    .eq('read', false);

  if (error) throw error;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Delete all read notifications for a user
 */
export async function deleteAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('read', true);

  if (error) throw error;
}

/**
 * Create a new notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification | null> {
  // Usar função do banco que respeita preferências
  const { data, error } = await supabase.rpc('create_notification_if_allowed', {
    p_user_id: input.userId,
    p_type: input.type,
    p_title: input.title,
    p_message: input.message,
    p_link: input.link || null,
    p_priority: input.priority || getDefaultPriorityForType(input.type),
    p_category: input.category || getCategoryForType(input.type),
    p_entity_id: input.entityId || null,
    p_entity_type: input.entityType || null,
    p_group_key: input.groupKey || null,
    p_metadata: input.metadata || {},
  });

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  // Se retornou null, preferências bloquearam a notificação
  if (!data) return null;

  // Buscar a notificação criada
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) throw fetchError;
  return mapNotificationFromDB(notification);
}

// ============================================================================
// NOTIFICATION HELPERS BY TYPE
// ============================================================================

/**
 * Helper: Criar notificação de menção
 */
export async function createMentionNotification(params: {
  userId: string;
  actorId: string;
  actorName: string;
  entityType: NotificationEntityType;
  entityId: string;
  entityName: string;
  link: string;
}): Promise<Notification | null> {
  return createNotification({
    userId: params.userId,
    type: 'mention',
    title: 'Você foi mencionado',
    message: `${params.actorName} mencionou você em ${params.entityName}`,
    link: params.link,
    category: 'mention',
    priority: 'normal',
    entityType: params.entityType,
    entityId: params.entityId,
    groupKey: `mention:${params.entityType}:${params.entityId}`,
    metadata: {
      actorId: params.actorId,
      actorName: params.actorName,
      entityName: params.entityName,
    },
  });
}

/**
 * Helper: Criar notificação de atribuição
 */
export async function createAssignmentNotification(params: {
  userId: string;
  actorId?: string;
  actorName?: string;
  entityType: NotificationEntityType;
  entityId: string;
  entityName: string;
  link: string;
  isReassignment?: boolean;
  isHotLead?: boolean;
}): Promise<Notification | null> {
  const type: NotificationType = params.isReassignment 
    ? 'reassignment' 
    : params.isHotLead 
      ? 'hot_lead_assigned' 
      : 'assignment';
  
  const title = params.isHotLead 
    ? '🔥 Lead quente atribuído!'
    : params.isReassignment 
      ? 'Reatribuição de responsabilidade'
      : 'Você foi atribuído';

  const message = params.actorName
    ? `${params.actorName} atribuiu ${params.entityName} para você`
    : `Você é responsável por ${params.entityName}`;

  return createNotification({
    userId: params.userId,
    type,
    title,
    message,
    link: params.link,
    category: 'assignment',
    priority: params.isHotLead ? 'high' : 'normal',
    entityType: params.entityType,
    entityId: params.entityId,
    groupKey: `assignment:${params.entityType}:${params.entityId}`,
    metadata: {
      actorId: params.actorId,
      actorName: params.actorName,
      entityName: params.entityName,
      isHotLead: params.isHotLead,
    },
  });
}

/**
 * Helper: Criar notificação de mudança de status
 */
export async function createStatusChangeNotification(params: {
  userId: string;
  entityType: NotificationEntityType;
  entityId: string;
  entityName: string;
  oldStatus: string;
  newStatus: string;
  link: string;
  isRegression?: boolean;
}): Promise<Notification | null> {
  const type: NotificationType = params.isRegression ? 'status_regression' : 'status_change';
  const title = params.isRegression ? '⚠️ Regressão de status' : 'Status alterado';
  const message = `${params.entityName}: ${params.oldStatus} → ${params.newStatus}`;

  return createNotification({
    userId: params.userId,
    type,
    title,
    message,
    link: params.link,
    category: 'status',
    priority: params.isRegression ? 'high' : 'normal',
    entityType: params.entityType,
    entityId: params.entityId,
    groupKey: `status:${params.entityType}:${params.entityId}`,
    metadata: {
      entityName: params.entityName,
      oldValue: params.oldStatus,
      newValue: params.newStatus,
      isRegression: params.isRegression,
    },
  });
}

/**
 * Helper: Criar notificação de SLA
 */
export async function createSLANotification(params: {
  userId: string;
  entityType: 'track' | 'deal';
  entityId: string;
  entityName: string;
  stage: string;
  daysInStage: number;
  maxDays: number;
  link: string;
  isBreach: boolean;
}): Promise<Notification | null> {
  const type: NotificationType = params.isBreach ? 'sla_breach' : 'sla_warning';
  const priority: NotificationPriority = params.isBreach ? 'critical' : 'urgent';
  const emoji = params.isBreach ? '🚨' : '⚠️';
  const title = params.isBreach 
    ? `${emoji} SLA Vencido: ${params.entityName}`
    : `${emoji} SLA em Risco: ${params.entityName}`;
  const message = `${params.daysInStage} dias em ${params.stage} (limite: ${params.maxDays} dias)`;

  return createNotification({
    userId: params.userId,
    type,
    title,
    message,
    link: params.link,
    category: 'sla',
    priority,
    entityType: params.entityType,
    entityId: params.entityId,
    groupKey: `sla:${params.entityType}:${params.entityId}:${params.stage}`,
    metadata: {
      entityName: params.entityName,
      stage: params.stage,
      daysInStage: params.daysInStage,
      maxDays: params.maxDays,
      isBreach: params.isBreach,
    },
  });
}

/**
 * Helper: Criar notificação de deadline
 */
export async function createDeadlineNotification(params: {
  userId: string;
  entityType: NotificationEntityType;
  entityId: string;
  entityName: string;
  dueDate: string;
  link: string;
  isOverdue: boolean;
}): Promise<Notification | null> {
  const type: NotificationType = params.isOverdue ? 'deadline' : 'deadline_approaching';
  const priority: NotificationPriority = params.isOverdue ? 'critical' : 'urgent';
  const emoji = params.isOverdue ? '🚨' : '⏰';
  const title = params.isOverdue 
    ? `${emoji} Prazo vencido: ${params.entityName}`
    : `${emoji} Prazo se aproximando: ${params.entityName}`;

  return createNotification({
    userId: params.userId,
    type,
    title,
    message: `Vencimento: ${new Date(params.dueDate).toLocaleDateString('pt-BR')}`,
    link: params.link,
    category: 'deadline',
    priority,
    entityType: params.entityType,
    entityId: params.entityId,
    groupKey: `deadline:${params.entityType}:${params.entityId}`,
    metadata: {
      entityName: params.entityName,
      dueDate: params.dueDate,
      isOverdue: params.isOverdue,
    },
  });
}

// ============================================================================
// GROUPING UTILITIES
// ============================================================================

/**
 * Agrupa notificações por group_key para exibição no Inbox
 */
export function groupNotifications(notifications: Notification[]): GroupedNotification[] {
  const groups = new Map<string, Notification[]>();
  const ungrouped: Notification[] = [];

  // Separar agrupadas e não agrupadas
  notifications.forEach(n => {
    if (n.groupKey) {
      const existing = groups.get(n.groupKey) || [];
      existing.push(n);
      groups.set(n.groupKey, existing);
    } else {
      ungrouped.push(n);
    }
  });

  const result: GroupedNotification[] = [];

  // Processar grupos
  groups.forEach((items, groupKey) => {
    const sorted = items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latest = sorted[0];
    const unreadCount = items.filter(n => !n.read).length;

    // Determinar prioridade máxima do grupo
    const priorityOrder: NotificationPriority[] = ['critical', 'urgent', 'high', 'normal', 'low'];
    const maxPriority = sorted.reduce((max, n) => {
      const currentIndex = priorityOrder.indexOf(n.priority);
      const maxIndex = priorityOrder.indexOf(max);
      return currentIndex < maxIndex ? n.priority : max;
    }, 'low' as NotificationPriority);

    result.push({
      groupKey,
      notifications: sorted,
      latestAt: latest.createdAt,
      unreadCount,
      totalCount: items.length,
      title: items.length > 1 
        ? `${latest.title} (+${items.length - 1})`
        : latest.title,
      message: items.length > 1
        ? `${items.length} notificações relacionadas`
        : latest.message,
      category: latest.category,
      priority: maxPriority,
      entityType: latest.entityType,
      entityId: latest.entityId,
      link: latest.link,
    });
  });

  // Adicionar não agrupadas como grupos de 1
  ungrouped.forEach(n => {
    result.push({
      groupKey: n.id,
      notifications: [n],
      latestAt: n.createdAt,
      unreadCount: n.read ? 0 : 1,
      totalCount: 1,
      title: n.title,
      message: n.message,
      category: n.category,
      priority: n.priority,
      entityType: n.entityType,
      entityId: n.entityId,
      link: n.link,
    });
  });

  // Ordenar por data mais recente
  return result.sort((a, b) => 
    new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
  );
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(
  userId: string
): Promise<UserNotificationPreferences> {
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  // Se não existe, criar com defaults
  if (!data) {
    const { data: created, error: createError } = await supabase
      .from('user_notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single();

    if (createError) throw createError;
    return mapPreferencesFromDB(created);
  }

  return mapPreferencesFromDB(data);
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  updates: UserNotificationPreferencesInput
): Promise<UserNotificationPreferences> {
  const payload: any = {};
  
  if (updates.dndEnabled !== undefined) payload.dnd_enabled = updates.dndEnabled;
  if (updates.prefMention !== undefined) payload.pref_mention = updates.prefMention;
  if (updates.prefAssignment !== undefined) payload.pref_assignment = updates.prefAssignment;
  if (updates.prefStatus !== undefined) payload.pref_status = updates.prefStatus;
  if (updates.prefSla !== undefined) payload.pref_sla = updates.prefSla;
  if (updates.prefDeadline !== undefined) payload.pref_deadline = updates.prefDeadline;
  if (updates.prefActivity !== undefined) payload.pref_activity = updates.prefActivity;
  if (updates.prefSystem !== undefined) payload.pref_system = updates.prefSystem;
  if (updates.minPriority !== undefined) payload.min_priority = updates.minPriority;
  if (updates.channelInapp !== undefined) payload.channel_inapp = updates.channelInapp;
  if (updates.channelEmail !== undefined) payload.channel_email = updates.channelEmail;
  if (updates.channelPush !== undefined) payload.channel_push = updates.channelPush;

  const { data, error } = await supabase
    .from('user_notification_preferences')
    .upsert({ user_id: userId, ...payload })
    .select()
    .single();

  if (error) throw error;
  return mapPreferencesFromDB(data);
}

/**
 * Toggle DND mode
 */
export async function toggleDND(userId: string): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId);
  const newDndState = !prefs.dndEnabled;
  
  await updateNotificationPreferences(userId, { dndEnabled: newDndState });
  return newDndState;
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch notifications with real-time updates
 */
export function useNotifications(userId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, userId],
    queryFn: () => getNotifications(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, userId] });
          queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

/**
 * Hook to get grouped notifications
 */
export function useGroupedNotifications(userId: string | null) {
  const { data: notifications, ...rest } = useNotifications(userId);
  
  const grouped = useMemo(() => {
    if (!notifications) return [];
    return groupNotifications(notifications);
  }, [notifications]);

  return { data: grouped, ...rest };
}

/**
 * Hook to get unread count
 */
export function useUnreadCount(userId: string | null) {
  return useQuery({
    queryKey: [...UNREAD_COUNT_KEY, userId],
    queryFn: () => getUnreadCount(userId!),
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: 60 * 1000, // Refresh a cada minuto
  });
}

/**
 * Hook to get notification preferences
 */
export function useNotificationPreferences(userId: string | null) {
  return useQuery({
    queryKey: [...NOTIFICATION_PREFERENCES_KEY, userId],
    queryFn: () => getNotificationPreferences(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook to mark as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * Hook to mark all as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * Hook to mark group as read
 */
export function useMarkGroupAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, groupKey }: { userId: string; groupKey: string }) =>
      markGroupAsRead(userId, groupKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * Hook to delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * Hook to delete all read
 */
export function useDeleteAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

/**
 * Hook to create notification
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * Hook to update preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UserNotificationPreferencesInput }) =>
      updateNotificationPreferences(userId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATION_PREFERENCES_KEY, variables.userId] });
    },
  });
}

/**
 * Hook to toggle DND
 */
export function useToggleDND() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleDND,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_KEY });
    },
  });
}