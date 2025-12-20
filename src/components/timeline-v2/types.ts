export type TimelineItemType = 'comment' | 'email' | 'meeting' | 'audit' | 'system'

export interface TimelineAuthor {
  id: string
  name: string
  avatar?: string
}

export interface TimelineItem {
  id: string
  type: TimelineItemType
  author: TimelineAuthor
  content: string
  title?: string
  date: string // ISO 8601
  metadata?: Record<string, unknown>

  // Para threads (Parte 3)
  parentId?: string | null
  replies?: TimelineItem[]

  // Permissões
  isEditable?: boolean
  isDeletable?: boolean
}

export interface TimelineFilterState {
  searchQuery: string
  activeFilter: 'all' | 'comment' | 'communication' | 'system'
}

export interface CommentFormData {
  content: string
  mentions: string[]
  parentId?: string | null
}
