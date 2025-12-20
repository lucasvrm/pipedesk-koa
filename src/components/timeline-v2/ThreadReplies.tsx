import { useState, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronUp, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { getInitials } from '@/lib/helpers'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { TimelineItem } from './types'

interface ThreadRepliesProps {
  replies: TimelineItem[]
  currentUserId: string
  onEdit?: (item: TimelineItem) => void
  onDelete?: (item: TimelineItem) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const MAX_VISIBLE_COLLAPSED = 2

export function ThreadReplies({
  replies,
  currentUserId,
  onEdit,
  onDelete,
  isCollapsed: controlledCollapsed,
  onToggleCollapse
}: ThreadRepliesProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(true)
  
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const toggleCollapse = onToggleCollapse ?? (() => setInternalCollapsed(!internalCollapsed))

  const visibleReplies = useMemo(() => {
    if (!isCollapsed || replies.length <= MAX_VISIBLE_COLLAPSED) {
      return replies
    }
    return replies.slice(-MAX_VISIBLE_COLLAPSED) // Show most recent when collapsed
  }, [replies, isCollapsed])

  const hiddenCount = replies.length - visibleReplies.length

  if (replies.length === 0) return null

  return (
    <div className="ml-8 mt-3 border-l-2 border-muted pl-4 space-y-2">
      {/* Collapse toggle if needed */}
      {replies.length > MAX_VISIBLE_COLLAPSED && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground w-full justify-start"
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="h-3 w-3 mr-1.5" />
              {hiddenCount} resposta{hiddenCount > 1 ? 's' : ''} anterior{hiddenCount > 1 ? 'es' : ''}
            </>
          ) : (
            <>
              <ChevronUp className="h-3 w-3 mr-1.5" />
              Recolher respostas
            </>
          )}
        </Button>
      )}

      {/* Replies list */}
      {visibleReplies.map((reply) => (
        <ReplyCard
          key={reply.id}
          reply={reply}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

interface ReplyCardProps {
  reply: TimelineItem
  currentUserId: string
  onEdit?: (item: TimelineItem) => void
  onDelete?: (item: TimelineItem) => void
}

function ReplyCard({ reply, currentUserId, onEdit, onDelete }: ReplyCardProps) {
  const isOwner = reply.author.id === currentUserId
  const canEdit = isOwner && reply.isEditable !== false
  const canDelete = isOwner && reply.isDeletable !== false
  const showMenu = canEdit || canDelete

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(reply.date), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return ''
    }
  }, [reply.date])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="rounded-md border border-muted/50 bg-muted/20 p-3 transition-all hover:bg-muted/30">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-6 w-6 border">
            <AvatarImage src={reply.author.avatar} alt={reply.author.name} />
            <AvatarFallback className="text-[10px] bg-muted">
              {getInitials(reply.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">
              {reply.author.name}
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
        </div>

        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={handleMenuClick}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={handleMenuClick}>
              {canEdit && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(reply)}>
                  <Edit className="h-3 w-3 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {canDelete && onDelete && (
                <DropdownMenuItem onClick={() => onDelete(reply)} className="text-destructive">
                  <Trash2 className="h-3 w-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {reply.content}
      </p>
    </div>
  )
}
