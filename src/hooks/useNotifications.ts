import { Notification } from '@/lib/types'
import { useSupabase } from './useSupabase'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export function useNotifications() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  return useSupabase<Notification>('notifications', {
    filter: userId ? (query) => query.eq('user_id', userId) : undefined,
    orderBy: { column: 'created_at', ascending: false },
    realtime: true,
  })
}
