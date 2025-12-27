import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface UseSupabaseReturn<T> {
  data: T[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  create: (item: Partial<T>) => Promise<T | null>
  update: (id: string, updates: Partial<T>) => Promise<T | null>
  remove: (id: string) => Promise<boolean>
}

export function useSupabase<T extends { id: string }>(
  tableName: string,
  options: {
    select?: string
    filter?: (query: any) => any
    realtime?: boolean
    orderBy?: { column: string; ascending?: boolean }
  } = {}
): UseSupabaseReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const { select = '*', filter, realtime = true, orderBy } = options

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from(tableName).select(select)

      if (filter) {
        query = filter(query)
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
      }

      const { data: fetchedData, error: fetchError } = await query

      if (fetchError) throw fetchError

      setData((fetchedData as unknown as T[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [tableName, select, filter, orderBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!realtime) return

    const realtimeChannel = supabase
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((current) => [...current, payload.new as T])
          } else if (payload.eventType === 'UPDATE') {
            setData((current) =>
              current.map((item) =>
                item.id === (payload.new as T).id ? (payload.new as T) : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setData((current) =>
              current.filter((item) => item.id !== (payload.old as T).id)
            )
          }
        }
      )
      .subscribe()

    setChannel(realtimeChannel)

    return () => {
      realtimeChannel.unsubscribe()
    }
  }, [tableName, realtime])

  const create = useCallback(
    async (item: Partial<T>): Promise<T | null> => {
      try {
        const { data: newItem, error: createError } = await supabase
          .from(tableName)
          .insert(item as Record<string, unknown>)
          .select()
          .single()

        if (createError) throw createError

        return newItem as T
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Create failed'))
        return null
      }
    },
    [tableName]
  )

  const update = useCallback(
    async (id: string, updates: Partial<T>): Promise<T | null> => {
      try {
        const { data: updatedItem, error: updateError } = await supabase
          .from(tableName)
          .update(updates as Record<string, unknown>)
          .eq('id', id)
          .select()
          .single()

        if (updateError) throw updateError

        return updatedItem as T
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Update failed'))
        return null
      }
    },
    [tableName]
  )

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Delete failed'))
        return false
      }
    },
    [tableName]
  )

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    remove,
  }
}
