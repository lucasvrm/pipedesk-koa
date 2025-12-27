export type TimelineItemType = 'comment' | 'email' | 'meeting' | 'audit' | 'system' | 'activity'

export interface TimelineAuthor {
  id?: string
  name: string
  avatar?: string
  avatar_url?: string
  avatarBgColor?: string
  avatarTextColor?: string
  avatarBorderColor?: string
}

export interface TimelineItem {
  id: string
  type: TimelineItemType
  author: TimelineAuthor
  content: string
  title?: string
  date: string // ISO 8601
  metadata?: Record<string, unknown>

  // Para threads
  parentId?: string | null
  replies?: TimelineItem[]
  depth?: number // Track nesting level for replies (0 = root, 1-4 = nested)

  // Permissões
  isEditable?: boolean
  isDeletable?: boolean
}

export interface TimelineFilterState {
  searchQuery: string
  activeTypes: TimelineItemType[] // Array para multiselect
}

export interface CommentFormData {
  content: string
  mentions: string[]
  parentId?: string | null
}
