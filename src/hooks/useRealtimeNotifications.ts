import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export function useRealtimeNotifications(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Se não houver usuário logado, não faz nada
    if (!userId) return;

    // Criação do canal de escuta
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Escuta apenas novos registros
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`, // Filtra para o usuário atual
        },
        (payload) => {
          console.log('🔔 Nova notificação recebida:', payload);
          
          // 1. Invalida o cache do React Query para atualizar o contador no sininho
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['inbox'] });
          
          // 2. Exibe o toast visual
          toast.info("Nova Notificação", {
            description: payload.new.message || "Você tem uma nova mensagem.",
            duration: 5000,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Conectado ao canal de notificações para o user ${userId}`);
        }
      });

    // Limpeza ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}