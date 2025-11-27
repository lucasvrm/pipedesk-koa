import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'assignment' | 'status_change' | 'sla_breach' | 'deadline';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationInput {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  link: string;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch all notifications for a user
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      type: item.type,
      title: item.title,
      message: item.message,
      link: item.link || '',
      read: item.read,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  notification: NotificationInput
): Promise<Notification> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || '',
      read: data.read,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch notifications for a user with real-time updates
 */
export function useNotifications(userId: string | null) {
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getNotifications(userId!),
    enabled: !!userId,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const realtimeChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [userId, queryClient]);

  return query;
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Hook to create a notification
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}