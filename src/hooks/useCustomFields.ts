import { CustomFieldDefinition, CustomFieldValue } from '@/lib/types'
import { useSupabase } from './useSupabase'

export function useCustomFieldDefinitions(entityType?: 'deal' | 'track' | 'task') {
  return useSupabase<CustomFieldDefinition>('custom_field_definitions', {
    filter: entityType ? (query) => query.eq('entity_type', entityType) : undefined,
    orderBy: { column: 'position', ascending: true },
    realtime: true,
  })
}

export function useCustomFieldValues(entityId?: string, entityType?: 'deal' | 'track' | 'task') {
  return useSupabase<CustomFieldValue>('custom_field_values', {
    filter:
      entityId && entityType
        ? (query) => query.eq('entity_id', entityId).eq('entity_type', entityType)
        : undefined,
    realtime: true,
  })
}
