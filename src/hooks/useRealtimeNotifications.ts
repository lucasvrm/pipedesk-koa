import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export function useRealtimeNotifications(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
        console.log("🚫 [Realtime] Sem userId, ignorando conexão.");
        return;
    }

    console.log(`🔌 [Realtime] Tentando conectar para o user: ${userId}`);

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 [Realtime] EVENTO RECEBIDO:', payload);
          
          // Tenta disparar o toast imediatamente para teste
          toast.success("Notificação Recebida!", {
            description: payload.new.message,
            duration: 8000, // Duração longa para garantir que você veja
          });

          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 [Realtime] Status da Conexão: ${status}`);
        if (err) {
            console.error('❌ [Realtime] Erro de conexão:', err);
        }
      });

    return () => {
      console.log("🔌 [Realtime] Desconectando...");
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}