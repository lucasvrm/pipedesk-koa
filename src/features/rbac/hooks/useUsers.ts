import { User } from '@/lib/types'
import { useSupabase } from '@/hooks/useSupabase'

export function useUsers() {
  // Alterado de 'users' para 'profiles'
  return useSupabase<User>('profiles', {
    orderBy: { column: 'name', ascending: true },
    realtime: true,
  })
}