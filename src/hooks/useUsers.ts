import { User } from '@/lib/types'
import { useSupabase } from './useSupabase'

export function useUsers() {
  return useSupabase<User>('users', {
    orderBy: { column: 'name', ascending: true },
    realtime: true,
  })
}
