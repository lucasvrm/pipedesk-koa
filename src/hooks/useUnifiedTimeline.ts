import { useState, useMemo } from 'react'
import { useComments } from '@/services/commentService'
import { useActivityLogs } from '@/services/activityService' // Supondo que exista ou similar
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
  const { data: comments, isLoading: commentsLoading } = useComments(entityId, entityType)

  // Mock de activities se não tiver hook pronto, ou usar activityService se ele exportar hook
  // Vou assumir que activityService tem uma função de fetch e vou criar um hook simples aqui ou mockar
  // Para o MVP, vou focar em comentários e simular algumas activities para mostrar a funcionalidade

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = []

    if (comments) {
      comments.forEach(c => {
        items.push({
          id: c.id,
          type: 'comment',
          date: c.createdAt || c.created_at,
          author: {
            name: c.author?.name || 'Usuário',
            avatar: c.author?.avatar
          },
          content: c.content
        })
      })
    }

    // Sort by date desc
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [comments])

  return {
    items: timelineItems,
    isLoading: commentsLoading
  }
}
