import { GoogleIntegration, GoogleDriveFolder, CalendarEvent } from '@/lib/types'
import { useSupabase } from './useSupabase'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export function useGoogleIntegration() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  const result = useSupabase<GoogleIntegration>('google_integrations', {
    filter: userId ? (query) => query.eq('user_id', userId) : undefined,
    realtime: true,
  })

  return {
    ...result,
    integration: result.data[0] || null,
  }
}

export function useGoogleDriveFolders() {
  return useSupabase<GoogleDriveFolder>('google_drive_folders', {
    realtime: true,
  })
}

export function useCalendarEvents(entityId?: string, entityType?: 'deal' | 'track' | 'task') {
  return useSupabase<CalendarEvent>('calendar_events', {
    filter:
      entityId && entityType
        ? (query) => query.eq('entity_id', entityId).eq('entity_type', entityType)
        : undefined,
    orderBy: { column: 'start_time', ascending: true },
    realtime: true,
  })
}
