import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export function useRealtimeNotifications(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log(`🔌 [Realtime] Iniciando modo DEBUG sem filtros...`);

    const channel = supabase
      .channel('global-debug-notifications') // Mudamos o nome do canal
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
          // REMOVEMOS O FILTRO: filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔥 [Realtime] EVENTO CAPTURADO (SEM FILTRO):', payload);
          
          // Se capturou, vamos tentar mostrar o toast
          // (Mesmo que a notificação não seja para você, só para teste)
          toast.success("Evento Realtime Recebido!", {
            description: `Tipo: ${payload.eventType}. Olhe o console!`,
            duration: 5000,
          });

          // Atualiza as listas
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe((status) => {
        console.log(`📡 [Realtime] Status: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}