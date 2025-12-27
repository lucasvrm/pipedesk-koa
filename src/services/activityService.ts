import { supabase } from '@/lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'

export type ActivityEntityType =
  | 'deal'
  | 'track'
  | 'task'
  | 'lead'
  | 'company'
  | 'contact'
  | 'user'
  | 'folder'
  | 'player'

export interface ActivityLogEntry {
  id: string
  user_id: string
  entity_id: string
  entity_type: ActivityEntityType
  action: string
  changes: any
  created_at: string
  user?: {
    name: string
    avatar_url: string
  }
}

export async function logActivity(
  entityId: string,
  entityType: ActivityEntityType,
  action: string,
  userId: string,
  details?: any
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activity_log') as any).insert({
      entity_id: entityId,
      entity_type: entityType,
      action: action,
      user_id: userId,
      changes: details || {}
    })
  } catch (error) {
    console.error('Erro ao registrar atividade:', error)
  }
}

export async function getActivities(
  entityId?: string,
  entityType?: ActivityEntityType
): Promise<ActivityLogEntry[]> {
  let query = supabase
    .from('activity_log')
    .select(`
      *,
      user:profiles(name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (entityId) {
    query = query.eq('entity_id', entityId)
  }
  if (entityType) {
    query = query.eq('entity_type', entityType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar atividades:', error)
    return []
  }

  return data as ActivityLogEntry[]
}

// Hook para usar no componente
export function useActivities(entityId?: string, entityType?: ActivityEntityType) {
  return useQuery({
    queryKey: ['activities', entityId, entityType],
    queryFn: () => getActivities(entityId, entityType),
    // Atualiza a cada 5 segundos para parecer "realtime" ou use realtime subscriptions
    refetchInterval: 5000 
  })
}