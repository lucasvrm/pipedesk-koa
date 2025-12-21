import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useComments } from '@/services/commentService'
import { useActivities, ActivityLogEntry } from '@/services/activityService'
import { fetchTimeline } from '@/services/timelineService'
import { EntityType } from '@/types/integration'

export type TimelineItemType = 'comment' | 'activity' | 'system' | 'meeting' | 'email' | 'audit'

export interface TimelineItem {
  id: string
  type: TimelineItemType
  date: string
  author: {
    id?: string
    name: string
    avatar?: string
  }
  content: string
  title?: string
  metadata?: Record<string, unknown>
  // Threads support
  parentId?: string | null
  replies?: TimelineItem[]
  // Permissions
  isEditable?: boolean
  isDeletable?: boolean
}

/**
 * Formats activity content for better readability in the timeline.
 * Provides user-friendly descriptions for different activity types.
 */
function formatActivityContent(activity: ActivityLogEntry): { content: string; title?: string } {
  const action = activity.action || ''
  const changes = activity.changes || {}

  // Handle owner/responsible change
  if (action.toLowerCase().includes('responsável alterado')) {
    const previousOwnerName = changes.previousOwnerName || 'não definido'
    const newOwnerName = changes.newOwnerName || 'desconhecido'
    return {
      title: 'Alteração de Responsável',
      content: `Responsável alterado de ${previousOwnerName} para ${newOwnerName}`
    }
  }

  // Handle status change
  if (action.toLowerCase().includes('status alterado')) {
    return {
      title: 'Alteração de Status',
      content: action
    }
  }

  // Handle member addition
  if (action.toLowerCase().includes('membro adicionado') || action.toLowerCase().includes('novo membro')) {
    const memberName = changes.memberName || changes.userName || ''
    return {
      title: 'Novo Membro',
      content: memberName ? `Novo membro adicionado: ${memberName}` : action
    }
  }

  // Handle contact addition
  if (action.toLowerCase().includes('contato') && action.toLowerCase().includes('adicionado')) {
    return {
      title: 'Contato Adicionado',
      content: action
    }
  }

  // Handle contact linking
  if (action.toLowerCase().includes('contato') && action.toLowerCase().includes('vinculado')) {
    return {
      title: 'Contato Vinculado',
      content: action
    }
  }

  // Handle contact unlinking
  if (action.toLowerCase().includes('contato') && action.toLowerCase().includes('desvinculado')) {
    return {
      title: 'Contato Desvinculado',
      content: action
    }
  }

  // Handle disqualification
  if (action.toLowerCase().includes('desqualificado')) {
    return {
      title: 'Lead Desqualificado',
      content: action
    }
  }

  // Handle stage change (for deals/tracks)
  if (action.toLowerCase().includes('estágio alterado') || action.toLowerCase().includes('movido para')) {
    return {
      title: 'Alteração de Estágio',
      content: action
    }
  }

  // Handle document upload
  if (action.toLowerCase().includes('arquivo') || action.toLowerCase().includes('upload')) {
    const fileName = changes.fileName || changes.file_name || ''
    return {
      title: 'Documento Enviado',
      content: fileName ? `Arquivo enviado: ${fileName}` : action
    }
  }

  // Handle won/lost status
  if (action.toLowerCase().includes('marcado como ganho')) {
    return {
      title: 'Ganho',
      content: action
    }
  }
  if (action.toLowerCase().includes('marcado como perdido')) {
    return {
      title: 'Perdido',
      content: action
    }
  }

  // Handle priority change
  if (action.toLowerCase().includes('prioridade alterada')) {
    return {
      title: 'Alteração de Prioridade',
      content: action
    }
  }

  // Handle comments
  if (action.toLowerCase().includes('comentário')) {
    const preview = changes.content_preview || ''
    return {
      title: 'Comentário',
      content: preview ? `Comentário: "${preview}..."` : action
    }
  }

  // Default: format changes as additional details
  if (Object.keys(changes).length > 0) {
    const details = Object.entries(changes)
      .filter(([k, v]) => v && k !== 'updated_at' && !k.includes('Id'))
      .map(([k, v]) => {
        const key = k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
        return `${key}: ${v}`
      })
      .join(', ')
    
    if (details) {
      return {
        title: 'Atividade',
        content: `${action} (${details})`
      }
    }
  }

  return {
    content: action
  }
}

/**
 * Organizes timeline items into a hierarchical thread structure.
 * Items with parentId are nested under their parent as replies.
 */
function organizeIntoThreads(items: TimelineItem[]): TimelineItem[] {
  const itemsMap = new Map<string, TimelineItem>()
  const rootItems: TimelineItem[] = []
  
  // First pass: create map with empty replies array
  items.forEach(item => {
    itemsMap.set(item.id, { ...item, replies: [] })
  })
  
  // Second pass: organize hierarchy
  items.forEach(item => {
    const mappedItem = itemsMap.get(item.id)
    if (!mappedItem) return
    
    if (item.parentId && itemsMap.has(item.parentId)) {
      const parent = itemsMap.get(item.parentId)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(mappedItem)
      }
    } else {
      rootItems.push(mappedItem)
    }
  })
  
  // Sort replies by date (ascending - oldest first in replies)
  rootItems.forEach(item => {
    if (item.replies?.length) {
      item.replies.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    }
  })
  
  return rootItems
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
      // Map API type to internal type
      const typeMapping: Record<string, TimelineItemType> = {
        meeting: 'meeting',
        email: 'email',
        audit: 'audit'
      }

      timelineResponse.entries.forEach(entry => {
        if (seenIds.has(entry.id)) return
        seenIds.add(entry.id)

        const itemType = typeMapping[entry.type.toLowerCase()] || 'system'

        items.push({
          id: entry.id,
          type: itemType,
          date: entry.createdAt,
          title: entry.title,
          author: {
            id: entry.createdBy?.id,
            name: entry.createdBy?.name || 'Sistema',
            avatar: entry.createdBy?.avatar
          },
          content: entry.description || entry.title,
          metadata: entry.metadata,
          parentId: null,
          isEditable: false,
          isDeletable: false
        })
      })
    }

    // Process legacy comments
    if (comments) {
      comments.forEach(c => {
        if (seenIds.has(c.id)) return
        seenIds.add(c.id)

        // Use createdAt or fallback to created_at
        const timestamp = c.createdAt || c.created_at
        if (!timestamp) {
          console.warn('Comment missing timestamp:', c.id)
        }
        
        items.push({
          id: c.id,
          type: 'comment',
          date: timestamp || new Date(0).toISOString(),
          author: {
            id: c.authorId,
            name: c.author?.name || 'Usuário',
            avatar: c.author?.avatar
          },
          content: c.content,
          parentId: c.parentId || null,
          isEditable: true,
          isDeletable: true
        })
      })
    }

    // Process legacy activities
    if (activities) {
      activities.forEach(a => {
        if (seenIds.has(a.id)) return
        seenIds.add(a.id)

        // Format activity content using the helper function
        const formatted = formatActivityContent(a)

        items.push({
          id: a.id,
          type: 'system',
          date: a.created_at,
          title: formatted.title,
          author: {
            id: a.user_id,
            name: a.user?.name || 'Sistema',
            avatar: a.user?.avatar_url
          },
          content: formatted.content,
          metadata: a.changes,
          parentId: null,
          isEditable: false,
          isDeletable: false
        })
      })
    }

    // Sort by date desc (most recent first)
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // Organize into threads
    return organizeIntoThreads(items)
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
