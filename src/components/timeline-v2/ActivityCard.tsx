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
import { UserBadge } from '@/components/ui/user-badge'
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
  item: TimelineItem & { customColor?: string }
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
        borderClass: 'border-yellow-300 dark:border-yellow-700/50',
        bgClass: 'bg-yellow-50 dark:bg-yellow-950/30',
        badgeClass: 'border-yellow-400 text-yellow-700 dark:text-yellow-400'
      }
    case 'email':
      return {
        icon: <Mail className="h-4 w-4" />,
        label: 'email',
        borderClass: 'border-blue-200 dark:border-blue-800/50',
        bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
        badgeClass: 'border-blue-300 text-blue-600 dark:text-blue-400'
      }
    case 'meeting':
      return {
        icon: <Calendar className="h-4 w-4" />,
        label: 'reunião',
        borderClass: 'border-red-200 dark:border-red-800/50',
        bgClass: 'bg-red-50/50 dark:bg-red-950/20',
        badgeClass: 'border-red-300 text-red-600 dark:text-red-400'
      }
    case 'audit':
      return {
        icon: <GitCommit className="h-4 w-4" />,
        label: 'alteração',
        borderClass: 'border-amber-500 dark:border-amber-600/50',
        bgClass: 'bg-amber-50/50 dark:bg-amber-950/20',
        badgeClass: 'bg-amber-600 text-white border-amber-700 dark:bg-amber-700 dark:border-amber-600'
      }
    case 'system':
    default:
      return {
        icon: <Zap className="h-4 w-4" />,
        label: 'sistema',
        borderClass: 'border-slate-300 dark:border-slate-700',
        bgClass: 'bg-slate-100/50 dark:bg-slate-800/30',
        badgeClass: 'border-slate-400 text-slate-500 dark:text-slate-400'
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

  // Apply custom color if provided
  const hasCustomColor = !!item.customColor
  const borderLeftColor = item.customColor || undefined
  const backgroundColor = item.customColor 
    ? `${item.customColor}15` // 15% opacity
    : undefined

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:shadow-sm',
        !hasCustomColor && typeConfig.borderClass,
        !hasCustomColor && typeConfig.bgClass
      )}
      style={
        hasCustomColor
          ? {
              borderLeft: `4px solid ${borderLeftColor}`,
              backgroundColor: backgroundColor
            }
          : undefined
      }
    >
      {/* Header: Avatar, Name, Badge, Time */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <UserBadge
            name={item.author.name}
            avatarUrl={item.author.avatar}
            bgColor={item.author.avatarBgColor}
            textColor={item.author.avatarTextColor}
            borderColor={item.author.avatarBorderColor}
            size="sm"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">
                {item.author.name}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 h-4',
                  !hasCustomColor && typeConfig.badgeClass
                )}
                style={
                  hasCustomColor
                    ? {
                        backgroundColor: item.customColor,
                        color: '#ffffff',
                        borderColor: item.customColor
                      }
                    : undefined
                }
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
      {item.type === 'comment' && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:bg-primary hover:text-white"
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
      )}

      {item.type !== 'comment' && showMenu && (
        <div className="flex items-center justify-end mt-3">
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
        </div>
      )}

      {/* Thread Replies */}
      {hasReplies && item.replies && (
        <ThreadReplies
          replies={item.replies}
          currentUserId={currentUserId}
          onEdit={onEditReply}
          onDelete={onDeleteReply}
          onReply={onReply}
          depth={1}
        />
      )}
    </div>
  )
}
