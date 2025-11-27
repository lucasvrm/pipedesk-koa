import { supabase } from '@/lib/supabaseClient'

export async function logActivity(
  entityId: string, 
  entityType: 'deal' | 'track' | 'task', 
  action: string, 
  userId: string,
  details?: any
) {
  try {
    await supabase.from('activity_log').insert({
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