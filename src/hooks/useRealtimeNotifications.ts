import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export function useRealtimeNotifications(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Canal único por usuário para evitar conflitos
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Escuta apenas novas notificações
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`, // Filtro de Segurança: Só ouve o que é meu
        },
        (payload) => {
          // 1. Atualiza cache do React Query (para o sininho e listas)
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // 2. Exibe alerta visual flutuante
          toast.info("Nova Notificação", {
            description: payload.new.message || "Você tem uma nova mensagem.",
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}