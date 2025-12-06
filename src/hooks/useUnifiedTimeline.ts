import { useState, useMemo } from 'react'
import { useComments } from '@/services/commentService'
import { useActivities } from '@/services/activityService'
import { Comment } from '@/lib/types'

export type TimelineItemType = 'comment' | 'activity' | 'system'

export interface TimelineItem {
  id: string
  type: TimelineItemType
  date: string
  author: {
    name: string
    avatar?: string
  }
  content: string
  metadata?: Record<string, any>
}

export function useUnifiedTimeline(entityId: string, entityType: 'deal' | 'lead' | 'company') {
  // Fetch data
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

    // Process Comments
    if (comments) {
      comments.forEach(c => {
        const timestamp = c.createdAt || c.created_at
        if (!timestamp) {
          console.warn('Comment missing timestamp:', c.id)
        }
        
        items.push({
          id: c.id,
          type: 'comment',
          date: timestamp || new Date(0).toISOString(), // Use epoch time for missing timestamps
          author: {
            name: c.author?.name || 'Usuário',
            avatar: c.author?.avatar
          },
          content: c.content
        })
      })
    }

    // Process Activities
    if (activities) {
      activities.forEach(a => {
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
          type: 'system', // Mapeia tudo que vem de activities como 'system' para o filtro funcionar
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
  }, [comments, activities])

  const refetch = async () => {
    await Promise.all([refetchComments(), refetchActivities()])
  }

  return {
    items: timelineItems,
    isLoading: commentsLoading || activitiesLoading,
    error: commentsError || activitiesError,
    refetch
  }
}
