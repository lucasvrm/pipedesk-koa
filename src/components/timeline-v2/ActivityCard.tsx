import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MessageSquare,
  Mail,
  Calendar,
  GitCommit,
  Zap,
  MoreVertical,
  Reply,
  Edit,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/helpers'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ThreadReplies } from './ThreadReplies'
import type { TimelineItem, TimelineItemType } from './types'

interface ActivityCardProps {
  item: TimelineItem
  currentUserId: string
  onEdit?: () => void
  onDelete?: () => void
  onReply?: () => void
  onEditReply?: (item: TimelineItem) => void
  onDeleteReply?: (item: TimelineItem) => void
}

interface TypeStyleConfig {
  icon: React.ReactNode
  label: string
  borderClass: string
  bgClass: string
  badgeClass: string
}

function getTypeConfig(type: TimelineItemType): TypeStyleConfig {
  switch (type) {
    case 'comment':
      return {
        icon: <MessageSquare className="h-4 w-4" />,
        label: 'comentário',
        borderClass: 'border-blue-200 dark:border-blue-800/50',
        bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
        badgeClass: 'border-blue-300 text-blue-600 dark:text-blue-400'
      }
    case 'email':
      return {
        icon: <Mail className="h-4 w-4" />,
        label: 'email',
        borderClass: 'border-cyan-200 dark:border-cyan-800/50',
        bgClass: 'bg-cyan-50/50 dark:bg-cyan-950/20',
        badgeClass: 'border-cyan-300 text-cyan-600 dark:text-cyan-400'
      }
    case 'meeting':
      return {
        icon: <Calendar className="h-4 w-4" />,
        label: 'reunião',
        borderClass: 'border-violet-200 dark:border-violet-800/50',
        bgClass: 'bg-violet-50/50 dark:bg-violet-950/20',
        badgeClass: 'border-violet-300 text-violet-600 dark:text-violet-400'
      }
    case 'audit':
      return {
        icon: <GitCommit className="h-4 w-4" />,
        label: 'alteração',
        borderClass: 'border-orange-200 dark:border-orange-800/50',
        bgClass: 'bg-orange-50/50 dark:bg-orange-950/20',
        badgeClass: 'border-orange-300 text-orange-600 dark:text-orange-400'
      }
    case 'system':
    default:
      return {
        icon: <Zap className="h-4 w-4" />,
        label: 'sistema',
        borderClass: 'border-border',
        bgClass: 'bg-muted/50',
        badgeClass: 'border-muted-foreground/30 text-muted-foreground'
      }
  }
}

export function ActivityCard({
  item,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  onEditReply,
  onDeleteReply
}: ActivityCardProps) {
  const typeConfig = useMemo(() => getTypeConfig(item.type), [item.type])

  const isOwner = item.author.id === currentUserId
  const canEdit = isOwner && item.isEditable !== false
  const canDelete = isOwner && item.isDeletable !== false
  const showMenu = canEdit || canDelete
  const hasReplies = item.replies && item.replies.length > 0
  const replyCount = item.replies?.length ?? 0

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.date), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return ''
    }
  }, [item.date])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:shadow-sm',
        typeConfig.borderClass,
        typeConfig.bgClass
      )}
    >
      {/* Header: Avatar, Name, Badge, Time */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={item.author.avatar} alt={item.author.name} />
            <AvatarFallback className="text-xs bg-muted">
              {getInitials(item.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">
                {item.author.name}
              </span>
              <Badge
                variant="outline"
                className={cn('text-[10px] px-1.5 py-0 h-4', typeConfig.badgeClass)}
              >
                {typeConfig.label}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {item.title && (
          <p className="text-sm font-medium text-foreground">{item.title}</p>
        )}
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {item.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onReply}
        >
          <Reply className="h-3.5 w-3.5 mr-1.5" />
          Responder
          {replyCount > 0 && (
            <span className="ml-1.5 text-[10px] text-muted-foreground">
              ({replyCount})
            </span>
          )}
        </Button>

        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleMenuClick}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={handleMenuClick}>
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Thread Replies */}
      {hasReplies && (
        <ThreadReplies
          replies={item.replies!}
          currentUserId={currentUserId}
          onEdit={onEditReply}
          onDelete={onDeleteReply}
        />
      )}
    </div>
  )
}
