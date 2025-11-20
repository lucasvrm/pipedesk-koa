import { MasterDeal } from '@/lib/types'
import { useSupabase } from '@/hooks/useSupabase'

export function useDeals() {
  return useSupabase<MasterDeal>('master_deals', {
    filter: (query) => query.is('deleted_at', null),
    orderBy: { column: 'created_at', ascending: false },
    realtime: true,
  })
}
