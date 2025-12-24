import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  NOTIFICATIONS_KEY, 
  UNREAD_COUNT_KEY,
  useNotificationPreferences,
} from '@/services/notificationService';
import {
  NotificationPriority,
} from '@/lib/types';

// Cores do toast por prioridade
const TOAST_STYLES: Record<NotificationPriority, {
  className: string;
  duration: number;
}> = {
  critical: {
    className: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    duration: 10000, // 10 segundos
  },
  urgent: {
    className: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
    duration: 8000,
  },
  high: {
    className: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    duration: 6000,
  },
  normal: {
    className: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    duration: 5000,
  },
  low: {
    className: 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700',
    duration: 4000,
  },
};

// Ícones emoji por prioridade
const PRIORITY_EMOJI: Record<NotificationPriority, string> = {
  critical: '🚨',
  urgent: '⚠️',
  high: '🔔',
  normal: '💬',
  low: '📝',
};

interface UseRealtimeNotificationsOptions {
  onNewNotification?: (notification: any) => void;
  onOpenInbox?: () => void;
}

export function useRealtimeNotifications(
  userId?: string,
  options?: UseRealtimeNotificationsOptions
) {
  const queryClient = useQueryClient();
  const { data: preferences } = useNotificationPreferences(userId || null);
  
  // Ref para acessar preferences atualizado dentro do callback
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const onOpenInboxRef = useRef(options?.onOpenInbox);
  onOpenInboxRef.current = options?.onOpenInbox;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-realtime:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new;
          
          // 1. Sempre invalidar cache (atualiza badge e lista)
          queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, userId] });
          queryClient.invalidateQueries({ queryKey: [...UNREAD_COUNT_KEY, userId] });

          // 2. Callback opcional
          options?.onNewNotification?.(notification);

          // 3. Verificar DND antes de mostrar toast
          const currentPrefs = preferencesRef.current;
          if (currentPrefs?.dndEnabled) {
            // DND ativo: não mostra toast, mas notificação já está no inbox
            return;
          }

          // 4. Mostrar toast com estilo de prioridade
          const priority = (notification.priority || 'normal') as NotificationPriority;
          const style = TOAST_STYLES[priority];
          const emoji = PRIORITY_EMOJI[priority];

          toast(
            <div className="flex flex-col gap-1">
              <span className="font-medium">{emoji} {notification.title}</span>
              <span className="text-sm text-muted-foreground">{notification.message}</span>
            </div>,
            {
              duration: style.duration,
              className: style.className,
              action: {
                label: 'Ver',
                onClick: () => onOpenInboxRef.current?.(),
              },
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Atualizar cache quando notificação é marcada como lida
          queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, userId] });
          queryClient.invalidateQueries({ queryKey: [...UNREAD_COUNT_KEY, userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Atualizar cache quando notificação é deletada
          queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, userId] });
          queryClient.invalidateQueries({ queryKey: [...UNREAD_COUNT_KEY, userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, options?.onNewNotification]);
}

/**
 * Hook simplificado que só atualiza o contador de não lidos
 * Útil para componentes que só precisam do badge
 */
export function useRealtimeUnreadCount(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-count:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [...UNREAD_COUNT_KEY, userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
