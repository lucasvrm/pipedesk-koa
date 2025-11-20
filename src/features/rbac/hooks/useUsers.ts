import { User } from '@/lib/types'
import { useSupabase } from '@/hooks/useSupabase'

export function useUsers() {
  return useSupabase<User>('users', {
    orderBy: { column: 'name', ascending: true },
    realtime: true,
  })
}
