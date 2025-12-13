import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useComments } from '@/services/commentService'
import { useActivities } from '@/services/activityService'
import { fetchTimeline } from '@/services/timelineService'
import { TimelineEntry, EntityType } from '@/types/integration'
import { Comment } from '@/lib/types'

export type TimelineItemType = 'comment' | 'activity' | 'system' | 'meeting' | 'email' | 'audit'

export interface TimelineItem {
  id: string
  type: TimelineItemType
  date: string
  author: {
    name: string
    avatar?: string
  }
  content: string
  title?: string
  metadata?: Record<string, unknown>
}

/**
 * Hook to fetch unified timeline data from the API.
 * Combines data from the new timeline API (meetings, emails, audits) with legacy data (comments, activities).
 */
export function useUnifiedTimeline(entityId: string, entityType: 'deal' | 'lead' | 'company') {
  // Fetch timeline from API (meetings, emails, audits)
  const {
    data: timelineResponse,
    isLoading: timelineLoading,
    error: timelineError,
    refetch: refetchTimeline
  } = useQuery({
    queryKey: ['timeline', entityType, entityId],
    queryFn: () => fetchTimeline(entityType as EntityType, entityId),
    enabled: !!entityId,
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Also fetch legacy comments and activities for backwards compatibility
  const { 
    data: comments, 
    isLoading: commentsLoading, 
    error: commentsError,
    refetch: refetchComments 
  } = useComments(entityId, entityType)
  
  const { 
    data: activities, 
    isLoading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities
  } = useActivities(entityId, entityType)

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = []
    const seenIds = new Set<string>()

    // Process timeline entries from API (meetings, emails, audits)
    if (timelineResponse?.entries) {
      timelineResponse.entries.forEach(entry => {
        if (seenIds.has(entry.id)) return
        seenIds.add(entry.id)

        // Map API type to internal type
        let itemType: TimelineItemType = 'system'
        const entryTypeLower = entry.type.toLowerCase()
        if (entryTypeLower === 'meeting') {
          itemType = 'meeting'
        } else if (entryTypeLower === 'email') {
          itemType = 'email'
        } else if (entryTypeLower === 'audit') {
          itemType = 'audit'
        }

        items.push({
          id: entry.id,
          type: itemType,
          date: entry.createdAt,
          title: entry.title,
          author: {
            name: entry.createdBy?.name || 'Sistema',
            avatar: entry.createdBy?.avatar
          },
          content: entry.description || entry.title,
          metadata: entry.metadata
        })
      })
    }

    // Process legacy comments
    if (comments) {
      comments.forEach(c => {
        if (seenIds.has(c.id)) return
        seenIds.add(c.id)

        const timestamp = c.createdAt || (c as unknown as { created_at?: string }).created_at
        if (!timestamp) {
          console.warn('Comment missing timestamp:', c.id)
        }
        
        items.push({
          id: c.id,
          type: 'comment',
          date: timestamp || new Date(0).toISOString(),
          author: {
            name: c.author?.name || 'Usuário',
            avatar: c.author?.avatar
          },
          content: c.content
        })
      })
    }

    // Process legacy activities
    if (activities) {
      activities.forEach(a => {
        if (seenIds.has(a.id)) return
        seenIds.add(a.id)

        // Formata o conteúdo da atividade
        let content = a.action;
        if (a.changes && Object.keys(a.changes).length > 0) {
           const details = Object.entries(a.changes)
             .filter(([k, v]) => v && k !== 'updated_at')
             .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
             .join(', ');
           if (details) content += ` (${details})`;
        }

        items.push({
          id: a.id,
          type: 'system',
          date: a.created_at,
          author: {
            name: a.user?.name || 'Sistema',
            avatar: a.user?.avatar_url
          },
          content: content,
          metadata: a.changes
        })
      })
    }

    // Sort by date desc
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [timelineResponse, comments, activities])

  const refetch = useCallback(async () => {
    await Promise.all([refetchTimeline(), refetchComments(), refetchActivities()])
  }, [refetchTimeline, refetchComments, refetchActivities])

  return {
    items: timelineItems,
    data: timelineItems, // Alias for consistency
    isLoading: timelineLoading || commentsLoading || activitiesLoading,
    error: timelineError || commentsError || activitiesError,
    refetch
  }
}
